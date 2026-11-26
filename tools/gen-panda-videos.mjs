// Видео с пандой для оценочных упражнений сайта (баланс, прыжки через линию, наклон стоя) — тем же генератором,
// что конвейер Студії вправ (Gemini Omni + референс панды, scripts/pipeline/lib в репозитории Kidsney).
// Ключ Gemini берётся конвейером из ~/dev/kidsney/secrets/gemini-api-key.txt и в код/лог не попадает.
// Пишет assets/video/<key>-<n>.mp4 и .jpg (формат игры, без звука). Уже сделанные попытки пропускает.
// Запуск: node tools/gen-panda-videos.mjs [ключ …]   (без аргументов — все три; по 2 попытки на упражнение)
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
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
const COMMON_GREEN = 'Use the panda character from the reference image: the same cartoon panda, same style and lighting on the panda. '
  + 'The panda wears a plain white t-shirt with no logo, letters or print, and dark blue shorts. '
  + 'BACKGROUND: a perfectly uniform, flat, evenly lit pure chroma-key green (#00B140) filling the whole frame behind and under the panda: no room, no floor, no mat, no objects, no shadows, no gradients, no reflections. Nothing on the panda is green. '
  + 'Static camera, no camera movement, no cuts. The panda faces the camera directly (front view), the whole body from head to feet visible in every frame, centred. '
  + 'No text, no captions, no music, no other characters.';
const CLIPS = {
  balance: 'The panda puts its paws on its hips, lifts its left foot off the floor and bends the left leg backward (knee pointing down, foot behind), and stands steadily on the right leg for about four seconds without touching the floor. Then it puts the foot down and does the same on the left leg, lifting the right foot backward, for about three seconds.',
  side_jumps: 'On the floor directly in front of the panda lies one short straight strip of bright orange tape, pointing straight toward the camera, between the panda and the phone, so it divides the floor into a left side and a right side. The panda stands on the left side of the tape, feet together, knees slightly bent, arms bent at the elbows. It hops sideways with BOTH feet together, clearly lifting both feet off the floor at the same time, over the tape and lands on the right side; then immediately hops back over the tape to the left side the same way. It repeats this side-to-side hop over the tape eight times, quickly and rhythmically, landing softly each time with feet together. The camera sees each hop clearly: the feet leave the floor together and cross the orange tape.',
  high_knees: 'The panda runs in place quickly, lifting its knees high to hip height one after another, arms pumping, for the whole clip. It stays on the same spot facing the camera.',
  jumping_jack: 'The panda does jumping jacks: it jumps the feet wide apart while raising both arms straight up overhead, then jumps the feet back together while lowering the arms to its sides. It repeats this rhythmically about eight times, the arms clearly going all the way up and down each time.',
  shoulder_taps: 'The phone stands on the floor in front of the panda. The panda gets into a high plank facing the camera: hands on the floor under its shoulders, body straight from head to heels, head toward the camera. Keeping the hips still, it lifts one paw and taps the opposite shoulder, puts it back, then taps with the other paw, alternating about eight times. The camera is low, at floor level, so the panda\'s head, shoulders and arms are large and clearly visible.',
  bend: 'The panda stands with its feet together and knees straight, slowly bends forward from the hips and reaches its paws down to touch its toes, holds for two seconds, then slowly stands back up straight. It does this twice, keeping the knees straight the whole time.',
};
// --vertical: вертикальные ролики 9:16 для показа на весь экран (Юрий 26.11) → assets/video/<key>-v<n>.mp4
const GREEN = process.argv.includes('--green'); // панда на ровном зелёном фоне — фон вырезается на телефоне (панда поверх камеры, Юрий 26.11)
const VERT = process.argv.includes('--vertical') || GREEN;
const ARGS = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const keys = ARGS.length ? ARGS : VERT ? ['balance', 'high_knees', 'bend', 'jumping_jack', 'shoulder_taps'] : ['balance', 'side_jumps', 'bend'];
fs.mkdirSync('assets/video', { recursive: true });
for (const key of keys) {
  // Делаем 2 ролика, если их ещё нет; если есть — ещё 2 новых попытки только для ключей, переданных аргументом (переснять)
  const pre = GREEN ? `${key}-g` : VERT ? `${key}-v` : `${key}-`;
  const have = fs.readdirSync('assets/video').map((f) => (f.match(new RegExp(`^${pre}(\\d+)\\.mp4$`)) || [])[1]).filter(Boolean).map(Number);
  const start = have.length ? Math.max(...have) + 1 : 1;
  const redo = ARGS.includes(key);
  const list = !have.length ? [1, 2] : redo ? [start, start + 1] : [];
  if (!list.length) console.log('уже есть', key);
  for (const n of list) {
    const out = `assets/video/${pre}${n}.mp4`;
    console.log(`генерирую ${key}, попытка ${n}…`);
    try {
      const base = GREEN ? COMMON_GREEN : COMMON;
      const clip = GREEN ? CLIPS[key].replace(/The phone stands on the floor in front of the panda\. /, '').replace(/ The camera is low, at floor level[^.]*\./, ' The camera is low, near the floor, in front of the panda.') : CLIPS[key];
      const r = await omniVideo({ images: [REF], prompt: `${base}${VERT ? ' Vertical 9:16 frame: the panda fills most of the frame height.' : ''} ${clip}`, duration: '8s', aspect: VERT ? '9:16' : '16:9' });
      const raw = `/tmp/${key}-${n}.raw.mp4`, silent = `/tmp/${key}-${n}.mp4`;
      fs.writeFileSync(raw, r.video);
      stripAudio(ff, raw, silent);
      if (VERT) {
        execFileSync(ff, ['-y', '-loglevel', 'error', '-i', silent, '-an', '-vf', 'scale=540:960:force_original_aspect_ratio=decrease,pad=540:960:(ow-iw)/2:(oh-ih)/2,fps=24', '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-b:v', '900k', '-movflags', '+faststart', out]);
        execFileSync(ff, ['-y', '-loglevel', 'error', '-ss', '0.5', '-i', out, '-frames:v', '1', '-q:v', '3', out.replace(/\.mp4$/, '.jpg')]);
      } else {
        toGameFormat(ff, silent, out);
        poster(ff, out, out.replace(/\.mp4$/, '.jpg'), 0.5);
      }
      console.log('записано', out);
    } catch (e) { console.log('ошибка', key, n, String(e.message || e).slice(0, 200)); }
  }
}
