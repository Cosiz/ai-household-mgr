import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _adminClient: SupabaseClient | null = null;

function getAdminClient(): SupabaseClient {
  if (!_adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Missing Supabase env vars");
    _adminClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _adminClient;
}

// ─── WAL ─────────────────────────────────────────────────────────────────────

export async function insertWebhookLog(messageId: string, payload: unknown) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("webhook_logs")
    .insert({ message_id: messageId, payload, status: "received" });

  if (error) {
    const e = error as Error & { code?: string };
    if (e?.code === "23505") {
      // Unique constraint violation — duplicate
      const dup = new Error("DUPLICATE_MESSAGE_ID") as Error & { code?: string; pgMessage?: string };
      dup.code = "23505";
      dup.pgMessage = error.message;
      throw dup;
    }
    throw error;
  }
}

export async function updateWalStatus(messageId: string, status: string, errorMsg?: string) {
  const supabase = getAdminClient();
  await supabase
    .from("webhook_logs")
    .update({ status, error_msg: errorMsg ?? null })
    .eq("message_id", messageId);
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUserByPhone(phone: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, phone, household_id, full_name")
    .eq("phone", phone)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertUser(phone: string, householdId: string, name?: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("users")
    .upsert(
      { phone, household_id: householdId, full_name: name ?? null },
      { onConflict: "phone" }
    )
    .select("id, phone, household_id")
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ─── Households ─────────────────────────────────────────────────────────────

export async function getHouseholdByToken(token: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("households")
    .select("id, name, token")
    .eq("token", token)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ─── Events ─────────────────────────────────────────────────────────────────

export async function insertEvent(householdId: string, event: {
  event_type: string;
  title: string;
  description?: string;
  timestamp?: string;
  location?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("events")
    .insert({ household_id: householdId, ...event })
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getEventsByHouseholdToken(token: string, limit = 50) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, event_type, title, description, timestamp, location, metadata, created_at")
    .eq("households.token", token)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
