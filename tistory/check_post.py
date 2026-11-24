#!/usr/bin/env python3
"""티스토리 원고 자동 검사 (rules.md §11-5).
사용: python3 check_post.py posts/t002-*.html [--strict]
문제 없으면 'PASS', 있으면 항목별로 출력하고 종료코드 1.
"""
import sys, re, glob, os, difflib, html

BANNED = [
    "안녕하세요", "알아보겠습니다", "알아볼게요", "정리해 보겠습니다", "정리해보겠습니다", "지금부터",
    "이번 글에서는", "이번 포스팅", "마무리하며", "도움이 되셨", "참고하시기 바랍니다", "궁금하셨던",
    "중요합니다", "필수적", "꼭 알아두세요", "핵심은 이겁니다", "답은 간단합니다", "결론적으로",
    "요약하자면", "한마디로", "다양한", "효과적인", "꼼꼼히", "현명한", "체계적인", "완벽 정리",
    "총정리", "A to Z", "에 있어서", "하는 데 있어", "를 통해", "을 통해",
]
DIR = os.path.dirname(os.path.abspath(__file__))


def text_of(h):
    h = re.sub(r"<(script|style)[\s\S]*?</\1>", "", h)
    h = re.sub(r"<br\s*/?>", "\n", h)
    h = re.sub(r"</(p|li|h2|h3|tr|td|th)>", "\n", h)
    return html.unescape(re.sub(r"<[^>]+>", "", h)).replace("\xa0", " ")


def h2s(h):
    return [html.unescape(re.sub(r"<[^>]+>", "", x)).strip() for x in re.findall(r"<h2[^>]*>([\s\S]*?)</h2>", h)]


def first_sentence(h):
    for p in re.findall(r"<p[^>]*>([\s\S]*?)</p>", h):
        t = html.unescape(re.sub(r"<[^>]+>", "", p)).strip().replace("\xa0", "")
        if t and not t.startswith("기준:") and "[[CAPTURE" not in t and "[[TOPIMG" not in t:
            return re.split(r"(?<=[.?])\s", t)[0]
    return ""


def main():
    path = sys.argv[1]
    src = open(path, encoding="utf-8").read()
    body = text_of(src)
    probs = []

    for w in BANNED:
        n = body.count(w)
        if n:
            probs.append(f"금지 표현 '{w}' {n}회")
    n = body.count("좋습니다")
    if n > 2:
        probs.append(f"'~좋습니다' {n}회 (2회까지)")
    if "—" in src or "–" in src:
        probs.append("em/en dash 있음")
    if "!" in body:
        probs.append(f"느낌표 {body.count('!')}회")
    emoji = [c for c in body if ord(c) > 0x1F000 and c != "\U0001F449"]
    if emoji:
        probs.append(f"👉 외 이모지 {len(emoji)}개")
    if "**" in src:
        probs.append("마크다운 ** 남음")

    # 문장 끝 반복: 같은 어미(마지막 3글자) 4문장 연속
    prose = text_of(re.sub(r"<(table|ul|ol|blockquote)[\s\S]*?</\1>", "", src))  # 표·목록·인용(예시 원문)은 문장 끝 검사에서 제외
    sents = [s.strip() for s in re.split(r"(?<=[.?])\s+|\n", prose) if len(s.strip()) > 8]
    run, prev = 1, None
    for s in sents:
        end = s.rstrip(".?")[-3:]
        run = run + 1 if end == prev else 1
        prev = end
        if run == 4:
            probs.append(f"같은 문장 끝 '{end}' 4문장 연속: …{s[-30:]}")

    # 다른 원고와 비교
    mine_h2, mine_first = h2s(src), first_sentence(src)
    for other in sorted(glob.glob(os.path.join(DIR, "posts", "t*.html"))):
        if os.path.abspath(other) == os.path.abspath(path):
            continue
        o = open(other, encoding="utf-8").read()
        same = set(mine_h2) & set(h2s(o))
        if same:
            probs.append(f"소제목 겹침({os.path.basename(other)}): {', '.join(same)}")
        r = difflib.SequenceMatcher(None, mine_first, first_sentence(o)).ratio()
        if r > 0.6:
            probs.append(f"도입 첫 문장 유사 {r:.2f} ({os.path.basename(other)})")
        # 문장 골격 재사용: 숫자 지운 문장이 3개 이상 같으면
        norm = lambda t: {re.sub(r"[\d,.]+", "#", s) for s in re.split(r"(?<=[.?])\s+|\n", text_of(t)) if len(s) > 20}
        common = norm(src) & norm(o)
        if len(common) >= 3:
            probs.append(f"숫자만 다른 같은 문장 {len(common)}개 ({os.path.basename(other)}): {list(common)[0][:40]}…")

    chars = len(re.sub(r"\s", "", body))
    no = re.match(r"t(\d+)", os.path.basename(path))
    num = int(no.group(1)) if no else 0
    tag = f"t{num:03d}"

    # ── 11/19 첫 주에서 나온 문제를 다시 막는 검사 ──
    # (1) 분량·구성이 직전 4편과 몰림 (첫 주 5편이 전부 1,100~1,600자·표 1개였다)
    prev = []
    for k in range(num - 1, max(0, num - 5), -1):
        f = glob.glob(os.path.join(DIR, "posts", f"t{k:03d}-*.html"))
        if f:
            o = open(f[0], encoding="utf-8").read()
            prev.append((len(re.sub(r"\s", "", text_of(o))), o.count("<table"), len(h2s(o))))
    if len(prev) >= 3:
        close = sum(1 for c, _, _ in prev if abs(c - chars) <= chars * 0.15)
        if close >= 3:
            probs.append(f"분량 {chars}자가 직전 {len(prev)}편 중 {close}편과 ±15% 안 (rules §11-3: 분량을 다르게)")
        if all(tb == src.count("<table") for _, tb, _ in prev) and all(h == len(mine_h2) for _, _, h in prev):
            probs.append("표 개수·소제목 개수가 직전 편들과 전부 같음 (구성을 바꿀 것)")
    # (2) 제목 길이·메타 (t4 45자 제목이 헤더에서 …로 잘렸다)
    mp = os.path.join(DIR, "meta", f"{tag}.txt")
    if os.path.exists(mp):
        meta = dict(l.split(":", 1) for l in open(mp, encoding="utf-8").read().splitlines() if ":" in l)
        meta = {k.strip(): v.strip() for k, v in meta.items()}
        for k in ("TITLE", "CATEGORY", "TAGS", "DATE"):
            if not meta.get(k):
                probs.append(f"meta {k} 없음")
        if len(meta.get("TITLE", "")) > 42:
            probs.append(f"제목 {len(meta['TITLE'])}자(공백 포함 42자 이하, 헤더 2줄 넘으면 잘림)")
        if meta.get("HOMETOPIC") not in ("경영·직장", "생활정보", "경제", "IT 인터넷"):
            probs.append("meta HOMETOPIC 없음/값 이상(경영·직장·생활정보·경제·IT 인터넷 중 하나, 11/24 홈주제 자동 선택 오류 방지)")
        if "[[CAPTURE1]]" in src and not meta.get("ALT"):
            probs.append("캡처가 있는데 meta ALT 없음")
        if meta.get("DATE") and not re.match(r"\d{4}-\d{2}-\d{2} 08:00$", meta["DATE"]):
            probs.append(f"DATE 형식/시각 확인: {meta['DATE']} (08:00 고정)")
    else:
        probs.append(f"meta/{tag}.txt 없음")
    if not os.path.exists(os.path.join(DIR, "thumbs", f"{tag}.jpg")):
        probs.append(f"thumbs/{tag}.jpg 없음")
    if "[[CAPTURE1]]" in src and not os.path.exists(os.path.join(DIR, "caps", f"{tag}-cap.jpg")):
        probs.append(f"caps/{tag}-cap.jpg 없음")
    if "[[CAPTURE1]]" not in src:
        probs.append("[[CAPTURE1]] 자리 없음(도구 캡처 1장 필수, rules §6)")
    if not re.match(r"\s*<p>\[\[TOPIMG\]\]</p>", src):
        probs.append("맨 위 [[TOPIMG]] 자리 없음(본문 첫 줄에 대표이미지, 11/20)")
    # (3) 필수 구성
    if not re.search(r"<p[^>]*>(기준|계산 공식|계산 방식)", src):
        probs.append("기준·확인일 한 줄 없음(글 끝 회색 줄)")
    if re.match(r"\s*<p[^>]*>(기준|계산 공식|계산 방식)", src):
        probs.append("기준 줄이 맨 위에 있음 → 목록 요약에 그 줄이 먼저 나온다(11/20). 글 끝으로")
    if "/page/about" not in src or "글쓴이" not in src:
        probs.append("글쓴이 단락(/page/about 링크) 없음")
    tool_links = 0
    for href in re.findall(r'href="([^"]+)"', src):
        if "formda.kr" in href:
            tool_links += 1
            if "://www.formda.kr" in href or "http://" in href:
                probs.append(f"폼다 주소는 https://formda.kr (www 없이): {href[:60]}")
            if f"utm_campaign=t{num}" not in href.replace("&amp;", "&") or "utm_source=tistory" not in href:
                probs.append(f"utm_source=tistory·utm_campaign=t{num} 아님: {href[:80]}")
        if "jptcalc" in href or "bumohyetaek" in href:
            probs.append(f"다른 사이트 링크 금지(rules §5): {href[:60]}")
    if not 1 <= tool_links <= 2:
        probs.append(f"폼다 도구 링크 {tool_links}개(1~2개)")
    # (4) 간격·표 (스킨이 문단 간격 0, 5칸 표는 글자가 끊겼다)
    for m in re.finditer(r"</(p|table|ul|ol)>\s*<p(?! data-ke-size)(?! style=\"color:#666)", src):
        if src[max(0, m.start() - 6):m.start()] == "&nbsp;" or src[m.start() - 18:m.start()] in ("<p>[[CAPTURE1]]", "<p>[[TOPIMG]]"):
            continue  # 스페이서 자신, 캡처 자리 뒤 설명줄
        probs.append("문단·표 뒤에 스페이서 없이 바로 문단: …" + text_of(src[max(0, m.start() - 40):m.start()])[-30:])
    for tb in re.findall(r"<table[\s\S]*?</table>", src):
        cols = len(re.findall(r"<th", re.search(r"<tr>[\s\S]*?</tr>", tb).group(0)))
        if cols > 4:
            probs.append(f"표 {cols}칸(4칸 이하)")
        if "nowrap" not in tb:
            probs.append("표 숫자 칸 nowrap 없음")

    print(f"{os.path.basename(path)}: 본문 {chars}자, 소제목 {len(mine_h2)}개, 표 {src.count('<table')}개")
    if "--numbers" in sys.argv:
        # (5) 숫자 재검산 목록 (경정청구 연도·부부 합계를 틀렸다가 늦게 잡았다): 숫자가 든 문장을 전부 뽑아 하나씩 다시 계산한다
        print(" [숫자 재검산 목록]")
        for s in re.split(r"(?<=[.?])\s+|\n", text_of(re.sub(r"<table[\s\S]*?</table>", "", src))):
            if re.search(r"\d", s) and len(s.strip()) > 5:
                print("  ·", s.strip()[:120])
    if probs:
        for p in probs:
            print(" ✕", p)
        sys.exit(1)
    print(" PASS")


if __name__ == "__main__":
    main()
