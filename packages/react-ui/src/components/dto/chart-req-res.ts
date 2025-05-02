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

export type ChatRequest = Static<typeof ChatRequestSchema>;
export type ChatResponse = Static<typeof ChatResponseSchema>;
