// Голос Achird из Студії вправ: скачивает нужные клипы по публичному манифесту
// (assets/audio/studio/manifest.json) в assets/audio и пишет карту js/voice-map.js.
// Запуск: node tools/fetch-voice.mjs   (повтор безопасен: файлы сверяются по sha)
import fs from 'fs'; import crypto from 'crypto';
const BASE = 'https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/';
const LOCS = ['en', 'de', 'uk'];
const WANT = {
  voice: [
    ...Array.from({ length: 30 }, (_, i) => `count_${i + 1}`),
    'session_get_ready', 'session_start', 'session_finished', 'session_time_up', 'session_last_one', 'session_halfway', 'session_camera_lost',
    'hint_sit_lower', 'hint_turn_sideways', 'hint_keep_feet_planted', 'hint_stand_straight_arms_down', 'hint_keep_moving', 'hint_switch_legs',
    'hint_start_high_knees', 'hint_lift_knees_higher', 'hint_show_full_body', 'hint_jumping_jack_face_wrong', 'hint_jumping_jack_not_reached',
    'hint_get_into_plank', 'hint_keep_body_straight', 'frame_step_back',
  ],
  exercise: [
    'jumping_jack_howto', 'squats_howto', 'high_knees_howto', 'good_morning_howto', 'name_shoulder_taps',
    'good_morning_not_reached', 'good_morning_face_wrong', 'shoulder_taps_not_reached',
    ...['jumping_jack', 'good_morning', 'shoulder_taps'].flatMap((k) => [1, 2, 3, 4].map((n) => `${k}_coach_${n}`)),
  ],
};
const man = await fetch(BASE + 'audio/studio/manifest.json').then((r) => r.json());
const map = {};
for (const LOC of LOCS) {
  map[LOC] = {};
  fs.mkdirSync(`assets/audio/${LOC}`, { recursive: true });
  for (const [set, keys] of Object.entries(WANT)) {
    for (const key of keys) {
      const e = man.sets[set] && man.sets[set][LOC] && man.sets[set][LOC][key];
      if (!e) { console.log('НЕТ В МАНИФЕСТЕ', LOC, set, key); continue; }
      const ext = e.path.split('.').pop();
      const file = `${LOC}/${key}.${ext}`;
      const dest = `assets/audio/${file}`;
      const have = fs.existsSync(dest) ? crypto.createHash('sha256').update(fs.readFileSync(dest)).digest('hex').slice(0, 16) : null;
      if (have !== e.sha) {
        const buf = Buffer.from(await fetch(`${BASE}${e.path}?v=${e.sha}`).then((r) => { if (!r.ok) throw new Error(`${r.status} ${e.path}`); return r.arrayBuffer(); }));
        const sha = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
        if (sha !== e.sha) console.log('sha не совпал', LOC, key, sha, e.sha);
        fs.writeFileSync(dest, buf);
      }
      map[LOC][key] = file;
    }
  }
}
fs.writeFileSync('js/voice-map.js', `// Сгенерировано tools/fetch-voice.mjs из манифеста Студії вправ (${man.generatedAt}). Голос Achird, языки en/de/uk. Не править руками.\nexport const VOICE_FILES = ${JSON.stringify(map, null, 1)};\n`);
console.log('клипов', Object.fromEntries(Object.entries(map).map(([l, m]) => [l, Object.keys(m).length])));
