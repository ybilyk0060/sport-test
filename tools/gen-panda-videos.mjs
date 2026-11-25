// Видео с пандой для оценочных упражнений сайта (баланс, прыжки через линию, наклон стоя) — тем же генератором,
// что конвейер Студії вправ (Gemini Omni + референс панды, scripts/pipeline/lib в репозитории Kidsney).
// Ключ Gemini берётся конвейером из ~/dev/kidsney/secrets/gemini-api-key.txt и в код/лог не попадает.
// Пишет assets/video/<key>-<n>.mp4 и .jpg (формат игры, без звука). Уже сделанные попытки пропускает.
// Запуск: node tools/gen-panda-videos.mjs [ключ …]   (без аргументов — все три; по 2 попытки на упражнение)
import fs from 'fs';
import path from 'path';
const KID = '/Volumes/KidsneyDrive/dev/kidsney';
const { omniVideo } = await import(`${KID}/scripts/pipeline/lib/gemini.mjs`);
const { ffmpegPath, stripAudio, toGameFormat, poster } = await import(`${KID}/scripts/pipeline/lib/media.mjs`);
const ff = ffmpegPath(KID);
const REF = path.join(process.env.HOME, 'Library/Application Support/kidsney-eotd/refs/front.jpg');
if (!fs.existsSync(REF)) throw new Error('нет референса панды (front.jpg) — запустите конвейер Студії хотя бы раз');

const COMMON = 'Use the panda character and the gym from the reference image: the same cartoon panda, same room, same lighting and style. '
  + 'The panda wears a plain white t-shirt with no logo, letters or print, and the poster on the wall is a plain picture without any logo or text. '
  + 'Static camera, no camera movement, no cuts. The panda faces the camera directly (front view), the whole body from head to feet visible in every frame, centred. '
  + 'No text, no captions, no music, no other characters.';
const CLIPS = {
  balance: 'The panda puts its paws on its hips, lifts its left foot off the floor and bends the left leg backward (knee pointing down, foot behind), and stands steadily on the right leg for about four seconds without touching the floor. Then it puts the foot down and does the same on the left leg, lifting the right foot backward, for about three seconds.',
  side_jumps: 'A straight strip of bright orange tape lies on the floor in front of the panda, running from the panda toward the camera. The panda stands beside the tape with both feet together and jumps sideways over the tape with both feet together, then back over it to the other side, quickly and lightly, about eight jumps in a row, landing softly, keeping its body facing the camera.',
  bend: 'The panda stands with its feet together and knees straight, slowly bends forward from the hips and reaches its paws down to touch its toes, holds for two seconds, then slowly stands back up straight. It does this twice, keeping the knees straight the whole time.',
};
const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CLIPS);
fs.mkdirSync('assets/video', { recursive: true });
for (const key of keys) {
  for (const n of [1, 2]) {
    const out = `assets/video/${key}-${n}.mp4`;
    if (fs.existsSync(out)) { console.log('уже есть', out); continue; }
    console.log(`генерирую ${key}, попытка ${n}…`);
    try {
      const r = await omniVideo({ images: [REF], prompt: `${COMMON} ${CLIPS[key]}`, duration: '8s' });
      const raw = `/tmp/${key}-${n}.raw.mp4`, silent = `/tmp/${key}-${n}.mp4`;
      fs.writeFileSync(raw, r.video);
      stripAudio(ff, raw, silent);
      toGameFormat(ff, silent, out);
      poster(ff, out, out.replace(/\.mp4$/, '.jpg'), 0.5);
      console.log('записано', out);
    } catch (e) { console.log('ошибка', key, n, String(e.message || e).slice(0, 200)); }
  }
}
