import OpenAI from 'openai';
import { AiOutputSchema } from '@/lib/validations';
import type { AiOutput } from '@/lib/validations';

const FALLBACK_REPLY = "Thank you for your message. A member of the household team will respond shortly.";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey:  process.env.DASHSCOPE_API_KEY!,
      baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    });
  }
  return _client;
}

const SYSTEM_PROMPT = [
  'You are a high-end British household manager. ',
  'Analyze any incoming message and respond ONLY with valid JSON. ',
  'Schema: {intent: "create_event"|"query", events: [{title, description, start_time, end_time, location, category}], whatsapp_reply_text: string}. ',
  'If the user is asking a question or making a statement that does not require an event, set intent to "query" and return an empty events array. ',
  'The whatsapp_reply_text should be a polite, concise reply in the tone of a British butler.',
].join(' ');

export const aiService = {
  async runAnalysis(text?: string): Promise<AiOutput> {
    const client = getClient();

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: text || 'No message content provided.' },
    ];

    const completion = await client.chat.completions.create({
      model: 'qwen3.6-plus',
      messages,
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content ?? '';

    const cleaned = raw
      .replace(/^```json\\s*/i, '')
      .replace(/```\\s*$/i, '')
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      return AiOutputSchema.parse(parsed);
    } catch {
      console.error('AI output failed Zod validation:', cleaned);
      return {
        intent: 'query',
        events: [],
        whatsapp_reply_text: FALLBACK_REPLY,
      };
    }
  },
};
