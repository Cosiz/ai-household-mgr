import { z } from 'zod';

export const EventSchema = z.object({
  title:       z.string(),
  description: z.string().optional(),
  start_time:  z.string(),
  end_time:    z.string().optional(),
  location:    z.string().optional(),
  category:    z.string().optional(),
});

export const AiOutputSchema = z.object({
  intent:            z.enum(['create_event', 'query']),
  events:            z.array(EventSchema),
  whatsapp_reply_text: z.string(),
});

export type AiOutput = z.infer<typeof AiOutputSchema>;
export type ParsedEvent = z.infer<typeof EventSchema>;
