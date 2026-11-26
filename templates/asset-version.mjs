// 정적 자산 캐시 무효화(11/26): 운영 서버가 JS·CSS를 4시간 캐시(max-age=14400)하고 HTML은 매번 새로 받는다.
// 배포 직후 "새 HTML + 옛 JS"가 섞이지 않도록, 파일 내용 지문을 주소 뒤에 붙인다(내용이 같으면 주소도 같아 캐시 유지).
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const memo = {};
export function av(rel) {
  if (!memo[rel]) {
    try { memo[rel] = crypto.createHash('md5').update(fs.readFileSync(path.join(root, rel.replace(/^\//, '')))).digest('hex').slice(0, 8); }
    catch (e) { memo[rel] = 'na'; }
  }
  return rel + '?v=' + memo[rel];
}
