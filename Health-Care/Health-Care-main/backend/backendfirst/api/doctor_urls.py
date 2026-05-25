# api/doctor_urls.py - Doctor Dashboard URL routing
from django.urls import path
from .views.doctor_views import (
    doctor_dashboard_stats,
    pending_predictions,
    review_prediction,
    risk_distribution,
    doctor_patients,
    today_appointments,
    recent_messages,
    recent_activity,
    doctor_profile,
    doctor_notifications,
    all_patient_predictions,
)

urlpatterns = [
    # Dashboard
    path('dashboard/', doctor_dashboard_stats, name='doctor_dashboard_stats'),
    path('profile/', doctor_profile, name='doctor_profile'),
    path('notifications/', doctor_notifications, name='doctor_notifications'),

    # Predictions
    path('predictions/', all_patient_predictions, name='all_patient_predictions'),
    path('predictions/pending/', pending_predictions, name='pending_predictions'),
    path('predictions/<int:prediction_id>/review/', review_prediction, name='review_prediction'),

    # Charts
    path('risk-distribution/', risk_distribution, name='risk_distribution'),

    # Patients
    path('patients/', doctor_patients, name='doctor_patients'),

    # Appointments
    path('appointments/today/', today_appointments, name='today_appointments'),

    # Messages
    path('messages/recent/', recent_messages, name='recent_messages'),

    # Activity
    path('activity/', recent_activity, name='recent_activity'),
]
