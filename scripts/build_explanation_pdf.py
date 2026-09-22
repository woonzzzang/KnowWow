#!/usr/bin/env python3
"""Build a compact illustrated explanation of the KnowWow LangChain MVP."""

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "tmp" / "pdfs"
OUTPUT = ROOT / "output" / "pdf" / "KnowWow_구현_설명.pdf"
PAGE_W, PAGE_H = landscape(A4)

NAVY = colors.HexColor("#17243A")
BLUE = colors.HexColor("#175CD3")
PALE_BLUE = colors.HexColor("#EEF5FF")
MUTED = colors.HexColor("#5D6B82")
LINE = colors.HexColor("#DCE5F3")
GREEN = colors.HexColor("#0E8B6C")
PALE_GREEN = colors.HexColor("#ECF9F3")
AMBER = colors.HexColor("#9B5A05")
PALE_AMBER = colors.HexColor("#FFF6E5")


def setup_fonts() -> None:
    pdfmetrics.registerFont(TTFont("AppleGothic", "/System/Library/Fonts/Supplemental/AppleGothic.ttf"))
    pdfmetrics.registerFontFamily("AppleGothic", normal="AppleGothic", bold="AppleGothic")


def paragraph(c: canvas.Canvas, text: str, x: float, top: float, width: float, size: float = 10,
              leading: float | None = None, color= NAVY, bold: bool = False) -> float:
    style = ParagraphStyle(
        "body", fontName="AppleGothic", fontSize=size, leading=leading or size * 1.55,
        textColor=color, wordWrap="CJK", spaceAfter=0,
    )
    item = Paragraph(f"<b>{text}</b>" if bold else text, style)
    _, height = item.wrap(width, PAGE_H)
    item.drawOn(c, x, top - height)
    return height


def rounded_box(c: canvas.Canvas, x: float, y: float, width: float, height: float, fill,
                border=LINE, radius: float = 12) -> None:
    c.setFillColor(fill)
    c.setStrokeColor(border)
    c.roundRect(x, y, width, height, radius, fill=1, stroke=1)


def image_box(c: canvas.Canvas, filename: str, x: float, y: float, width: float, height: float) -> None:
    source = ImageReader(str(ASSETS / filename))
    iw, ih = source.getSize()
    scale = min(width / iw, height / ih)
    dw, dh = iw * scale, ih * scale
    c.setFillColor(colors.white)
    c.setStrokeColor(LINE)
    c.roundRect(x - 1, y - 1, width + 2, height + 2, 8, fill=1, stroke=1)
    c.drawImage(source, x + (width - dw) / 2, y + (height - dh) / 2, dw, dh, mask="auto")


def page_heading(c: canvas.Canvas, section: str, title: str, page: int) -> None:
    c.setFillColor(BLUE)
    c.setFont("AppleGothic", 10)
    c.drawString(44, PAGE_H - 38, section)
    c.setFillColor(NAVY)
    c.setFont("AppleGothic", 22)
    c.drawString(44, PAGE_H - 70, title)
    c.setStrokeColor(LINE)
    c.line(44, PAGE_H - 82, PAGE_W - 44, PAGE_H - 82)
    c.setFillColor(MUTED)
    c.setFont("AppleGothic", 8.5)
    c.drawString(44, 25, "KnowWow | 3반 정다운 | LangChain 종합실습과제")
    c.drawRightString(PAGE_W - 44, 25, f"{page} / 4")


def source_line(c: canvas.Canvas, text: str, x: float, y: float) -> None:
    c.setFillColor(MUTED)
    c.setFont("AppleGothic", 8)
    c.drawString(x, y, text)


def draw_page_one(c: canvas.Canvas) -> None:
    c.setFillColor(BLUE)
    c.setFont("AppleGothic", 11)
    c.drawString(44, 556, "LANGCHAIN MVP  /  IMPLEMENTATION NOTE")
    c.setFillColor(NAVY)
    c.setFont("AppleGothic", 32)
    c.drawString(44, 512, "KnowWow")
    paragraph(c, "업무 기록 속 설명되지 않은 판단을, 필요한 순간의 질문 하나로 남깁니다.", 236, 527, 550, 15, 23)

    rounded_box(c, 44, 426, 365, 70, PALE_BLUE)
    paragraph(c, "문제", 59, 482, 70, 10, bold=True, color=BLUE)
    paragraph(c, "Comment에는 무엇을 했는지는 남지만, 왜 그 처리를 택했는지는 빠지기 쉽습니다.", 59, 461, 335, 10)
    rounded_box(c, 423, 426, 374, 70, PALE_GREEN, colors.HexColor("#D2EDE0"))
    paragraph(c, "도우미의 역할", 438, 482, 95, 10, bold=True, color=GREEN)
    paragraph(c, "비슷한 기록과 다른 처리가 있을 때만 묻고, 사람의 확인을 거친 설명만 축적합니다.", 438, 461, 344, 10)

    labels = ["예시 Comment", "코드로 차이 감지", "LangChain 질문", "답변 구조화", "사람 확인"]
    widths = [128, 128, 128, 128, 128]
    gap = 22
    left = 44
    for index, label in enumerate(labels):
        x = left + index * (widths[index] + gap)
        rounded_box(c, x, 367, widths[index], 42, colors.white, LINE, 9)
        paragraph(c, label, x + 12, 394, widths[index] - 24, 10, bold=True, color=NAVY)
        if index < len(labels) - 1:
            c.setFillColor(BLUE)
            c.setFont("AppleGothic", 12)
            c.drawString(x + widths[index] + 5, 383, "→")

    image_box(c, "case008-overview.png", 44, 123, 753, 196)
    source_line(c, "실제 구현 화면 일부: 대표 업무 CASE-008의 이번 처리와 유사 기록의 최다 처리 비교", 46, 105)
    paragraph(c, "핵심 차이: 설치 누락이라는 조건은 비슷하지만, 8건 중 6건의 생산 이관과 달리 이번 건은 도면 개정으로 처리됐습니다.", 44, 87, 753, 9.5)
    c.setFillColor(MUTED)
    c.setFont("AppleGothic", 8.5)
    c.drawString(44, 25, "KnowWow | 3반 정다운 | LangChain 종합실습과제")
    c.drawRightString(PAGE_W - 44, 25, "1 / 4")
    c.showPage()


def draw_page_two(c: canvas.Canvas) -> None:
    page_heading(c, "01 / 입력에서 질문까지", "같은 기록을 묶고, 다른 처리에만 묻습니다", 2)
    paragraph(c, "문제 유형 · 장비 · 시스템 · 자재 상태 · 도면 상태를 코드로 묶습니다. 8건의 처리 분포는 생산 이관 6건, 현장 확인 후 이관 1건, 도면 개정 1건입니다.", 44, 492, 753, 10)
    image_box(c, "case008-pattern.png", 44, 169, 316, 294)
    image_box(c, "case008-question.png", 378, 197, 419, 266)
    source_line(c, "① 실제 Comment 및 집계 결과", 46, 153)
    source_line(c, "② 실제 모델이 생성한 질문", 380, 181)

    rounded_box(c, 378, 100, 419, 67, PALE_BLUE)
    paragraph(c, "LLM이 필요한 이유", 393, 153, 150, 10, bold=True, color=BLUE)
    paragraph(c, "코드는 차이를 찾지만 그 이유는 알 수 없습니다. 모델은 기록된 조건을 넣어 유도하지 않는 확인 질문을 만듭니다.", 393, 133, 389, 9.5)

    rounded_box(c, 44, 70, 316, 68, colors.white)
    paragraph(c, "LangChain 핵심 체인", 59, 123, 165, 10, bold=True, color=BLUE)
    paragraph(c, "ChatPromptTemplate → ChatModel → StrOutputParser", 59, 103, 290, 9.5)
    paragraph(c, "역할·금지 조건·한 문장 출력을 체인으로 연결", 59, 85, 290, 8.5, color=MUTED)
    c.showPage()


def draw_page_three(c: canvas.Canvas) -> None:
    page_heading(c, "02 / 답변에서 지식 후보까지", "모델의 정리 결과는 사람이 확인해야 저장됩니다", 3)
    image_box(c, "case008-structured.png", 44, 70, 348, 438)
    source_line(c, "실제 웹 화면: 테스트 답변 입력 후 AI 구조화, 저장 전 상태", 46, 54)

    image_box(c, "notebook-main.png", 410, 275, 387, 203)
    source_line(c, "제출 노트북의 저장된 실제 모델 실행 결과 일부", 412, 260)

    rounded_box(c, 410, 126, 387, 119, PALE_BLUE)
    paragraph(c, "입력 → 프롬프트 → LLM → 출력", 425, 230, 350, 11, bold=True, color=BLUE)
    paragraph(c, "질문은 수정된 프롬프트와 실제 API 모델로 생성했습니다. 담당자의 테스트 답변은 Pydantic Structured Output으로 새 조건·판단 이유·예외를 분리합니다. 확인 버튼을 누르기 전에는 개인 지식으로 확정하지 않습니다.", 425, 208, 355, 9.5)

    rounded_box(c, 410, 70, 387, 46, PALE_GREEN, colors.HexColor("#D2EDE0"))
    paragraph(c, "추가 컴포넌트: Document / Embeddings / Vector Store / Tool-calling Agent", 424, 102, 360, 9, bold=True, color=GREEN)
    paragraph(c, "근거 검색과 출처 검증을 위한 구성입니다.", 424, 83, 355, 8.5, color=MUTED)
    c.showPage()


def draw_page_four(c: canvas.Canvas) -> None:
    page_heading(c, "03 / 비교 실행과 한계", "입력을 바꾸자 질문과 추출 결과도 달라졌습니다", 4)
    image_box(c, "notebook-compare.png", 44, 165, 753, 346)
    source_line(c, "실제 제출 노트북의 CASE-018 / CASE-024 질문·답변 구조화 실행 출력", 46, 148)

    cards = [
        ("CASE-008", "설치 위치의 장비 간섭을 새 조건으로 포착", PALE_GREEN, GREEN),
        ("CASE-018", "대체 자재 확보는 포착, 표준 이름·값과 표현 차이", PALE_BLUE, BLUE),
        ("CASE-024", "합의 메일은 근거에 반영, 새 조건 필드는 비어 있음", PALE_AMBER, AMBER),
    ]
    for index, (name, detail, fill, accent) in enumerate(cards):
        x = 44 + index * 255
        rounded_box(c, x, 77, 243, 60, fill, LINE)
        paragraph(c, name, x + 12, 119, 220, 10, bold=True, color=accent)
        paragraph(c, detail, x + 12, 101, 218, 8.8)

    paragraph(c, "한계: 예시 24건과 경험적 임계값에 의존하며 모호한 답변은 조건이 누락될 수 있습니다. 사람의 확인과 평가 데이터셋, 영속 저장소가 다음 단계입니다. 온톨로지는 이번 MVP에서 제외했습니다.", 44, 68, 753, 8, color=MUTED)
    c.showPage()


def main() -> None:
    setup_fonts()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=(PAGE_W, PAGE_H))
    c.setTitle("KnowWow 구현 설명")
    c.setAuthor("정다운")
    for page in (draw_page_one, draw_page_two, draw_page_three, draw_page_four):
        page(c)
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    main()
