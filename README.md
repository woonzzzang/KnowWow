# KnowFlow

> **Work as usual, knowledge grows.**
> 제조 업무 Comment 이력에서 반복 패턴을 찾고, 패턴과 다른 처리가 발생했을 때만 담당자에게 짧게 질문하여 판단 근거를 지식으로 축적하는 LangChain 기반 AI 도우미입니다.

## 구현 상태

- [x] 의도적으로 설계한 Synthetic Comment 24건
- [x] Spring Boot Pattern Mining / Gap Detection API
- [x] LangChain 질문 생성·구조화·검색 Agent
- [x] Next.js 대시보드와 Micro-interview UI
- [x] 사용자 확인 후 Personal Knowledge 저장
- [x] Docker Compose 통합 실행
- [x] 실행 결과가 저장된 제출용 Jupyter Notebook
- [ ] 루트 `.env`의 `OPENAI_API_KEY` 입력 — 사용자가 직접 입력

온톨로지와 지식 그래프는 하루 MVP 범위에서 제외했습니다. 대신 설명 가능하고 검증 가능한 JSON 데이터, Pattern Signature, Evidence ID를 사용합니다.

## 핵심 아이디어

기존 업무 기록에는 `무엇을 처리했는가`는 남지만 `왜 그렇게 판단했는가`는 잘 남지 않습니다. KnowFlow는 모든 업무에 질문하지 않고 다음 흐름으로 새 조건만 수집합니다.

```text
Comment Case
    ↓
코드가 동일 Context의 Action 분포 계산
    ↓
현재 Action이 안정 패턴과 다른가?
    ├─ 아니오 → 질문하지 않음
    └─ 예     → LangChain이 비유도 질문 1개 생성
                    ↓
               담당자 자연어 답변
                    ↓
               Structured Output
                    ↓
               사용자 확인 후 저장
                    ↓
       Personal Knowledge / Agent 검색 근거
```

LLM은 패턴 집계나 `ACTION_VARIANT` 판정을 하지 않습니다. 결정론적 코드는 관찰 사실을 계산하고, LLM은 질문 생성·답변 구조화·검색 결과 설명만 담당합니다.

## 아키텍처

| 영역 | 기술 | 책임 |
|---|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS | Dashboard, My Work, Micro-interview, Knowledge, Agent 화면 |
| Business API | Java 21, Spring Boot 3.5 | 데이터 로딩, Pattern Mining, Gap Detection, 저장, AI 호출 조정 |
| AI Service | Python, FastAPI, LangChain | Prompt/LCEL, Structured Output, Vector Store, Tools/Agent |
| Data | JSON | Case 24건, 직원, 개인 지식, 평가 시나리오 |

```text
.
├── frontend/                       # 사용자 화면
├── backend/                        # 결정론적 업무 규칙과 REST API
├── ai-service/                     # LangChain + FastAPI
├── data/                           # Synthetic JSON 데이터
├── notebooks/
│   └── KnowFlow_LangChain_MVP.ipynb
├── scripts/
│   ├── validate_seed.py            # 데이터 불변조건 검증
│   ├── smoke_test.py               # 실행 중 서비스 통합 검증
│   └── build_notebook.py           # 제출 노트북 재생성
├── docker-compose.yml
└── KnowFlow_MVP_SPEC_v2.md         # 상세 제품 명세
```

## 가장 빠른 실행 방법

### 1. API 키 입력

루트에 `.env`가 생성되어 있으며 키 값은 의도적으로 비워 두었습니다.

```env
OPENAI_API_KEY=
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

`OPENAI_API_KEY=` 오른쪽에 키를 입력합니다. `.env`는 Git에서 제외됩니다.

### 2. 전체 서비스 실행

Docker Desktop을 실행한 뒤 프로젝트 루트에서 다음 명령을 사용합니다.

```bash
docker compose up --build
```

| 주소 | 용도 |
|---|---|
| http://localhost:3000 | KnowFlow 웹 화면 |
| http://localhost:8080/actuator/health | Backend 상태 |
| http://localhost:8000/health | AI Service와 키 설정 상태 |
| http://localhost:8000/docs | FastAPI 명세 |

종료:

```bash
docker compose down
```

API 키가 비어 있어도 Dashboard, Pattern, Gap 기능은 동작합니다. LLM이 필요한 POST 요청은 원인을 포함한 `503 AI_NOT_CONFIGURED`를 반환합니다.

## 핵심 시연 시나리오

1. 웹에서 **My Work**로 이동합니다.
2. `CASE-008`을 엽니다.
3. 같은 Context 8건의 Action 분포 `TRANSFER_TO_PRODUCTION 6 / SITE_CHECK_THEN_TRANSFER 1 / DRAWING_REVISION 1`을 확인합니다.
4. 현재 Case의 `DRAWING_REVISION`이 다수 Action과 달라 `ACTION_VARIANT`로 감지됩니다.
5. AI가 차이를 확인하는 질문 한 개를 생성합니다.
6. 예시 답변을 입력합니다.

```text
실제 설치 위치에 다른 장비가 있어서 그대로 설치할 수 없었습니다.
```

7. Structured Output 미리보기에서 `installation_feasibility=IMPOSSIBLE`과 근거를 확인합니다.
8. 사용자가 **확인하고 지식으로 저장**을 눌러야 `Personal Knowledge`가 됩니다.

`CASE-004`는 비슷한 업무에서 가장 많이 관찰된 방식으로 처리된 비교 사례입니다. 이 화면에서는 AI 질문·답변 입력을 표시하지 않고, 대표 사례인 `CASE-008`로 이동할 수 있게 안내합니다. AI 질문은 현재 사례의 Comment/Response 원문과 코드로 집계한 과거 처리 건수를 함께 입력받아 생성하며, 생성 실패 시 고정 예시 질문으로 대체하지 않습니다.

추가 비교용 Case는 `CASE-018`, `CASE-024`이며 [`data/demo_scenarios.json`](./data/demo_scenarios.json)에 기대 Context가 정리되어 있습니다.

## LangChain 사용 지점

| 컴포넌트 | 사용 위치 | 없으면 생기는 문제 |
|---|---|---|
| `ChatPromptTemplate` | Micro-question, 답변 구조화 | 역할·제약·출력 계약을 재사용하기 어려움 |
| LCEL `prompt \| model \| parser` | 질문 생성 | 입력부터 문자열 출력까지의 흐름이 분산됨 |
| `StrOutputParser` | 질문 한 문장 추출 | ChatMessage 객체가 UI 계약에 노출됨 |
| `with_structured_output()` + Pydantic | 답변 → 지식 후보 | 자유 형식 답변을 안전하게 저장하기 어려움 |
| `Document` | 검색 문서와 metadata | 출처 ID와 문서 유형을 추적하기 어려움 |
| `OpenAIEmbeddings` + `InMemoryVectorStore` + `NumPy` | 의미 기반 검색과 유사도 계산 | 표현이 다른 유사 경험을 찾기 어려움 |
| `@tool` | Case/Knowledge/Pattern 검색 분리 | Agent가 어떤 근거를 조회했는지 통제하기 어려움 |
| `create_agent()` | Knowledge Agent | 질의별 검색 순서를 동적으로 선택하기 어려움 |

실제 구현은 [`ai-service/app/knowledge_service.py`](./ai-service/app/knowledge_service.py), 프롬프트는 [`ai-service/app/prompts.py`](./ai-service/app/prompts.py)에 있습니다. Agent 응답의 Evidence ID는 서버가 실제 검색된 ID와 대조하며, 검증되지 않은 인용은 제거합니다.

사용자에게 보이는 AI 채팅에는 `DRAWING_REVISION`, `INSTALLATION_MISSING` 같은 내부 코드를 전달하지 않습니다. 질문용 입력부터 `도면 개정`, `설치 누락`, `생산 부서로 넘겨 처리`처럼 풀어 쓰고, 모델 응답에도 같은 변환을 한 번 더 적용합니다. 용어 매핑과 출력 안전장치는 [`ai-service/app/terminology.py`](./ai-service/app/terminology.py)에 모아 두었습니다.

## 로컬 개발 실행

필요 환경: Python 3.11+, Java 21, Maven 3.9+, Node.js 22+.

### AI Service

```bash
cd ai-service
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --reload --port 8000
```

### Backend

새 터미널에서:

```bash
cd backend
DATA_PATH=../data AI_SERVICE_URL=http://localhost:8000 mvn spring-boot:run
```

### Frontend

새 터미널에서:

```bash
cd frontend
npm install
npm run dev
```

업무 기록은 Backend가 읽는 Synthetic JSON 데이터입니다. Frontend는 API 연결이 끊기면 내장 예시 결과를 실제 결과처럼 보여주지 않고 오류를 표시합니다. 질문 생성·답변 구조화·저장에는 실제 AI API 연결이 필요합니다.

## 테스트와 검증

### 전체 더미 데이터 불변조건

```bash
python3 scripts/validate_seed.py
```

검증 내용: Case ID 중복, 외래키, 날짜, enum, 필수 필드, 전체 24건, Outcome `18/4/2`, 평가 시나리오와 의도한 패턴.

### Backend 단위 테스트

```bash
cd backend
mvn test
```

안정 패턴 4개, `CASE-008`의 Action 분포, 정상 Case의 인터뷰 미발생, Variant 탐지를 검증합니다.

### AI Service 단위 테스트

```bash
cd ai-service
.venv/bin/pytest -q
```

LCEL 체인, 키 미설정 응답, 문서 metadata, 사용자 확인 지식만 색인되는지를 검증합니다.

### Frontend 정적 검증

```bash
cd frontend
npm audit
npm run typecheck
npm run build
```

### 실행 중 서비스 통합 검증

AI Service와 Backend를 실행한 상태에서:

```bash
python3 scripts/smoke_test.py
```

## 주요 API

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/dashboard` | 개인 현황 요약 |
| GET | `/api/cases` | Comment Case 목록 |
| GET | `/api/cases/{id}/pattern` | Case와 같은 Context의 관찰 패턴 |
| GET | `/api/cases/{id}/gap` | 인터뷰 필요 여부 |
| POST | `/api/cases/{id}/micro-question` | LCEL 질문 생성 |
| POST | `/api/cases/{id}/knowledge/extract` | 답변 Structured Output |
| POST | `/api/cases/{id}/knowledge/confirm` | 사용자 확인 지식 저장 |
| GET | `/api/employees/{id}/knowledge` | 개인 지식 목록 |
| GET | `/api/organization/patterns` | 조직 패턴 목록 |
| GET | `/api/context-candidates` | 새 Context 후보 |
| POST | `/api/agent/chat` | Tool-calling Knowledge Agent |

## 과제 채점 기준 대응

- **주제 선정:** 반복 업무 기록에서 사라지는 판단 조건을 최소 질문으로 수집합니다.
- **문제 해결:** 입력 → Context 구성 → Gap 판정 → 체인 → 구조화 → 확인 저장을 화면과 노트북에서 추적할 수 있습니다.
- **2회 이상 비교:** 정상 `CASE-001`, Variant `CASE-008`, 그리고 3개 답변 시나리오를 비교합니다.
- **LangChain 컴포넌트:** Prompt/Chain 외에도 Structured Output, Document, Vector Store/Retriever, Tool/Agent를 실제 경로에서 사용합니다.
- **한계:** 더미 데이터, 경험적 임계값, In-memory Vector Store, 온톨로지 제외를 명시했습니다.

## 제출용 노트북

[`notebooks/KnowFlow_LangChain_MVP.ipynb`](./notebooks/KnowFlow_LangChain_MVP.ipynb)에 설명과 Demo Mode 실행 결과가 저장되어 있습니다. 제출 전 다음 작업을 권장합니다.

1. `.env`에 실제 API 키를 입력합니다.
2. 노트북을 처음부터 끝까지 `Restart & Run All` 합니다.
3. 실제 LLM 결과가 저장됐는지 확인합니다.
4. 학교 안내에 맞춰 `{반}_{이름}_KnowFlow.ipynb`로 파일명을 변경합니다.

## 현재 한계와 다음 단계

- Pattern Signature와 임계값은 Synthetic Data에 맞춘 MVP 규칙입니다.
- JSON 파일 저장은 동시 사용자와 대규모 데이터에 적합하지 않습니다.
- In-memory Vector Store는 서비스 재시작 시 다시 구성됩니다.
- 모호한 사용자 답변은 구조화 값이 `null`이 될 수 있습니다.
- 다음 단계는 운영 DB, 영속 Vector DB, 평가 데이터셋, 승인 워크플로, LangSmith trace입니다.
- 충분히 검증된 Context가 쌓인 이후에만 온톨로지 후보와 관계 정의를 도입하는 편이 안전합니다.

상세 데이터 계약과 설계 의도는 [`KnowFlow_MVP_SPEC_v2.md`](./KnowFlow_MVP_SPEC_v2.md)를 참고하세요.
