-- «Ребёнка нет рядом — пришлите ссылку» (Юрий 27.11): учёт отправок для ограничения частоты.
-- Храним только sha256 адреса и время, сам адрес не храним.
create table if not exists public.sport_test_link_requests (
  id bigserial primary key,
  email_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists sport_test_link_requests_hash_time on public.sport_test_link_requests (email_hash, created_at desc);
create index if not exists sport_test_link_requests_time on public.sport_test_link_requests (created_at desc);
alter table public.sport_test_link_requests enable row level security;
-- политик нет: доступ только у функции sport-test-sub (service role)
