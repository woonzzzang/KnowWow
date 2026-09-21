from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

from .config import get_settings
from .knowledge_service import AiNotConfiguredError, KnowledgeService
from .models import AgentChatRequest, ExtractKnowledgeRequest, IndexPayload, MicroQuestionRequest


settings = get_settings()
service = KnowledgeService(settings)

app = FastAPI(
    title="KnowFlow AI Service",
    version="0.1.0",
    description="LangChain micro-interview, structured output, retrieval and tool-calling agent",
)


@app.exception_handler(AiNotConfiguredError)
async def handle_missing_key(_, exception: AiNotConfiguredError):
    return JSONResponse(
        status_code=503,
        content={"detail": str(exception), "code": "AI_NOT_CONFIGURED"},
    )


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "model_provider": settings.model_provider,
        "model_name": settings.model_name,
        "configured": settings.is_configured,
        "index_ready": service._index is not None,
    }


@app.post("/ai/micro-question")
def micro_question(request: MicroQuestionRequest) -> dict[str, str]:
    question = service.make_micro_question(request)
    return {"question": question}


@app.post("/ai/extract-knowledge")
def extract_knowledge(request: ExtractKnowledgeRequest) -> dict[str, object]:
    result = service.extract_knowledge(request)
    return {"structured_knowledge": result.model_dump(mode="json")}


@app.post("/ai/index/refresh")
def refresh_index(payload: IndexPayload) -> dict[str, object]:
    counts = service.refresh_index(payload)
    return {"status": "refreshed", "document_counts": counts}


@app.post("/ai/agent/chat")
def agent_chat(request: AgentChatRequest) -> dict[str, object]:
    try:
        return service.answer_with_agent(request)
    except AiNotConfiguredError:
        raise
    except Exception as exception:
        raise HTTPException(
            status_code=502,
            detail="현재 검색된 Knowledge만으로 답변을 생성할 수 없습니다.",
        ) from exception
