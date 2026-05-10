import { z } from "zod";

export const EventSchema = z.object({
  event_type: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  timestamp: z.string().optional(),
  location: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const AiOutputSchema = z.object({
  intent: z.enum(["create_event", "query"]),
  events: z.array(EventSchema),
  whatsapp_reply_text: z.string(),
});

export type AiOutput = z.infer<typeof AiOutputSchema>;
