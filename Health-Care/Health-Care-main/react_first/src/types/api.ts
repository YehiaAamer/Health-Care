/**
 * Shared API Types for Health-AI Platform
 */

export type RiskLevel = 'High' | 'Medium' | 'Low';
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'needs_followup';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';
export type AppointmentType = 'initial' | 'follow_up' | 'review';

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: number;
  role: 'patient' | 'doctor' | 'admin';
  phone: string;
  bio: string;
  profile_picture: string;
}

export interface Prediction {
  id: number;
  patient_user: number;
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
  patient_name?: string; // Opt-in from serializer
}

export interface PredictionReview {
  id: number;
  prediction: number;
  doctor_user: number;
  decision: ReviewStatus;
  notes: string;
  created_at: string;
  medications?: MedicationRecommendation[];
}

export interface MedicationRecommendation {
  id: number;
  review: number;
  medication: number;
  medication_name?: string;
  dosage: string;
  frequency_per_day: number;
  timing: 'before_meal' | 'with_meal' | 'after_meal' | 'unspecified';
  duration_days: number;
  notes: string;
}

export interface Medication {
  id: number;
  name: string;
  generic_name: string;
}

export interface Appointment {
  id: number;
  doctor_user: number;
  patient_user: number;
  patient_name?: string;
  doctor_name?: string;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  appointment_type: AppointmentType;
  notes: string;
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
  patient_name: string;
  patient_id: string;
  last_message: string;
  time: string;
  unread_count: number;
  online: boolean;
  risk_level: RiskLevel;
  avatar?: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardStats {
  total_patients: number;
  pending_reviews: number;
  high_risk_count: number;
  today_appointments: number;
  total_predictions: number;
}
