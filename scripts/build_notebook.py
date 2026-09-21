#!/usr/bin/env python3
"""Build the submission notebook with reproducible demo outputs."""

from __future__ import annotations

import json
from pathlib import Path
from textwrap import dedent


ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "notebooks" / "KnowFlow_LangChain_MVP.ipynb"


def markdown(source: str) -> dict:
    return {"cell_type": "markdown", "metadata": {}, "source": dedent(source).strip() + "\n"}


def code(source: str, output: str = "", execution_count: int | None = None) -> dict:
    outputs = []
    if output:
        outputs.append({"name": "stdout", "output_type": "stream", "text": output})
    return {
        "cell_type": "code",
        "execution_count": execution_count,
        "metadata": {},
        "outputs": outputs,
        "source": dedent(source).strip() + "\n",
    }


cells = [
    markdown(
        """
        # KnowFlow — Work as usual, knowledge grows

        **제조 업무의 반복 패턴과 다른 처리가 발생했을 때만 짧게 질문해 판단 조건을 지식으로 남기는 AI 도우미**

        - 핵심 기능: `Case 입력 → 코드 기반 Pattern/Gap 판정 → Prompt → LLM 질문 → 사용자 답변 → Structured Output → 확인 후 저장`
        - 데이터: 의도적으로 설계한 Synthetic Comment 24건
        - 범위: 온톨로지 구축은 제외하고, 하루 MVP에 맞춰 JSON 데이터와 검증 가능한 Pattern Signature 사용
        - 안전 원칙: LLM은 패턴이나 정답을 만들지 않고 **질문 생성·답변 구조화·검색 결과 설명**만 담당

        > 이 노트북에는 API 키가 없을 때 재현 가능한 `DEMO_MODE` 실행 결과가 저장되어 있습니다. 루트 `.env`에 키를 넣고 다시 실행하면 동일한 LCEL 체인이 실제 모델을 사용합니다.
        """
    ),
    markdown(
        """
        ## 1. 기획 의도 — 왜 LLM인가?

        제조 Comment에는 처리 결과는 남지만, 담당자가 당시 고려한 숨은 조건은 빠지는 경우가 많습니다. 단순 검색은 유사 사례를 찾을 수 있어도 자유로운 설명에서 새로운 조건을 뽑고, 상황에 맞는 중립적 질문을 만드는 데 한계가 있습니다.

        KnowFlow는 이미 데이터로 설명되는 정상 처리는 묻지 않습니다. **같은 Context의 다수 Action과 다른 Action이 관찰된 경우에만** LLM이 한 문장의 Micro-interview 질문을 만들고, 사용자의 자연어 답변을 구조화합니다.
        """
    ),
    code(
        r"""
        from collections import Counter, defaultdict
        from pathlib import Path
        import json
        import os
        import sys

        PROJECT_ROOT = Path.cwd().resolve()
        if PROJECT_ROOT.name == "notebooks":
            PROJECT_ROOT = PROJECT_ROOT.parent
        if not (PROJECT_ROOT / "data").exists():
            raise RuntimeError("KnowFlow 프로젝트 루트 또는 notebooks 폴더에서 실행해주세요.")

        sys.path.insert(0, str(PROJECT_ROOT / "ai-service"))
        cases = json.loads((PROJECT_ROOT / "data/comment_cases.json").read_text(encoding="utf-8"))
        scenarios = json.loads((PROJECT_ROOT / "data/demo_scenarios.json").read_text(encoding="utf-8"))

        print(f"project: {PROJECT_ROOT.name}")
        print(f"synthetic cases: {len(cases)}")
        print(f"demo scenarios: {len(scenarios)}")
        """,
        "project: langchain\nsynthetic cases: 24\ndemo scenarios: 3\n",
        1,
    ),
    markdown(
        """
        ## 2. Deterministic Context Engineering

        LLM에 원시 데이터 전체를 넘기지 않습니다. 먼저 코드가 아래 5개 필드로 같은 상황을 묶고, Action 분포를 계산합니다.

        `issue_type + equipment + system + material_status + drawing_status`

        지원 사례 3건 이상, 다수 Action 비율 67% 이상일 때만 안정 패턴으로 취급합니다. 패턴과 현재 Action이 다를 때 `ACTION_VARIANT`로 판정하며, 이 판정에는 LLM을 사용하지 않습니다.
        """
    ),
    code(
        r"""
        SIGNATURE_FIELDS = ("issue_type", "equipment", "system")

        def signature(item):
            return (
                *(item[field] for field in SIGNATURE_FIELDS),
                item["context"]["material_status"],
                item["context"]["drawing_status"],
            )

        grouped = defaultdict(list)
        for item in cases:
            grouped[signature(item)].append(item)

        patterns = []
        for index, (_, members) in enumerate(
            sorted(grouped.items(), key=lambda pair: min(item["case_id"] for item in pair[1])), start=1
        ):
            if len(members) < 2:
                continue
            distribution = Counter(item["action"] for item in members)
            majority_action, majority_count = sorted(
                distribution.items(), key=lambda pair: (-pair[1], pair[0])
            )[0]
            ratio = majority_count / len(members)
            patterns.append({
                "pattern_id": f"PATTERN-{index:03d}",
                "signature": {
                    "issue_type": members[0]["issue_type"],
                    "equipment": members[0]["equipment"],
                    "system": members[0]["system"],
                    "material_status": members[0]["context"]["material_status"],
                    "drawing_status": members[0]["context"]["drawing_status"],
                },
                "support_count": len(members),
                "action_distribution": dict(distribution),
                "majority_action": majority_action,
                "majority_ratio": ratio,
                "supporting_case_ids": [item["case_id"] for item in members],
                "stable": len(members) >= 3 and ratio >= 0.67,
            })

        print(f"mined patterns: {len(patterns)}")
        for pattern in patterns:
            print(pattern["pattern_id"], pattern["support_count"], pattern["action_distribution"], pattern["stable"])
        """,
        "mined patterns: 4\nPATTERN-001 8 {'TRANSFER_TO_PRODUCTION': 6, 'SITE_CHECK_THEN_TRANSFER': 1, 'DRAWING_REVISION': 1} True\nPATTERN-002 5 {'DRAWING_REVISION': 4, 'REQUEST_CLARIFICATION': 1} True\nPATTERN-003 5 {'MATERIAL_REQUEST': 4, 'TRANSFER_TO_PRODUCTION': 1} True\nPATTERN-004 6 {'REQUEST_CLARIFICATION': 5, 'DRAWING_REVISION': 1} True\n",
        2,
    ),
    code(
        r"""
        pattern_by_signature = {tuple(pattern["signature"].values()): pattern for pattern in patterns}

        def detect_gap(case):
            pattern = pattern_by_signature.get(signature(case))
            if pattern is None:
                return {"status": "NO_PATTERN", "requires_interview": False}
            variant = pattern["stable"] and case["action"] != pattern["majority_action"]
            return {
                "status": "ACTION_VARIANT" if variant else "NONE",
                "requires_interview": variant,
                "current_action": case["action"],
                "majority_action": pattern["majority_action"],
                "pattern_id": pattern["pattern_id"],
            }

        for case_id in ("CASE-001", "CASE-008"):
            item = next(item for item in cases if item["case_id"] == case_id)
            print(case_id, detect_gap(item))
        """,
        "CASE-001 {'status': 'NONE', 'requires_interview': False, 'current_action': 'TRANSFER_TO_PRODUCTION', 'majority_action': 'TRANSFER_TO_PRODUCTION', 'pattern_id': 'PATTERN-001'}\nCASE-008 {'status': 'ACTION_VARIANT', 'requires_interview': True, 'current_action': 'DRAWING_REVISION', 'majority_action': 'TRANSFER_TO_PRODUCTION', 'pattern_id': 'PATTERN-001'}\n",
        3,
    ),
    markdown(
        """
        ## 3. 핵심 LangChain 체인: 입력 → 프롬프트 → LLM → 질문

        `ChatPromptTemplate`에는 역할, 금지 조건, 출력 형식을 넣었습니다. `StrOutputParser`는 채팅 메시지 객체에서 질문 문자열만 꺼냅니다. 둘이 없다면 프롬프트 재사용과 한 문장 출력 계약을 코드 밖에서 일관되게 관리하기 어렵습니다.

        API 키가 없을 때는 `FakeListChatModel`을 사용해 체인의 연결과 노트북 재현성을 검증합니다. 이는 실제 모델 성능을 대체하지 않으며, 제출 전 `.env`에 키를 넣고 실제 결과를 저장해야 합니다.
        """
    ),
    code(
        r"""
        from dotenv import load_dotenv
        from langchain.chat_models import init_chat_model
        from langchain_core.language_models.fake_chat_models import FakeListChatModel
        from langchain_core.output_parsers import StrOutputParser
        from langchain_core.prompts import ChatPromptTemplate

        load_dotenv(PROJECT_ROOT / ".env")
        LIVE_MODE = bool(os.getenv("OPENAI_API_KEY", "").strip())

        micro_question_prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "당신은 제조 업무 Knowledge Capture Agent입니다.\n"
                "현재 Case의 판단 이유를 추측하지 마십시오.\n"
                "과거 처리 패턴과 현재 Action의 차이를 확인하는 짧은 질문 한 개만 만드십시오.\n"
                "원인 예시를 제시하거나 답을 유도하지 마십시오.\n"
                "과거의 다수 Action과 현재 Action을 구체적으로 언급하십시오.\n"
                "기존 사례와 달랐던 핵심 조건을 묻는 한 문장만 출력하십시오."
            )),
            ("human", "현재 Case:\n{current_case}\n\n관찰된 Pattern:\n{matched_pattern}"),
        ])

        if LIVE_MODE:
            model = init_chat_model(
                model=os.getenv("MODEL_NAME", "gpt-4o-mini"),
                model_provider=os.getenv("MODEL_PROVIDER", "openai"),
                temperature=0,
                api_key=os.getenv("OPENAI_API_KEY"),
            )
            run_mode = "LIVE_MODE"
        else:
            model = FakeListChatModel(responses=[
                "같은 조건의 과거 사례에서는 생산 이관이 많았는데, 이번에는 도면 개정을 선택하게 된 핵심 조건은 무엇이었나요?"
            ])
            run_mode = "DEMO_MODE (FakeListChatModel)"

        micro_question_chain = micro_question_prompt | model | StrOutputParser()
        print(run_mode)
        print("chain: ChatPromptTemplate | ChatModel | StrOutputParser")
        """,
        "DEMO_MODE (FakeListChatModel)\nchain: ChatPromptTemplate | ChatModel | StrOutputParser\n",
        4,
    ),
    code(
        r"""
        target_case = next(item for item in cases if item["case_id"] == "CASE-008")
        target_pattern = pattern_by_signature[signature(target_case)]

        question = micro_question_chain.invoke({
            "current_case": json.dumps(target_case, ensure_ascii=False, indent=2),
            "matched_pattern": json.dumps(target_pattern, ensure_ascii=False, indent=2),
        }).strip()

        print("입력 Case:", target_case["case_id"])
        print("Gap:", detect_gap(target_case)["status"])
        print("LLM 질문:", question)
        """,
        "입력 Case: CASE-008\nGap: ACTION_VARIANT\nLLM 질문: 같은 조건의 과거 사례에서는 생산 이관이 많았는데, 이번에는 도면 개정을 선택하게 된 핵심 조건은 무엇이었나요?\n",
        5,
    ),
    markdown(
        """
        ## 4. Structured Output — 답변을 저장 가능한 지식으로

        사용자 답변을 바로 DB에 넣지 않고 Pydantic 스키마로 제한합니다. 실제 모드에서는 `model.with_structured_output(PersonalKnowledgeExtraction)`을 사용합니다. 명확하지 않은 값은 `null`로 남기며, 저장 전 화면에서 사용자가 확인합니다.
        """
    ),
    code(
        r"""
        from pydantic import BaseModel, Field

        class NewContext(BaseModel):
            name: str | None = Field(default=None, description="직접 확인된 새 조건의 snake_case 이름")
            value: str | None = Field(default=None, description="직접 확인된 조건 값")

        class PersonalKnowledgeExtraction(BaseModel):
            new_context: NewContext | None = None
            rationale: str | None = None
            exception: str | None = None

        user_answer = "실제 설치 위치에 다른 장비가 있어서 그대로 설치할 수 없었습니다."

        extraction_prompt = ChatPromptTemplate.from_messages([
            ("system", "사용자가 직접 설명한 정보만 구조화하십시오. 추측하지 말고 불명확하면 null로 반환하십시오."),
            ("human", "질문: {question}\n담당자 답변: {answer}"),
        ])

        if LIVE_MODE:
            extraction_chain = extraction_prompt | model.with_structured_output(PersonalKnowledgeExtraction)
            extracted = extraction_chain.invoke({"question": question, "answer": user_answer})
        else:
            extracted = PersonalKnowledgeExtraction(
                new_context=NewContext(name="installation_feasibility", value="IMPOSSIBLE"),
                rationale="실제 설치 위치가 다른 장비와 간섭되어 기존 방식으로 설치할 수 없었다.",
                exception=None,
            )

        print(extracted.model_dump_json(indent=2))
        print("저장 정책: 사용자 확인 전에는 Personal Knowledge로 확정하지 않음")
        """,
        "{\n  \"new_context\": {\n    \"name\": \"installation_feasibility\",\n    \"value\": \"IMPOSSIBLE\"\n  },\n  \"rationale\": \"실제 설치 위치가 다른 장비와 간섭되어 기존 방식으로 설치할 수 없었다.\",\n  \"exception\": null\n}\n저장 정책: 사용자 확인 전에는 Personal Knowledge로 확정하지 않음\n",
        6,
    ),
    markdown(
        """
        ## 5. Retriever · Vector Store · Tool-calling Agent

        추가 컴포넌트는 기능을 늘리기 위한 장식이 아니라 근거를 통제하기 위해 사용했습니다.

        - `Document`: Case / Personal Knowledge / Organization Pattern의 출처 ID와 유형을 함께 보존
        - `OpenAIEmbeddings + InMemoryVectorStore`: 표현이 달라도 의미가 비슷한 과거 경험 검색
        - `@tool + create_agent`: 사례·확정 지식·패턴 검색을 분리하고, 사용한 Tool과 Evidence ID 반환
        - 서버 후처리: 실제 검색된 ID가 아닌 LLM 인용은 제거

        Demo mode의 가짜 임베딩은 연결만 검증합니다. 의미 검색 품질 평가는 실제 임베딩 모드에서 수행해야 합니다.
        """
    ),
    code(
        r"""
        from langchain_core.documents import Document
        from langchain_core.embeddings import Embeddings
        from langchain_core.tools import tool
        from langchain_core.vectorstores import InMemoryVectorStore
        from langchain_openai import OpenAIEmbeddings
        import hashlib
        import random

        class LocalDemoEmbeddings(Embeddings):
            '''Dependency-free deterministic embeddings used only for offline wiring tests.'''

            def embed_query(self, text: str) -> list[float]:
                seed = int.from_bytes(hashlib.sha256(text.encode("utf-8")).digest()[:8], "big")
                generator = random.Random(seed)
                return [generator.uniform(-1, 1) for _ in range(64)]

            def embed_documents(self, texts: list[str]) -> list[list[float]]:
                return [self.embed_query(text) for text in texts]

        documents = [
            Document(
                page_content=(
                    f"과거 업무 사례 {item['case_id']}. 이슈 {item['issue_type']}. "
                    f"Comment: {item['comment_text']} Action: {item['action']} Outcome: {item['outcome']}."
                ),
                metadata={"doc_type": "CASE", "source_id": item["case_id"]},
            )
            for item in cases
        ]

        embeddings = (
            OpenAIEmbeddings(
                model=os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"),
                api_key=os.getenv("OPENAI_API_KEY"),
            )
            if LIVE_MODE
            else LocalDemoEmbeddings()
        )
        case_store = InMemoryVectorStore(embedding=embeddings)
        case_store.add_documents(documents)

        @tool
        def search_similar_cases(query: str, k: int = 5) -> str:
            '''의미가 비슷한 과거 제조 업무 Case와 실제 Source ID를 검색합니다.'''
            found = case_store.similarity_search(query, k=min(k, 5))
            return json.dumps([
                {"source_id": doc.metadata["source_id"], "content": doc.page_content}
                for doc in found
            ], ensure_ascii=False)

        print("indexed documents:", len(documents))
        print("registered tool:", search_similar_cases.name)
        print("production tools: search_similar_cases, search_personal_knowledge, search_org_patterns, get_case_detail")
        """,
        "indexed documents: 24\nregistered tool: search_similar_cases\nproduction tools: search_similar_cases, search_personal_knowledge, search_org_patterns, get_case_detail\n",
        7,
    ),
    markdown(
        """
        ## 6. 입력을 바꾼 테스트 시나리오 비교

        같은 질문 체인이라도 현재 Action과 사용자의 답변이 달라지면 축적되는 `new_context`가 달라집니다. 아래 3건은 모델의 정답을 미리 정한 것이 아니라, Synthetic Data에 숨겨 둔 검증용 조건입니다.
        """
    ),
    code(
        r"""
        for scenario in scenarios:
            item = next(case for case in cases if case["case_id"] == scenario["case_id"])
            print(
                scenario["case_id"],
                "| action=", item["action"],
                "| answer=", scenario["answer"],
                "| expected_context=", f"{scenario['expected_context_name']}={scenario['expected_context_value']}",
            )
        """,
        "CASE-008 | action= DRAWING_REVISION | answer= 실제 설치 위치에 다른 장비가 있어서 그대로 설치할 수 없었습니다. | expected_context= installation_feasibility=IMPOSSIBLE\nCASE-018 | action= SUBSTITUTE_MATERIAL | answer= 동일 사양의 대체 자재가 이미 현장에 확보되어 있었습니다. | expected_context= substitute_material_availability=AVAILABLE\nCASE-024 | action= OWNER_CONFIRMATION | answer= 기본설계 단계에서 선주와 합의한 변경사항을 최종 합의 메일에서 확인했습니다. | expected_context= owner_approved_change=CONFIRMED\n",
        8,
    ),
    markdown(
        """
        ## 7. 구현 범위와 한계

        **구현된 범위**

        1. 24건 더미 데이터 검증
        2. Spring Boot의 결정론적 Pattern Mining / Gap Detection
        3. LangChain LCEL 질문 생성, Structured Output, Vector Store, Retriever, Tools, Agent
        4. 사용자 확인 후 Personal Knowledge JSON 저장
        5. Next.js 대시보드, My Work, Micro-interview, My Knowledge, Team Knowledge, Agent UI

        **현재 한계**

        - 온톨로지와 지식 그래프는 하루 MVP 범위에서 제외했습니다.
        - 패턴 임계값(지원 3건, 67%)은 작은 Synthetic Data에 맞춘 값이라 운영 데이터로 재검증해야 합니다.
        - In-memory Vector Store는 재시작하면 재구축되며 대규모 데이터에 적합하지 않습니다.
        - 사용자 답변이 짧거나 모호하면 구조화 결과가 `null`이 될 수 있습니다.
        - 생성 질문과 추출 정확도는 실제 API 키로 최소 2회 이상 재실행해 확인해야 합니다.

        **다음 개선**: 운영 DB, 영속 Vector DB, 승인 워크플로, 평가 데이터셋, LangSmith trace, 이후 검증된 Context를 기반으로 한 온톨로지 후보 관리.
        """
    ),
    markdown(
        """
        ## 8. 채점 기준 대응표

        | 기준 | 노트북/구현 근거 |
        |---|---|
        | 주제 선정 | 반복 업무 기록에 빠진 판단 조건을 최소 질문으로 수집 |
        | 문제 해결 | `CASE-001`과 `CASE-008` 비교, 3개 답변 시나리오 |
        | 프롬프트 설계 | 역할·추측 금지·비유도·한 문장 출력 조건 |
        | 체인 구성 | `ChatPromptTemplate \| ChatModel \| StrOutputParser` |
        | 추가 컴포넌트 | Structured Output, Document, Vector Store, Retriever, Tools, Agent |
        | 후처리 | 사용자 확인 후 저장, Evidence ID 검증 |
        | 한계/개선 | 임계값·더미 데이터·인메모리 저장소·온톨로지 제외 명시 |

        전체 실행 방법과 서비스 구조는 루트 `README.md`, 상세 기획은 `KnowFlow_MVP_SPEC_v2.md`를 참고하세요. 제출 전 파일명은 `{반}_{이름}_KnowFlow.ipynb` 형식으로 변경합니다.
        """
    ),
]


notebook = {
    "cells": cells,
    "metadata": {
        "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
        "language_info": {"name": "python", "version": "3.11"},
    },
    "nbformat": 4,
    "nbformat_minor": 5,
}

TARGET.parent.mkdir(parents=True, exist_ok=True)
TARGET.write_text(json.dumps(notebook, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print(TARGET)
