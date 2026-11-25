// Свои фразы сайта тем же голосом Achird (Gemini TTS, как Студія вправ): полные инструкции к упражнениям,
// которых в Студии нет или там они короткие. Пишет assets/audio/<lang>/custom/<key>.wav и пересобирает js/voice-map.js.
// Запуск (ключ сервис-аккаунта kidsney-hero берётся из GOOGLE_APPLICATION_CREDENTIALS, в код и лог не попадает):
//   GOOGLE_APPLICATION_CREDENTIALS=<service-account.json> node tools/gen-custom-voice.mjs
import fs from 'fs';
import { execFileSync } from 'child_process';
import { createRequire } from 'module';
const KID = '/Volumes/KidsneyDrive/dev/kidsney';
const { buildRequest, synthesize, bearerFromServiceAccount } = await import(`${KID}/scripts/voice/tts.mjs`);

const PHRASES = [
  { key: 'shoulder_taps_front_howto', style: 'howto', text: {
    uk: 'Стань в упор лежачи обличчям до камери, руки під плечима. По черзі торкайся долонею протилежного плеча: права рука — ліве плече, ліва рука — праве. Тримай тіло рівно. Камера зарахує, коли ти робиш саме так.',
    en: 'Get into a high plank facing the camera, hands under your shoulders. Take turns tapping the opposite shoulder: right hand to left shoulder, left hand to right shoulder. Keep your body straight. The camera counts when you do it just like this.',
    de: 'Geh in den Liegestütz mit Blick zur Kamera, Hände unter den Schultern. Tippe abwechselnd die gegenüberliegende Schulter an: rechte Hand zur linken Schulter, linke Hand zur rechten. Halte den Körper gerade. Die Kamera zählt, wenn du es genau so machst.' } },
  { key: 'good_morning_full_howto', style: 'howto', text: {
    uk: 'Стань боком до камери, ноги рівні, руки біля плечей. Нахиляйся вперед від стегон з рівною спиною, ніби кланяєшся, і повертайся назад. Камера зарахує, коли ти робиш саме так.',
    en: 'Stand sideways to the camera, legs straight, hands by your shoulders. Bend forward from your hips with a straight back, like a bow, then come back up. The camera counts when you do it just like this.',
    de: 'Stell dich seitlich zur Kamera, Beine gerade, Hände an den Schultern. Beug dich mit geradem Rücken aus der Hüfte nach vorn wie bei einer Verbeugung und richte dich wieder auf. Die Kamera zählt, wenn du es genau so machst.' } },
];

const auth = bearerFromServiceAccount(process.env);
let ffmpeg = null;
try { ffmpeg = createRequire(`${KID}/package.json`)('ffmpeg-static'); } catch { /* без нормализации громкости */ }
for (const ph of PHRASES) {
  for (const loc of ['uk', 'en', 'de']) {
    const out = `assets/audio/${loc}/custom/${ph.key}.wav`;
    fs.mkdirSync(`assets/audio/${loc}/custom`, { recursive: true });
    const raw = await synthesize(buildRequest(ph, loc), auth);
    if (ffmpeg) {
      const tmp = `${out}.raw.wav`; fs.writeFileSync(tmp, raw);
      execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', tmp, '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '22050', '-ac', '1', '-sample_fmt', 's16', out]);
      fs.unlinkSync(tmp);
    } else fs.writeFileSync(out, raw);
    console.log('записано', out);
  }
}
execFileSync('node', ['tools/fetch-voice.mjs'], { stdio: 'inherit' });
