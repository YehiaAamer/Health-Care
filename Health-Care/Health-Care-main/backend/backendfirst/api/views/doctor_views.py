# api/doctor_views.py - Doctor Dashboard API Views
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import timedelta

from ..models import (
    Prediction, PredictionReview, DoctorPatientAssignment,
    DoctorPatientChatMessage, DoctorPatientChatThread,
    Notification, Appointment, UserProfile, MedicationRecommendation,
)
from ..doctor_permissions import IsApprovedDoctor
from ..services.notification_service import create_notification


# ═══════════════════════════════════════════════════════════════
# Dashboard Statistics
# ═══════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def doctor_dashboard_stats(request):
    """
    GET /api/doctor/dashboard/
    Returns aggregated stats for the doctor dashboard cards.
    """
    doctor = request.user
    profile = getattr(doctor, 'profile', None)
    doctor_profile_obj = getattr(doctor, 'doctorprofile', None)
    specialties = doctor_profile_obj.get_allowed_disease_types() if doctor_profile_obj else ["diabetes"]

    # Get assigned patients
    assignments = DoctorPatientAssignment.objects.filter(
        doctor_user=doctor,
        status="active",
    ).select_related("patient_user")

    patient_ids = assignments.values_list("patient_user_id", flat=True)
    patient_count = len(patient_ids)

    # Predictions from assigned patients filtered by this doctor's specialties
    predictions = Prediction.objects.filter(
        patient_user_id__in=patient_ids,
        disease_type__in=specialties,
    )
    total_predictions = predictions.count()
    pending_reviews = predictions.filter(review_status="pending").count()

    # Today's appointments
    today = timezone.localdate()
    today_appointments = Appointment.objects.filter(
        doctor_user=doctor,
        appointment_date=today,
        status="scheduled",
    ).count()

    # Unread notifications
    unread_notifications = Notification.objects.filter(
        user=doctor,
        is_read=False,
    ).count()

    # Unread messages count
    threads = DoctorPatientChatThread.objects.filter(
        assignment__doctor_user=doctor,
        assignment__status="active",
    )
    unread_messages = DoctorPatientChatMessage.objects.filter(
        thread__in=threads,
        read_at__isnull=True,
    ).exclude(sender_user=doctor).count()

    # High risk count
    high_risk_count = predictions.filter(probability__gte=75).count()

    return Response({
        "total_patients": patient_count,
        "total_predictions": total_predictions,
        "pending_reviews": pending_reviews,
        "today_appointments": today_appointments,
        "high_risk_count": high_risk_count,
        "unread_notifications": unread_notifications,
        "unread_messages": unread_messages,
        "specialties": specialties,
    })


# ═══════════════════════════════════════════════════════════════
# Pending Predictions
# ═══════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def pending_predictions(request):
    """
    GET /api/doctor/predictions/pending/
    Returns predictions from assigned patients that need review.
    """
    doctor = request.user
    profile = getattr(doctor, 'profile', None)
    doctor_profile_obj = getattr(doctor, 'doctorprofile', None)
    specialties = doctor_profile_obj.get_allowed_disease_types() if doctor_profile_obj else ["diabetes"]

    patient_ids = DoctorPatientAssignment.objects.filter(
        doctor_user=doctor,
        status="active",
    ).values_list("patient_user_id", flat=True)

    predictions = (
        Prediction.objects
        .filter(
            patient_user_id__in=patient_ids,
            review_status="pending",
            disease_type__in=specialties,
        )
        .select_related("patient_user")
        .order_by("-created_at")[:20]
    )

    data = []
    for pred in predictions:
        patient = pred.patient_user
        profile = getattr(patient, "profile", None)
        data.append({
            "id": pred.id,
            "patient": {
                "id": patient.id,
                "name": f"{patient.first_name} {patient.last_name}".strip() or patient.username,
                "email": patient.email,
                "profile_picture": profile.profile_picture if profile else None,
            },
            "probability": pred.probability,
            "risk_level": pred.risk_level,
            "glucose": pred.glucose,
            "bmi": pred.bmi,
            "age": pred.age,
            "review_status": pred.review_status,
            "disease_type": pred.disease_type,
            "extra_fields": pred.extra_fields,
            "created_at": pred.created_at.isoformat(),
            "patient_name": f"{patient.first_name} {patient.last_name}".strip() or patient.username,
        })

    return Response({"count": len(data), "predictions": data})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def all_patient_predictions(request):
    """
    GET /api/doctor/predictions/?risk_level=...&review_status=...
    Returns all predictions from assigned patients with optional filtering.
    """
    doctor = request.user
    profile = getattr(doctor, 'profile', None)
    doctor_profile_obj = getattr(doctor, 'doctorprofile', None)
    specialties = doctor_profile_obj.get_allowed_disease_types() if doctor_profile_obj else ["diabetes"]

    risk_level = request.query_params.get("risk_level")
    review_status = request.query_params.get("review_status")
    disease_type = request.query_params.get("disease_type")

    patient_ids = DoctorPatientAssignment.objects.filter(
        doctor_user=doctor,
        status="active",
    ).values_list("patient_user_id", flat=True)

    # Start filtered by specialties; allow ?disease_type to narrow further
    active_specialties = [disease_type] if disease_type else specialties
    predictions = Prediction.objects.filter(
        patient_user_id__in=patient_ids,
        disease_type__in=active_specialties,
    ).select_related("patient_user")

    if risk_level:
        predictions = predictions.filter(risk_level__iexact=risk_level)
    if review_status:
        predictions = predictions.filter(review_status=review_status)

    predictions = predictions.order_by("-created_at")

    data = []
    for pred in predictions:
        patient = pred.patient_user
        profile = getattr(patient, "profile", None)
        data.append({
            "id": pred.id,
            "patient_name": f"{patient.first_name} {patient.last_name}".strip() or patient.username,
            "age": pred.age,
            "glucose": pred.glucose,
            "bmi": pred.bmi,
            "blood_pressure": pred.blood_pressure,
            "insulin": pred.insulin,
            "skin_thickness": pred.skin_thickness,
            "diabetes_pedigree_function": pred.diabetes_pedigree_function,
            "pregnancies": pred.pregnancies,
            "probability": pred.probability,
            "risk_level": pred.risk_level,
            "review_status": pred.review_status,
            "disease_type": pred.disease_type,
            "extra_fields": pred.extra_fields,
            "created_at": pred.created_at.isoformat(),
            "message": pred.message,
        })

    return Response({"count": len(data), "predictions": data})


# ═══════════════════════════════════════════════════════════════
# Review a Prediction
# ═══════════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def review_prediction(request, prediction_id):
    """
    POST /api/doctor/predictions/<id>/review/
    {
        "decision": "approved|rejected|needs_followup",
        "notes": "optional notes"
    }
    """
    doctor = request.user
    decision = request.data.get("decision")
    notes = request.data.get("notes", "")

    valid_decisions = ["approved", "rejected", "needs_followup"]
    if decision not in valid_decisions:
        return Response(
            {"error": f"القرار يجب أن يكون أحد: {', '.join(valid_decisions)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        prediction = Prediction.objects.select_related("patient_user").get(id=prediction_id)
    except Prediction.DoesNotExist:
        return Response({"error": "التحليل غير موجود"}, status=status.HTTP_404_NOT_FOUND)

    # Verify doctor is assigned to this patient
    is_assigned = DoctorPatientAssignment.objects.filter(
        doctor_user=doctor,
        patient_user=prediction.patient_user,
        status="active",
    ).exists()

    if not is_assigned:
        return Response(
            {"error": "ليس لديك صلاحية مراجعة هذا التحليل"},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Create or update review
    review, created = PredictionReview.objects.update_or_create(
        prediction=prediction,
        doctor_user=doctor,
        defaults={"decision": decision, "notes": notes},
    )

    # Update prediction review status
    prediction.review_status = decision
    prediction.save(update_fields=["review_status"])

    # Create notification for patient using service
    create_notification(
        user=prediction.patient_user,
        type="prediction_reviewed",
        title="تمت مراجعة تحليلك",
        body=f"قام الطبيب بمراجعة تحليلك رقم #{prediction.id}.",
        related_object_id=prediction.id,
        related_object_type="prediction",
    )

    return Response({
        "message": "تمت المراجعة بنجاح",
        "review_id": review.id,
        "prediction_id": prediction.id,
        "decision": decision,
    })


# ═══════════════════════════════════════════════════════════════
# Risk Distribution
# ═══════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def risk_distribution(request):
    """
    GET /api/doctor/risk-distribution/?disease_type=diabetes
    Returns aggregated risk level counts for the donut chart.
    """
    doctor = request.user
    doctor_profile_obj = getattr(doctor, 'doctorprofile', None)
    specialties = doctor_profile_obj.get_allowed_disease_types() if doctor_profile_obj else ["diabetes"]

    raw_disease_type = request.query_params.get("disease_type")
    # If no param is provided, default to the doctor's primary specialty if available, or 'diabetes'
    if not raw_disease_type:
        disease_type = specialties[0] if specialties else Prediction.DISEASE_DIABETES
    else:
        disease_type = raw_disease_type

    patient_ids = DoctorPatientAssignment.objects.filter(
        doctor_user=doctor,
        status="active",
    ).values_list("patient_user_id", flat=True)

    # Clean double filtering: Must belong to doctor's assigned patients AND allowed specialties
    predictions = Prediction.objects.filter(
        patient_user_id__in=patient_ids,
        disease_type=disease_type,
        disease_type__in=specialties,
    )

    # Categorize by probability thresholds
    low = predictions.filter(probability__lt=25).count()
    medium = predictions.filter(probability__gte=25, probability__lt=50).count()
    high = predictions.filter(probability__gte=50, probability__lt=75).count()
    very_high = predictions.filter(probability__gte=75).count()

    return Response({
        "distribution": [
            {"level": "Low", "level_en": "Low", "count": low, "color": "#22c55e"},
            {"level": "Medium", "level_en": "Medium", "count": medium, "color": "#eab308"},
            {"level": "High", "level_en": "High", "count": high, "color": "#f97316"},
            {"level": "Very High", "level_en": "Very High", "count": very_high, "color": "#ef4444"},
        ],
        "total": low + medium + high + very_high,
    })


# ═══════════════════════════════════════════════════════════════
# Patient List
# ═══════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def doctor_patients(request):
    """
    GET /api/doctor/patients/?search=...
    Returns list of assigned patients with latest prediction info.
    """
    doctor = request.user
    search = request.query_params.get("search", "").strip()

    assignments = (
        DoctorPatientAssignment.objects
        .filter(doctor_user=doctor, status="active")
        .select_related("patient_user", "patient_user__profile")
    )

    if search:
        assignments = assignments.filter(
            Q(patient_user__first_name__icontains=search)
            | Q(patient_user__last_name__icontains=search)
            | Q(patient_user__email__icontains=search)
        )

    data = []
    for assignment in assignments[:50]:
        patient = assignment.patient_user
        profile = getattr(patient, "profile", None)
        latest = (
            Prediction.objects
            .filter(patient_user=patient)
            .order_by("-created_at")
            .first()
        )
        data.append({
            "id": patient.id,
            "name": f"{patient.first_name} {patient.last_name}".strip() or patient.username,
            "email": patient.email,
            "phone": profile.phone if profile else None,
            "profile_picture": profile.profile_picture if profile else None,
            "assignment_status": assignment.status,
            "assigned_at": assignment.created_at.isoformat(),
            "latest_prediction": {
                "id": latest.id,
                "probability": latest.probability,
                "risk_level": latest.risk_level,
                "review_status": latest.review_status,
                "created_at": latest.created_at.isoformat(),
            } if latest else None,
        })

    return Response({"count": len(data), "patients": data})


# ═══════════════════════════════════════════════════════════════
# Today's Appointments
# ═══════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def today_appointments(request):
    """
    GET /api/doctor/appointments/today/
    Returns today's appointments for the doctor.
    """
    doctor = request.user
    today = timezone.localdate()

    appointments = (
        Appointment.objects
        .filter(doctor_user=doctor, appointment_date=today)
        .select_related("patient_user", "patient_user__profile", "prediction")
        .order_by("appointment_time")
    )

    data = []
    for appt in appointments:
        patient = appt.patient_user
        profile = getattr(patient, "profile", None)
        data.append({
            "id": appt.id,
            "patient": {
                "id": patient.id,
                "name": f"{patient.first_name} {patient.last_name}".strip() or patient.username,
                "profile_picture": profile.profile_picture if profile else None,
            },
            "time": appt.appointment_time.strftime("%H:%M"),
            "status": appt.status,
            "type": appt.appointment_type,
            "prediction_id": appt.prediction_id,
            "notes": appt.notes,
            "patient_name": f"{patient.first_name} {patient.last_name}".strip() or patient.username,
        })

    return Response({"count": len(data), "appointments": data})


# ═══════════════════════════════════════════════════════════════
# Recent Messages
# ═══════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def recent_messages(request):
    """
    GET /api/doctor/messages/recent/
    Returns latest messages from assigned patients.
    """
    doctor = request.user

    threads = DoctorPatientChatThread.objects.filter(
        assignment__doctor_user=doctor,
        assignment__status="active",
    ).select_related(
        "assignment__patient_user",
        "assignment__patient_user__profile",
    )

    data = []
    for thread in threads:
        last_msg = (
            DoctorPatientChatMessage.objects
            .filter(thread=thread)
            .order_by("-created_at")
            .first()
        )
        if last_msg:
            patient = thread.assignment.patient_user
            profile = getattr(patient, "profile", None)
            data.append({
                "thread_id": thread.id,
                "patient": {
                    "id": patient.id,
                    "name": f"{patient.first_name} {patient.last_name}".strip() or patient.username,
                    "profile_picture": profile.profile_picture if profile else None,
                },
                "last_message": last_msg.content[:100],
                "sender": "patient" if last_msg.sender_user_id == patient.id else "doctor",
                "is_read": last_msg.read_at is not None,
                "created_at": last_msg.created_at.isoformat(),
            })

    # Sort by most recent message first
    data.sort(key=lambda x: x["created_at"], reverse=True)
    return Response({"count": len(data[:10]), "messages": data[:10]})


# ═══════════════════════════════════════════════════════════════
# Recent Activity
# ═══════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def recent_activity(request):
    """
    GET /api/doctor/activity/
    Returns a combined feed of recent events.
    """
    doctor = request.user
    profile = getattr(doctor, 'profile', None)
    doctor_profile_obj = getattr(doctor, 'doctorprofile', None)
    specialties = doctor_profile_obj.get_allowed_disease_types() if doctor_profile_obj else ["diabetes"]

    patient_ids = DoctorPatientAssignment.objects.filter(
        doctor_user=doctor,
        status="active",
    ).values_list("patient_user_id", flat=True)

    activities = []

    # Recent predictions from patients filtered by doctor specialties
    recent_predictions = (
        Prediction.objects
        .filter(
            patient_user_id__in=patient_ids,
            disease_type__in=specialties,
        )
        .select_related("patient_user")
        .order_by("-created_at")[:5]
    )
    for pred in recent_predictions:
        patient_name = f"{pred.patient_user.first_name} {pred.patient_user.last_name}".strip()
        activities.append({
            "type": "prediction",
            "icon": "activity",
            "title": "تحليل جديد",
            "description": f"تحليل جديد من {patient_name or pred.patient_user.email}",
            "related_id": pred.id,
            "created_at": pred.created_at.isoformat(),
        })

    # Recent reviews by this doctor
    recent_reviews = (
        PredictionReview.objects
        .filter(doctor_user=doctor)
        .select_related("prediction", "prediction__patient_user")
        .order_by("-created_at")[:5]
    )
    for review in recent_reviews:
        activities.append({
            "type": "review",
            "icon": "check",
            "title": "مراجعة تحليل",
            "description": f"تمت مراجعة تحليل #{review.prediction_id}",
            "related_id": review.prediction_id,
            "created_at": review.created_at.isoformat(),
        })

    # Recent appointments
    recent_appts = (
        Appointment.objects
        .filter(doctor_user=doctor)
        .select_related("patient_user")
        .order_by("-created_at")[:5]
    )
    for appt in recent_appts:
        patient_name = f"{appt.patient_user.first_name} {appt.patient_user.last_name}".strip()
        activities.append({
            "type": "appointment",
            "icon": "calendar",
            "title": "موعد جديد",
            "description": f"موعد مع {patient_name or appt.patient_user.email}",
            "related_id": appt.id,
            "created_at": appt.created_at.isoformat(),
        })

    # Recent messages from patients
    recent_msgs = (
        DoctorPatientChatMessage.objects
        .filter(thread__assignment__doctor_user=doctor)
        .exclude(sender_user=doctor)
        .select_related("sender_user")
        .order_by("-created_at")[:5]
    )
    for msg in recent_msgs:
        patient_name = f"{msg.sender_user.first_name} {msg.sender_user.last_name}".strip()
        activities.append({
            "type": "message",
            "icon": "message-square",
            "title": "رسالة جديدة",
            "description": f"رسالة من {patient_name or msg.sender_user.email}",
            "related_id": msg.thread_id,
            "created_at": msg.created_at.isoformat(),
        })

    # Recent medication recommendations
    recent_meds = (
        MedicationRecommendation.objects
        .filter(review__doctor_user=doctor)
        .select_related("medication", "review__prediction__patient_user")
        .order_by("-review__created_at")[:5]
    )
    for med_rec in recent_meds:
        patient_name = f"{med_rec.review.prediction.patient_user.first_name} {med_rec.review.prediction.patient_user.last_name}".strip()
        activities.append({
            "type": "review",
            "icon": "pill",
            "title": "توصية دواء",
            "description": f"تم وصف {med_rec.medication.name} للمريض {patient_name}",
            "related_id": med_rec.review.prediction_id,
            "created_at": med_rec.review.created_at.isoformat(),
        })

    # Sort all activities by date
    activities.sort(key=lambda x: x["created_at"], reverse=True)
    return Response({"count": len(activities[:15]), "activities": activities[:15]})


# ═══════════════════════════════════════════════════════════════
# Doctor Profile
# ═══════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def doctor_profile(request):
    """
    GET /api/doctor/profile/
    Returns the doctor's own profile info.
    """
    doctor = request.user
    profile = getattr(doctor, "profile", None)
    doctor_profile_obj = getattr(doctor, "doctorprofile", None)

    patient_count = DoctorPatientAssignment.objects.filter(
        doctor_user=doctor, status="active"
    ).count()

    review_count = PredictionReview.objects.filter(doctor_user=doctor).count()

    return Response({
        "id": doctor.id,
        "email": doctor.email,
        "first_name": doctor.first_name,
        "last_name": doctor.last_name,
        "username": doctor.username,
        "phone": profile.phone if profile else None,
        "bio": profile.bio if profile else None,
        "profile_picture": profile.profile_picture if profile else None,
        "role": profile.role if profile else "doctor",
        "doctor_status": profile.doctor_status if profile else None,
        "specialties": doctor_profile_obj.get_allowed_disease_types() if doctor_profile_obj else ["diabetes"],
        "patient_count": patient_count,
        "review_count": review_count,
        "date_joined": doctor.date_joined.isoformat(),
    })


# ═══════════════════════════════════════════════════════════════
# Doctor Notifications
# ═══════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def doctor_notifications(request):
    """
    GET /api/doctor/notifications/
    Returns notifications for the doctor.
    """
    notifications = (
        Notification.objects
        .filter(user=request.user)
        .order_by("-created_at")[:20]
    )

    data = [{
        "id": n.id,
        "type": n.type,
        "title": n.title,
        "body": n.body,
        "is_read": n.is_read,
        "related_object_id": n.related_object_id,
        "related_object_type": n.related_object_type,
        "created_at": n.created_at.isoformat(),
    } for n in notifications]

    return Response({"count": len(data), "notifications": data})


# ═══════════════════════════════════════════════════════════════
# Chat Views
# ═══════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def thread_messages(request, thread_id):
    """
    GET /api/doctor/messages/recent/<thread_id>/messages/
    Returns list of messages for a thread.
    """
    try:
        thread = DoctorPatientChatThread.objects.get(id=thread_id)
    except DoctorPatientChatThread.DoesNotExist:
        return Response({"error": "المحادثة غير موجودة"}, status=status.HTTP_404_NOT_FOUND)

    # Verify authorization (request user must be either doctor or patient in the thread)
    assignment = thread.assignment
    if request.user != assignment.doctor_user and request.user != assignment.patient_user:
        return Response({"error": "غير مصرح لك بمشاهدة هذه المحادثة"}, status=status.HTTP_403_FORBIDDEN)

    messages = thread.messages.all().order_by("created_at")
    data = [{
        "id": m.id,
        "content": m.content,
        "sender": "patient" if m.sender_user == assignment.patient_user else "doctor",
        "created_at": m.created_at.isoformat()
    } for m in messages]

    return Response({"messages": data})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request, thread_id):
    """
    POST /api/doctor/messages/recent/<thread_id>/send/
    Sends a new message in the chat thread and triggers a notification.
    """
    try:
        thread = DoctorPatientChatThread.objects.get(id=thread_id)
    except DoctorPatientChatThread.DoesNotExist:
        return Response({"error": "المحادثة غير موجودة"}, status=status.HTTP_404_NOT_FOUND)

    assignment = thread.assignment
    if request.user != assignment.doctor_user and request.user != assignment.patient_user:
        return Response({"error": "غير مصرح لك بالإرسال في هذه المحادثة"}, status=status.HTTP_403_FORBIDDEN)

    content = request.data.get("content", "").strip()
    if not content:
        return Response({"error": "لا يمكن إرسال رسالة فارغة"}, status=status.HTTP_400_BAD_REQUEST)

    # Save message
    msg = DoctorPatientChatMessage.objects.create(
        thread=thread,
        sender_user=request.user,
        content=content
    )

    # Determine recipient and sender names
    sender_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
    if request.user == assignment.patient_user:
        # Sender is patient, recipient is doctor
        recipient = assignment.doctor_user
        # Trigger Doctor Notification: new_message
        create_notification(
            user=recipient,
            type="new_message",
            title="رسالة جديدة من مريض",
            body=f"قام المريض {sender_name} بإرسال رسالة جديدة.",
            related_object_id=thread.id,
            related_object_type="chat_thread"
        )
        sender_type = "patient"
    else:
        # Sender is doctor, recipient is patient
        recipient = assignment.patient_user
        # Trigger Patient Notification: new_message
        create_notification(
            user=recipient,
            type="new_message",
            title="رسالة جديدة من الطبيب",
            body=f"تلقيت رسالة جديدة من الدكتور {sender_name}.",
            related_object_id=thread.id,
            related_object_type="chat_thread"
        )
        sender_type = "doctor"

    return Response({
        "id": msg.id,
        "content": msg.content,
        "sender": sender_type,
        "created_at": msg.created_at.isoformat()
    })

