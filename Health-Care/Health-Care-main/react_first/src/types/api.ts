/**
 * Shared API Types for Health-AI Platform
 */

export type RiskLevel =
  | "Very High"
  | "High"
  | "Medium"
  | "Low"
  | "very_high"
  | "veryhigh"
  | "high"
  | "medium"
  | "low"
  | "unknown";

export type DiseaseType = "diabetes" | "cardiovascular";

export type ReviewStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "needs_followup";

export type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "no_show";

export type AppointmentType =
  | "initial"
  | "follow_up"
  | "review";

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  name?: string;
  phone?: string | null;
  bio?: string | null;
  profile_picture?: string | null;
  profile?: UserProfile;
}

export interface UserProfile {
  id: number;
  role: "patient" | "doctor" | "admin";
  phone: string | null;
  bio: string | null;
  profile_picture: string | null;
  doctor_status?: "pending" | "approved" | "rejected" | "suspended" | null;
}

export interface DoctorProfileResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  phone?: string | null;
  bio?: string | null;
  profile_picture?: string | null;
  role: "doctor";
  doctor_status?: "pending" | "approved" | "rejected" | "suspended" | null;
  specialties: DiseaseType[];
  patient_count: number;
  review_count: number;
  date_joined: string;
}

export interface PredictionExtraFields {
  gender?: string;
  weight?: number | string;
  height?: number | string;

  systolic_bp?: number | string;
  systolicBloodPressure?: number | string;

  diastolic_bp?: number | string;
  diastolicBloodPressure?: number | string;

  cholesterol?: number | string;

  smoke?: boolean;
  smoking?: boolean;

  alcohol?: boolean;

  physical_activity?: boolean;
  physicalActivity?: boolean;
  active?: boolean;
}

export interface Prediction {
  id: number;

  /**
   * Some endpoints return patient_user, while doctor-specific endpoints may omit it.
   */
  patient_user?: number;

  pregnancies: number;
  glucose: number;
  blood_pressure: number;
  skin_thickness: number;
  insulin: number;
  bmi: number;
  diabetes_pedigree_function: number;
  age: number;

  probability: number;
  risk_level: RiskLevel;
  message: string;
  review_status: ReviewStatus;
  created_at: string;

  patient_name?: string;
  disease_type?: DiseaseType;
  extra_fields?: PredictionExtraFields;
}

export interface PredictionReview {
  id: number;
  prediction: number;
  doctor_user: number;
  decision: ReviewStatus;
  notes: string | null;
  created_at: string;
  medications?: MedicationRecommendation[];
}

export interface MedicationRecommendation {
  id: number;
  review: number;
  medication: number;
  medication_name?: string;
  dosage: string | null;
  frequency_per_day: number;
  timing: "before_meal" | "with_meal" | "after_meal" | "unspecified";
  duration_days: number | null;
  notes: string | null;
}

export interface Medication {
  id: number;
  name: string;
  generic_name: string | null;
}

export interface Appointment {
  id: number;
  doctor_user?: number;
  patient_user?: number;
  patient_name?: string;
  doctor_name?: string;
  appointment_date?: string;
  appointment_time?: string;
  time?: string;
  status: AppointmentStatus;
  appointment_type?: AppointmentType;
  type?: AppointmentType;
  notes?: string | null;
  prediction_id?: number | null;
  patient?: {
    id: number;
    name: string;
    profile_picture?: string | null;
  };
}

export interface ChatMessage {
  id: number;
  thread: number;
  sender_user: number;
  content: string;
  created_at: string;
  read_at: string | null;
}

export interface ChatThread {
  id: number;
  thread_id?: number;
  patient_name: string;
  patient_id: string;
  last_message: string;
  time: string;
  created_at?: string;
  unread_count: number;
  online: boolean;
  risk_level: RiskLevel;
  avatar?: string;
  patient?: {
    id: number;
    name: string;
    email?: string;
    profile_picture?: string | null;
  };
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  related_object_id?: number | null;
  related_object_type?: string | null;
  created_at: string;
}

export interface DashboardStats {
  total_patients: number;
  pending_reviews: number;
  high_risk_count: number;
  today_appointments: number;
  total_predictions: number;
  unread_notifications?: number;
  unread_messages?: number;
  specialties?: DiseaseType[];
}