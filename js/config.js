// ЕДИНЫЕ НАСТРОЙКИ. Всё, что владелец может захотеть поменять без программиста, — здесь.

export const CONFIG = {
  // --- Пейвол ---
  // 'teaser' — общий итог и самое сильное качество открыты, остальное размыто. 'hard' — всё закрыто. Проверка: ?paywall=hard
  paywallMode: 'teaser',

  // --- Подписка (одна цена) ---
  // Как у квиза Reself (1 мес $15.19 вместо $38.95, дальше $38.95/мес, −61 %), в гривнах. Владелец 25.11: «цену подобную их».
  // Первый период со скидкой, дальше автопродление по обычной цене. Владелец смотрит цифры до публикации.
  // Цена продления и способ отмены показываются рядом с кнопкой оплаты (не только мелким шрифтом).
  subscription: {
    periodDays: 30,      // длина периода
    // Цены по валюте (валюта — по языку, js/locale.js). first — первый период со скидкой, regular — каждый следующий.
    // UAH: решение владельца 25.11. USD/EUR — ПРЕДЛОЖЕНИЕ (как Reself $15.19 → $38.95), ждёт ОК владельца.
    prices: {
      UAH: { first: 629, regular: 1599 },
      USD: { first: 14.99, regular: 38.99 },
      EUR: { first: 14.99, regular: 36.99 },
    },
    // Честный таймер скидки: один отсчёт на посетителя (хранится на устройстве, обновление страницы и повторный тест его не перезапускают).
    // Когда время вышло, скидки больше нет: первый период стоит regular.
    offerMinutes: 15,
  },

  // --- Оплата ---
  // 'test' — тестовая страница оплаты (pay-test.html), настоящих платежей нет.
  // Подключение провайдера: добавить модуль в js/payment.js и поменять это значение.
  paymentProvider: 'test', // 'wayforpay' включать ТОЛЬКО с ключами своего мерчанта: демо test_merch_n1 списывает реальные деньги
  // Функция оплаты (Supabase). Сумма к оплате берётся на сервере (SPORT_TEST_PRICE_UAH), держите price.uah равной ей.
  payFn: 'https://iiafijcmajkitvtktntk.supabase.co/functions/v1/sport-test-pay',

  // --- Аналитика воронки (включается только после согласия на cookie) ---
  // metaPixelId — ID пикселя из Meta Events Manager (владелец даст). posthogKey — ключ проекта PostHog (если решим подключать).
  // PostHog: проект владельца (публичный ключ клиента, его можно держать в коде). События сайта помечены app = 'sport-test'.
  analytics: { metaPixelId: null, posthogKey: 'phc_AfhhsP7znm7dZiNtsycEcsq8R6qhMcqjdUaLb9vY72yn', posthogHost: 'https://eu.i.posthog.com' },

  // --- Хранение данных ---
  // 'device' — на устройстве (localStorage). Сервер не подключён: см. вопросы владельцу.
  storage: 'device',

  // --- Адреса медиа ---
  modelPath: 'vendor/mediapipe/pose_landmarker_lite.task',
  wasmPath: 'vendor/mediapipe/wasm',
  // Видео с пандой — публичные файлы каталога Студії вправ (те же адреса, что отдаёт exercise-catalog).
  mediaBase: 'https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/',

  // --- Наши приложения (полезные ссылки и подарок подписчику) ---
  // live: false — карточка без кнопки этого стора (страница ещё не опубликована: ссылка дала бы 404).
  // Статус 25.11: Zoo Google Play — опубликовано; Zoo App Store — на ревью; Chill Move App Store — одобрено, ждёт выпуска владельцем;
  // Chill Move Google Play — на проверке. Как выйдут — поставить live: true.
  apps: {
    zoo: { ages: [4, 6], ios: { url: 'https://apps.apple.com/app/id6835778169', live: false }, android: { url: 'https://play.google.com/store/apps/details?id=tech.kidsney.zoo', live: true } },
    chillmove: { ages: [7, 15], ios: { url: 'https://apps.apple.com/app/id6835860395', live: false }, android: { url: 'https://play.google.com/store/apps/details?id=com.chillmove.app', live: false } },
  },
  // Подарок подписчику: месяц бесплатно в этих приложениях по промокоду.
  // Коды настоящие только из стора: App Store Offer Codes (подписки zoo_monthly / family_monthly) и промокоды Google Play.
  // Пока пулов кодов и сервера выдачи нет — 'test': показывается тестовый код с пометкой, в приложении он не сработает.
  promoMode: 'test',

  // --- Набор упражнений по возрасту ---
  // 5 основных вправ студии: зірочка (обличчям) → присідання, біг на місці, нахили (боком) → торкання плечей (обличчям, на підлозі).
  // target — задание (повторы или секунды), capSec — предел времени. Это параметры ЗАДАНИЯ, а не возрастные нормы.
  // engineAge — возраст для калибровки движка студии (≤7 «young», 8–10 «mid», 11+ «standard»).
  ageGroups: {
    '4-6': { engineAge: 5, plan: [
      { key: 'jumping_jack', target: 6, capSec: 20 },
      { key: 'squats', target: 5, capSec: 25 },
      { key: 'high_knees', target: 8, capSec: 20 },
      { key: 'good_morning', target: 5, capSec: 25 },
      { key: 'shoulder_taps', target: 6, capSec: 25 },
    ] },
    '7-9': { engineAge: 8, plan: [
      { key: 'jumping_jack', target: 10, capSec: 25 },
      { key: 'squats', target: 8, capSec: 30 },
      { key: 'high_knees', target: 10, capSec: 25 },
      { key: 'good_morning', target: 6, capSec: 25 },
      { key: 'shoulder_taps', target: 10, capSec: 30 },
    ] },
    '10-12': { engineAge: 11, plan: [
      { key: 'jumping_jack', target: 12, capSec: 25 },
      { key: 'squats', target: 10, capSec: 30 },
      { key: 'high_knees', target: 12, capSec: 25 },
      { key: 'good_morning', target: 8, capSec: 30 },
      { key: 'shoulder_taps', target: 12, capSec: 30 },
    ] },
    '13-15': { engineAge: 14, plan: [
      { key: 'jumping_jack', target: 15, capSec: 30 },
      { key: 'squats', target: 12, capSec: 30 },
      { key: 'high_knees', target: 15, capSec: 30 },
      { key: 'good_morning', target: 10, capSec: 30 },
      { key: 'shoulder_taps', target: 16, capSec: 30 },
    ] },
  },

  // Медиа, спека и голос упражнений (из каталога студии; голос — Achird, js/voice-map.js)
  // spec — ключ в js/engine/specs.js; intro — клип-инструкция; coach — префикс клипов похвалы (каждый 5-й повтор).
  // maxEngineAge — потолок калибровки: у «нахилів» студии пороги взрослого эталона (для 8+ нужен наклон ниже горизонтали),
  //   поэтому до решения владельца считаем всем по детским порогам (наклон до горизонтали).
  exercises: {
    jumping_jack: { spec: 'jumping_jack', facing: 'front', goal: 'reps', video: 'eotd/jumping_jack-v2-d26a07ed.mp4', poster: 'eotd/jumping_jack-v2-d26a07ed.jpg', intro: 'jumping_jack_howto', coach: 'jumping_jack_coach_' },
    squats: { spec: 'squats', facing: 'side', goal: 'reps', video: 'studio/squats-v3-15c52172.mp4', poster: 'studio/squats-v3-6adec835.jpg', intro: 'squats_howto' },
    high_knees: { spec: 'high_knees', facing: 'side', goal: 'seconds', video: 'studio/high_knees-v1-79235890.mp4', poster: 'studio/high_knees-v1-05fc6289.jpg', intro: 'high_knees_howto' },
    good_morning: { spec: 'good_morning', facing: 'side', goal: 'reps', video: 'eotd/good_morning-v1-91b13db9.mp4', poster: 'eotd/good_morning-v1-91b13db9.jpg', intro: 'good_morning_howto', coach: 'good_morning_coach_', maxEngineAge: 7 },
    shoulder_taps: { spec: 'shoulder_taps_front', facing: 'front', floor: true, goal: 'reps', video: 'eotd/shoulder_taps-v1-e37b6726.mp4', poster: 'eotd/shoulder_taps-v1-e37b6726.jpg', intro: 'name_shoulder_taps', coach: 'shoulder_taps_coach_' },
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


