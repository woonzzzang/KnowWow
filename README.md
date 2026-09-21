# KnowFlow

**Work as usual, knowledge grows.**

KnowFlow는 제조 업무 Comment 이력에서 반복되는 처리 패턴을 찾고, 기존 패턴으로 설명되지 않는 행동이 발생했을 때만 담당자에게 짧게 질문하여 판단 근거를 지식으로 축적하는 LangChain 기반 MVP입니다.

> 이미 데이터로 설명 가능한 것은 묻지 않고, 데이터로 설명되지 않는 판단이 발생했을 때만 사람에게 묻습니다.

## 현재 구현 단계

- [x] 의도적으로 설계된 Synthetic Comment 24건
- [x] 데이터 검증 스크립트
- [x] Spring Boot Pattern Mining / Gap Detection API
- [ ] FastAPI + LangChain 질문·구조화·RAG Agent
- [ ] Next.js 대시보드
- [ ] Docker Compose
- [ ] 실행 결과가 저장된 제출용 노트북

## 프로젝트 구조

```text
.
├── frontend/       # Next.js 사용자 화면
├── backend/        # Spring Boot 업무 규칙과 데이터 API
├── ai-service/     # FastAPI + LangChain
├── data/           # Synthetic JSON 데이터
├── notebooks/      # 제출용 실행 노트북
└── scripts/        # 데이터 검증 도구
```

## 더미 데이터 검증

```bash
python3 scripts/validate_seed.py
```

## Backend 테스트

Maven이 설치되어 있다면 다음 명령으로 Pattern/Gap 테스트를 실행합니다.

```bash
cd backend
mvn test
```

현재 테스트는 안정 패턴 4개, `CASE-008`의 6:1:1 Action 분포, 정상 Case의 인터뷰 미발생, Variant Case 탐지를 검증합니다.

LLM은 패턴 집계나 Gap 판정을 하지 않습니다. 이 단계는 항상 deterministic code에서 수행하며, LLM은 질문 생성·답변 구조화·검색 결과 설명에만 사용합니다.

## 환경변수

루트 `.env`의 API 키 값을 채웁니다. 빈 템플릿은 `.env.example`에도 있습니다.

```env
OPENAI_API_KEY=
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

API 키가 없는 상태에서도 데이터 및 Pattern/Gap 로직은 검증할 수 있도록 구성합니다.

## 상세 명세

전체 제품 의도와 데이터 계약은 [`KnowFlow_MVP_SPEC_v2.md`](./KnowFlow_MVP_SPEC_v2.md)를 참고하세요.
