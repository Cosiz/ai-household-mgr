import OpenAI from "openai";
import { AiOutputSchema } from "@/lib/validations";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
      apiKey: process.env.DASHSCOPE_API_KEY ?? "",
    });
  }
  return _client;
}

const SYSTEM_PROMPT = `You are a high-end British household manager. Analyse text/images and output strictly valid JSON conforming to the schema.

Output MUST be valid JSON with exactly these fields:
- intent: "create_event" | "query"
- events: array of objects with event_type, title, description, timestamp, location, metadata
- whatsapp_reply_text: string — a polite British response to send back via WhatsApp

Be precise, courteous, and efficient.`;

export interface AiInput {
  text?: string | null;
  imageBase64?: string | null;
}

export async function runAiAnalysis(input: AiInput): Promise<{
  intent: "create_event" | "query";
  events: Array<{
    event_type: string;
    title: string;
    description?: string;
    timestamp?: string;
    location?: string;
    metadata?: Record<string, unknown>;
  }>;
  whatsapp_reply_text: string;
}> {
  const client = getClient();

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  if (input.text) {
    messages.push({ role: "user", content: input.text });
  }

  if (input.imageBase64) {
    messages.push({
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${input.imageBase64}` },
        },
      ],
    });
  }

  const completion = await client.chat.completions.create({
    model: "qwen-plus",
    messages,
    temperature: 0.3,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  // Strip markdown fences if present
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    const validated = AiOutputSchema.parse(parsed);
    return validated;
  } catch (err) {
    console.error("[AI] Zod validation failed:", err);
    return {
      intent: "query",
      events: [],
      whatsapp_reply_text:
        "I apologise, but I had a spot of trouble understanding that. Could you kindly rephrase?",
    };
  }
}
