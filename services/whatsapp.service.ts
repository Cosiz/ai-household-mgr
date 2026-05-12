import axios from 'axios';

const SENT_API_URL = 'https://api.sent.dm/v3/messages';

export const whatsappService = {
  /** Send a WhatsApp text reply to a phone number */
  async sendMessage(to: string, text: string): Promise<void> {
    await axios.post(
      SENT_API_URL,
      {
        to,
        message: {
          type: 'text',
          text,
        },
      },
      {
        headers: {
          'x-api-key': process.env.SENT_API_KEY!,
          'Content-Type': 'application/json',
        },
      }
    );
  },

  /** Extract sender phone from Sent.dm payload */
  extractPhone(payload: Record<string, unknown>): string {
    const data = payload?.data as Record<string, unknown> | undefined;
    return (data?.from as string) || (data?.sender as string) || '';
  },

  /** Extract text content from Sent.dm payload */
  extractText(payload: Record<string, unknown>): string {
    const data = payload?.data as Record<string, unknown> | undefined;
    const msg  = data?.message as Record<string, unknown> | undefined;
    return (msg?.text as string) || '';
  },
};
