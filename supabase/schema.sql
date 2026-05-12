-- Households
create table if not exists households (
  id              uuid primary key default gen_random_uuid(),
  household_token text unique not null default gen_random_uuid()::text,
  name            text,
  created_at      timestamptz default now()
);

-- Users (linked to households)
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid references households(id) on delete cascade,
  phone         text unique not null,
  name          text,
  created_at    timestamptz default now()
);

-- Events
create table if not exists events (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid references households(id) on delete cascade,
  title         text not null,
  description   text,
  start_time    timestamptz not null,
  end_time      timestamptz,
  location      text,
  category      text,
  created_at    timestamptz default now()
);

-- Webhook audit log
create table if not exists webhook_logs (
  id          uuid primary key default gen_random_uuid(),
  message_id  text unique not null,
  payload     jsonb,
  status      text default 'received',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Indexes
create index if not exists events_household_id_idx on events(household_id);
create index if not exists events_start_time_idx   on events(start_time);
create index if not exists webhook_logs_message_id_idx on webhook_logs(message_id);

-- RLS
alter table households enable row level security;
alter table users        enable row level security;
alter table events       enable row level security;
alter table webhook_logs enable row level security;

create policy "public_read_households"   on households for select using (true);
create policy "service_insert_events"    on events       for insert with check (true);
create policy "public_read_events"       on events       for select using (true);
create policy "service_insert_webhook_logs" on webhook_logs for insert with check (true);
create policy "service_update_webhook_logs" on webhook_logs for update using (true);
