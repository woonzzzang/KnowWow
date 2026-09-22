#!/usr/bin/env python3
"""Build the illustrated KnowWow implementation note."""

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "tmp" / "pdfs"
OUTPUT = ROOT / "output" / "pdf" / "KnowWow_구현_설명.pdf"
PAGE_W, PAGE_H = landscape(A4)

INK = colors.HexColor("#222932")
SECONDARY = colors.HexColor("#5F6873")
ACCENT = colors.HexColor("#205B9E")
RULE = colors.HexColor("#CFD4DA")


def setup_fonts() -> None:
    pdfmetrics.registerFont(
        TTFont("AppleGothic", "/System/Library/Fonts/Supplemental/AppleGothic.ttf")
    )
    pdfmetrics.registerFontFamily("AppleGothic", normal="AppleGothic", bold="AppleGothic")


def paragraph(
    c: canvas.Canvas,
    text: str,
    x: float,
    top: float,
    width: float,
    size: float = 10,
    leading: float | None = None,
    color=INK,
    bold: bool = False,
) -> float:
    style = ParagraphStyle(
        "body",
        fontName="AppleGothic",
        fontSize=size,
        leading=leading or size * 1.55,
        textColor=color,
        wordWrap="CJK",
    )
    item = Paragraph(f"<b>{text}</b>" if bold else text, style)
    _, height = item.wrap(width, PAGE_H)
    item.drawOn(c, x, top - height)
    return height


def label(c: canvas.Canvas, text: str, x: float, y: float, color=SECONDARY) -> None:
    c.setFillColor(color)
    c.setFont("AppleGothic", 9)
    c.drawString(x, y, text)


def rule(c: canvas.Canvas, x1: float, y: float, x2: float) -> None:
    c.setStrokeColor(RULE)
    c.setLineWidth(0.7)
    c.line(x1, y, x2, y)


def screenshot(c: canvas.Canvas, filename: str, x: float, y: float, width: float, height: float) -> None:
    source = ImageReader(str(ASSETS / filename))
    iw, ih = source.getSize()
    scale = min(width / iw, height / ih)
    dw, dh = iw * scale, ih * scale
    left = x + (width - dw) / 2
    bottom = y + (height - dh) / 2
    c.drawImage(source, left, bottom, dw, dh, mask="auto")
    c.setStrokeColor(RULE)
    c.setLineWidth(0.6)
    c.rect(left, bottom, dw, dh, fill=0, stroke=1)


def footer(c: canvas.Canvas, page: int) -> None:
    rule(c, 44, 44, PAGE_W - 44)
    label(c, "KnowWow  |  3반 정다운  |  LangChain 종합실습과제", 44, 27)
    c.setFillColor(SECONDARY)
    c.setFont("AppleGothic", 9)
    c.drawRightString(PAGE_W - 44, 27, f"{page} / 4")


def heading(c: canvas.Canvas, page: int, section: str, title: str) -> None:
    label(c, f"KnowWow  /  {section}", 44, 555, ACCENT)
    paragraph(c, title, 44, 540, 753, size=22, leading=30)
    rule(c, 44, 493, PAGE_W - 44)
    footer(c, page)


def draw_page_one(c: canvas.Canvas) -> None:
    label(c, "KnowWow  /  구현 기록", 44, 555, ACCENT)
    paragraph(c, "설치 누락인데, 왜 도면을 고쳤을까", 44, 536, 753, size=27, leading=35)
    paragraph(
        c,
        "CASE-008은 자재도 준비됐고 도면에도 문제가 없었지만, 도면 개정으로 처리됐습니다. "
        "비슷한 설치 누락 8건 중 6건은 생산 부서로 넘겼습니다.",
        44, 487, 753, size=11, leading=18,
    )
    paragraph(
        c,
        "Comment에는 무엇을 했는지는 남지만, 왜 그 처리를 택했는지는 빠지기 쉽습니다. "
        "KnowWow는 처리 차이를 찾은 뒤 담당자에게 그 이유를 묻습니다.",
        44, 437, 753, size=10, leading=16,
    )
    rule(c, 44, 390, PAGE_W - 44)

    screenshot(c, "case008-overview.png", 44, 147, 753, 224)
    label(c, "실제 화면 · 대표 업무 CASE-008의 처리와 비슷한 과거 업무의 최다 처리", 44, 132)

    rule(c, 44, 114, PAGE_W - 44)
    paragraph(
        c,
        "이번 과제에서는 예시 Comment와 과거 처리 기록을 사용했습니다. "
        "사람이 답한 내용을 모델이 정리하더라도, 확인 전에는 지식으로 저장하지 않습니다.",
        44, 103, 753, size=9.5, leading=16,
    )
    footer(c, 1)
    c.showPage()


def draw_page_two(c: canvas.Canvas) -> None:
    heading(c, 2, "질문 생성", "어떤 차이를 보고 질문했는가")
    paragraph(
        c,
        "문제 유형·장비·시스템·자재 상태·도면 상태가 같은 기록을 묶었습니다. "
        "8건의 처리 분포는 생산 이관 6건, 현장 확인 후 이관 1건, 도면 개정 1건입니다.",
        44, 479, 753, size=10, leading=16,
    )

    screenshot(c, "case008-pattern.png", 44, 182, 317, 267)
    screenshot(c, "case008-question.png", 379, 182, 418, 267)
    label(c, "1  실제 Comment와 과거 처리 분포", 44, 165)
    label(c, "2  LangChain으로 생성한 질문", 379, 165)
    rule(c, 44, 148, PAGE_W - 44)

    paragraph(
        c,
        "코드로는 처리 방식이 달랐다는 사실까지만 알 수 있습니다. 왜 달랐는지는 기록에 없어, "
        "LLM에 현재 조건과 과거 처리 분포를 주고 담당자에게 물을 문장을 만들게 했습니다.",
        44, 137, 356, size=9.5, leading=15,
    )
    paragraph(
        c,
        "ChatPromptTemplate에 역할·금지 조건·출력 형식을 넣고 "
        "ChatModel, StrOutputParser로 이었습니다. 모델이 이유를 짐작해 답하지 않도록 질문 한 문장만 출력하게 했습니다.",
        419, 137, 378, size=9.5, leading=15,
    )
    c.showPage()


def draw_page_three(c: canvas.Canvas) -> None:
    heading(c, 3, "답변 정리", "답변을 확인한 뒤 저장한다")
    screenshot(c, "case008-structured.png", 44, 113, 354, 365)
    label(c, "웹 화면 · 답변 정리 후, 아직 저장하지 않은 상태", 44, 96)

    screenshot(c, "notebook-main.png", 420, 275, 377, 203)
    label(c, "제출 노트북에 저장된 실제 모델 실행 결과", 420, 259)
    rule(c, 420, 243, 797)
    paragraph(
        c,
        "질문은 수정된 프롬프트와 실제 API 모델로 생성했습니다. 담당자의 테스트 답변은 "
        "Pydantic Structured Output으로 새 조건·판단 이유·예외를 나눠 받았습니다.",
        420, 230, 377, size=9.5, leading=15,
    )
    paragraph(
        c,
        "화면에서 답변을 확인하거나 고치고 저장할 수 있습니다. 확인 버튼을 누르기 전에는 "
        "개인 지식으로 확정하지 않습니다.",
        420, 169, 377, size=9.5, leading=15,
    )
    paragraph(
        c,
        "다른 질문에는 Document·Embeddings·Vector Store·Tool-calling Agent를 사용해 "
        "근거를 찾고 출처를 확인합니다.",
        420, 119, 377, size=9, leading=14, color=SECONDARY,
    )
    c.showPage()


def draw_page_four(c: canvas.Canvas) -> None:
    heading(c, 4, "비교 실행", "세 가지 입력에서 나온 결과")
    screenshot(c, "notebook-compare.png", 44, 176, 753, 299)
    label(c, "제출 노트북에 저장된 CASE-018 / CASE-024 질문·답변 정리 결과", 44, 160)
    rule(c, 44, 148, PAGE_W - 44)

    rows = [
        ("CASE-008", "설치 위치의 장비 간섭을 새 조건으로 정리"),
        ("CASE-018", "대체 자재 확보는 찾았지만 표준 이름·값과 불일치"),
        ("CASE-024", "합의 메일은 근거에 반영, 새 조건 필드는 빈칸"),
    ]
    for index, (case_id, result) in enumerate(rows):
        y = 133 - index * 22
        label(c, case_id, 44, y, ACCENT)
        label(c, result, 133, y, INK)

    rule(c, 44, 75, PAGE_W - 44)
    paragraph(
        c,
        "예시 24건과 경험적 임계값을 썼습니다. 모호한 답변에서는 조건이 빠질 수 있어 "
        "사람의 확인이 필요합니다. 평가 데이터셋과 영속 저장소는 아직 없고, 온톨로지는 이번 MVP에서 제외했습니다.",
        44, 66, 753, size=8.5, leading=13, color=SECONDARY,
    )
    c.showPage()


def main() -> None:
    setup_fonts()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=(PAGE_W, PAGE_H))
    c.setTitle("KnowWow 구현 기록")
    c.setAuthor("정다운")
    for page in (draw_page_one, draw_page_two, draw_page_three, draw_page_four):
        page(c)
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    main()
