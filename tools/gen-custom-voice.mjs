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
  // Оценочный тест v3 (25.11): баланс, прыжки через линию, наклон стоя, касания плеч головой к телефону
  { key: 'balance_howto', style: 'howto', text: {
    uk: 'Стань босоніж обличчям до телефону, руки на пояс. Стань на праву ногу, ліву зігни назад. Тримай рівновагу якомога довше!',
    en: 'Stand barefoot facing the phone, hands on your hips. Stand on your right leg and bend your left leg back. Keep your balance as long as you can!',
    de: 'Stell dich barfuß vor das Handy, Hände an die Hüften. Steh auf dem rechten Bein und winkle das linke nach hinten an. Halte das Gleichgewicht, so lange du kannst!' } },
  { key: 'balance_left', style: 'howto', text: {
    uk: 'Тепер на лівій нозі! Руки на пояс, праву ногу зігни назад і тримайся.',
    en: 'Now on your left leg! Hands on hips, bend your right leg back and hold.',
    de: 'Jetzt auf dem linken Bein! Hände an die Hüften, rechtes Bein nach hinten anwinkeln und halten.' } },
  { key: 'side_jumps_howto', style: 'howto', text: {
    uk: 'Поклади на підлогу смужку скотчу або шнурок. Стань поруч, ноги разом. Стрибай через лінію туди й назад двома ногами якнайшвидше!',
    en: 'Put a strip of tape or a shoelace on the floor. Stand next to it with your feet together. Jump over the line and back with both feet, as fast as you can!',
    de: 'Leg ein Stück Klebeband oder einen Schnürsenkel auf den Boden. Stell dich daneben, Füße zusammen. Spring mit beiden Füßen so schnell du kannst hin und her!' } },
  { key: 'side_jumps_again', style: 'howto', text: {
    uk: 'Ще одна спроба! Відпочинь кілька секунд і знову стрибай якнайшвидше.',
    en: 'One more try! Rest a few seconds, then jump as fast as you can again.',
    de: 'Noch ein Versuch! Ruh dich ein paar Sekunden aus und spring dann wieder so schnell du kannst.' } },
  { key: 'bend_howto', style: 'howto', text: {
    uk: 'Стань обличчям до телефону, ноги разом, коліна прямі. Повільно нахилися вперед і тягнися руками якнайнижче. Затримайся на дві секунди й випрямся. Дві спроби!',
    en: 'Stand facing the phone, feet together, knees straight. Slowly bend forward and reach your hands down as far as you can. Hold for two seconds, then stand up. Two tries!',
    de: 'Stell dich vor das Handy, Füße zusammen, Knie gestreckt. Beug dich langsam vor und greif mit den Händen so weit nach unten wie möglich. Zwei Sekunden halten, dann aufrichten. Zwei Versuche!' } },
  { key: 'bend_knees_straight', style: 'hint', text: {
    uk: 'Коліна прямі!', en: 'Keep your knees straight!', de: 'Knie gestreckt lassen!' } },
  { key: 'shoulder_taps_head_howto', style: 'howto', text: {
    uk: 'Останнє! Ляж на підлогу головою до телефону й стань в упор лежачи, руки під плечима. По черзі торкайся протилежного плеча, таз не розгойдуй. Двадцять секунд!',
    en: 'Last one! Lie down with your head toward the phone and get into a high plank, hands under your shoulders. Take turns tapping the opposite shoulder and keep your hips still. Twenty seconds!',
    de: 'Die letzte Übung! Leg dich mit dem Kopf zum Handy und geh in den Liegestütz, Hände unter den Schultern. Tippe abwechselnd die gegenüberliegende Schulter an und halte die Hüfte ruhig. Zwanzig Sekunden!' } },
  { key: 'shoulder_taps_front_howto', style: 'howto', text: {
    uk: 'Стань в упор лежачи обличчям до камери, руки під плечима. По черзі торкайся долонею протилежного плеча: права рука — ліве плече, ліва рука — праве. Тримай тіло рівно. Камера зарахує, коли ти робиш саме так.',
    en: 'Get into a high plank facing the camera, hands under your shoulders. Take turns tapping the opposite shoulder: right hand to left shoulder, left hand to right shoulder. Keep your body straight. The camera counts when you do it just like this.',
    de: 'Geh in den Liegestütz mit Blick zur Kamera, Hände unter den Schultern. Tippe abwechselnd die gegenüberliegende Schulter an: rechte Hand zur linken Schulter, linke Hand zur rechten. Halte den Körper gerade. Die Kamera zählt, wenn du es genau so machst.' } },
  { key: 'good_morning_full_howto', style: 'howto', text: {
    uk: 'Стань боком до камери, ноги рівні, руки біля плечей. Нахиляйся вперед від стегон з рівною спиною, ніби кланяєшся, і повертайся назад. Камера зарахує, коли ти робиш саме так.',
    en: 'Stand sideways to the camera, legs straight, hands by your shoulders. Bend forward from your hips with a straight back, like a bow, then come back up. The camera counts when you do it just like this.',
    de: 'Stell dich seitlich zur Kamera, Beine gerade, Hände an den Schultern. Beug dich mit geradem Rücken aus der Hüfte nach vorn wie bei einer Verbeugung und richte dich wieder auf. Die Kamera zählt, wenn du es genau so machst.' } },
  // Исправления по машинной проверке голоса (docs/voice-check.md, 26.11): только язык с ошибкой, остальные остаются из Студии
  { key: 'good_morning_face_wrong', style: 'hint', text: { en: 'Turn sideways to the camera.' } },
  { key: 'tuck_jump_face_wrong', style: 'hint', text: { en: 'Turn to face the camera!' } },
  { key: 'hint_body_too_upright', style: 'hint', text: { de: 'Leg dich flach hin.' } },
  { key: 'jumping_jack_howto', style: 'howto', text: { de: 'Stell dich vor die Kamera und mach Hampelmänner: Beine weit auseinander, Arme hoch. So zählt es!' } },
  { key: 'quadruped_arm_circles_coach_1', style: 'celebrate', text: { de: 'Super gekreist!' } },
  { key: 'side_bend_coach_1', style: 'celebrate', text: { de: 'Super zur Seite gebeugt!' } },
  { key: 'side_leg_raise_coach_1', style: 'celebrate', text: { de: 'Super, Bein schön hoch!' } },
];

const auth = bearerFromServiceAccount(process.env);
let ffmpeg = null;
try { ffmpeg = createRequire(`${KID}/package.json`)('ffmpeg-static'); } catch { /* без нормализации громкости */ }
for (const ph of PHRASES) {
  for (const loc of ['uk', 'en', 'de']) {
    if (!ph.text[loc]) continue;
    const out = `assets/audio/${loc}/custom/${ph.key}.wav`;
    if (fs.existsSync(out) || fs.existsSync(out.replace(/\.wav$/, '.m4a'))) { console.log('уже есть', out); continue; }
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
