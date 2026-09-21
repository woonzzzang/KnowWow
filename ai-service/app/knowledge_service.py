from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from typing import Any

from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.tools import tool
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_openai import OpenAIEmbeddings

from .config import Settings
from .models import (
    AgentChatRequest,
    CommentCase,
    ExtractKnowledgeRequest,
    IndexPayload,
    MicroQuestionRequest,
    OrganizationPattern,
    PersonalKnowledgeExtraction,
)
from .prompts import AGENT_SYSTEM_PROMPT, KNOWLEDGE_EXTRACTION_PROMPT, MICRO_QUESTION_PROMPT
from .terminology import (
    ACTION_LABELS,
    CONSTRUCTION_STAGE_LABELS,
    DRAWING_STATUS_LABELS,
    ISSUE_LABELS,
    MATERIAL_STATUS_LABELS,
    OUTCOME_LABELS,
    humanize_chat_text,
    label_of,
)


SOURCE_ID_PATTERN = re.compile(r"\b(?:CASE|PK|PATTERN)-\d{3}\b")


class AiNotConfiguredError(RuntimeError):
    pass


def compact_json(value: Any) -> str:
    if hasattr(value, "model_dump"):
        value = value.model_dump(mode="json")
    return json.dumps(value, ensure_ascii=False, indent=2)


def micro_question_context(request: MicroQuestionRequest) -> tuple[dict[str, Any], dict[str, Any]]:
    """Build a prompt payload containing only plain Korean user-facing terms."""

    current_case = {
        "문제": label_of(ISSUE_LABELS, request.current_case.issue_type, "분류되지 않은 문제"),
        "이번에 한 처리": label_of(
            ACTION_LABELS, request.current_case.action, "별도로 정한 방식으로 처리"
        ),
        "현재 알려진 상황": [
            label_of(
                MATERIAL_STATUS_LABELS,
                request.current_case.context.material_status,
                "자재 상태는 아직 확인되지 않음",
            ),
            label_of(
                DRAWING_STATUS_LABELS,
                request.current_case.context.drawing_status,
                "도면 상태는 아직 확인되지 않음",
            ),
            label_of(
                CONSTRUCTION_STAGE_LABELS,
                request.current_case.context.construction_stage,
                "진행 단계는 아직 확인되지 않음",
            ),
        ],
    }
    matched_pattern = {
        "비슷한 과거 업무 수": request.matched_pattern.support_count,
        "가장 많이 했던 처리": label_of(
            ACTION_LABELS,
            request.matched_pattern.majority_action,
            "별도로 정한 방식으로 처리",
        ),
        "처리별 건수": {
            label_of(ACTION_LABELS, action, "기타 방식으로 처리"): count
            for action, count in request.matched_pattern.action_distribution.items()
        },
    }
    return current_case, matched_pattern


def case_document(item: CommentCase) -> Document:
    content = (
        f"과거 업무 사례 {item.case_id}. 문제 유형 "
        f"{label_of(ISSUE_LABELS, item.issue_type, '분류되지 않은 문제')}, "
        f"장비 {item.equipment}, 시스템 {item.system}, "
        f"{label_of(MATERIAL_STATUS_LABELS, item.context.material_status, '자재 상태 미확인')}, "
        f"{label_of(DRAWING_STATUS_LABELS, item.context.drawing_status, '도면 상태 미확인')}. "
        f"Comment: {item.comment_text} Response: {item.response_text} "
        f"관찰된 처리 방식: {label_of(ACTION_LABELS, item.action, '기타 처리')}, "
        f"처리 결과: {label_of(OUTCOME_LABELS, item.outcome, '결과 미확인')}."
    )
    return Document(
        page_content=content,
        metadata={
            "doc_type": "CASE",
            "source_id": item.case_id,
            "employee_id": item.employee_id,
            "issue_type": item.issue_type,
        },
    )


def pattern_document(item: OrganizationPattern) -> Document:
    distribution = ", ".join(
        f"{label_of(ACTION_LABELS, key, '기타 처리')} {value}건"
        for key, value in item.action_distribution.items()
    )
    content = (
        f"조직의 과거 처리 경향 {item.pattern_id}. 문제 유형 "
        f"{label_of(ISSUE_LABELS, item.signature.issue_type, '분류되지 않은 문제')}, "
        f"장비 {item.signature.equipment}, 시스템 {item.signature.system}, "
        f"{label_of(MATERIAL_STATUS_LABELS, item.signature.material_status, '자재 상태 미확인')}, "
        f"{label_of(DRAWING_STATUS_LABELS, item.signature.drawing_status, '도면 상태 미확인')}. "
        f"총 {item.support_count}건에서 {distribution}. 가장 많이 관찰된 처리 방식은 "
        f"{label_of(ACTION_LABELS, item.majority_action, '기타 처리')}이며 "
        f"비율은 {item.majority_ratio:.0%}이다. "
        "이 경향은 공식 업무 규칙이나 정답이 아니라 과거 관찰 결과이다."
    )
    return Document(
        page_content=content,
        metadata={
            "doc_type": "ORG_PATTERN",
            "source_id": item.pattern_id,
            "issue_type": item.signature.issue_type,
        },
    )


def knowledge_document(item: dict[str, Any]) -> Document | None:
    if not item.get("verified_by_user"):
        return None
    knowledge_id = item.get("knowledge_id")
    structured = item.get("structured_knowledge") or {}
    new_context = structured.get("new_context") or {}
    content = (
        f"사람이 확인한 개인 경험지식 {knowledge_id}. 담당자 {item.get('employee_id')}. "
        f"새로 확인한 상황 {humanize_chat_text(str(new_context.get('name')))}="
        f"{humanize_chat_text(str(new_context.get('value')))}. "
        f"처리 방식 {humanize_chat_text(str(structured.get('action')))}. "
        f"판단 근거: {structured.get('rationale')}. "
        f"예외: {structured.get('exception') or '명시되지 않음'}. "
        f"원문 답변: {item.get('raw_answer_text')}"
    )
    source_cases = item.get("source_case_ids") or []
    return Document(
        page_content=content,
        metadata={
            "doc_type": "PERSONAL_KNOWLEDGE",
            "source_id": knowledge_id,
            "employee_id": item.get("employee_id"),
            "source_case_ids": ",".join(source_cases),
        },
    )


@dataclass
class KnowledgeIndex:
    case_store: InMemoryVectorStore
    knowledge_store: InMemoryVectorStore
    pattern_store: InMemoryVectorStore
    case_lookup: dict[str, CommentCase] = field(default_factory=dict)
    source_ids: set[str] = field(default_factory=set)


class KnowledgeService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._model = None
        self._embeddings = None
        self._index: KnowledgeIndex | None = None

    def require_configured(self) -> None:
        if not self.settings.is_configured:
            key_name = "OPENAI_API_KEY" if self.settings.model_provider == "openai" else "GOOGLE_API_KEY"
            raise AiNotConfiguredError(f"{key_name}가 비어 있습니다. 루트 .env 파일에 키를 입력해주세요.")

    @property
    def model(self):
        self.require_configured()
        if self._model is None:
            provider_key = (
                self.settings.openai_api_key
                if self.settings.model_provider == "openai"
                else self.settings.google_api_key
            )
            self._model = init_chat_model(
                model=self.settings.model_name,
                model_provider=self.settings.model_provider,
                temperature=0,
                api_key=provider_key,
            )
        return self._model

    @property
    def embeddings(self):
        self.require_configured()
        if self._embeddings is None:
            if self.settings.model_provider != "openai":
                raise AiNotConfiguredError("현재 MVP의 Vector Store는 MODEL_PROVIDER=openai를 사용합니다.")
            self._embeddings = OpenAIEmbeddings(
                model=self.settings.openai_embedding_model,
                api_key=self.settings.openai_api_key,
            )
        return self._embeddings

    def make_micro_question(self, request: MicroQuestionRequest) -> str:
        chain = MICRO_QUESTION_PROMPT | self.model | StrOutputParser()
        current_case, matched_pattern = micro_question_context(request)
        question = chain.invoke(
            {
                "current_case": compact_json(current_case),
                "matched_pattern": compact_json(matched_pattern),
            }
        ).strip()
        return humanize_chat_text(question)

    def extract_knowledge(self, request: ExtractKnowledgeRequest) -> PersonalKnowledgeExtraction:
        structured_model = self.model.with_structured_output(PersonalKnowledgeExtraction)
        chain = KNOWLEDGE_EXTRACTION_PROMPT | structured_model
        return chain.invoke(
            {
                "current_case": compact_json(request.current_case),
                "matched_pattern": compact_json(request.matched_pattern),
                "question": request.question,
                "answer": request.answer,
            }
        )

    def refresh_index(self, payload: IndexPayload) -> dict[str, int]:
        case_docs = [case_document(item) for item in payload.cases]
        pattern_docs = [pattern_document(item) for item in payload.patterns]
        knowledge_docs = [doc for item in payload.knowledge if (doc := knowledge_document(item)) is not None]

        case_store = InMemoryVectorStore(embedding=self.embeddings)
        knowledge_store = InMemoryVectorStore(embedding=self.embeddings)
        pattern_store = InMemoryVectorStore(embedding=self.embeddings)
        if case_docs:
            case_store.add_documents(case_docs)
        if knowledge_docs:
            knowledge_store.add_documents(knowledge_docs)
        if pattern_docs:
            pattern_store.add_documents(pattern_docs)

        all_docs = [*case_docs, *knowledge_docs, *pattern_docs]
        self._index = KnowledgeIndex(
            case_store=case_store,
            knowledge_store=knowledge_store,
            pattern_store=pattern_store,
            case_lookup={item.case_id: item for item in payload.cases},
            source_ids={str(doc.metadata["source_id"]) for doc in all_docs},
        )
        return {
            "cases": len(case_docs),
            "knowledge": len(knowledge_docs),
            "patterns": len(pattern_docs),
        }

    @staticmethod
    def _format_documents(documents: list[Document]) -> str:
        if not documents:
            return "검색 결과가 없습니다."
        return json.dumps(
            [
                {
                    "source_id": doc.metadata.get("source_id"),
                    "doc_type": doc.metadata.get("doc_type"),
                    "employee_id": doc.metadata.get("employee_id"),
                    "content": doc.page_content,
                }
                for doc in documents
            ],
            ensure_ascii=False,
        )

    def answer_with_agent(self, request: AgentChatRequest) -> dict[str, Any]:
        self.refresh_index(request)
        assert self._index is not None
        index = self._index
        used_tools: list[str] = []
        retrieved_ids: set[str] = set()

        def record(name: str, documents: list[Document]) -> str:
            used_tools.append(name)
            retrieved_ids.update(str(doc.metadata.get("source_id")) for doc in documents)
            return self._format_documents(documents)

        @tool
        def search_similar_cases(query: str, k: int = 5) -> str:
            """의미가 비슷한 과거 제조 업무 Case를 검색하고 실제 Case ID를 반환합니다."""
            return record("search_similar_cases", index.case_store.similarity_search(query, k=min(k, 5)))

        @tool
        def search_personal_knowledge(query: str, employee_id: str | None = None, k: int = 5) -> str:
            """담당자가 확인한 Personal Knowledge를 검색합니다. 추측이 아닌 사람 확인 지식만 반환합니다."""
            documents = index.knowledge_store.similarity_search(query, k=min(k, 5))
            if employee_id:
                documents = [doc for doc in documents if doc.metadata.get("employee_id") == employee_id]
            return record("search_personal_knowledge", documents)

        @tool
        def search_org_patterns(query: str, k: int = 5) -> str:
            """코드로 집계된 Organization Pattern과 Action 분포를 검색합니다. 패턴은 공식 Rule이 아닙니다."""
            return record("search_org_patterns", index.pattern_store.similarity_search(query, k=min(k, 5)))

        @tool
        def get_case_detail(case_id: str) -> str:
            """정확한 Case ID로 업무 사례의 전체 구조화 정보를 조회합니다."""
            used_tools.append("get_case_detail")
            item = index.case_lookup.get(case_id)
            if item is None:
                return f"{case_id}를 찾을 수 없습니다."
            retrieved_ids.add(case_id)
            return compact_json(item)

        agent = create_agent(
            model=self.model,
            tools=[search_similar_cases, search_personal_knowledge, search_org_patterns, get_case_detail],
            system_prompt=AGENT_SYSTEM_PROMPT,
        )
        user_context = request.query
        if request.employee_id:
            user_context += f"\n현재 선택된 담당자: {request.employee_id}"
        result = agent.invoke({"messages": [{"role": "user", "content": user_context}]})
        raw_answer = humanize_chat_text(str(result["messages"][-1].content))

        cited_ids = set(SOURCE_ID_PATTERN.findall(raw_answer))
        invalid_ids = cited_ids - retrieved_ids
        answer = raw_answer
        for source_id in invalid_ids:
            answer = answer.replace(source_id, "[검증되지 않은 근거 제거]")

        verified_ids = sorted(retrieved_ids)
        if verified_ids and not (set(SOURCE_ID_PATTERN.findall(answer)) & retrieved_ids):
            answer += "\n\n## 근거\n" + "\n".join(f"- {source_id}" for source_id in verified_ids)

        return {
            "answer": answer,
            "evidence_ids": verified_ids,
            "used_tools": list(dict.fromkeys(used_tools)),
        }
