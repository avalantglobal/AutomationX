import { Type, Static } from '@sinclair/typebox';

export const ChatRequestSchema = Type.Object({
  message: Type.String(),
});

export const ChatResponseSchema = Type.Object({
  content: Type.String(),
  inputTokens: Type.Number(),
  outputTokens: Type.Number(),
  totalTokens: Type.Number(),
});
export const ChatBotxJwtRequestSchema = Type.Object({
  email: Type.String(),
  firstName: Type.String(),
  lastName: Type.String(),
  userId: Type.String(),
});
export const ChatBotxJwtResponseSchema = Type.Object({
  token: Type.String()
});
export type ChatRequest = Static<typeof ChatRequestSchema>;
export type ChatResponse = Static<typeof ChatResponseSchema>;
export type ChatBotxJwtRequest = Static<typeof ChatBotxJwtRequestSchema>;
export type ChatBotxJwtResponse = Static<typeof ChatBotxJwtResponseSchema>;
