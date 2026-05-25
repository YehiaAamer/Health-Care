import { apiCall, API_ENDPOINTS } from "@/lib/api";
import type { Prediction, PredictionReview, ReviewStatus } from "@/types/api";

export const reportsApi = {
  /**
   * Get all predictions (reports) for the doctor
   */
  getReports: async (params?: { risk?: string; status?: string }): Promise<Prediction[]> => {
    let url = API_ENDPOINTS.DOCTOR_REPORTS;
    const queryParams = new URLSearchParams();
    if (params?.risk) queryParams.append('risk_level', params.risk);
    if (params?.status) queryParams.append('review_status', params.status);
    
    const queryString = queryParams.toString();
    if (queryString) url += `?${queryString}`;
    
    const response = await apiCall<{ predictions: Prediction[] }>(url);
    return response?.predictions || [];
  },

  /**
   * Get a single report's details
   */
  getReportDetails: async (id: number): Promise<Prediction> => {
    return apiCall<Prediction>(`${API_ENDPOINTS.GET_PREDICTIONS}${id}/`);
  },

  /**
   * Submit a review for a prediction
   */
  submitReview: async (predictionId: number, data: {
    decision: ReviewStatus;
    notes: string;
    medications?: Array<{
      medication_id: number;
      dosage: string;
      frequency_per_day: number;
      timing: string;
      duration_days: number;
      notes?: string;
    }>;
  }): Promise<PredictionReview> => {
    return apiCall<PredictionReview>(API_ENDPOINTS.DOCTOR_REVIEW_PREDICTION(predictionId), {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
