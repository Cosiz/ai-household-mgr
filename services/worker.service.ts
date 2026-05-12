import { dbService }   from '@/services/db.service';
import { aiService }  from '@/services/ai.service';
import { whatsappService } from '@/services/whatsapp.service';

function generateMessageId(payload: Record<string, unknown>): string {
  const data = payload?.data as Record<string, unknown> | undefined;
  return (
    (data?.message_id as string) ||
    (data?.id as string) ||
    (`fallback_${Date.now()}`)
  );
}

export function processPayloadInBackground(payload: Record<string, unknown>): void {
  void runProcessing(payload);
}

async function runProcessing(payload: Record<string, unknown>): Promise<void> {
  const messageId = generateMessageId(payload);

  try {
    await dbService.updateWebhookStatus(messageId, 'processing');

    const phone  = whatsappService.extractPhone(payload);
    const text   = whatsappService.extractText(payload);

    if (!text) {
      await dbService.updateWebhookStatus(messageId, 'completed');
      return;
    }

    const aiResult = await aiService.runAnalysis(text);

    const householdId = await dbService.getHouseholdIdByPhone(phone);

    if (aiResult.intent === 'create_event' && householdId) {
      for (const event of aiResult.events) {
        await dbService.insertEvent(householdId, {
          title:       event.title,
          description: event.description,
          start_time:  event.start_time,
          end_time:    event.end_time,
          location:    event.location,
          category:    event.category,
        });
      }
    }

    if (phone && aiResult.whatsapp_reply_text) {
      await whatsappService.sendMessage(phone, aiResult.whatsapp_reply_text);
    }

    await dbService.updateWebhookStatus(messageId, 'completed');
  } catch (err) {
    console.error('Background processing error:', err);
    await dbService.updateWebhookStatus(messageId, 'failed');
  }
}
