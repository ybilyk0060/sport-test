-- Веб-тест: подписка на сервере (владелец 25.11: статус и отмена не только в браузере).
-- Доступ к таблицам — только у функции sport-test-sub (service role). RLS включён, политик нет: клиент напрямую ничего не читает.
create table if not exists public.sport_test_subscriptions (
  id uuid primary key default gen_random_uuid(),
  order_ref text unique,
  email text not null,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  mode text not null default 'test' check (mode in ('test', 'live')),
  currency text not null,
  first_amount numeric not null,
  regular_amount numeric not null,
  period_days int not null default 30,
  started_at timestamptz not null default now(),
  paid_until timestamptz not null,
  cancelled_at timestamptz,
  -- Ответы квиза и итоговые числа теста (без видео и точек тела) — чтобы отчёт открывался на другом устройстве
  quiz jsonb,
  results jsonb,
  workouts jsonb not null default '[]'::jsonb,
  last_restore_at timestamptz,
  lang text not null default 'en',
  site text,                      -- адрес сайта для ссылок в письмах
  reminded_for timestamptz,       -- для какого paid_until уже отправлено напоминание за 3 дня
  created_at timestamptz not null default now()
);
create index if not exists sport_test_subscriptions_email_idx on public.sport_test_subscriptions (lower(email));

-- Ключи доступа устройств (хранится только sha256 ключа; ключ живёт в браузере и в ссылке из письма)
create table if not exists public.sport_test_sub_tokens (
  token_hash text primary key,
  sub_id uuid not null references public.sport_test_subscriptions(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.sport_test_subscriptions enable row level security;
alter table public.sport_test_sub_tokens enable row level security;

-- Напоминание за 3 дня до продления: раз в час вызывать функцию (секрет SPORT_TEST_CRON_SECRET в Vault).
-- Включается отдельно, после деплоя функции и секрета:
-- select cron.schedule('sport-test-remind', '17 * * * *', $$
--   select net.http_post(url := 'https://iiafijcmajkitvtktntk.supabase.co/functions/v1/sport-test-sub',
--     headers := jsonb_build_object('content-type', 'application/json', 'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'sport_test_cron_secret')),
--     body := '{"action":"remind"}'::jsonb);
-- $$);
