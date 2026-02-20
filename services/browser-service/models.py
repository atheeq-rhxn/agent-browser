from typing import Any, Literal, Optional
from pydantic import BaseModel, Field


class TaskRequest(BaseModel):
    task: str = Field(..., description="The browser automation task to execute")
    session_id: Optional[str] = Field(None, description="Reuse existing browser session")
    output_schema: Optional[dict[str, Any]] = Field(None, description="JSON schema for structured output")
    use_vision: bool = Field(True, description="Enable vision/screenshot capability")


class TaskStatus(BaseModel):
    task_id: str
    status: Literal["pending", "running", "completed", "failed", "stopped"]
    result: Optional[str] = None
    improved_task: Optional[str] = Field(None, description="The prompt-improved version of the original task")
    structured_output: Optional[dict[str, Any]] = None
    error: Optional[str] = None
    urls: list[str] = Field(default_factory=list)
    steps: int = 0
    duration_seconds: Optional[float] = None


class TaskResponse(BaseModel):
    task_id: str
    status: Literal["pending", "running", "completed", "failed"]
    message: Optional[str] = None


class SessionCreate(BaseModel):
    keep_alive: bool = Field(False, description="Keep browser alive after task")


class SessionResponse(BaseModel):
    session_id: str
    message: str


class HealthResponse(BaseModel):
    status: str
    active_tasks: int
    active_sessions: int
