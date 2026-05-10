import {
  extractMessage,
  fetchMediaToBase64,
  sendWhatsAppMessage,
} from "@/services/whatsapp.service";
import { updateWalStatus, getUserByPhone, insertEvent } from "@/services/db.service";
import { runAiAnalysis } from "@/services/ai.service";
import { AiOutputSchema } from "@/lib/validations";
import type { WhatsAppMessagePayload } from "@/services/whatsapp.service";

export async function processPayloadInBackground(
  messageId: string,
  payload: WhatsAppMessagePayload
): Promise<void> {
  try {
    await updateWalStatus(messageId, "processing");

    const msg = extractMessage(payload);
    if (!msg) {
      await updateWalStatus(messageId, "failed", "No message found in payload");
      return;
    }

    let imageBase64: string | null = null;
    if (msg.image_id) {
      imageBase64 = await fetchMediaToBase64(msg.image_id);
    }

    const aiResult = await runAiAnalysis({
      text: msg.text,
      imageBase64,
    });

    // Insert events if any
    if (aiResult.events.length > 0) {
      const user = await getUserByPhone(msg.from);
      if (user?.household_id) {
        for (const event of aiResult.events) {
          await insertEvent(user.household_id, {
            event_type: event.event_type,
            title: event.title,
            description: event.description,
            timestamp: event.timestamp,
            location: event.location,
            metadata: event.metadata,
          });
        }
      }
    }

    // Send WhatsApp reply
    if (aiResult.whatsapp_reply_text) {
      await sendWhatsAppMessage(msg.from, aiResult.whatsapp_reply_text);
    }

    await updateWalStatus(messageId, "completed");
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[Processor] Error:", error);
    await updateWalStatus(messageId, "failed", error);
  }
}
