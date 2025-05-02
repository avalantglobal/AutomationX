import { api } from '@/lib/api';
import { ChatRequest, ChatResponse } from '../dto/chart-req-res';
interface EnvConfig {
  CHATBOT_API_URL: string;
  CHATBOT_API_JWT_TOKEN: string;
}
// Extend the Window interface
declare global {
  interface Window {
    env: EnvConfig;
  }
}

const CHATBOT_API_URL = window['env'].CHATBOT_API_URL;
const botxToken = window['env'].CHATBOT_API_JWT_TOKEN;
export const chatApi = {
  sendMessage(request: ChatRequest): Promise<ChatResponse> {
    return api.post<ChatResponse>(CHATBOT_API_URL, request, null, {
      Authorization: `Bearer ${botxToken}`,
    });
  },
};
