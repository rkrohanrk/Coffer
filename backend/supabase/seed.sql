-- Coffer demo seed — run in the Supabase SQL Editor AFTER schema.sql.
--
-- Creates a real, email-confirmed Supabase Auth user and a populated portfolio so
-- the prefilled login on /login works end-to-end:
--     email:    investor@coffer.in
--     password: vault2026
--
-- Idempotent: safe to run more than once.

create extension if not exists pgcrypto;

do $$
declare
  demo_id      uuid := 'a0000000-0000-4000-8000-000000000001';
  brokerage_id uuid;
  mf_id        uuid;
  reliance     uuid;
  infy         uuid;
  hdfc         uuid;
  nifty        uuid;
  gold         uuid;
begin
  -- ── Supabase Auth user (confirmed) ─────────────────────────────────────────
  if not exists (select 1 from auth.users where id = demo_id) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', demo_id, 'authenticated', 'authenticated',
      'investor@coffer.in', crypt('vault2026', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Demo Investor"}'::jsonb,
      '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), demo_id, demo_id::text,
      jsonb_build_object('sub', demo_id::text, 'email', 'investor@coffer.in'),
      'email', now(), now(), now()
    );
  end if;

  -- ── App profile row (FK target for accounts.user_id) ───────────────────────
  insert into public.users (id, email, password_hash)
  values (demo_id, 'investor@coffer.in', crypt('vault2026', gen_salt('bf')))
  on conflict (id) do nothing;

  -- Portfolio already seeded? Stop here.
  if exists (select 1 from accounts where user_id = demo_id) then
    return;
  end if;

  -- ── Accounts ───────────────────────────────────────────────────────────────
  insert into accounts (user_id, name, type, institution)
  values (demo_id, 'Zerodha', 'BROKERAGE', 'Zerodha') returning id into brokerage_id;
  insert into accounts (user_id, name, type, institution)
  values (demo_id, 'Groww MF', 'RETIREMENT', 'Groww') returning id into mf_id;

  -- ── Assets (shared catalog) ────────────────────────────────────────────────
  insert into assets (symbol, name, asset_class, sector) values
    ('RELIANCE.NS', 'Reliance Industries Ltd',     'EQUITY', 'Energy'),
    ('INFY.NS',     'Infosys Ltd',                 'EQUITY', 'Technology'),
    ('HDFCBANK.NS', 'HDFC Bank Ltd',               'EQUITY', 'Finance'),
    ('NIFTYBEES.NS','Nippon India ETF Nifty BeES',  'ETF',   null),
    ('GOLDBEES.NS', 'Nippon India ETF Gold BeES',   'ETF',   null)
  on conflict (symbol) do nothing;

  select id into reliance from assets where symbol = 'RELIANCE.NS';
  select id into infy     from assets where symbol = 'INFY.NS';
  select id into hdfc     from assets where symbol = 'HDFCBANK.NS';
  select id into nifty    from assets where symbol = 'NIFTYBEES.NS';
  select id into gold     from assets where symbol = 'GOLDBEES.NS';

  -- ── Transactions ───────────────────────────────────────────────────────────
  insert into transactions (account_id, asset_id, type, trade_date, quantity, price, fees) values
    (brokerage_id, null,     'DEPOSIT',  '2023-01-02', 200000, 1,       0),
    (brokerage_id, null,     'DEPOSIT',  '2023-07-01', 50000,  1,       0),
    (brokerage_id, reliance, 'BUY',      '2023-01-05', 10,     2450.00, 25),
    (brokerage_id, infy,     'BUY',      '2023-01-10', 20,     1520.00, 25),
    (brokerage_id, nifty,    'BUY',      '2023-02-01', 50,     190.00,  15),
    (brokerage_id, hdfc,     'BUY',      '2023-03-15', 15,     1620.00, 25),
    (brokerage_id, gold,     'BUY',      '2023-04-10', 30,     520.00,  15),
    (brokerage_id, reliance, 'BUY',      '2023-07-05', 5,      2750.00, 25),
    (brokerage_id, infy,     'SELL',     '2023-09-15', 10,     1800.00, 25),
    (brokerage_id, reliance, 'DIVIDEND', '2023-11-15', 15,     9.0,     0),
    (brokerage_id, nifty,    'BUY',      '2024-01-10', 30,     215.00,  15),
    (brokerage_id, hdfc,     'SELL',     '2024-03-01', 5,      1720.00, 25),
    (mf_id,        null,     'DEPOSIT',  '2023-01-15', 50000,  1,       0),
    (mf_id,        null,     'DEPOSIT',  '2024-01-15', 50000,  1,       0),
    (mf_id,        nifty,    'BUY',      '2023-01-20', 100,    188.00,  0),
    (mf_id,        gold,     'BUY',      '2023-06-01', 50,     530.00,  0),
    (mf_id,        nifty,    'BUY',      '2024-01-22', 50,     218.00,  0),
    (brokerage_id, infy,     'BUY',      '2024-02-01', 10,     1740.00, 25),
    (brokerage_id, reliance, 'BUY',      '2024-03-10', 5,      2950.00, 25),
    (brokerage_id, hdfc,     'SELL',     '2024-06-01', 5,      1780.00, 25);
end $$;
