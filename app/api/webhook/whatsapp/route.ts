import { NextRequest, NextResponse } from "next/server";
import { insertWebhookLog } from "@/services/db.service";
import { extractMessageId } from "@/services/whatsapp.service";
import { processPayloadInBackground } from "./processor";
import type { WhatsAppMessagePayload } from "@/services/whatsapp.service";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  let body: WhatsAppMessagePayload;
  try {
    body = await req.json();
  } catch {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const messageId = extractMessageId(body);

  if (!messageId) {
    return new NextResponse("OK", { status: 200 });
  }

  try {
    await insertWebhookLog(messageId, body);
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e?.code === "23505") {
      // Duplicate — already processed
      return new NextResponse("OK", { status: 200 });
    }
    console.error("[Webhook] WAL insert error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }

  // Fire and forget
  processPayloadInBackground(messageId, body).catch((err) =>
    console.error("[Webhook] Background processor error:", err)
  );

  return new NextResponse("OK", { status: 200 });
}
