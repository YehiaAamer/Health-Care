import { apiCall, API_ENDPOINTS } from "@/lib/api";
import type { ChatThread, ChatMessage } from "@/types/api";

type ThreadsResponse = {
  count: number;
  threads?: ChatThread[];
  messages?: ChatThread[];
};

type MessagesResponse = {
  count: number;
  messages: ChatMessage[];
};

type SendMessageResponse = {
  message: ChatMessage;
};

export const messagesApi = {
  /**
   * Get all active conversation threads for the doctor.
   *
   * Backend:
   * GET /api/doctor/messages/recent/
   */
  getThreads: async (): Promise<ChatThread[]> => {
    const response = await apiCall<ThreadsResponse>(
      API_ENDPOINTS.DOCTOR_MESSAGES_RECENT
    );

    return Array.isArray(response?.threads)
      ? response.threads
      : Array.isArray(response?.messages)
      ? response.messages
      : [];
  },

  /**
   * Get full message history for a specific thread.
   *
   * Backend:
   * GET /api/doctor/messages/<thread_id>/messages/
   */
  getMessages: async (threadId: number): Promise<ChatMessage[]> => {
    const response = await apiCall<MessagesResponse>(
      `${API_ENDPOINTS.DOCTOR_MESSAGES}${threadId}/messages/`
    );

    return Array.isArray(response?.messages) ? response.messages : [];
  },

  /**
   * Send a new message in a thread.
   *
   * Backend:
   * POST /api/doctor/messages/<thread_id>/send/
   */
  sendMessage: async (
    threadId: number,
    content: string
  ): Promise<ChatMessage> => {
    const response = await apiCall<SendMessageResponse>(
      `${API_ENDPOINTS.DOCTOR_MESSAGES}${threadId}/send/`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      }
    );

    return response.message;
  },
};