// Проверка голоса на слух машиной: каждый клип EN и DE из js/voice-map.js отправляется в Gemini (как в конвейере Студії),
// он расшифровывает речь и отмечает, звучит ли фраза естественно для носителя: неверные числа, ударения, сокращения,
// не тот язык, обрывы. Отчёт — docs/voice-check.md (Claude разберёт его и решит, что перезаписать).
// Ключ Gemini берётся конвейером Kidsney из ~/dev/kidsney/secrets/gemini-api-key.txt и не печатается.
// Запуск: node tools/check-voice.mjs [en|de]
import fs from 'fs';
const KID = '/Volumes/KidsneyDrive/dev/kidsney';
const { generateJson } = await import(`${KID}/scripts/pipeline/lib/gemini.mjs`);
const { VOICE_FILES } = await import('../js/voice-map.js');
const langs = process.argv[2] ? [process.argv[2]] : ['en', 'de'];
const NAMES = { en: 'American English', de: 'German (Germany/Austria)' };
const SCHEMA = { type: 'OBJECT', properties: {
  transcript: { type: 'STRING' },
  language_ok: { type: 'BOOLEAN', description: 'spoken in the expected language' },
  natural: { type: 'BOOLEAN', description: 'sounds natural to a native speaker talking to a child' },
  issues: { type: 'STRING', description: 'mispronounced words, wrong numbers, odd stress, robotic or cut-off audio, unnatural phrasing; empty if none' },
}, required: ['transcript', 'language_ok', 'natural', 'issues'] };
const mime = (f) => (f.endsWith('.wav') ? 'audio/wav' : f.endsWith('.mp3') ? 'audio/mpeg' : 'audio/mp4');
const out = ['# Проверка голоса (Gemini)', '', `Дата: ${new Date().toISOString().slice(0, 16)}`, ''];
let bad = 0;
for (const lang of langs) {
  out.push(`## ${lang.toUpperCase()}`, '', '| Ключ | Расшифровка | Замечания |', '| --- | --- | --- |');
  for (const [key, rel] of Object.entries(VOICE_FILES[lang] || {})) {
    const file = `assets/audio/${rel}`;
    if (!fs.existsSync(file)) { out.push(`| ${key} | — | файл не найден |`); bad++; continue; }
    try {
      const r = await generateJson({ temperature: 0, schema: SCHEMA, parts: [
        { inline_data: { mime_type: mime(file), data: fs.readFileSync(file).toString('base64') } },
        { text: `This is a short voice prompt from a kids' fitness app, expected in ${NAMES[lang]}. Transcribe it exactly, then judge as a native speaker whether it sounds natural and correct for a parent and child. Report any problem.` },
      ] });
      const flag = !r.language_ok || !r.natural || (r.issues && r.issues.trim());
      if (flag) bad++;
      out.push(`| ${key} | ${String(r.transcript).replace(/\|/g, '/')} | ${flag ? '⚠️ ' + String(r.issues || (r.language_ok ? 'неестественно' : 'не тот язык')).replace(/\|/g, '/') : 'ок'} |`);
      process.stdout.write(flag ? '!' : '.');
    } catch (e) { out.push(`| ${key} | — | ошибка: ${String(e.message || e).slice(0, 80)} |`); process.stdout.write('x'); }
  }
  out.push('');
}
fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/voice-check.md', out.join('\n'));
console.log(`\nготово: docs/voice-check.md, замечаний ${bad}`);
