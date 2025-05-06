import { Type, Static } from '@sinclair/typebox';
export const ChatResponseSchema = Type.Object({
  content: Type.String(),
  inputTokens: Type.Number(),
  outputTokens: Type.Number(),
  totalTokens: Type.Number(),
});

export const ChatBotxJwtResponseSchema = Type.Object({
  token: Type.String(),
});

export type ChatResponse = Static<typeof ChatResponseSchema>;
export type ChatBotxJwtResponse = Static<typeof ChatBotxJwtResponseSchema>;
