# Веб-тест «Який спорт підійде дитині»

Анкета (5 питань) → 30 с руху перед камерою або завантажене відео → аналіз пози MediaPipe Pose Landmarker прямо в браузері → paywall (WayForPay) → повний результат.

- `index.html`, `app.js`, `app.css` — сайт, без збірки. Статичний хостинг (GitHub Pages).
- `analyze.js` — метрики з точок пози: стрибки, присідання, гнучкість, координація, баланс, витривалість; рекомендації спорту. Тест: `node tests/analyze.test.mjs`.
- `vendor/mediapipe/` — бандл tasks-vision, wasm і модель pose_landmarker_lite (ті ж, що в Студії вправ Kidsney).
- `supabase/functions/sport-test-pay/` — функція оплати (Supabase проект iiafijcmajkitvtktntk), таблиця `sport_test_orders`.

## Оплата
Без секретів функція працює в тестовому режимі (публічний тестовий мерчант WayForPay, гроші не списуються, на сайті жовта смуга «Тестовий режим»).
Бойовий режим: у Supabase → Edge Functions → Secrets задати `WFP_MERCHANT`, `WFP_SECRET`, `WFP_DOMAIN` (домен сайту, як у кабінеті WayForPay), за бажанням `SPORT_TEST_PRICE_UAH` (за замовчуванням 210). Якщо сайт переїде на свій домен — додати його в `SPORT_TEST_RETURN_HOSTS`.
Оплата підтверджується на сервері (callback WayForPay з перевіркою підпису + CHECK_STATUS), не з адреси повернення.

## Приватність
Відео не покидає пристрій. На сервер іде тільки номер замовлення і сума.
