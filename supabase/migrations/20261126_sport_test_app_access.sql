-- Доступ подписчика теста к приложениям (Kidsney, Kidsney Zoo, Chill Move) без промокодов (Юрий 26.11).
-- Вход в приложении: email оплаты → одноразовый код на почту → токен приложения. Статус подписки по одному email не раскрывается.
-- Таблицы доступны только сервисной роли (RLS включён, политик нет). НЕ ПРИМЕНЕНО: ждёт ОК Юрия.

create table if not exists public.sport_test_access_codes (
  email text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts smallint not null default 0,
  sent_at timestamptz not null default now()
);
alter table public.sport_test_access_codes enable row level security;

create table if not exists public.sport_test_app_tokens (
  token_hash text primary key,
  sub_id uuid not null references public.sport_test_subscriptions(id) on delete cascade,
  app text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);
alter table public.sport_test_app_tokens enable row level security;
create index if not exists sport_test_app_tokens_sub on public.sport_test_app_tokens(sub_id);

-- Цепочка писем подписчику: день 3 и 7 (onboard_step 1, 2), затем раз в 30 дней приглашение на повторный тест
alter table public.sport_test_subscriptions add column if not exists onboard_step smallint not null default 0;
alter table public.sport_test_subscriptions add column if not exists retest_mailed_at timestamptz;
