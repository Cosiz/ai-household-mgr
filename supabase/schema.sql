-- ═══════════════════════════════════════════════════════
-- Household Manager Schema
-- ═══════════════════════════════════════════════════════

-- Households
CREATE TABLE IF NOT EXISTS public.households (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  token       TEXT        UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Users (phone numbers linked to households)
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         TEXT        UNIQUE NOT NULL,
  household_id  UUID        REFERENCES public.households(id),
  full_name     TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  UUID        REFERENCES public.households(id),
  event_type    TEXT        NOT NULL,
  title         TEXT        NOT NULL,
  description   TEXT,
  timestamp     TIMESTAMPTZ,
  location      TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Webhook Audit Log (WAL) — idempotency via unique message_id
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id          BIGSERIAL   PRIMARY KEY,
  message_id  TEXT        UNIQUE NOT NULL,
  payload     JSONB       NOT NULL DEFAULT '{}',
  status      TEXT        NOT NULL DEFAULT 'received',
  error_msg   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_household_id   ON public.events(household_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at    ON public.events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_phone           ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_message_id ON public.webhook_logs(message_id);

-- RLS — disable for now (app-level household_id filtering)
ALTER TABLE public.households   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs DISABLE ROW LEVEL SECURITY;

-- ─── Seed data (optional) ─────────────────────────────────
INSERT INTO public.households (id, name, token) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Sample Household', 'sample-token-abc123')
ON CONFLICT (id) DO NOTHING;
