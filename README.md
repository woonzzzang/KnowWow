# KnowWow

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

온톨로지와 지식 그래프는 하루 MVP 범위에서 제외했습니다. 대신 설명 가능하고 검증 가능한 JSON 데이터, Pattern Signature, Evidence ID를 사용합니다.

## 핵심 아이디어

기존 업무 기록에는 `무엇을 처리했는가`는 남지만 `왜 그렇게 판단했는가`는 잘 남지 않습니다. KnowWow는 모든 업무에 질문하지 않고 다음 흐름으로 새 조건만 수집합니다.

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
├── 제출파일/                       # 제출용 노트북·PDF·명세서
│   ├── 3반_정다운_KnowWow.ipynb
│   ├── 3반_정다운_KnowWow_설명.pdf
│   ├── 3반_정다운_서브노트.pdf
│   ├── 3반_정다운_서브노트.pages
│   └── KnowWow_구현_명세서.md
├── scripts/
│   ├── validate_seed.py            # 데이터 불변조건 검증
│   ├── smoke_test.py               # 실행 중 서비스 통합 검증
│   └── run_notebook.py             # 기존 노트북 셀을 재실행하고 결과 저장
└── docker-compose.yml
```

## 제출 파일

| 파일 | 내용 |
|---|---|
| [`3반_정다운_KnowWow.ipynb`](./제출파일/3반_정다운_KnowWow.ipynb) | LangChain 질문 생성·답변 구조화 코드와 저장된 실제 실행 결과. 과제의 주 제출물 |
| [`3반_정다운_KnowWow_설명.pdf`](./제출파일/3반_정다운_KnowWow_설명.pdf) | 기획 배경, 데이터 항목, 화면 캡처, 결과·한계, 향후 개인 지식→팀 지식 흐름 |
| [`3반_정다운_서브노트.pdf`](./제출파일/3반_정다운_서브노트.pdf) | 온톨로지 학습 내용과 KnowWow에 적용해 본 개인 정리 노트 |
| [`3반_정다운_서브노트.pages`](./제출파일/3반_정다운_서브노트.pages) | 서브노트의 편집 가능한 Pages 원본. macOS Pages가 없으면 PDF로 읽을 수 있음 |
| [`KnowWow_구현_명세서.md`](./제출파일/KnowWow_구현_명세서.md) | 구현 범위, 데이터 계약, 설계 의도를 담은 명세서 |

## 처음 클론한 뒤 실행하기

Docker Desktop과 Docker Compose를 준비합니다. 기본 포트는 3000(화면), 8080(업무 API), 8000(AI API)입니다.

```bash
git clone https://github.com/woonzzzang/KnowWow.git
cd KnowWow
cp .env.example .env
```

`.env`의 `OPENAI_API_KEY=` 오른쪽에 본인 키를 입력합니다. `.env`는 Git에서 제외되며 제출 파일에도 포함하지 않습니다. 키를 넣지 않아도 업무 목록과 패턴 화면은 볼 수 있지만, AI 질문·답변·검색 호출은 실패 원인을 반환합니다.

```bash
docker compose up --build
```

빌드가 끝나면 `http://localhost:3000`에서 **My Work → CASE-008**을 열어 대표 흐름을 확인합니다. 처음 실행할 때는 이미지 빌드에 시간이 걸릴 수 있습니다. 제출 PDF와 노트북의 저장된 출력은 API 키 없이도 읽을 수 있습니다.

| 주소 | 용도 |
|---|---|
| http://localhost:3000 | KnowWow 웹 화면 |
| http://localhost:8080/actuator/health | Backend 상태 |
| http://localhost:8000/health | AI Service와 키 설정 상태 |
| http://localhost:8000/docs | FastAPI 명세 |

종료:

```bash
docker compose down
```

Docker 대신 각 서비스를 개발 모드로 실행하려면 아래의 "로컬 개발 실행" 절을 따릅니다. API 키가 비어 있을 때 LLM이 필요한 POST 요청은 `503 AI_NOT_CONFIGURED`를 반환합니다.

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

7. Structured Output 미리보기에서 AI가 추출한 설치 방해 조건과 근거를 확인합니다. 저장된 노트북 실행에서는 `installation_location_issue=EQUIPMENT_CONFLICT`가 나왔으며, 평가용 기대 조건명·값과는 달랐습니다.
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

제출 노트북은 [`제출파일/3반_정다운_KnowWow.ipynb`](./제출파일/3반_정다운_KnowWow.ipynb)입니다. 실제 API 키로 질문 생성·답변 구조화·임베딩 셀을 끝까지 실행했고, `CASE-008` 외에 `CASE-018`, `CASE-024`도 같은 체인으로 비교한 결과가 저장돼 있습니다. 이전의 Fake 모델 출력은 제거했습니다. 노트북은 프로젝트 루트 또는 `제출파일` 폴더에서 열어도 데이터 경로를 찾습니다. 저장된 결과를 다시 생성하려면 프로젝트 루트에서 다음 명령을 사용합니다(실제 API 호출이 다시 발생합니다).

```bash
python3 -m venv ai-service/.venv
ai-service/.venv/bin/pip install -r ai-service/requirements.txt
ai-service/.venv/bin/python scripts/run_notebook.py
```

실행 결과에서는 `CASE-018`의 대체 자재 확보를 의미상 포착했으나 표준 이름·값과 다르게 표현했고, `CASE-024`의 합의 메일 확인은 근거 문장에는 반영했지만 새 조건 필드는 비웠습니다. 이는 실제 모델의 구조화 한계로 노트북에 그대로 남겼습니다. 기획 배경부터 핵심 화면과 실행 결과까지 설명한 PDF는 [`제출파일/3반_정다운_KnowWow_설명.pdf`](./제출파일/3반_정다운_KnowWow_설명.pdf)입니다.

PDF는 기획 배경, 예시 데이터의 비교 항목, 질문·답변 기능과 실제 실행 결과를 화면 일부를 확대해 설명하고, 마지막에 개인 경험을 팀의 참고 지식으로 발전시키는 향후 방향을 구분해 적었습니다. 다시 만들 때는 실행 중인 서비스와 macOS Chrome이 필요합니다. 먼저 `ai-service/.venv/bin/pip install reportlab pillow`로 PDF 제작 패키지를 설치하고, `node scripts/capture_pdf_assets.mjs`로 화면 일부와 노트북 출력을 캡처한 뒤 `ai-service/.venv/bin/python scripts/build_explanation_pdf.py`를 실행합니다. 웹 화면과 제출 노트북은 각각 실제 모델을 호출하므로 질문 문구는 조금 다를 수 있습니다.

## 현재 한계와 다음 단계

- Pattern Signature와 임계값은 Synthetic Data에 맞춘 MVP 규칙입니다.
- JSON 파일 저장은 동시 사용자와 대규모 데이터에 적합하지 않습니다.
- In-memory Vector Store는 서비스 재시작 시 다시 구성됩니다.
- 모호한 사용자 답변은 구조화 값이 `null`이 될 수 있습니다.
- 개인이 확인한 새 판단 조건은 검토 후보로 집계하지만, 현재 Team Knowledge 화면의 팀 패턴으로 자동 승격하지 않습니다. 여러 담당자·업무의 근거와 반례를 검토하고 사람이 승인해 공유하는 단계는 향후 과제입니다.
- 다음 단계는 운영 DB, 영속 Vector DB, 평가 데이터셋, 승인 워크플로, LangSmith trace입니다.
- 충분히 검증된 Context가 쌓인 이후에만 온톨로지 후보와 관계 정의를 도입하는 편이 안전합니다.

상세 데이터 계약과 설계 의도는 [`제출파일/KnowWow_구현_명세서.md`](./제출파일/KnowWow_구현_명세서.md)를 참고하세요.
