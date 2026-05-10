import { NextResponse } from "next/server";

const META_API = "https://graph.facebook.com/v21.0";

export interface WhatsAppMessagePayload {
  entry: Array<{
    changes: Array<{
      value: {
        messages?: Array<{
          id: string;
          from: string;
          text?: { body: string };
          image?: { id: string; mime_type: string; sha256: string };
          type: string;
        }>;
        statuses?: Array<{
          id: string;
          status: string;
        }>;
      };
    }>;
  }>;
}

export function extractMessage(payload: WhatsAppMessagePayload) {
  const entry = payload.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  const message = value?.messages?.[0];

  if (!message) return null;

  return {
    message_id: message.id,
    from: message.from,
    text: message.text?.body ?? null,
    image_id: message.image?.id ?? null,
    type: message.type,
  };
}

export function extractMessageId(payload: WhatsAppMessagePayload): string | null {
  const msg = extractMessage(payload);
  return msg?.message_id ?? null;
}

export async function sendWhatsAppMessage(to: string, body: string): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.error("[WhatsApp] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID");
    return;
  }

  const res = await fetch(`${META_API}/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[WhatsApp] Send error:", err);
    throw new Error(`WhatsApp send failed: ${res.status}`);
  }
}

export async function fetchMediaToBase64(mediaId: string): Promise<string | null> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) {
    console.error("[WhatsApp] Missing WHATSAPP_ACCESS_TOKEN");
    return null;
  }

  // Get media URL
  const urlRes = await fetch(`${META_API}/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!urlRes.ok) {
    console.error("[WhatsApp] Media URL fetch failed:", urlRes.status);
    return null;
  }

  const { url: mediaUrl } = await urlRes.json();

  // Fetch binary
  const binRes = await fetch(mediaUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!binRes.ok) {
    console.error("[WhatsApp] Media binary fetch failed:", binRes.status);
    return null;
  }

  const buffer = await binRes.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return base64;
}
