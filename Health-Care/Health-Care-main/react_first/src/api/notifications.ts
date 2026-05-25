import { apiCall, API_ENDPOINTS } from "@/lib/api";
import { Notification } from "@/types/api";

export const notificationsApi = {
  /**
   * Get all notifications for the current user
   */
  getNotifications: async (): Promise<Notification[]> => {
    const response = await apiCall<{ notifications: Notification[] }>(
      API_ENDPOINTS.DOCTOR_NOTIFICATIONS
    );
    return response.notifications;
  },

  /**
   * Mark a specific notification as read
   */
  markAsRead: async (id: number): Promise<void> => {
    await apiCall(`${API_ENDPOINTS.DOCTOR_NOTIFICATIONS}${id}/read/`, {
      method: 'POST'
    });
  }
};
