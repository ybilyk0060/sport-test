-- Напоминание за 3 дня до продления: cron раз в час вызывает sport-test-sub {action:'remind'}.
-- Секрет генерируется в базе и нигде не вводится руками; таблица закрыта RLS без политик (читает только service role).
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.sport_test_settings (
  key text primary key,
  value text not null
);
alter table public.sport_test_settings enable row level security;
revoke all on public.sport_test_settings from anon, authenticated;

insert into public.sport_test_settings (key, value)
values ('cron_secret', encode(extensions.gen_random_bytes(24), 'hex'))
on conflict (key) do nothing;

select cron.unschedule('sport-test-remind') where exists (select 1 from cron.job where jobname = 'sport-test-remind');
select cron.schedule('sport-test-remind', '17 * * * *', $$
  select net.http_post(
    url := 'https://hcnlzndlivlojdqmzbgi.supabase.co/functions/v1/sport-test-sub',
    headers := jsonb_build_object('content-type', 'application/json',
      'x-cron-secret', (select value from public.sport_test_settings where key = 'cron_secret')),
    body := '{"action":"remind"}'::jsonb);
$$);
