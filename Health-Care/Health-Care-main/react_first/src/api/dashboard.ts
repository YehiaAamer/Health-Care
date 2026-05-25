import { apiCall, API_ENDPOINTS } from "@/lib/api";
import { DashboardStats, Appointment, Prediction, Notification } from "@/types/api";

export const dashboardApi = {
  /**
   * Get main statistics for the doctor dashboard
   */
  getStats: async (): Promise<DashboardStats> => {
    return apiCall<DashboardStats>(API_ENDPOINTS.DOCTOR_DASHBOARD);
  },

  /**
   * Get pending predictions that need review
   */
  getPendingPredictions: async (): Promise<Prediction[]> => {
    const response = await apiCall<{ predictions: Prediction[] }>(
      API_ENDPOINTS.DOCTOR_PENDING_PREDICTIONS
    );
    return response?.predictions || [];
  },

  /**
   * Get risk distribution data for charts
   */
  getRiskDistribution: async (): Promise<any> => {
    return apiCall(API_ENDPOINTS.DOCTOR_RISK_DISTRIBUTION);
  },

  /**
   * Get appointments for today
   */
  getTodayAppointments: async (): Promise<Appointment[]> => {
    const response = await apiCall<{ appointments: Appointment[] }>(
      API_ENDPOINTS.DOCTOR_APPOINTMENTS_TODAY
    );
    return response?.appointments || [];
  },

  /**
   * Get recent doctor activity
   */
  getRecentActivity: async (): Promise<any[]> => {
    const response = await apiCall<{ activities: any[] }>(
      API_ENDPOINTS.DOCTOR_ACTIVITY
    );
    return response?.activities || [];
  }
};
