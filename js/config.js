// ЕДИНЫЕ НАСТРОЙКИ. Всё, что владелец может захотеть поменять без программиста, — здесь.

export const CONFIG = {
  // --- Пейвол ---
  // 'teaser' — общий итог и самое сильное качество открыты, остальное размыто.
  // 'hard'   — весь результат закрыт до оплаты.
  // Для проверки можно переопределить в адресе: ?paywall=hard
  paywallMode: 'teaser',

  // --- Цена (единственное место) ---
  // Показываем в гривне. usd — ориентир владельца; uah — сумма к оплате.
  // ВНИМАНИЕ: uah задана вручную по рабочему курсу, владелец подтверждает сумму (см. docs/OWNER-REPORT.md, вопросы).
  price: { usd: 5, uah: 210 },

  // --- Оплата ---
  // 'test' — тестовая страница оплаты (pay-test.html), настоящих платежей нет.
  // Подключение провайдера: добавить модуль в js/payment.js и поменять это значение.
  paymentProvider: 'test', // 'wayforpay' включать ТОЛЬКО с ключами своего мерчанта: демо test_merch_n1 списывает реальные деньги
  // Функция оплаты (Supabase). Сумма к оплате берётся на сервере (SPORT_TEST_PRICE_UAH), держите price.uah равной ей.
  payFn: 'https://iiafijcmajkitvtktntk.supabase.co/functions/v1/sport-test-pay',

  // --- Хранение данных ---
  // 'device' — на устройстве (localStorage). Сервер не подключён: см. вопросы владельцу.
  storage: 'device',

  // --- Адреса медиа ---
  modelPath: 'vendor/mediapipe/pose_landmarker_lite.task',
  wasmPath: 'vendor/mediapipe/wasm',
  // Видео с пандой — публичные файлы каталога Студії вправ (те же адреса, что отдаёт exercise-catalog).
  mediaBase: 'https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/',

  // --- Города квиза ---
  cities: ['Київ', 'Львів', 'Одеса', 'Дніпро', 'Харків', 'Вінниця', 'Івано-Франківськ', 'Запоріжжя'],

  // --- Набор упражнений по возрасту ---
  // target — задание (повторы или секунды), capSec — предел времени на упражнение.
  // Это параметры ЗАДАНИЯ, а не возрастные нормы. Для 4–6 лет набор легче и короче.
  // engineAge — возраст для калибровки движка студии (≤7 «young», 8–10 «mid», 11+ «standard»).
  ageGroups: {
    '4-6': { engineAge: 5, plan: [
      { key: 'jumping_jack', target: 6, capSec: 20 },
      { key: 'squats', target: 5, capSec: 25 },
      { key: 'high_knees', target: 8, capSec: 20 },
      { key: 'plank', target: 10, capSec: 30 },
    ] },
    '7-9': { engineAge: 8, plan: [
      { key: 'jumping_jack', target: 10, capSec: 25 },
      { key: 'squats', target: 8, capSec: 30 },
      { key: 'high_knees', target: 10, capSec: 25 },
      { key: 'plank', target: 15, capSec: 40 },
    ] },
    '10-12': { engineAge: 11, plan: [
      { key: 'jumping_jack', target: 10, capSec: 25 },
      { key: 'squats', target: 8, capSec: 30 },
      { key: 'high_knees', target: 10, capSec: 25 },
      { key: 'plank', target: 15, capSec: 40 },
    ] },
  },

  // Медиа и голос упражнений (из каталога студии)
  exercises: {
    jumping_jack: { facing: 'front', goal: 'reps', video: 'eotd/jumping_jack-v2-d26a07ed.mp4', poster: 'eotd/jumping_jack-v2-d26a07ed.jpg', intro: 'intro_jumping_jacks' },
    squats: { facing: 'side', goal: 'reps', video: 'studio/squats-v3-15c52172.mp4', poster: 'studio/squats-v3-6adec835.jpg', intro: 'intro_squats' },
    high_knees: { facing: 'side', goal: 'seconds', video: 'studio/high_knees-v1-79235890.mp4', poster: 'studio/high_knees-v1-05fc6289.jpg', intro: 'intro_high_knees' },
    plank: { facing: 'side', goal: 'seconds', video: 'studio/plank-v1-162ac800.mp4', poster: 'studio/plank-v1-193f9ce0.jpg', intro: 'intro_plank' },
  },

  // --- Уровни профиля ---
  // Балл качества 0..1 = среднее его показателей (js/scoring.js). Пороги — РАБОЧИЕ, не возрастные нормы.
  levels: { high: 0.75, mid: 0.45 },

  // Запасной путь: длительность записи, сек (подсказка пользователю) и предел разбора
  fallbackClipSec: 15,
  fallbackMaxSec: 40,

  // Сколько длится экран «Рахуємо результат», мс
  calcMs: 4000,
};

export function priceLabel() {
  return `${CONFIG.price.uah} грн`;
}
