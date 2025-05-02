import { api } from '@/lib/api';
import { ChatBotxJwtRequest, ChatBotxJwtResponse, ChatRequest, ChatResponse } from '../dto/chart-req-res';
interface EnvConfig {
  CHATBOT_API_URL: string;
  CHATBOT_API_JWT_TOKEN: string;
  REACT_APP_ZERO_URL: string;
}
// Extend the Window interface
declare global {
  interface Window {
    env: EnvConfig;
  }
}

const CHATBOT_API_URL = window['env'].CHATBOT_API_URL;
const botxToken = window['env'].CHATBOT_API_JWT_TOKEN;
const REACT_APP_ZERO_URL = window['env'].REACT_APP_ZERO_URL;
export const chatApi = {
  sendMessage(request: ChatRequest): Promise<ChatResponse> {
    return api.post<ChatResponse>(CHATBOT_API_URL, request, null, {
      Authorization: `Bearer ${botxToken}`,
    });
  },
  getSignBotxJwt(request: ChatBotxJwtRequest): Promise<ChatBotxJwtResponse> {
    return api.post<ChatBotxJwtResponse>(`${REACT_APP_ZERO_URL}/pmtx/sign-jwt-botx`, request);
  }
};
