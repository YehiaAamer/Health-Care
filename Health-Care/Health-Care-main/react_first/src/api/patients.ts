import { apiCall, API_ENDPOINTS } from "@/lib/api";
import type { User, Prediction } from "@/types/api";

type CreatePatientPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
};

type PatientProfileResponse = User & {
  predictions: Prediction[];
};

export const patientsApi = {
  getPatients: async (): Promise<User[]> => {
    const response = await apiCall<{ patients: User[] }>(
      API_ENDPOINTS.DOCTOR_PATIENTS
    );

    return response?.patients || [];
  },

  getPatientProfile: async (
    id: number
  ): Promise<PatientProfileResponse> => {
    return apiCall<PatientProfileResponse>(
      `${API_ENDPOINTS.DOCTOR_PATIENTS}${id}/profile/`
    );
  },

  createPatient: async (payload: CreatePatientPayload): Promise<User> => {
    return apiCall<User>(API_ENDPOINTS.DOCTOR_PATIENTS, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};