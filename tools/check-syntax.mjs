// Синтаксис всех модулей сайта (27.11: строчный комментарий «съел» код в stage.js, тесты его не импортируют — сайт упал).
import fs from 'fs';
import { execFileSync } from 'child_process';
let bad = 0;
for (const dir of ['js', 'js/engine', 'js/i18n']) for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
  try { execFileSync(process.execPath, ['--input-type=module', '--check'], { input: fs.readFileSync(`${dir}/${f}`), stdio: ['pipe', 'pipe', 'pipe'] }); }
  catch (e) { bad++; console.log('FAIL синтаксис', `${dir}/${f}`, String(e.stderr).split('\n').slice(0, 5).join(' | ')); }
}
console.log(bad ? `${bad} FAILED` : 'синтаксис: ALL OK'); process.exit(bad ? 1 : 0);
