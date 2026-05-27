-- MF Tracker — Supabase schema
-- Run this in the Supabase SQL editor to initialise the database.

create table if not exists profiles (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  created_at  timestamptz default now()
);

-- Seed default profile
insert into profiles (name) values ('Default') on conflict do nothing;

create table if not exists holdings (
  id           uuid primary key default gen_random_uuid(),
  scheme_code  integer not null,
  scheme_name  text not null,
  units        real not null,
  buy_nav      real not null,
  buy_date     date not null,
  notes        text default '',
  profile_name text not null default 'Default',
  created_at   timestamptz default now()
);

create table if not exists redemptions (
  id           uuid primary key default gen_random_uuid(),
  scheme_code  integer not null,
  scheme_name  text not null,
  units        real not null,
  sell_nav     real not null,
  sell_date    date not null,
  notes        text default '',
  profile_name text not null default 'Default',
  created_at   timestamptz default now()
);

-- Indexes for common filters
create index if not exists holdings_profile_idx    on holdings (profile_name);
create index if not exists redemptions_profile_idx on redemptions (profile_name);
