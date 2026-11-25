// 티스토리 구글 색인 검사(11/25). GSC URL 검사 API, 인증은 jsb 수집기와 같은 ~/.claude/analytics/credentials.json.
// 사용: node ix.mjs [blog=formda] [글번호...]   예) node ix.mjs formda 2 3 4 5 6   /   node ix.mjs jptcalc 2 3
// 글번호를 안 주면 홈·소개·개인정보·사이트맵 상태만 본다.
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module'
const ANALYTICS = '/home/tjd618/.claude/analytics'
const require = createRequire(path.join(ANALYTICS, 'report.mjs')); const { google } = require('googleapis')
const credentials = JSON.parse(fs.readFileSync(path.join(ANALYTICS, 'credentials.json'), 'utf8'))
const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/webmasters'] })
const sc = google.searchconsole({ version: 'v1', auth })
const [blog = 'formda', ...nos] = process.argv.slice(2)
const site = `https://${blog}.tistory.com/`
const urls = [site, site + 'pages/about', site + 'pages/privacy', ...nos.map(n => site + n)]
for (const u of urls) {
  try {
    const r = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: site, languageCode: 'ko' } })
    const x = r.data.inspectionResult.indexStatusResult || {}
    console.log([u.replace(site, '/'), x.verdict, x.coverageState, (x.lastCrawlTime || '-').slice(0, 16), x.pageFetchState].join(' | '))
  } catch (e) { console.log(u, 'ERR', e.message.slice(0, 150)) }
}
const s = await sc.sitemaps.list({ siteUrl: site })
for (const m of s.data.sitemap || []) console.log('sitemap', m.path, '마지막 읽음', (m.lastDownloaded || '-').slice(0, 16), JSON.stringify(m.contents || []))
