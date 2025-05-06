import { api } from '@/lib/api';
import { ChatBotxJwtRequest, ChatRequest } from '../dto/botx-req';
import {
  ChatBotxJwtResponse,
  ChatResponse,
  ChatUserMessagesReqsponse,
} from '../dto/botx-res';
import { authenticationSession } from '@/lib/authentication-session';
interface EnvConfig {
  BOTX_API_URL: string;
  REACT_APP_ZERO_URL: string;
}
// Extend the Window interface
declare global {
  interface Window {
    env: EnvConfig;
  }
}

const BOTX_API_URL = window['env'].BOTX_API_URL;
const REACT_APP_ZERO_URL = window['env'].REACT_APP_ZERO_URL;
export const botxApi = {
  sendMessage(request: ChatRequest): Promise<ChatResponse> {
    return api.post<ChatResponse>(
      `${BOTX_API_URL}/v1/chat/sse`,
      request,
      null,
      {
        Authorization: `Bearer ${authenticationSession.getBotxToken()}`,
      }
    );
  },

  getLastUserChatMessages(request?: any): Promise<ChatUserMessagesReqsponse[]> {
    return api.get<ChatUserMessagesReqsponse[]>(
      `${BOTX_API_URL}/v1/chat`,
      '',
      undefined,
      {
        Authorization: `Bearer ${authenticationSession.getBotxToken()}`,
      }
    );
  },

  getSignBotxJwt(request: ChatBotxJwtRequest): Promise<ChatBotxJwtResponse> {
    return api.post<ChatBotxJwtResponse>(
      `${REACT_APP_ZERO_URL}/pmtx/sign-jwt-botx`,
      request
    );
  },
};
