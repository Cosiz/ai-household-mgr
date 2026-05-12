import { NextResponse } from 'next/server';
import { dbService }     from '@/services/db.service';
import { processPayloadInBackground } from '@/services/worker.service';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    console.log('INCOMING PAYLOAD:', rawBody);
    const payload = JSON.parse(rawBody);

    // Approve Sent.dm test pings instantly
    if (payload.event === 'test' || Object.keys(payload).length === 0) {
      return NextResponse.json({ status: 'test_received' }, { status: 200 });
    }

    // Extract unique ID safely based on Sent.dm's nested data structure
    const data = payload?.data as Record<string, unknown> | undefined;
    const uniqueId =
      (data?.message_id as string) ||
      (data?.id as string) ||
      `fallback_${Date.now()}`;

    await dbService.insertWebhookLog(uniqueId, payload);

    // Trigger background process (DO NOT await it)
    processPayloadInBackground(payload);

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    // Sent.dm doesn't need error details — acknowledge to avoid retries
    return NextResponse.json({ status: 'ignored' }, { status: 200 });
  }
}
