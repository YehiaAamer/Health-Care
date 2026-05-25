import { apiCall, API_ENDPOINTS } from "@/lib/api";
import type { ChatThread, ChatMessage } from "@/types/api";

export const messagesApi = {
  /**
   * Get all active conversation threads for the doctor
   */
  getThreads: async (): Promise<ChatThread[]> => {
    const response = await apiCall<{ threads: ChatThread[] }>(API_ENDPOINTS.DOCTOR_MESSAGES);
    return response?.threads || [];
  },

  /**
   * Get message history for a specific thread
   */
  getMessages: async (threadId: number): Promise<ChatMessage[]> => {
    const response = await apiCall<{ messages: ChatMessage[] }>(
      `${API_ENDPOINTS.DOCTOR_MESSAGES}${threadId}/messages/`
    );
    return response?.messages || [];
  },

  /**
   * Send a new message in a thread
   */
  sendMessage: async (threadId: number, content: string): Promise<ChatMessage> => {
    return apiCall(`${API_ENDPOINTS.DOCTOR_MESSAGES}${threadId}/send/`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }
};
