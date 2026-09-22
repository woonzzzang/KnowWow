#!/usr/bin/env python3
"""Build the illustrated, non-specialist explanation of the KnowWow MVP."""

from __future__ import annotations

from pathlib import Path

from PIL import Image
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
PAGE_COUNT = 8

INK = colors.HexColor("#222932")
SECONDARY = colors.HexColor("#596575")
ACCENT = colors.HexColor("#205B9E")
RULE = colors.HexColor("#CAD2DC")


def setup_fonts() -> None:
    pdfmetrics.registerFont(
        TTFont("AppleGothic", "/System/Library/Fonts/Supplemental/AppleGothic.ttf")
    )
    pdfmetrics.registerFontFamily("AppleGothic", normal="AppleGothic", bold="AppleGothic")


def paragraph(
    c: canvas.Canvas,
    value: str,
    x: float,
    top: float,
    width: float,
    size: float = 10,
    leading: float | None = None,
    color=INK,
    bold: bool = False,
) -> float:
    style = ParagraphStyle(
        "text",
        fontName="AppleGothic",
        fontSize=size,
        leading=leading or size * 1.55,
        textColor=color,
        wordWrap="CJK",
    )
    item = Paragraph(f"<b>{value}</b>" if bold else value, style)
    _, height = item.wrap(width, PAGE_H)
    item.drawOn(c, x, top - height)
    return height


def label(c: canvas.Canvas, value: str, x: float, y: float, color=SECONDARY, size: float = 9) -> None:
    c.setFillColor(color)
    c.setFont("AppleGothic", size)
    c.drawString(x, y, value)


def rule(c: canvas.Canvas, x1: float, y: float, x2: float) -> None:
    c.setStrokeColor(RULE)
    c.setLineWidth(0.7)
    c.line(x1, y, x2, y)


def screenshot(
    c: canvas.Canvas,
    filename: str,
    x: float,
    y: float,
    width: float,
    height: float,
    crop: tuple[int, int, int, int] | None = None,
) -> None:
    with Image.open(ASSETS / filename) as source:
        picture = source.crop(crop) if crop else source.copy()
    iw, ih = picture.size
    scale = min(width / iw, height / ih)
    dw, dh = iw * scale, ih * scale
    left, bottom = x + (width - dw) / 2, y + (height - dh) / 2
    c.drawImage(ImageReader(picture), left, bottom, dw, dh, mask="auto")
    c.setStrokeColor(RULE)
    c.setLineWidth(0.6)
    c.rect(left, bottom, dw, dh, fill=0, stroke=1)


def footer(c: canvas.Canvas, page: int) -> None:
    rule(c, 44, 44, PAGE_W - 44)
    label(c, "KnowWow  |  3반 정다운  |  LangChain 종합실습과제", 44, 27)
    c.setFillColor(SECONDARY)
    c.setFont("AppleGothic", 9)
    c.drawRightString(PAGE_W - 44, 27, f"{page} / {PAGE_COUNT}")


def heading(c: canvas.Canvas, page: int, section: str, title: str, title_size: float = 22) -> None:
    label(c, f"KnowWow  /  {section}", 44, 555, ACCENT)
    paragraph(c, title, 44, 539, 753, size=title_size, leading=30)
    rule(c, 44, 493, PAGE_W - 44)
    footer(c, page)


def draw_page_one(c: canvas.Canvas) -> None:
    heading(c, 1, "기획 배경", "현장 기록에는 처리만 남고, 이유는 빠진다", 24)
    paragraph(
        c,
        "선박의 세면대 온수 배관이 설치되지 않았다는 업무 기록이 있습니다. "
        "자재도 준비됐고 도면에도 문제가 없는데, 담당자는 도면을 고쳤습니다. "
        "기록에는 이 결정을 내린 이유가 없습니다.",
        44, 476, 753, size=11, leading=18,
    )

    label(c, "비슷한 과거 업무 8건 중 6건", 44, 403, ACCENT, 9.5)
    paragraph(c, "생산 부서에 넘겨 설치 요청", 44, 392, 350, size=13, leading=20)
    c.setStrokeColor(RULE)
    c.line(420, 365, 420, 414)
    label(c, "이번 업무 CASE-008", 445, 403, ACCENT, 9.5)
    paragraph(c, "도면 개정", 445, 392, 352, size=13, leading=20)

    screenshot(c, "case008-overview.png", 44, 160, 753, 183)
    label(c, "실제 구현 화면 · 대표 업무와 비슷한 과거 업무의 처리 비교", 44, 144)
    rule(c, 44, 126, PAGE_W - 44)
    paragraph(
        c,
        "KnowWow는 이런 차이가 보일 때 담당자에게 짧게 묻습니다. "
        "답을 대신 지어내지 않고, 담당자가 설명한 추가 상황만 확인해 다음 업무에 참고할 수 있게 남기는 것이 목표입니다.",
        44, 113, 753, size=10, leading=16,
    )
    c.showPage()


def draw_page_two(c: canvas.Canvas) -> None:
    heading(c, 2, "데이터 준비", "무엇을 비교하려고 기록을 나눴나")
    paragraph(
        c,
        "실제 회사 정보 대신 직접 만든 예시 업무 기록 24건을 사용했습니다. "
        "Comment는 접수된 문제, Response는 당시 남긴 처리 내용입니다. 아래 값은 대표 업무 CASE-008의 예입니다.",
        44, 478, 753, size=10, leading=16,
    )

    columns = (44, 225, 476, 797)
    rule(c, columns[0], 430, columns[3])
    label(c, "기록 항목", columns[0], 414, ACCENT)
    label(c, "CASE-008에 적힌 내용", columns[1], 414, ACCENT)
    label(c, "서비스에서 쓰는 이유", columns[2], 414, ACCENT)
    rule(c, columns[0], 401, columns[3])

    rows = [
        ("접수된 문제", "세면대 온수 배관 미설치", "무슨 일이 있었는지 읽는 원문"),
        ("기록된 처리", "설치 전에 도면을 고침", "실제로 어떤 조치를 했는지"),
        ("문제 유형", "설치 누락", "비슷한 업무를 찾는 조건 1"),
        ("장비 / 배관 계통", "세면대 / 온수 배관", "비슷한 업무를 찾는 조건 2, 3"),
        ("자재 / 도면 상태", "준비됨 / 문제 없음", "비슷한 업무를 찾는 조건 4, 5"),
        ("업무 결과", "승인", "처리 후 상태. 정답 판정에는 쓰지 않음"),
        ("담당자 / 프로젝트", "EMP-001 / SHIP-C01", "누가, 어느 업무에서 남겼는지 추적"),
    ]
    for index, (field, example, purpose) in enumerate(rows):
        top = 395 - index * 39
        paragraph(c, field, columns[0], top, 170, size=9.5, leading=14)
        paragraph(c, example, columns[1], top, 240, size=9.5, leading=14)
        paragraph(c, purpose, columns[2], top, 320, size=9.3, leading=14)
        rule(c, columns[0], top - 33, columns[3])

    paragraph(
        c,
        "비교할 때는 문제 유형·장비·배관 계통·자재 상태·도면 상태, 이 다섯 가지만 묶습니다. "
        "현재 처리와 업무 결과는 비교 대상의 특징을 설명하지만, 같은 업무를 찾는 조건에는 넣지 않았습니다.",
        44, 105, 753, size=9.5, leading=15,
    )
    c.showPage()


def draw_page_three(c: canvas.Canvas) -> None:
    heading(c, 3, "과거 기록 비교", "같은 조건 8건인데, 이번 처리가 다르다")
    paragraph(
        c,
        "CASE-008과 다섯 조건이 같은 업무를 모았습니다. 가장 많이 한 처리는 생산 부서로 넘기는 방식입니다.",
        44, 478, 753, size=10, leading=16,
    )
    screenshot(c, "case008-pattern.png", 44, 77, 353, 379)
    label(c, "실제 화면 · 접수된 내용과 과거 처리 8건의 분포", 44, 61)

    label(c, "기록에 있는 사실", 429, 443, ACCENT, 10)
    paragraph(c, "6건은 생산 부서에 넘김", 429, 424, 368, size=15, leading=21)
    paragraph(c, "1건은 현장 확인 후 넘김, 1건은 도면 개정", 429, 394, 368, size=9.7, leading=15)
    rule(c, 429, 361, 797)

    label(c, "이번 업무", 429, 342, ACCENT, 10)
    paragraph(
        c,
        "문제 유형과 자재·도면 상태는 비슷하지만, CASE-008에서는 도면을 고쳤습니다. "
        "기록만으로는 설치 위치에 다른 장비가 있었다는 사실을 알 수 없습니다.",
        429, 328, 368, size=10.3, leading=17,
    )
    rule(c, 429, 245, 797)

    label(c, "그래서 질문합니다", 429, 226, ACCENT, 10)
    paragraph(
        c,
        "여섯 건이 따랐던 방식을 정답으로 취급하지는 않습니다. "
        "과거와 다른 처리의 이유가 기록되지 않았으므로, 담당자에게 이번에 달랐던 상황을 확인합니다.",
        429, 212, 368, size=10.3, leading=17,
    )
    paragraph(
        c,
        "처리 건수 계산과 질문 필요 여부는 코드가 판단합니다. LLM은 아직 없는 이유를 추측하지 않고 질문 문장만 만듭니다.",
        429, 122, 368, size=9.1, leading=14, color=SECONDARY,
    )
    c.showPage()


def draw_page_four(c: canvas.Canvas) -> None:
    heading(c, 4, "질문 기능", "평소와 같으면 묻지 않고, 다를 때만 묻는다")
    paragraph(
        c,
        "같은 데이터를 써도 이번에 택한 처리 방식에 따라 화면이 달라집니다. 질문을 남발하지 않기 위한 선택입니다.",
        44, 478, 753, size=10, leading=16,
    )
    label(c, "CASE-004 · 과거에 가장 많았던 방식", 44, 441, ACCENT, 10)
    label(c, "CASE-008 · 과거와 다른 방식", 429, 441, ACCENT, 10)
    screenshot(c, "case004-no-question.png", 44, 247, 352, 171)
    screenshot(c, "case008-question.png", 429, 163, 368, 255)
    label(c, "실제 화면 · 추가 질문 없음", 44, 230)
    label(c, "실제 화면 · LangChain이 만든 한 문장 질문", 429, 146)

    paragraph(
        c,
        "CASE-004는 생산 부서에 넘겼습니다. 같은 조건의 업무에서 가장 많았던 처리라 "
        "추가로 묻지 않습니다. 이 업무의 결과가 '반려'인 것과 질문 여부는 별개입니다.",
        44, 214, 352, size=9.8, leading=16,
    )
    paragraph(
        c,
        "CASE-008은 도면 개정이었습니다. LLM에는 현재 기록과 과거 처리별 건수, "
        "'답을 추측하지 말고 한 문장으로 물을 것'이라는 조건을 넣었습니다.",
        429, 132, 368, size=9.8, leading=16,
    )
    c.showPage()


def draw_page_five(c: canvas.Canvas) -> None:
    heading(c, 5, "답변 정리", "이유는 담당자가 말하고, AI는 정리만 한다")
    paragraph(
        c,
        "담당자는 '실제 설치 위치에 다른 장비가 있어서 그대로 설치할 수 없었습니다'라고 답했습니다. "
        "그제야 기록에 없던 조건이 드러납니다.",
        44, 478, 753, size=10, leading=16,
    )

    screenshot(c, "case008-structured.png", 69, 111, 703, 339, crop=(0, 550, 718, 900))
    label(c, "실제 화면을 확대해 잘라낸 부분 · AI가 정리한 내용과 저장 전 확인 버튼", 69, 96)
    paragraph(
        c,
        "AI는 '설치 위치에 다른 장비가 있어 기존 도면대로 설치할 수 없었다'는 판단 이유를 정리했습니다. "
        "화면의 '아직 저장되지 않음'처럼, 담당자가 고치거나 확인하기 전에는 지식으로 확정하지 않습니다.",
        44, 83, 753, size=9.3, leading=14,
    )
    c.showPage()


def draw_page_six(c: canvas.Canvas) -> None:
    heading(c, 6, "LangChain 구현", "모델은 질문을 만들고 답변을 나눠 적는다", 21)
    paragraph(
        c,
        "업무 기록과 처리 분포를 ChatPromptTemplate → ChatModel → StrOutputParser로 연결해 질문을 만들었습니다. "
        "담당자 답변은 Pydantic Structured Output으로 새 상황과 판단 이유를 나눴습니다.",
        44, 478, 753, size=9.8, leading=15,
    )
    screenshot(c, "notebook-main.png", 44, 194, 753, 244, crop=(0, 190, 1200, 630))
    label(c, "제출 노트북의 저장된 실제 모델 실행 결과 · CASE-008 질문과 답변 정리", 44, 178)
    rule(c, 44, 162, PAGE_W - 44)
    label(c, "질문 만들기", 44, 143, ACCENT)
    paragraph(c, "프롬프트에 역할과 금지 조건을 넣고, 모델 답변에서 질문 문장만 꺼냅니다.", 44, 130, 230, size=8.8, leading=14)
    label(c, "답변 정리", 300, 143, ACCENT)
    paragraph(c, "담당자가 말한 새 상황과 판단 이유를 정해진 항목으로 받습니다.", 300, 130, 230, size=8.8, leading=14)
    label(c, "다시 찾기", 556, 143, ACCENT)
    paragraph(
        c,
        "확인된 지식과 과거 기록은 검색 Agent의 근거로 사용합니다. 이번 과제의 중심 기능은 질문과 답변 정리입니다.",
        556, 130, 241, size=8.8, leading=14,
    )
    c.showPage()


def draw_page_seven(c: canvas.Canvas) -> None:
    heading(c, 7, "비교 실행", "다른 답변에서는 어디까지 알아냈나")
    paragraph(
        c,
        "같은 질문 생성·답변 정리 과정을 다른 업무에도 실행했습니다. 실제 모델 출력은 아래처럼 성공한 부분과 놓친 부분이 함께 남아 있습니다.",
        44, 478, 753, size=9.8, leading=15,
    )
    screenshot(c, "notebook-compare.png", 44, 158, 753, 300)
    label(c, "제출 노트북의 저장된 실제 실행 결과 · CASE-018과 CASE-024", 44, 142)
    rule(c, 44, 127, PAGE_W - 44)
    label(c, "CASE-018", 44, 112, ACCENT)
    paragraph(c, "대체 자재 확보는 찾아냈지만, 미리 정한 항목 이름·값과 맞지 않았습니다.", 138, 121, 659, size=8.9, leading=13)
    label(c, "CASE-024", 44, 90, ACCENT)
    paragraph(c, "합의 메일 내용은 판단 근거에 반영했지만, 새 상황 항목은 비웠습니다.", 138, 99, 659, size=8.9, leading=13)
    paragraph(
        c,
        "예시 데이터 24건과 경험적 기준을 쓴 MVP입니다. 모호한 답변은 사람이 확인해야 하며, 온톨로지는 이번에 만들지 않았습니다.",
        44, 72, 753, size=8.3, leading=12, color=SECONDARY,
    )
    c.showPage()


def draw_page_eight(c: canvas.Canvas) -> None:
    heading(c, 8, "다음 단계", "개인의 경험이 팀의 참고 지식이 되려면", 22)
    paragraph(
        c,
        "여기서 말하는 암묵지는 기록에 빠져 있던 현장 판단 조건입니다. CASE-008의 '설치 위치에 다른 장비가 있었다'는 "
        "설명처럼, 담당자가 말해야 비로소 알 수 있는 내용입니다.",
        44, 478, 753, size=10.3, leading=17,
    )
    paragraph(
        c,
        "목표는 이런 설명을 한 사람의 기억에만 두지 않고, 출처와 확인 과정을 남겨 다음 담당자도 찾아볼 수 있게 하는 것입니다.",
        44, 431, 753, size=9.5, leading=15,
    )
    rule(c, 44, 398, PAGE_W - 44)

    label(c, "지금 구현된 것", 44, 380, ACCENT, 10)
    paragraph(c, "1  담당자가 확인한 개인 지식", 44, 365, 350, size=12, leading=18)
    paragraph(
        c,
        "답변 원문과 CASE-008 출처를 함께 저장합니다. AI가 정리한 내용은 담당자가 확인해야 지식으로 남습니다.",
        44, 340, 350, size=9.8, leading=16,
    )
    paragraph(c, "2  반복되는 새 상황의 후보", 430, 365, 367, size=12, leading=18)
    paragraph(
        c,
        "확인된 지식에서 같은 새 상황이 몇 번 언급됐고 누가 설명했는지 집계합니다. 아직은 검토 후보일 뿐입니다.",
        430, 340, 367, size=9.8, leading=16,
    )
    rule(c, 44, 277, PAGE_W - 44)

    label(c, "앞으로 필요한 것 · 이번 MVP에는 미구현", 44, 259, ACCENT, 10)
    paragraph(c, "3  팀의 검토와 승인", 44, 244, 350, size=12, leading=18)
    paragraph(
        c,
        "다른 담당자·프로젝트에서도 같은 조건이 반복되는지, 반대 사례는 없는지 확인해야 합니다. 공유 여부는 사람이 결정합니다.",
        44, 219, 350, size=9.8, leading=16,
    )
    paragraph(c, "4  팀이 참고하는 처리 패턴", 430, 244, 367, size=12, leading=18)
    paragraph(
        c,
        "검토된 조건을 출처와 함께 공유하면 비슷한 업무에서 과거 판단을 찾기 쉬워집니다. 가장 많았던 처리를 정답으로 만드는 것은 아닙니다.",
        430, 219, 367, size=9.8, leading=16,
    )
    rule(c, 44, 153, PAGE_W - 44)

    label(c, "현재 화면과 혼동하지 말아야 할 점", 44, 135, ACCENT, 10)
    paragraph(
        c,
        "현재 Team Knowledge 화면은 예시 업무 기록에서 처리 횟수를 집계한 결과입니다. 저장된 개인 지식이 그 화면의 팀 패턴으로 "
        "자동 승격되지는 않습니다. 위의 검토·승인 과정을 거쳐 연결하는 것이 향후 확장 방향입니다.",
        44, 121, 753, size=9.4, leading=15,
    )
    c.showPage()


def main() -> None:
    setup_fonts()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=(PAGE_W, PAGE_H))
    c.setTitle("KnowWow 구현 설명")
    c.setAuthor("정다운")
    for page in (
        draw_page_one,
        draw_page_two,
        draw_page_three,
        draw_page_four,
        draw_page_five,
        draw_page_six,
        draw_page_seven,
        draw_page_eight,
    ):
        page(c)
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    main()
