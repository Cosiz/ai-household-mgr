import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _client;
}

export const dbService = {
  /** Insert a webhook log. Unique constraint on message_id makes duplicates idempotent. */
  async insertWebhookLog(messageId: string, payload: Record<string, unknown>): Promise<void> {
    const supabase = getClient();
    const { error } = await supabase.from('webhook_logs').insert({
      message_id: messageId,
      payload,
      status: 'received',
    });
    if (error) {
      // PostgreSQL unique violation = duplicate, swallow it
      if (error.code === '23505') return;
      throw error;
    }
  },

  async updateWebhookStatus(messageId: string, status: 'processing' | 'completed' | 'failed'): Promise<void> {
    const supabase = getClient();
    await supabase
      .from('webhook_logs')
      .update({ status })
      .eq('message_id', messageId);
  },

  /** Map a phone number to a household_id */
  async getHouseholdIdByPhone(phone: string): Promise<string | null> {
    const supabase = getClient();
    const { data } = await supabase
      .from('users')
      .select('household_id')
      .eq('phone', phone)
      .maybeSingle();
    return data?.household_id ?? null;
  },

  /** Get household record by its magic token */
  async getHouseholdByToken(householdToken: string) {
    const supabase = getClient();
    const { data } = await supabase
      .from('households')
      .select('*')
      .eq('household_token', householdToken)
      .maybeSingle();
    return data;
  },

  /** Get events for a household token (joined through households) */
  async getEventsByHouseholdToken(householdToken: string) {
    const supabase = getClient();
    const household = await dbService.getHouseholdByToken(householdToken);
    if (!household) return [];
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('household_id', household.id)
      .order('start_time', { ascending: true });
    return data ?? [];
  },

  /** Insert a parsed event into the events table */
  async insertEvent(
    householdId: string,
    event: {
      title: string;
      description?: string;
      start_time: string;
      end_time?: string;
      location?: string;
      category?: string;
    }
  ): Promise<void> {
    const supabase = getClient();
    await supabase.from('events').insert({ household_id: householdId, ...event });
  },
};
