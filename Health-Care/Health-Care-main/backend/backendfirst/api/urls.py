# api/urls.py
from django.urls import path, include
from .views.patient_views import (
    predict_diabetes,
    get_past_predictions,
    get_all_predictions,
    ollama_health,
    feature_importance,
    chatbot_predict,
    get_conversation_history,
)
from .views.auth_views import register, login, logout, get_current_user, update_profile, delete_profile_picture, password_reset_request, password_reset_confirm
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # ────────────────────────────────────────────────
    # Authentication Endpoints
    # ────────────────────────────────────────────────
    path('auth/register/', register, name='register'),
    path('auth/login/', login, name='login'),
    path('auth/logout/', logout, name='logout'),
    path('auth/me/', get_current_user, name='get_current_user'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/password-reset/', password_reset_request, name='password_reset_request'),
    path('auth/password-reset/confirm/', password_reset_confirm, name='password_reset_confirm'),
    path('profile/', update_profile, name='update_profile'),
    path('profile/picture/', delete_profile_picture, name='delete_profile_picture'),

    # ────────────────────────────────────────────────
    # Prediction Endpoints (XGBoost Only)
    # ────────────────────────────────────────────────
    path('predict/', predict_diabetes, name='predict_diabetes'),
    path('predictions/', get_past_predictions, name='get_past_predictions'),
    path('history/', get_all_predictions, name='get_all_predictions'),
    path('feature-importance/', feature_importance, name='feature_importance'),

    # ────────────────────────────────────────────────
    # Chatbot Endpoints (Medgamma-based)
    # ────────────────────────────────────────────────
    path('chatbot/', chatbot_predict, name='chatbot_predict'),
    path('chatbot/history/<int:conversation_id>/', get_conversation_history, name='get_conversation_history'),

    # ────────────────────────────────────────────────
    # Health Check Endpoints
    # ────────────────────────────────────────────────
    path('ollama/health/', ollama_health, name='ollama_health'),

    # ────────────────────────────────────────────────
    # Doctor Dashboard Endpoints
    # ────────────────────────────────────────────────
    path('doctor/', include('api.doctor_urls')),
]