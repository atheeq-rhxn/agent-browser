import asyncio
import json
import logging
import time
import uuid
from contextlib import asynccontextmanager
from typing import Optional

from browser_use import Agent, Browser, ChatGoogle
from fastapi import FastAPI, HTTPException
from google import genai
from google.genai import types

from models import (
    HealthResponse,
    SessionCreate,
    SessionResponse,
    TaskRequest,
    TaskResponse,
    TaskStatus,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("browser-use-service")

# ---------------------------------------------------------------------------
# Timeouts (seconds) — override via env vars if needed
# ---------------------------------------------------------------------------
PROMPT_IMPROVE_TIMEOUT = 30   # max time to wait for Gemini prompt improvement
AGENT_RUN_TIMEOUT = 600       # max time for the browser agent to finish (10 min)

# ---------------------------------------------------------------------------
# Shared state
# ---------------------------------------------------------------------------
task_store: dict[str, TaskStatus] = {}
session_store: dict[str, Browser] = {}

LLM = ChatGoogle(model="gemini-2.5-flash")

# Fixed Chrome browser — reused for every task that does not supply a session_id
BROWSER = Browser(
    executable_path="/usr/bin/google-chrome",
    user_data_dir="~/.config/google-chrome",
    profile_directory="Default",
)

# client.aio exposes native async methods — no asyncio.to_thread wrapping needed.
_genai_client = genai.Client()

PROMPT_IMPROVER_SYSTEM = """You are an expert at writing browser automation instructions for an AI agent.
Your job is to take a user's raw task description and rewrite it into a clear, detailed, step-by-step instruction set that a browser agent can follow reliably.

Guidelines:
- Break the task into explicit, numbered steps
- Specify what to look for on each page (button labels, form fields, URLs, etc.)
- Include fallback instructions for common obstacles (cookie banners, popups, login prompts)
- Clarify the expected output or success condition
- Keep instructions actionable and unambiguous
- Do NOT change the intent of the original task — only improve clarity and completeness
- Return ONLY the improved prompt, no preamble or explanation"""


# ---------------------------------------------------------------------------
# Prompt improvement
# ---------------------------------------------------------------------------

async def improve_prompt(task: str, task_id: str) -> str:
    """Call Gemini to rewrite the task into detailed browser automation steps.

    Times out after PROMPT_IMPROVE_TIMEOUT seconds. On any failure the
    original task string is returned so the agent can still run.
    """
    logger.info("[%s] Improving prompt (timeout=%ss)", task_id, PROMPT_IMPROVE_TIMEOUT)
    try:
        response = await asyncio.wait_for(
            _genai_client.aio.models.generate_content(
                model="gemini-2.5-flash",
                contents=task,
                config=types.GenerateContentConfig(
                    system_instruction=PROMPT_IMPROVER_SYSTEM,
                    temperature=0.3,
                ),
            ),
            timeout=PROMPT_IMPROVE_TIMEOUT,
        )
        improved = (response.text or "").strip()
        if improved:
            logger.info("[%s] Prompt improved successfully (%d chars)", task_id, len(improved))
            return improved
        logger.warning("[%s] Gemini returned empty response — using original task", task_id)
        return task

    except asyncio.TimeoutError:
        logger.warning(
            "[%s] Prompt improvement timed out after %ss — using original task",
            task_id, PROMPT_IMPROVE_TIMEOUT,
        )
        return task
    except Exception as exc:
        logger.error("[%s] Prompt improvement failed: %s — using original task", task_id, exc)
        return task


# ---------------------------------------------------------------------------
# Task execution
# ---------------------------------------------------------------------------

async def execute_task(task_id: str, request: TaskRequest) -> None:
    start_time = time.time()
    status = task_store[task_id]
    status.status = "running"
    logger.info("[%s] Task started | original_task=%r", task_id, request.task[:120])

    browser: Optional[Browser] = None
    try:
        # 1. Improve the prompt
        improved_task = await improve_prompt(request.task, task_id)
        status.improved_task = improved_task

        # 2. Resolve browser — use named session if provided, otherwise the shared Chrome instance
        if request.session_id and request.session_id in session_store:
            browser = session_store[request.session_id]
            logger.info("[%s] Reusing session %s", task_id, request.session_id)
        else:
            browser = BROWSER
            logger.info("[%s] Using default Chrome browser", task_id)

        # 3. Build and run the agent (with overall timeout)
        agent = Agent(
            task=improved_task,
            llm=LLM,
            browser=browser,
            max_failures=3,
        )

        logger.info("[%s] Agent starting | timeout=%ss", task_id, AGENT_RUN_TIMEOUT)
        history = await asyncio.wait_for(
            agent.run(),
            timeout=AGENT_RUN_TIMEOUT,
        )

        # 4. Collect results
        status.status = "completed" if history.is_successful() else "failed"
        status.result = history.final_result()
        status.urls = [u for u in history.urls() if u]
        status.steps = history.number_of_steps()

        logger.info(
            "[%s] Agent finished | status=%s | steps=%d | urls=%d | duration=%.1fs",
            task_id, status.status, status.steps, len(status.urls),
            time.time() - start_time,
        )

        # 5. Optional structured output parsing
        if request.output_schema and status.result:
            try:
                status.structured_output = json.loads(status.result)
                logger.info("[%s] Structured output parsed successfully", task_id)
            except json.JSONDecodeError:
                logger.warning("[%s] Could not parse result as JSON for structured output", task_id)

    except asyncio.TimeoutError:
        status.status = "failed"
        status.error = f"Agent timed out after {AGENT_RUN_TIMEOUT}s"
        logger.error("[%s] Agent run timed out after %ss", task_id, AGENT_RUN_TIMEOUT)

    except asyncio.CancelledError:
        status.status = "stopped"
        status.error = "Task was cancelled"
        logger.warning("[%s] Task cancelled", task_id)

    except Exception as exc:
        status.status = "failed"
        status.error = str(exc)
        logger.exception("[%s] Unexpected error: %s", task_id, exc)

    finally:
        status.duration_seconds = round(time.time() - start_time, 2)
        logger.info(
            "[%s] Task finished | final_status=%s | duration=%.2fs",
            task_id, status.status, status.duration_seconds,
        )
        # Only close if it was an explicit named session being cleaned up
        # The default BROWSER singleton is never closed per-task
        if browser and request.session_id and request.session_id not in session_store:
            await browser.close()
            logger.debug("[%s] Browser closed", task_id)


# ---------------------------------------------------------------------------
# App lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Browser-Use Service starting up")
    yield
    logger.info("Shutting down — closing %d session(s)", len(session_store))
    for browser in session_store.values():
        await browser.close()
    session_store.clear()
    logger.info("Shutdown complete")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

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
    logger.info("[%s] Task queued | task=%r", task_id, request.task[:120])

    task_store[task_id] = TaskStatus(task_id=task_id, status="pending")
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
        logger.info("[%s] Task stop requested by user", task_id)
    return {"message": f"Task {task_id} stop requested"}


@app.delete("/task/{task_id}")
async def delete_task(task_id: str):
    if task_id not in task_store:
        raise HTTPException(status_code=404, detail="Task not found")

    status = task_store[task_id]
    if status.status == "running":
        raise HTTPException(status_code=400, detail="Cannot delete running task")

    del task_store[task_id]
    logger.info("[%s] Task deleted", task_id)
    return {"message": f"Task {task_id} deleted"}


@app.post("/session", response_model=SessionResponse)
async def create_session(request: SessionCreate):
    session_id = str(uuid.uuid4())
    browser = Browser(
        executable_path="/usr/bin/google-chrome",
        user_data_dir="~/.config/google-chrome",
        profile_directory="Default",
        keep_alive=request.keep_alive,
    )
    session_store[session_id] = browser
    logger.info("[session:%s] Created | keep_alive=%s", session_id, request.keep_alive)
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
    logger.info("[session:%s] Closed", session_id)
    return {"message": f"Session {session_id} closed"}


# ---------------------------------------------------------------------------
# Entrypoints
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


def run_server():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
