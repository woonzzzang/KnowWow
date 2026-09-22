# KnowWow MVP 구현 명세서 v2
## 제조 업무 로그 기반 선택적 암묵지 외재화 + RAG Agent
### LangChain 실습 프로젝트 / Vercel 배포 기준

---

# 0. 프로젝트 한 줄 정의

> **기존 제조 업무 로그에서 반복되는 문제 해결 패턴을 찾고, 기존 패턴으로 설명되지 않는 행동이 발생했을 때만 담당자에게 짧게 질문하여 판단 근거를 명시지화하고, 축적된 개인·조직 경험지식을 RAG Agent로 재사용하는 시스템**

프로젝트명:

# **KnowWow**
### Work as usual, knowledge grows.

핵심 메시지:

> **현업자는 평소대로 일하고, 시스템은 기존 업무 로그를 최대한 활용하며, 정말 필요한 순간에만 최소한의 질문을 한다.**

---

# 1. 이번 MVP의 Scope

이번 프로젝트는 **LangChain 실습 과제**이며 구현 기간이 매우 짧다.

따라서 아래 범위만 구현한다.

## 반드시 구현
- Synthetic Comment 업무 데이터
- Comment Case 구조화
- deterministic Pattern Mining
- Action Distribution 계산
- Pattern Gap 탐지
- Gap 발생 시에만 Micro-interview 질문 생성
- 현업자 답변을 LLM Structured Output으로 구조화
- Human Confirmation 후 Personal Knowledge 저장
- Personal Knowledge / Past Case / Organization Pattern RAG
- LangChain Tool-calling Agent
- Evidence ID가 포함된 답변
- Next.js Frontend
- Spring Boot Backend
- Python FastAPI + LangChain AI Service
- Docker Compose
- Frontend Vercel 배포

## 가능하면 구현
- Spring Boot / FastAPI 클라우드 배포
- 간단한 Team Knowledge Dashboard
- Context Candidate 집계
- 개인별 Action Pattern 비교

## 이번 MVP에서 구현하지 않음
- 실제 Ontology
- RDF / OWL / SPARQL
- Neo4j / Knowledge Graph DB
- CAD / 도면 Parsing
- OCR / VLM
- 실제 사내 시스템 연동
- 실제 직원 정보
- 실제 회사 Comment 데이터
- 인과추론
- Process Mining 전용 프레임워크
- Fine-tuning
- 자동 Ontology Evolution

---

# 2. 전체 시스템 구조

```text
┌──────────────────────────────────────┐
│            Frontend                  │
│ Next.js + TypeScript                 │
│ Tailwind CSS + shadcn/ui             │
│                                      │
│ Vercel 배포                           │
└──────────────────┬───────────────────┘
                   │ REST API
                   ▼
┌──────────────────────────────────────┐
│         Spring Boot Backend          │
│ Java 21                              │
│                                      │
│ - Comment / Knowledge API            │
│ - JSON Data 관리                     │
│ - Pattern Mining                     │
│ - Gap Detection                      │
│ - Personal Knowledge 저장            │
│ - AI Service 호출                    │
└──────────────────┬───────────────────┘
                   │ Internal REST API
                   ▼
┌──────────────────────────────────────┐
│       Python AI Service              │
│ FastAPI + LangChain                  │
│                                      │
│ - Chat Model                         │
│ - Structured Output                  │
│ - Embedding / Vector Store           │
│ - Retriever                          │
│ - Tools / Agent                      │
│ - Micro-question 생성                │
│ - Knowledge Extraction              │
└──────────────────┬───────────────────┘
                   │
                   ▼
           OpenAI / Gemini API
```

---

# 3. 기술 스택

## Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- fetch 또는 axios
- 배포: **Vercel**

## Main Backend
- Java 21
- Spring Boot 3.x
- Spring Web
- Jackson
- Validation
- Lombok 사용 가능
- 필요 시 WebClient
- 배포 시 Docker 사용

## AI Backend
- Python 3.11+
- FastAPI
- LangChain
- Pydantic
- Uvicorn
- Vector Store:
  - 1순위: LangChain InMemoryVectorStore
  - 2순위: Chroma
- LLM:
  - API Key 기반
  - `.env` / Secret 환경변수 사용

## Local Infra
- Docker
- Docker Compose

---

# 4. 서비스별 책임 분리

## 4.1 Spring Boot가 담당해야 하는 것

LLM이 필요 없는 deterministic 업무 로직은 Spring Boot에서 수행한다.

### Spring Boot 책임
- Comment Case CRUD
- JSON Data 읽기/쓰기
- Employee 조회
- Pattern Mining
- Action Distribution 집계
- Majority Action 계산
- Pattern Gap 판정
- Personal Knowledge persistence
- Context Candidate 집계
- FastAPI 호출
- Frontend용 통합 API 제공

### Spring Boot가 하면 안 되는 것
- 자연어 질문 생성
- 자연어에서 지식 구조화
- RAG
- Embedding
- Agent reasoning

---

## 4.2 FastAPI + LangChain이 담당해야 하는 것

### AI Service 책임
- Micro-question 생성
- User 답변 Structured Output
- Comment / Knowledge Document 변환
- Embedding
- Retriever
- Tool
- RAG Agent
- 최종 답변 생성

### 절대 하지 말 것
- Pattern count 계산
- Majority ratio 계산
- Pattern Gap 자체를 확률적으로 판단
- 사용자 답변에 없는 판단 이유 생성
- 빈도가 높은 Action을 정답으로 선언

---

# 5. 핵심 Domain 개념

이번 MVP에서는 Ontology 대신 아래 Controlled Vocabulary + JSON Schema로 표현한다.

## 5.1 Observed Case

실제 업무 로그에 기록되어 있는 사실.

```text
Issue
Context
Action
Outcome
Employee
Project
```

예:

```text
Issue = InstallationMissing
MaterialStatus = Available
DrawingStatus = Valid
Action = TransferToProduction
Outcome = Accepted
```

---

## 5.2 Inferred Pattern

여러 Observed Case를 deterministic code로 집계한 결과.

예:

```text
Context:
InstallationMissing
Material = Available
Drawing = Valid

Observed Actions:
TransferToProduction = 6
SiteCheckThenTransfer = 2
DrawingRevision = 1
```

주의:

> Inferred Pattern은 Rule이 아니다.

---

## 5.3 Knowledge Gap

현재 시스템이 알고 있는 Context 기준으로는
Action 차이를 설명하기 어려운 Case.

기본 조건:

```text
Stable Pattern 존재
AND
현재 Action != Majority Action
```

---

## 5.4 Personal Knowledge

Knowledge Gap에 대해 담당자가 직접 설명한 판단 근거.

LLM이 생성한 추론이 아니라
**현업자가 직접 답한 내용을 LLM이 구조화한 것**이어야 한다.

---

## 5.5 Organization Pattern

여러 직원 / 여러 Case에 걸쳐 관찰된 처리 경향.

정답 Rule이 아니다.

---

## 5.6 Context Candidate

기존 JSON Schema에는 없었지만
Micro-interview를 통해 반복적으로 발견되는 판단 Context.

예:
- installation_feasibility
- work_area_availability
- schedule_urgency
- owner_specific_requirement

MVP에서는 Ontology로 자동 승격하지 않는다.

---

# 6. 가장 중요한 설계 원칙

## 원칙 1. LLM은 없는 암묵지를 생성하지 않는다

LLM은:
- 사용자가 말한 내용을 구조화
- 질문 생성
- 검색 결과 설명

만 한다.

LLM이 해서는 안 되는 것:

```text
"아마 이런 이유였을 것이다."
"보통 이런 이유 때문에 그랬을 것이다."
```

---

## 원칙 2. 질문은 Pattern Gap에서만 한다

현업자에게 질문을 남발하면 안 된다.

기본 MVP:

```text
Stable Pattern과 같은 Action
→ 질문 없음

Stable Pattern과 다른 Action
→ 질문
```

---

## 원칙 3. 개인차를 지우지 않는다

```text
EMP-001 → Action A
EMP-002 → Action B
```

를 억지로 하나의 Rule로 합치지 않는다.

---

## 원칙 4. 모든 Knowledge에는 Source가 존재해야 한다

- Case ID
- Personal Knowledge ID
- Pattern ID

를 항상 남긴다.

---

# 7. Synthetic Data 설계 가이드
# ★ 가장 중요 ★

Codex는 데이터를 단순 랜덤 생성하지 말고,
아래 규칙에 따라 **의도적으로 설계된 Test Dataset**을 만들어야 한다.

목적은 실제 회사 데이터를 흉내 내는 것이 아니라,

> **업무의 의사결정 구조를 재현하는 것**

이다.

---

# 8. Synthetic Data 생성 원칙

## 8.1 전체 규모

최소:

- Employee: 3명
- Comment Case: 24건
- Project: 4개
- Issue Type: 4종 이상

권장:

```text
EMP-001: 숙련자
EMP-002: 중급자
EMP-003: 신입/초급자
```

---

## 8.2 프로젝트

Synthetic Project:

```text
SHIP-A01
SHIP-A02
SHIP-B01
SHIP-C01
```

Vessel Type:

```text
LNGC
CONTAINER
TANKER
```

실제 회사 / 실제 호선 번호 금지.

---

# 9. 반드시 포함해야 하는 데이터 패턴

## Pattern Group A
### Installation Missing / 정상적인 생산 이관 Pattern

조건:

```text
Issue = INSTALLATION_MISSING
MaterialStatus = AVAILABLE
DrawingStatus = VALID
```

8건 생성.

Action Distribution 예:

```text
TRANSFER_TO_PRODUCTION       6
SITE_CHECK_THEN_TRANSFER     1
DRAWING_REVISION             1
```

목적:
- Majority Pattern 생성
- Variant 발생
- Micro-interview 시연 가능

---

## Variant A-1
### 숨겨진 Context: Installation Feasibility

Visible Context:

```text
Material = AVAILABLE
Drawing = VALID
```

Action:

```text
DRAWING_REVISION
```

Micro-interview 실제 답변:

```text
"실제 설치 위치에 다른 장비가 있어서
그 위치로는 설치할 수 없었습니다."
```

구조화 결과:

```text
installation_feasibility = IMPOSSIBLE
```

이 Case가 메인 Demo Scenario.

---

## Variant A-2
### 숨겨진 Context: Work Area Readiness

Action:

```text
SITE_CHECK_THEN_TRANSFER
```

Micro-interview 답변:

```text
"해당 구역에 다른 공정 작업이 진행 중이라
실제 설치 가능한 상태인지 먼저 확인했습니다."
```

구조화:

```text
work_area_readiness = NOT_READY
```

---

# 10. Pattern Group B
## Drawing Error

조건:

```text
Issue = DRAWING_ERROR
DrawingStatus = INVALID
```

5건.

주요 Action:

```text
DRAWING_REVISION
```

4건 이상.

Variant 1건:

```text
REQUEST_CLARIFICATION
```

이유는 직접 저장하지 말고,
Micro-interview를 통해 얻도록 구성 가능.

---

# 11. Pattern Group C
## Material Issue

조건:

```text
Issue = MATERIAL_ISSUE
MaterialStatus = UNAVAILABLE
```

5건.

주요 Action:

```text
MATERIAL_REQUEST
```

4건 이상.

Variant:

```text
TRANSFER_TO_PRODUCTION
```

단, 숨은 Context가 존재하도록 설정.

예:

```text
"동일 사양 대체 자재가 이미 현장에 확보되어 있었습니다."
```

---

# 12. Pattern Group D
## Specification Conflict

4~6건.

주요 Action:

```text
REQUEST_CLARIFICATION
```

일부 Case:

```text
DRAWING_REVISION
```

Micro-interview 예:

```text
"기본설계에서 이미 선주와 합의된 변경사항이 있었고,
최종 합의 메일을 확인한 후 도면에 반영했습니다."
```

---

# 13. Synthetic Data가 반드시 가져야 하는 특성

데이터 전체에서 다음을 의도적으로 만들 것.

### 1. 안정적인 Pattern
같은 Context에서 대부분 같은 Action.

### 2. Variant
Visible Context는 같은데 Action이 다름.

### 3. Personal Difference
같은 직원이 반복적으로 비슷한 판단을 하는 Case.

### 4. Cross-person Difference
직원마다 처리 방식이 조금씩 다름.

### 5. Hidden Context
기존 JSON field만으로는 설명되지 않는 차이.

### 6. Accepted / Rejected 혼합
Accepted = 정답이라는 오해 방지.

최소:

```text
ACCEPTED 18건
REJECTED 4건
PENDING 2건
```

정도로 구성 가능.

---

# 14. 데이터 생성 시 금지 사항

Codex는 아래처럼 데이터를 만들면 안 된다.

## 나쁜 예

```text
CASE 1
설치 누락 → 생산 이관

CASE 2
도면 오류 → 도면 수정

CASE 3
자재 부족 → 자재 발주
```

너무 정답표처럼 단순하다.

---

## 좋은 예

```text
CASE 1
설치 누락
Material Available
Drawing Valid
→ Production Transfer

CASE 2
설치 누락
Material Available
Drawing Valid
→ Production Transfer

CASE 3
설치 누락
Material Available
Drawing Valid
→ Drawing Revision
```

표면 Context는 같지만
숨은 판단 조건이 존재하도록 설계한다.

---

# 15. 더미 데이터 Validation Checklist

Seed script가 생성 후 자동 검증할 것.

```text
[ ] Employee 3명 이상
[ ] Case 24건 이상
[ ] Issue Type 4개 이상
[ ] Stable Pattern 최소 3개
[ ] Pattern Gap 후보 최소 3개
[ ] Employee별 Case 최소 5건
[ ] Accepted / Rejected 혼합
[ ] 동일 Visible Context + Different Action Case 존재
[ ] Micro-interview로 발견 가능한 Hidden Context 최소 3개
```

조건 미충족 시 seed 생성 실패 처리.

---

# 16. employees.json

```json
[
  {
    "employee_id": "EMP-001",
    "name": "김설계",
    "department": "Accommodation Design / Piping",
    "experience_level": "SENIOR",
    "experience_years": 8
  },
  {
    "employee_id": "EMP-002",
    "name": "박설계",
    "department": "Accommodation Design / Piping",
    "experience_level": "MID",
    "experience_years": 4
  },
  {
    "employee_id": "EMP-003",
    "name": "이설계",
    "department": "Accommodation Design / Piping",
    "experience_level": "JUNIOR",
    "experience_years": 1
  }
]
```

Synthetic only.

---

# 17. comment_cases.json

```json
[
  {
    "case_id": "CASE-001",
    "project_id": "SHIP-A01",
    "vessel_type": "LNGC",
    "employee_id": "EMP-001",

    "comment_text": "Wash basin hot water pipe has not been installed.",
    "response_text": "Transferred to production department for installation.",

    "issue_type": "INSTALLATION_MISSING",
    "equipment": "WASH_BASIN",
    "system": "HOT_FRESH_WATER",

    "context": {
      "material_status": "AVAILABLE",
      "drawing_status": "VALID",
      "construction_stage": "INSTALLATION"
    },

    "action": "TRANSFER_TO_PRODUCTION",
    "outcome": "ACCEPTED",

    "created_at": "2026-08-01"
  }
]
```

---

# 18. Controlled Vocabulary

## issue_type

```text
INSTALLATION_MISSING
DRAWING_ERROR
MATERIAL_ISSUE
SPEC_CONFLICT
OTHER
```

## action

```text
TRANSFER_TO_PRODUCTION
SITE_CHECK_THEN_TRANSFER
DRAWING_REVISION
MATERIAL_REQUEST
REQUEST_CLARIFICATION
OTHER
```

## outcome

```text
ACCEPTED
REJECTED
PENDING
```

## material_status

```text
AVAILABLE
PARTIAL
UNAVAILABLE
UNKNOWN
```

## drawing_status

```text
VALID
INVALID
OUTDATED
UNKNOWN
```

## construction_stage

```text
DESIGN
PROCUREMENT
INSTALLATION
COMMISSIONING
UNKNOWN
```

---

# 19. personal_knowledge.json

```json
[
  {
    "knowledge_id": "PK-001",

    "employee_id": "EMP-001",
    "source_case_ids": [
      "CASE-008"
    ],

    "trigger": {
      "type": "ACTION_VARIANT",
      "pattern_id": "PATTERN-001"
    },

    "question": "과거 유사 사례에서는 대부분 생산부서 이관으로 처리되었는데, 이번 건은 도면 개정을 하셨습니다. 기존 사례와 달랐던 핵심 조건은 무엇인가요?",

    "raw_answer_text": "실제 설치 위치에 다른 장비가 있어서 그대로 설치할 수 없었습니다.",

    "structured_knowledge": {
      "new_context": {
        "name": "installation_feasibility",
        "value": "IMPOSSIBLE"
      },

      "action": "DRAWING_REVISION",

      "rationale": "실제 설치 위치에 다른 장비가 있어 현재 위치로는 설치할 수 없었음.",

      "exception": null
    },

    "verified_by_user": true,
    "created_at": "2026-09-21"
  }
]
```

---

# 20. organization_patterns.json

반드시 Python/Java deterministic 집계 결과.

```json
[
  {
    "pattern_id": "PATTERN-001",

    "signature": {
      "issue_type": "INSTALLATION_MISSING",
      "equipment": "WASH_BASIN",
      "system": "HOT_FRESH_WATER",
      "material_status": "AVAILABLE",
      "drawing_status": "VALID"
    },

    "support_count": 8,

    "action_distribution": {
      "TRANSFER_TO_PRODUCTION": 6,
      "SITE_CHECK_THEN_TRANSFER": 1,
      "DRAWING_REVISION": 1
    },

    "majority_action": "TRANSFER_TO_PRODUCTION",
    "majority_ratio": 0.75,

    "supporting_case_ids": [
      "CASE-001",
      "CASE-002",
      "CASE-003",
      "CASE-004",
      "CASE-005",
      "CASE-006",
      "CASE-007",
      "CASE-008"
    ]
  }
]
```

LLM 생성 금지.

---

# 21. context_candidates.json

```json
[
  {
    "context_key": "installation_feasibility",
    "display_name": "Installation Feasibility",

    "mention_count": 2,

    "employee_ids": [
      "EMP-001",
      "EMP-002"
    ],

    "source_knowledge_ids": [
      "PK-001",
      "PK-004"
    ],

    "status": "CANDIDATE"
  }
]
```

---

# 22. Pattern Mining

Spring Boot에서 구현.

기본 Signature:

```text
issue_type
equipment
system
material_status
drawing_status
```

Pseudo:

```java
Map<PatternSignature, List<CommentCase>> groups;

for each group:
    supportCount = size
    actionCounts = groupByAction()
    majorityAction = max(actionCounts)
    majorityRatio = majorityCount / supportCount
```

Pattern 저장:

```text
support_count >= 2
```

Stable Pattern:

```text
support_count >= 3
AND majority_ratio >= 0.67
```

---

# 23. Gap Detection

```text
NO_PATTERN
ACTION_VARIANT
NONE
```

기본:

```text
Pattern 없음
→ NO_PATTERN

Stable Pattern 있음
+ Current Action != Majority Action
→ ACTION_VARIANT

그 외
→ NONE
```

Micro-interview는 **ACTION_VARIANT만** 발생.

---

# 24. Micro-question 생성

FastAPI/LangChain.

입력:

```json
{
  "current_case": {...},
  "matched_pattern": {...}
}
```

System Prompt:

```text
당신은 제조 업무 Knowledge Capture Agent입니다.

현재 Case의 판단 이유를 추측하지 마십시오.

당신의 역할은 과거 처리 Pattern과 현재 Action의 차이를
담당자에게 확인하기 위한 짧은 질문 한 개를 만드는 것입니다.

절대 가능한 원인을 예시로 제시하지 마십시오.
사용자의 답변을 유도하지 마십시오.

"왜 그렇게 했나요?"보다
"기존 사례와 달랐던 핵심 조건은 무엇인가요?"
형식으로 구체적으로 질문하십시오.
```

---

# 25. Personal Knowledge Structured Output

Pydantic:

```python
class NewContext(BaseModel):
    name: str | None = None
    value: str | None = None

class PersonalKnowledgeExtraction(BaseModel):
    new_context: NewContext | None = None
    rationale: str | None = None
    exception: str | None = None
```

System Prompt:

```text
사용자가 직접 답한 정보만 구조화하십시오.

사용자가 명시하지 않은:
- 판단 이유
- 원인
- Context
- 예외 조건

을 추측하거나 생성하지 마십시오.

불명확하면 null을 반환하십시오.
```

---

# 26. Human Confirmation

Structured Output 결과를 바로 저장하지 않는다.

Frontend에서 Preview:

```text
새 Context
installation_feasibility = IMPOSSIBLE

Rationale
실제 설치 위치에 다른 장비가 있어 설치할 수 없었음.

[수정]
[확인 후 저장]
```

[확인 후 저장] 이후에만:

```text
verified_by_user = true
```

---

# 27. RAG Index

FastAPI 시작 시 또는 refresh endpoint에서 Index 생성.

Document Type:

```text
CASE
PERSONAL_KNOWLEDGE
ORG_PATTERN
```

metadata:

```json
{
  "doc_type": "PERSONAL_KNOWLEDGE",
  "source_id": "PK-001",
  "employee_id": "EMP-001",
  "issue_type": "INSTALLATION_MISSING"
}
```

---

# 28. Retriever Tools

LangChain Tools:

```python
search_similar_cases(query: str, k: int = 5)

search_personal_knowledge(
    query: str,
    employee_id: str | None = None,
    k: int = 5
)

search_org_patterns(query: str, k: int = 5)

get_case_detail(case_id: str)
```

---

# 29. Agent Prompt

```text
당신은 제조 업무 경험지식 검색 Agent입니다.

당신은 과거 업무 Case,
담당자가 직접 확인한 Personal Knowledge,
여러 Case에서 관찰된 Organization Pattern을 검색하여
사용자의 판단을 지원합니다.

규칙:

1. 검색되지 않은 판단 이유를 생성하지 마십시오.
2. Organization Pattern은 공식 Rule이 아닙니다.
3. 가장 빈도가 높은 Action을 정답이라고 단정하지 마십시오.
4. 현재 상황과 과거 상황의 차이를 설명하십시오.
5. 정보가 부족하면 부족하다고 말하십시오.
6. 모든 핵심 주장에 Source ID를 붙이십시오.
7. 명령보다 "검토 제안" 형태로 답하십시오.
8. Human-confirmed Knowledge와 Inferred Pattern을 구분하십시오.
```

---

# 30. Agent 답변 형식

```markdown
## 과거 처리 패턴

...

## 확인된 개인 경험

...

## 현재 상황과 과거 사례의 차이

...

## 검토 제안

...

## 근거

- CASE-001
- CASE-008
- PK-001
- PATTERN-001

> 본 결과는 과거 업무 이력과 확인된 경험지식을 기반으로 한 참고 정보이며,
> 공식 업무 Rule 또는 최종 설계 판단을 대체하지 않습니다.
```

---

# 31. Spring Boot API

## Cases

```text
GET /api/cases
GET /api/cases/{caseId}
GET /api/cases/{caseId}/pattern
GET /api/cases/{caseId}/gap
```

## Micro Interview

```text
POST /api/cases/{caseId}/micro-question
POST /api/cases/{caseId}/knowledge/extract
POST /api/cases/{caseId}/knowledge/confirm
```

## Knowledge

```text
GET /api/employees/{employeeId}/knowledge
GET /api/organization/patterns
GET /api/context-candidates
```

## Agent

```text
POST /api/agent/chat
```

---

# 32. Spring → FastAPI Internal API

```text
POST /ai/micro-question
POST /ai/extract-knowledge
POST /ai/agent/chat
POST /ai/index/refresh
```

---

# 33. Frontend 화면

총 3개.

---

## Page 1. My Work

구성:

```text
Employee Selector

Comment Case List

Case Detail
- Comment
- Response
- Context
- Action
- Outcome

Pattern Summary
- Support Count
- Action Distribution

Gap Status

Micro Interview
```

Gap이 없으면:

```text
기존 Pattern 내에서 설명 가능한 처리입니다.
추가 질문이 없습니다.
```

Gap이면:

```text
⚠ Pattern Gap

동일한 Visible Context의 과거 사례
ProductionTransfer 6
DrawingRevision 1

AI 질문:
...
```

---

## Page 2. My Knowledge

선택된 직원의 Personal Knowledge.

Card:

```text
PK-001
Source CASE-008

Context
installation_feasibility = IMPOSSIBLE

Action
Drawing Revision

Reason
...

Verified
✓
```

---

## Page 3. Team Knowledge

### 상단
- Total Cases
- Personal Knowledge Count
- Stable Pattern Count
- Context Candidate Count

### 중단
Pattern Table

```text
Context
Observed Actions
Support
Employees
```

### 하단
Ask Knowledge Agent Chat

---

# 34. Frontend UX 원칙

- 제조 Dashboard 느낌
- 과도한 애니메이션 금지
- 카드/테이블 중심
- Evidence ID를 눈에 보이게
- `Observed Pattern`과 `Confirmed Knowledge` Badge 색/라벨 구분
- 특정 Action을 "추천 정답"처럼 강조하지 말 것

Badge 예:

```text
OBSERVED
PATTERN
HUMAN CONFIRMED
CONTEXT CANDIDATE
```

---

# 35. Docker 구조

Repository:

```text
knowflow/
├── frontend/
├── backend/
├── ai-service/
├── docker-compose.yml
├── README.md
└── .env.example
```

---

## docker-compose

개발 환경:

```text
frontend  :3000
backend   :8080
ai        :8000
```

Frontend는 로컬 Docker 사용 가능하되,
배포는 Vercel Native Build 사용.

---

# 36. Environment Variables

## frontend

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Vercel:

```env
NEXT_PUBLIC_API_BASE_URL=https://<backend-url>
```

---

## backend

```env
AI_SERVICE_URL=http://ai-service:8000
DATA_PATH=/app/data
```

---

## ai-service

OpenAI 예:

```env
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4o-mini
OPENAI_API_KEY=
```

Gemini 사용 시:

```env
MODEL_PROVIDER=google_genai
MODEL_NAME=<model-name>
GOOGLE_API_KEY=
```

Codex는 provider abstraction을 만들어서
환경변수만 변경하면 모델을 바꿀 수 있도록 한다.

API Key는 절대 Frontend로 전달하지 않는다.

---

# 37. Deployment

## Frontend
**Vercel**

절차:

```text
GitHub Repository 연결
→ frontend directory 선택
→ NEXT_PUBLIC_API_BASE_URL 설정
→ Deploy
```

---

## Backend / AI Service

이번 과제에서 배포까지 할 경우:

- Spring Boot: Railway 또는 유사 Docker hosting
- FastAPI: Railway 또는 유사 Docker hosting

Vercel은 Frontend만 담당한다.

배포 때문에 핵심 기능 구현이 늦어지면
Backend는 Local Demo로 유지해도 된다.

우선순위:

```text
1. 기능 완성
2. Docker Compose
3. Frontend Vercel
4. Backend Cloud Deploy
```

---

# 38. CORS

Spring Boot:

개발:

```text
http://localhost:3000
```

배포:

```text
https://<vercel-domain>
```

만 허용.

`*` 허용은 개발 중에만 임시 사용.

---

# 39. LLM API Fail 처리

LLM API 실패 시 앱 전체 Crash 금지.

예:

```text
AI 질문 생성에 실패했습니다.
잠시 후 다시 시도해주세요.
```

RAG 실패:

```text
현재 검색된 Knowledge만으로 답변을 생성할 수 없습니다.
```

---

# 40. 메인 Demo Scenario

발표에서 반드시 아래 순서로 보여준다.

### 1.

User:
EMP-001

Case:
CASE-008

```text
Installation Missing
Material Available
Drawing Valid
Action = Drawing Revision
```

---

### 2.

Pattern:

```text
동일 Visible Context 8건

Production Transfer       6
Site Check Then Transfer  1
Drawing Revision          1
```

---

### 3.

System:

```text
⚠ Pattern Gap
```

---

### 4.

AI:

> 과거 유사 사례에서는 대부분 생산부서 이관으로 처리되었는데,
> 이번 건은 도면 개정을 하셨습니다.
> 기존 사례와 달랐던 핵심 조건은 무엇인가요?

---

### 5.

Employee:

> 실제 설치 위치에 다른 장비가 있어서 그대로 설치할 수 없었습니다.

---

### 6.

LLM:

```text
New Context
installation_feasibility = IMPOSSIBLE

Rationale
실제 설치 위치에 다른 장비가 있어 현재 위치에 설치 불가능.
```

---

### 7.

Human:

```text
[확인 후 저장]
```

---

### 8.

다른 직원이 Team Knowledge Agent에 질문:

> 설치 누락인데 자재와 도면은 정상입니다.
> 추가로 무엇을 확인할 수 있나요?

---

### 9.

Agent:

```text
과거 동일 조건에서는
Production Transfer가 가장 많이 관찰되었습니다.

다만 CASE-008에서 담당자는
"실제 설치 가능 여부"를 추가 판단 조건으로 확인했습니다.

따라서 현재 Case에서도
실제 설치 위치의 설치 가능 여부를 확인해볼 수 있습니다.

Evidence
PATTERN-001
CASE-008
PK-001
```

---

# 41. MVP 평가 항목

## Functional

```text
[ ] Stable Pattern 탐지
[ ] Pattern Gap 탐지
[ ] Gap일 때만 질문
[ ] Human 답변 구조화
[ ] Human Confirmation
[ ] Personal Knowledge 저장
[ ] RAG 검색
[ ] Evidence 포함 Agent 답변
```

---

## LLM Safety

```text
[ ] 이유 추측 금지
[ ] 입력에 없는 Context 생성 금지
[ ] Pattern = Rule 처리 금지
[ ] Majority Action = 정답 처리 금지
[ ] 불확실하면 null/unknown
```

---

# 42. Codex 구현 순서

## Phase 1 — 반드시 먼저

1. Monorepo 생성
2. Synthetic Seed Data 생성
3. Seed Validation
4. Spring Boot JSON load
5. Pattern Mining
6. Gap Detection
7. REST API
8. Next.js Case Dashboard

**여기까지 LLM 없이 완성해야 한다.**

---

## Phase 2

9. FastAPI
10. `init_chat_model()` 기반 Chat Model 연결
11. Micro-question
12. Structured Output
13. Human Confirmation
14. Personal Knowledge 저장

---

## Phase 3

15. Document 생성
16. Vector Store
17. Retriever
18. Tools
19. Agent
20. Team Knowledge Chat

---

## Phase 4

21. Docker
22. docker-compose
23. Vercel frontend deploy
24. Backend deploy 가능하면 진행

---

# 43. Codex가 절대로 하지 말아야 하는 것

- Streamlit로 변경 금지
- Spring Boot 제거 금지
- 모든 Backend를 FastAPI로 합치지 말 것
- LangChain4j로 대체하지 말 것
- 실제 Ontology 구현 금지
- Neo4j 추가 금지
- PostgreSQL 추가 금지
- Redis 추가 금지
- Kubernetes 추가 금지
- LangGraph가 꼭 필요하지 않으면 추가 금지
- 복잡한 인증 구현 금지
- LLM이 Pattern Mining하도록 만들지 말 것
- 실제 회사 데이터를 추측해서 생성하지 말 것

---

# 44. 완료 조건

아래 Demo가 처음부터 끝까지 동작하면 완료.

```text
Case 선택
↓
Pattern 표시
↓
Gap 탐지
↓
Micro-question
↓
User Answer
↓
Structured Output
↓
Human Confirm
↓
Personal Knowledge 저장
↓
Team Agent 질문
↓
새 Knowledge 검색
↓
Evidence 포함 답변
```

이 Flow가 핵심이다.

---

# 45. README 소개 문구

> **KnowWow**는 제조 업무 과정에서 이미 생성되는 Comment 처리 이력을 활용하여 반복적인 문제 해결 패턴을 탐색하고, 기존 패턴으로 설명되지 않는 의사결정이 발생했을 때만 담당자에게 짧은 질문을 던져 판단 근거를 보완하는 Knowledge Capture MVP입니다. 별도의 지식 문서 작성을 강요하지 않고 평소 업무 데이터에서 출발하며, 사람이 직접 확인한 경험지식과 과거 사례를 LangChain RAG Agent를 통해 재사용합니다.

---

# 46. 프로젝트의 핵심 차별점

이 프로젝트는:

```text
업무 로그를 RAG에 넣고 검색하는 챗봇
```

이 아니다.

핵심은:

```text
Existing Work Log
        ↓
Pattern Mining
        ↓
Pattern Gap
        ↓
Selective Micro-interview
        ↓
Human-confirmed Knowledge
        ↓
Personal Knowledge
        ↓
Organization Experience
        ↓
RAG Agent
```

이다.

특히 다음 문장이 프로젝트의 핵심 원칙이다.

> **이미 데이터로 설명 가능한 것은 묻지 않고, 데이터로 설명되지 않는 판단이 발생했을 때만 사람에게 묻는다.**
