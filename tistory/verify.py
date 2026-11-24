#!/usr/bin/env python3
"""예약·발행된 글을 원본과 대조 (/tistory-publish 3단계).
사용: python3 verify.py   (Downloads/claude-chrome/formda-verify/post-N.json 을 meta의 POSTNO로 원본과 맞춘다)
post-N.json은 크롬 읽기 전용 추출로 만든다. 본문 HTML은 브라우저 필터로 못 받아서
제목·카테고리·날짜·태그·소제목·표/이미지/링크 수·alt·이미지 로딩·UTM·www·대표이미지 유무를 본다."""
import json, re, glob, html, os, sys
V = '/mnt/c/Users/jinsung/Downloads/claude-chrome/formda-verify/'
D = os.path.dirname(os.path.abspath(__file__)); os.chdir(D)
bad = 0
for mp in sorted(glob.glob('meta/t*.txt')):
    t = os.path.basename(mp)[:-4]
    meta = {k.strip(): v.strip() for k, v in (l.split(':', 1) for l in open(mp, encoding='utf-8') if ':' in l)}
    n = meta.get('POSTNO'); jp = V + f'post-{n}.json'
    if not n or not os.path.exists(jp): continue
    j = json.load(open(jp, encoding='utf-8'))
    if not j.get('title'):
        print(f'글 {n} ({t}): 추출 실패(로그인 풀림 등) - 다시 추출'); bad += 1; continue
    src = open(glob.glob(f'posts/{t}-*.html')[0], encoding='utf-8').read()
    iss = []
    if j['title'] != meta['TITLE']: iss.append(f"제목: 블로그 '{j['title']}' / meta '{meta['TITLE']}'")
    if j['category'] != meta['CATEGORY']: iss.append('카테고리 다름')
    if [int(x) for x in re.findall(r'\d+', j['date'])][:5] != [int(x) for x in re.findall(r'\d+', meta['DATE'])][:5]: iss.append(f"날짜 {j['date']} / {meta['DATE']}")
    if sorted(t.lower() for t in j['tags']) != sorted(x.strip().lower() for x in meta['TAGS'].split(',')): iss.append('태그 다름')
    if 'headings' in j:
      h2 = ['H2: ' + html.unescape(re.sub('<[^>]+>', '', x)).strip() for x in re.findall(r'<h2[^>]*>([\s\S]*?)</h2>', src)]
      if j['headings'] != h2: iss.append('소제목 다름')
    c = j.get('counts') or {'table': src.count('<table'), 'img': len(j.get('imgs', [])), 'a': len(j.get('links', []))}
    if c['table'] != src.count('<table'): iss.append(f"표 {c['table']}/{src.count('<table')}")
    if c['img'] != 2: iss.append(f"본문 이미지 {c['img']}개(맨 위 대표이미지+캡처 = 2)")
    im = next((x for x in j['imgs'] if x.get('alt') == meta.get('ALT')), {})
    if im.get('alt') != meta.get('ALT'): iss.append('alt 다름')
    if not im.get('complete') or (im.get('naturalWidth') or 0) < 1000: iss.append(f"이미지 로딩/크기(검토중 자리표시?) {im.get('naturalWidth')}")
    for l in [x if isinstance(x, dict) else {'url': x} for x in j.get('links', [])]:
        if 'formda.kr' in l['url'] and 'queryKeys' in l and l.get('queryKeys') != ['utm_source', 'utm_medium', 'utm_campaign']: iss.append(f"UTM 없음 {l['url']}")
        if '://www.formda.kr' in l['url']: iss.append(f"www 붙은 주소(폼다는 www 없이) {l['url']}")
    if c['a'] != len(re.findall(r'<a ', src)): iss.append('링크 수 다름')
    if meta.get('HOMETOPIC') and j.get('hometopic') is not None and j.get('hometopic', '').replace(' ', '') != meta['HOMETOPIC'].replace(' ', ''): iss.append(f"홈주제 {j.get('hometopic')} / meta {meta['HOMETOPIC']}")
    if meta.get('HOMETOPIC') and j.get('hometopic') is None: iss.append('홈주제 추출 안 됨')
    print(f"글 {n} ({t}): {'OK' if not iss else '문제 ' + str(len(iss))}")
    for i in iss: print('   ✕', i)
    bad += len(iss)
sys.exit(1 if bad else 0)
