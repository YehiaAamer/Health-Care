import { apiCall, API_ENDPOINTS } from "@/lib/api";
import type { User, Prediction } from "@/types/api";

export const patientsApi = {
  /**
   * Get list of patients assigned to the doctor
   */
  getPatients: async (): Promise<User[]> => {
    const response = await apiCall<{ patients: User[] }>(API_ENDPOINTS.DOCTOR_PATIENTS);
    return response?.patients || [];
  },

  /**
   * Get full medical history/profile of a patient
   */
  getPatientProfile: async (id: number): Promise<User & { predictions: Prediction[] }> => {
    return apiCall(`${API_ENDPOINTS.DOCTOR_PATIENTS}${id}/`);
  }
};
