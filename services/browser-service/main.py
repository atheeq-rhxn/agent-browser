import asyncio
import time
import uuid
from contextlib import asynccontextmanager
from typing import Optional

from browser_use import Agent, Browser, ChatGoogle
from fastapi import FastAPI, HTTPException

from models import (
    HealthResponse,
    SessionCreate,
    SessionResponse,
    TaskRequest,
    TaskResponse,
    TaskStatus,
)

task_store: dict[str, TaskStatus] = {}
session_store: dict[str, Browser] = {}

LLM = ChatGoogle(model="gemini-3-flash-preview")


async def execute_task(
    task_id: str,
    request: TaskRequest,
):
    start_time = time.time()
    status = task_store[task_id]
    status.status = "running"

    browser: Optional[Browser] = None
    try:
        if request.session_id and request.session_id in session_store:
            browser = session_store[request.session_id]
        else:
            browser = Browser()
        
        agent = Agent(
            task=request.task,
            llm=LLM,
            browser=browser,
            max_failures=3,
        )

        history = await agent.run(max_steps=request.max_steps)

        status.status = "completed" if history.is_successful() else "failed"
        status.result = history.final_result()
        status.urls = [u for u in history.urls() if u]
        status.steps = history.number_of_steps()
        status.duration_seconds = time.time() - start_time

        if request.output_schema and status.result:
            import json

            try:
                status.structured_output = json.loads(status.result)
            except json.JSONDecodeError:
                pass

    except asyncio.CancelledError:
        status.status = "stopped"
        status.error = "Task was cancelled"

    except Exception as e:
        status.status = "failed"
        status.error = str(e)

    finally:
        status.duration_seconds = time.time() - start_time
        if request.session_id and browser and request.session_id not in session_store:
            await browser.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    for browser in session_store.values():
        await browser.close()
    session_store.clear()


app = FastAPI(
    title="Browser-Use Service",
    description="API for browser automation using browser-use",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="healthy",
        active_tasks=sum(1 for t in task_store.values() if t.status == "running"),
        active_sessions=len(session_store),
    )


@app.post("/task", response_model=TaskResponse)
async def create_task(request: TaskRequest):
    task_id = str(uuid.uuid4())

    task_store[task_id] = TaskStatus(
        task_id=task_id,
        status="pending",
    )

    asyncio.create_task(execute_task(task_id, request))

    return TaskResponse(
        task_id=task_id,
        status="pending",
        message=f"Task created. Poll /task/{task_id} for status.",
    )


@app.get("/task/{task_id}", response_model=TaskStatus)
async def get_task_status(task_id: str):
    if task_id not in task_store:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_store[task_id]


@app.post("/task/{task_id}/stop")
async def stop_task(task_id: str):
    if task_id not in task_store:
        raise HTTPException(status_code=404, detail="Task not found")

    status = task_store[task_id]
    if status.status == "running":
        status.status = "stopped"
        status.error = "Task stopped by user"
    return {"message": f"Task {task_id} stop requested"}


@app.delete("/task/{task_id}")
async def delete_task(task_id: str):
    if task_id not in task_store:
        raise HTTPException(status_code=404, detail="Task not found")

    status = task_store[task_id]
    if status.status == "running":
        raise HTTPException(status_code=400, detail="Cannot delete running task")

    del task_store[task_id]
    return {"message": f"Task {task_id} deleted"}


@app.post("/session", response_model=SessionResponse)
async def create_session(request: SessionCreate):
    session_id = str(uuid.uuid4())
    browser = Browser(keep_alive=request.keep_alive)
    session_store[session_id] = browser
    return SessionResponse(
        session_id=session_id,
        message="Session created. Use session_id in task requests to reuse browser.",
    )


@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    if session_id not in session_store:
        raise HTTPException(status_code=404, detail="Session not found")

    browser = session_store.pop(session_id)
    await browser.close()
    return {"message": f"Session {session_id} closed"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)


def run_server():
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
