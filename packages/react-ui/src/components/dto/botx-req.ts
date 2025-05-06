import { Type, Static } from '@sinclair/typebox';

export const ChatRequestSchema = Type.Object({
  message: Type.String(),
});

export const ChatBotxJwtRequestSchema = Type.Object({
  email: Type.String(),
  firstName: Type.String(),
  lastName: Type.String()
});
export type ChatRequest = Static<typeof ChatRequestSchema>;
export type ChatBotxJwtRequest = Static<typeof ChatBotxJwtRequestSchema>;
