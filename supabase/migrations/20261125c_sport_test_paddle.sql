-- Paddle: связь заказов и подписок сайта с транзакциями и подписками Paddle
alter table public.sport_test_orders add column if not exists provider text;
alter table public.sport_test_orders add column if not exists provider_txn text;
alter table public.sport_test_orders add column if not exists provider_sub text;
alter table public.sport_test_subscriptions add column if not exists provider_sub text;
create index if not exists sport_test_subscriptions_provider_sub on public.sport_test_subscriptions (provider_sub);
