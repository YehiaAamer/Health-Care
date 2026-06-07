import { apiCall, API_ENDPOINTS } from "@/lib/api";
import { Notification } from "@/types/api";

export const notificationsApi = {
  /**
   * Get all notifications for the current user based on their role
   */
  getNotifications: async (role?: string): Promise<Notification[]> => {
    const endpoint = role === "doctor"
      ? API_ENDPOINTS.DOCTOR_NOTIFICATIONS
      : "/api/patient/notifications/";
    const response = await apiCall<{ notifications: Notification[] }>(endpoint);
    return response.notifications;
  },

  /**
   * Mark a specific notification as read
   */
  markAsRead: async (id: number): Promise<void> => {
    await apiCall(`/api/notifications/${id}/read/`, {
      method: 'POST'
    });
  }
};
