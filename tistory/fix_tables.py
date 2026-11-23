# 표를 휴대폰 폭에 맞게 정리: 글자 14px, 여백 6px, 숫자 칸만 nowrap, 글자 칸은 줄바꿈 허용, 가로 스크롤 감싸기
import re, sys
NUM = re.compile(r'^[\d,.%×~\s원배만억년월일개시간kcalgm세살생자쪽장()+\-:/]+$')
def cell(m):
    tag, attrs, inner = m.group(1), m.group(2), m.group(3)
    txt = re.sub(r'<[^>]+>', '', inner).strip()
    style = 'padding:6px 6px;' + ('white-space:nowrap;' if NUM.match(txt) and len(txt) <= 14 else 'word-break:keep-all;')
    return f'<{tag} style="{style}">{inner}</{tag}>'
for f in sys.argv[1:]:
    s = open(f, encoding='utf-8').read()
    def table(m):
        t = m.group(0)
        t = re.sub(r'<table[^>]*>', '<table style="border-collapse:collapse;width:100%;font-size:14px;line-height:1.5;" border="1">', t, 1)
        t = re.sub(r'<(td|th)( [^>]*)?>([\s\S]*?)</\1>', cell, t)
        return t
    s = re.sub(r'(?:<div style="overflow-x:auto;">\s*)?(<table[\s\S]*?</table>)(?:\s*</div>)?', lambda m: '<div style="overflow-x:auto;">' + table(re.match(r'[\s\S]*', m.group(1))) + '</div>', s)
    open(f, 'w', encoding='utf-8').write(s)
