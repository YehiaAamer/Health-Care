# api/doctor_urls.py - Doctor Dashboard URL routing

from django.urls import path

from .views.doctor_views import (
    doctor_dashboard_stats,
    pending_predictions,
    review_prediction,
    risk_distribution,
    doctor_patients,
    doctor_patient_profile,
    today_appointments,
    recent_messages,
    thread_messages,
    send_thread_message,
    recent_activity,
    doctor_profile,
    doctor_notifications,
    all_patient_predictions,
    create_patient,
    create_appointment,
)

urlpatterns = [
    # ────────────────────────────────────────────────
    # Dashboard
    # ────────────────────────────────────────────────
    path("dashboard/", doctor_dashboard_stats, name="doctor_dashboard_stats"),
    path("profile/", doctor_profile, name="doctor_profile"),
    path("notifications/", doctor_notifications, name="doctor_notifications"),

    # ────────────────────────────────────────────────
    # Predictions
    # ────────────────────────────────────────────────
    path("predictions/", all_patient_predictions, name="all_patient_predictions"),
    path("predictions/pending/", pending_predictions, name="pending_predictions"),
    path(
        "predictions/<int:prediction_id>/review/",
        review_prediction,
        name="review_prediction",
    ),

    # ────────────────────────────────────────────────
    # Charts
    # ────────────────────────────────────────────────
    path("risk-distribution/", risk_distribution, name="risk_distribution"),

    # ────────────────────────────────────────────────
    # Patients
    # ────────────────────────────────────────────────
    path("patients/", doctor_patients, name="doctor_patients"),
    path("patients/create/", create_patient, name="create_patient"),
    path(
        "patients/<int:patient_id>/profile/",
        doctor_patient_profile,
        name="doctor_patient_profile",
    ),

    # ────────────────────────────────────────────────
    # Appointments
    # ────────────────────────────────────────────────
    path("appointments/today/", today_appointments, name="today_appointments"),
    path("appointments/create/", create_appointment, name="create_appointment"),

    # ────────────────────────────────────────────────
    # Messages
    # ────────────────────────────────────────────────
    path("messages/recent/", recent_messages, name="recent_messages"),
    
    # دمج الطريقتين (القديمة + الجديدة)
    path(
        "messages/<int:thread_id>/messages/",
        thread_messages,
        name="thread_messages",
    ),
    path(
        "messages/<int:thread_id>/send/",
        send_thread_message,
        name="send_thread_message",
    ),
    # تعديلك الإضافي


    # ────────────────────────────────────────────────
    # Activity
    # ────────────────────────────────────────────────
    path("activity/", recent_activity, name="recent_activity"),
]