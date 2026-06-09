# api/doctor_views.py - Doctor Dashboard API Views

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone

from ..models import (
    Prediction,
    PredictionReview,
    DoctorPatientAssignment,
    DoctorPatientChatMessage,
    DoctorPatientChatThread,
    Notification,
    Appointment,
    MedicationRecommendation,
)
from ..doctor_permissions import IsApprovedDoctor
from ..services.notification_service import create_notification


# ═══════════════════════════════════════════════════════════════
# Dashboard Statistics
# ═══════════════════════════════════════════════════════════════

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def doctor_dashboard_stats(request):
    """
    GET /api/doctor/dashboard/
    Returns aggregated stats for the doctor dashboard cards.
    """
    doctor = request.user
    doctor_profile_obj = getattr(doctor, "doctorprofile", None)
    specialties = (
        doctor_profile_obj.get_allowed_disease_types()
        if doctor_profile_obj
        else ["diabetes"]
    )

    assignments = DoctorPatientAssignment.objects.filter(
        doctor_user=doctor,
        status="active",
    ).select_related("patient_user")

    patient_ids = assignments.values_list("patient_user_id", flat=True)
    patient_count = len(patient_ids)

    predictions = Prediction.objects.filter(
        patient_user_id__in=patient_ids,
        disease_type__in=specialties,
    )

    total_predictions = predictions.count()
    pending_reviews = predictions.filter(review_status="pending").count()

    today = timezone.localdate()
    today_appointments = Appointment.objects.filter(
        doctor_user=doctor,
        appointment_date=today,
        status="scheduled",
    ).count()

    unread_notifications = Notification.objects.filter(
        user=doctor,
        is_read=False,
    ).count()

    threads = DoctorPatientChatThread.objects.filter(
        assignment__doctor_user=doctor,
        assignment__status="active",
    )

    unread_messages = (
        DoctorPatientChatMessage.objects
        .filter(thread__in=threads, read_at__isnull=True)
        .exclude(sender_user=doctor)
        .count()
    )

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

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def pending_predictions(request):
    """
    GET /api/doctor/predictions/pending/
    Returns predictions from assigned patients that need review.
    """
    doctor = request.user
    doctor_profile_obj = getattr(doctor, "doctorprofile", None)
    specialties = (
        doctor_profile_obj.get_allowed_disease_types()
        if doctor_profile_obj
        else ["diabetes"]
    )

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
        .select_related("patient_user", "patient_user__profile")
        .order_by("-created_at")[:20]
    )

    data = []

    for pred in predictions:
        patient = pred.patient_user
        profile = getattr(patient, "profile", None)
        patient_name = (
            f"{patient.first_name} {patient.last_name}".strip()
            or patient.username
            or patient.email
        )

        data.append({
            "id": pred.id,
            "patient": {
                "id": patient.id,
                "name": patient_name,
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
            "patient_name": patient_name,
        })

    return Response({"count": len(data), "predictions": data})


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def all_patient_predictions(request):
    """
    GET /api/doctor/predictions/?risk_level=...&review_status=...
    Returns all predictions from assigned patients with optional filtering.
    """
    doctor = request.user
    doctor_profile_obj = getattr(doctor, "doctorprofile", None)
    specialties = (
        doctor_profile_obj.get_allowed_disease_types()
        if doctor_profile_obj
        else ["diabetes"]
    )

    risk_level = request.query_params.get("risk_level")
    review_status = request.query_params.get("review_status")
    disease_type = request.query_params.get("disease_type")

    patient_ids = DoctorPatientAssignment.objects.filter(
        doctor_user=doctor,
        status="active",
    ).values_list("patient_user_id", flat=True)

    active_specialties = [disease_type] if disease_type else specialties

    predictions = (
        Prediction.objects
        .filter(
            patient_user_id__in=patient_ids,
            disease_type__in=active_specialties,
        )
        .select_related("patient_user")
    )

    if risk_level:
        predictions = predictions.filter(risk_level__iexact=risk_level)

    if review_status:
        predictions = predictions.filter(review_status=review_status)

    predictions = predictions.order_by("-created_at")

    data = []

    for pred in predictions:
        patient = pred.patient_user
        patient_name = (
            f"{patient.first_name} {patient.last_name}".strip()
            or patient.username
            or patient.email
        )

        data.append({
            "id": pred.id,
            "patient_name": patient_name,
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

@api_view(["POST"])
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
        prediction = Prediction.objects.select_related("patient_user").get(
            id=prediction_id
        )
    except Prediction.DoesNotExist:
        return Response(
            {"error": "التحليل غير موجود"},
            status=status.HTTP_404_NOT_FOUND,
        )

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

    review, created = PredictionReview.objects.update_or_create(
        prediction=prediction,
        doctor_user=doctor,
        defaults={"decision": decision, "notes": notes},
    )

    prediction.review_status = decision
    prediction.save(update_fields=["review_status"])

    # Create notification for patient
    Notification.objects.create(
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

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def risk_distribution(request):
    """
    GET /api/doctor/risk-distribution/?disease_type=diabetes
    Returns aggregated risk level counts for the donut chart.
    """
    doctor = request.user
    doctor_profile_obj = getattr(doctor, "doctorprofile", None)
    specialties = (
        doctor_profile_obj.get_allowed_disease_types()
        if doctor_profile_obj
        else ["diabetes"]
    )

    raw_disease_type = request.query_params.get("disease_type")

    if not raw_disease_type:
        disease_type = specialties[0] if specialties else Prediction.DISEASE_DIABETES
    else:
        disease_type = raw_disease_type

    patient_ids = DoctorPatientAssignment.objects.filter(
        doctor_user=doctor,
        status="active",
    ).values_list("patient_user_id", flat=True)

    predictions = Prediction.objects.filter(
        patient_user_id__in=patient_ids,
        disease_type=disease_type,
        disease_type__in=specialties,
    )

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

@api_view(["GET"])
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

        patient_name = (
            f"{patient.first_name} {patient.last_name}".strip()
            or patient.username
            or patient.email
        )

        data.append({
            "id": patient.id,
            "name": patient_name,
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
                "disease_type": latest.disease_type,
                "created_at": latest.created_at.isoformat(),
            } if latest else None,
        })

    return Response({"count": len(data), "patients": data})


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def doctor_patient_profile(request, patient_id):
    """
    GET /api/doctor/patients/<patient_id>/profile/
    Returns patient profile with latest predictions.
    """
    doctor = request.user

    assignment_exists = DoctorPatientAssignment.objects.filter(
        doctor_user=doctor,
        patient_user_id=patient_id,
        status="active",
    ).exists()

    if not assignment_exists:
        return Response(
            {"error": "ليس لديك صلاحية الوصول إلى بيانات هذا المريض"},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        patient = User.objects.select_related("profile").get(id=patient_id)
    except User.DoesNotExist:
        return Response(
            {"error": "المريض غير موجود"},
            status=status.HTTP_404_NOT_FOUND,
        )

    profile = getattr(patient, "profile", None)

    predictions_qs = (
        Prediction.objects
        .filter(patient_user=patient)
        .order_by("-created_at")[:10]
    )

    predictions = []

    for pred in predictions_qs:
        predictions.append({
            "id": pred.id,
            "probability": pred.probability,
            "risk_level": pred.risk_level,
            "glucose": pred.glucose,
            "bmi": pred.bmi,
            "blood_pressure": pred.blood_pressure,
            "insulin": pred.insulin,
            "skin_thickness": pred.skin_thickness,
            "diabetes_pedigree_function": pred.diabetes_pedigree_function,
            "pregnancies": pred.pregnancies,
            "age": pred.age,
            "review_status": pred.review_status,
            "disease_type": pred.disease_type,
            "extra_fields": pred.extra_fields,
            "message": pred.message,
            "created_at": pred.created_at.isoformat(),
        })

    patient_name = (
        f"{patient.first_name} {patient.last_name}".strip()
        or patient.username
        or patient.email
    )

    return Response({
        "id": patient.id,
        "email": patient.email,
        "username": patient.username,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "name": patient_name,
        "phone": profile.phone if profile else None,
        "bio": profile.bio if profile else None,
        "profile_picture": profile.profile_picture if profile else None,
        "predictions": predictions,
    })


# ═══════════════════════════════════════════════════════════════
# Today's Appointments
# ═══════════════════════════════════════════════════════════════

@api_view(["GET"])
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
        patient_name = (
            f"{patient.first_name} {patient.last_name}".strip()
            or patient.username
            or patient.email
        )

        data.append({
            "id": appt.id,
            "patient": {
                "id": patient.id,
                "name": patient_name,
                "profile_picture": profile.profile_picture if profile else None,
            },
            "time": appt.appointment_time.strftime("%H:%M"),
            "status": appt.status,
            "type": appt.appointment_type,
            "prediction_id": appt.prediction_id,
            "notes": appt.notes,
            "patient_name": patient_name,
        })

    return Response({"count": len(data), "appointments": data})


# ═══════════════════════════════════════════════════════════════
# Messages / Chat Threads
# ═══════════════════════════════════════════════════════════════

def _serialize_chat_message(message):
    return {
        "id": message.id,
        "thread": message.thread_id,
        "sender_user": message.sender_user_id,
        "content": message.content,
        "read_at": message.read_at.isoformat() if message.read_at else None,
        "created_at": message.created_at.isoformat(),
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def recent_messages(request):
    """
    GET /api/doctor/messages/recent/
    Returns all active chat threads for the doctor.
    It returns threads even if they do not have messages yet.

    Important:
    If the doctor has active DoctorPatientAssignment records but no
    DoctorPatientChatThread records yet, this endpoint creates the missing
    threads automatically.
    """
    doctor = request.user

    assignments = DoctorPatientAssignment.objects.filter(
        doctor_user=doctor,
        status="active",
    )

    for assignment in assignments:
        DoctorPatientChatThread.objects.get_or_create(
            assignment=assignment
        )

    threads = (
        DoctorPatientChatThread.objects
        .filter(
            assignment__doctor_user=doctor,
            assignment__status="active",
        )
        .select_related(
            "assignment__patient_user",
            "assignment__patient_user__profile",
        )
    )

    data = []

    for thread in threads:
        patient = thread.assignment.patient_user
        profile = getattr(patient, "profile", None)

        last_msg = (
            DoctorPatientChatMessage.objects
            .filter(thread=thread)
            .order_by("-created_at")
            .first()
        )

        latest_prediction = (
            Prediction.objects
            .filter(patient_user=patient)
            .order_by("-created_at")
            .first()
        )

        unread_count = (
            DoctorPatientChatMessage.objects
            .filter(thread=thread, read_at__isnull=True)
            .exclude(sender_user=doctor)
            .count()
        )

        patient_name = (
            f"{patient.first_name} {patient.last_name}".strip()
            or patient.username
            or patient.email
        )

        data.append({
            "id": thread.id,
            "thread_id": thread.id,
            "patient_id": str(patient.id),
            "patient_name": patient_name,
            "last_message": last_msg.content[:100] if last_msg else "",
            "time": last_msg.created_at.isoformat() if last_msg else "",
            "created_at": (
                last_msg.created_at.isoformat()
                if last_msg
                else thread.created_at.isoformat()
            ),
            "risk_level": latest_prediction.risk_level if latest_prediction else "unknown",
            "unread_count": unread_count,
            "online": False,
            "patient": {
                "id": patient.id,
                "name": patient_name,
                "email": patient.email,
                "profile_picture": profile.profile_picture if profile else None,
            },
        })

    data.sort(key=lambda item: item["created_at"] or "", reverse=True)

    return Response({
        "count": len(data),
        "threads": data,
        "messages": data,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def thread_messages(request, thread_id):
    """
    GET /api/doctor/messages/<thread_id>/messages/
    Returns full message history for the selected thread.
    """
    doctor = request.user

    try:
        thread = (
            DoctorPatientChatThread.objects
            .select_related("assignment", "assignment__patient_user")
            .get(
                id=thread_id,
                assignment__doctor_user=doctor,
                assignment__status="active",
            )
        )
    except DoctorPatientChatThread.DoesNotExist:
        return Response(
            {"error": "المحادثة غير موجودة أو ليس لديك صلاحية الوصول إليها"},
            status=status.HTTP_404_NOT_FOUND,
        )

    messages = (
        DoctorPatientChatMessage.objects
        .filter(thread=thread)
        .select_related("sender_user")
        .order_by("created_at")
    )

    messages.filter(
        read_at__isnull=True,
    ).exclude(sender_user=doctor).update(
        read_at=timezone.now()
    )

    data = [_serialize_chat_message(message) for message in messages]

    return Response({
        "count": len(data),
        "messages": data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def send_thread_message(request, thread_id):
    """
    POST /api/doctor/messages/<thread_id>/send/
    Body:
    {
        "content": "message text"
    }
    """
    doctor = request.user
    content = str(request.data.get("content", "")).strip()

    if not content:
        return Response(
            {"error": "محتوى الرسالة مطلوب"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        thread = (
            DoctorPatientChatThread.objects
            .select_related("assignment", "assignment__patient_user")
            .get(
                id=thread_id,
                assignment__doctor_user=doctor,
                assignment__status="active",
            )
        )
    except DoctorPatientChatThread.DoesNotExist:
        return Response(
            {"error": "المحادثة غير موجودة أو ليس لديك صلاحية الإرسال فيها"},
            status=status.HTTP_404_NOT_FOUND,
        )

    message = DoctorPatientChatMessage.objects.create(
        thread=thread,
        sender_user=doctor,
        content=content,
    )

    Notification.objects.create(
        user=thread.assignment.patient_user,
        type="message",
        title="رسالة جديدة من الطبيب",
        body=content[:120],
        related_object_id=thread.id,
        related_object_type="chat_thread",
    )

    return Response(
        {"message": _serialize_chat_message(message)},
        status=status.HTTP_201_CREATED,
    )


# ═══════════════════════════════════════════════════════════════
# Recent Activity
# ═══════════════════════════════════════════════════════════════

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def recent_activity(request):
    """
    GET /api/doctor/activity/
    Returns a combined feed of recent events.
    """
    doctor = request.user
    doctor_profile_obj = getattr(doctor, "doctorprofile", None)
    specialties = (
        doctor_profile_obj.get_allowed_disease_types()
        if doctor_profile_obj
        else ["diabetes"]
    )

    patient_ids = DoctorPatientAssignment.objects.filter(
        doctor_user=doctor,
        status="active",
    ).values_list("patient_user_id", flat=True)

    activities = []

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
        patient_name = (
            f"{pred.patient_user.first_name} {pred.patient_user.last_name}".strip()
            or pred.patient_user.email
        )

        activities.append({
            "type": "prediction",
            "icon": "activity",
            "title": "تحليل جديد",
            "description": f"تحليل جديد من {patient_name}",
            "related_id": pred.id,
            "created_at": pred.created_at.isoformat(),
        })

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

    recent_appts = (
        Appointment.objects
        .filter(doctor_user=doctor)
        .select_related("patient_user")
        .order_by("-created_at")[:5]
    )

    for appt in recent_appts:
        patient_name = (
            f"{appt.patient_user.first_name} {appt.patient_user.last_name}".strip()
            or appt.patient_user.email
        )

        activities.append({
            "type": "appointment",
            "icon": "calendar",
            "title": "موعد جديد",
            "description": f"موعد مع {patient_name}",
            "related_id": appt.id,
            "created_at": appt.created_at.isoformat(),
        })

    recent_msgs = (
        DoctorPatientChatMessage.objects
        .filter(thread__assignment__doctor_user=doctor)
        .exclude(sender_user=doctor)
        .select_related("sender_user")
        .order_by("-created_at")[:5]
    )

    for msg in recent_msgs:
        patient_name = (
            f"{msg.sender_user.first_name} {msg.sender_user.last_name}".strip()
            or msg.sender_user.email
        )

        activities.append({
            "type": "message",
            "icon": "message-square",
            "title": "رسالة جديدة",
            "description": f"رسالة من {patient_name}",
            "related_id": msg.thread_id,
            "created_at": msg.created_at.isoformat(),
        })

    recent_meds = (
        MedicationRecommendation.objects
        .filter(review__doctor_user=doctor)
        .select_related("medication", "review__prediction__patient_user")
        .order_by("-review__created_at")[:5]
    )

    for med_rec in recent_meds:
        patient_name = (
            f"{med_rec.review.prediction.patient_user.first_name} "
            f"{med_rec.review.prediction.patient_user.last_name}"
        ).strip()

        activities.append({
            "type": "review",
            "icon": "pill",
            "title": "توصية دواء",
            "description": f"تم وصف {med_rec.medication.name} للمريض {patient_name}",
            "related_id": med_rec.review.prediction_id,
            "created_at": med_rec.review.created_at.isoformat(),
        })

    activities.sort(key=lambda item: item["created_at"], reverse=True)

    return Response({
        "count": len(activities[:15]),
        "activities": activities[:15],
    })


# ═══════════════════════════════════════════════════════════════
# Doctor Profile
# ═══════════════════════════════════════════════════════════════

@api_view(["GET"])
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
        doctor_user=doctor,
        status="active",
    ).count()

    review_count = PredictionReview.objects.filter(
        doctor_user=doctor
    ).count()

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
        "specialties": (
            doctor_profile_obj.get_allowed_disease_types()
            if doctor_profile_obj
            else ["diabetes"]
        ),
        "patient_count": patient_count,
        "review_count": review_count,
        "date_joined": doctor.date_joined.isoformat(),
    })


# ═══════════════════════════════════════════════════════════════
# Doctor Notifications
# ═══════════════════════════════════════════════════════════════

@api_view(["GET"])
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

    data = [
        {
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "body": n.body,
            "is_read": n.is_read,
            "related_object_id": n.related_object_id,
            "related_object_type": n.related_object_type,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifications
    ]

    return Response({"count": len(data), "notifications": data})


# ═══════════════════════════════════════════════════════════════
# Create Patient & Create Appointment
# ═══════════════════════════════════════════════════════════════

import secrets
import string

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def create_patient(request):
    """
    POST /api/doctor/patients/create/
    {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "phone": "1234567890",
        "password": "securepassword"
    }
    """
    doctor = request.user
    first_name = request.data.get("first_name", "").strip()
    last_name = request.data.get("last_name", "").strip()
    email = request.data.get("email", "").strip().lower()
    phone = request.data.get("phone", "").strip()
    password = request.data.get("password", "")

    errors = {}
    if not first_name:
        errors["first_name"] = "الاسم الأول مطلوب"
    if not last_name:
        errors["last_name"] = "اسم العائلة مطلوب"
    if not email:
        errors["email"] = "البريد الإلكتروني مطلوب"
    if not password:
        errors["password"] = "كلمة المرور مطلوبة"
    elif len(password) < 6:
        errors["password"] = "كلمة المرور يجب أن تكون 6 أحرف على الأقل"

    import logging
    logger = logging.getLogger(__name__)

    if errors:
        logger.error(f"[create_patient Validation Errors]: {errors}")
        return Response(
            {
                "error": "فشل التحقق من البيانات", 
                "details": errors,
                "submitted_email": request.data.get("email"),
                "normalized_email": email
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Duplicate email check debug details
    duplicate_query = User.objects.filter(username=email)
    query_str = str(duplicate_query.query)
    match_count = duplicate_query.count()

    logger.info(f"Duplicate check - Submitted: {request.data.get('email')}, Normalized: {email}, Query: {query_str}, Match Count: {match_count}")

    if match_count > 0:
        return Response(
            {
                "error": "هذا البريد الإلكتروني مسجل بالفعل",
                "submitted_email": request.data.get("email"),
                "normalized_email": email,
                "query_executed": query_str,
                "matching_user_count": match_count
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Create User
    user = User(
        username=email,
        email=email,
        first_name=first_name,
        last_name=last_name,
    )
    user.set_password(password)
    user.save()

    # Get or create profiles (guarantee profile fields are set)
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.role = UserProfile.ROLE_PATIENT
    if phone:
        profile.phone = phone
    profile.save()

    # Get or create DoctorProfile for the user to be safe
    DoctorProfile.objects.get_or_create(user=user)

    # Assign patient to this doctor
    assignment, _ = DoctorPatientAssignment.objects.get_or_create(
        doctor_user=doctor,
        patient_user=user,
        defaults={"status": DoctorPatientAssignment.STATUS_ACTIVE}
    )
    if assignment.status != DoctorPatientAssignment.STATUS_ACTIVE:
        assignment.status = DoctorPatientAssignment.STATUS_ACTIVE
        assignment.save()

    return Response({
        "message": "تم إضافة المريض بنجاح",
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": profile.phone,
            "role": profile.role,
        }
    }, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def create_appointment(request):
    """
    POST /api/doctor/appointments/create/
    {
        "patient_id": 12,
        "date": "2026-06-10",
        "time": "10:00 AM",
        "type": "follow_up",
        "notes": "some notes"
    }
    """
    doctor = request.user
    patient_id = request.data.get("patient_id")
    date_str = request.data.get("date")
    time_str = request.data.get("time")
    appt_type = request.data.get("type", Appointment.TYPE_FOLLOW_UP)
    notes = request.data.get("notes", "")

    if not patient_id or not date_str or not time_str:
        return Response(
            {"error": "المريض والتاريخ والوقت مطلوبة"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        patient = User.objects.get(id=patient_id)
    except User.DoesNotExist:
        return Response(
            {"error": "المريض غير موجود"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Check assignment
    is_assigned = DoctorPatientAssignment.objects.filter(
        doctor_user=doctor,
        patient_user=patient,
        status=DoctorPatientAssignment.STATUS_ACTIVE,
    ).exists()

    if not is_assigned:
        return Response(
            {"error": "ليس لديك صلاحية لحجز موعد مع هذا المريض"},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Clean / parse date & time
    from datetime import datetime
    try:
        # Expected formats: YYYY-MM-DD or ISO string
        if "T" in date_str:
            parsed_date = datetime.fromisoformat(date_str.replace("Z", "+00:00")).date()
        else:
            parsed_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        return Response(
            {"error": "صيغة التاريخ غير صحيحة (YYYY-MM-DD)"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Try parsing time: e.g. "10:00 AM" or "14:30"
    parsed_time = None
    time_formats = ["%I:%M %p", "%I:%M%p", "%H:%M", "%H:%M:%S"]
    for fmt in time_formats:
        try:
            parsed_time = datetime.strptime(time_str.strip(), fmt).time()
            break
        except Exception:
            continue

    if not parsed_time:
        return Response(
            {"error": "صيغة الوقت غير صحيحة (مثال: 10:00 AM)"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Create appointment
    appointment = Appointment.objects.create(
        doctor_user=doctor,
        patient_user=patient,
        appointment_date=parsed_date,
        appointment_time=parsed_time,
        appointment_type=appt_type,
        status=Appointment.STATUS_SCHEDULED,
        notes=notes,
    )

    # Notify patient
    Notification.objects.create(
        user=patient,
        type="appointment_scheduled",
        title="موعد جديد محجوز",
        body=f"قام الطبيب بحجز موعد لك بتاريخ {parsed_date} الساعة {parsed_time.strftime('%I:%M %p')}.",
        related_object_id=appointment.id,
        related_object_type="appointment",
    )

    return Response({
        "message": "تم إنشاء الحجز بنجاح",
        "appointment": {
            "id": appointment.id,
            "patient_id": patient.id,
            "patient_name": f"{patient.first_name} {patient.last_name}".strip(),
            "date": appointment.appointment_date.isoformat(),
            "time": appointment.appointment_time.strftime("%H:%M"),
            "type": appointment.appointment_type,
            "status": appointment.status,
            "notes": appointment.notes,
        }
    }, status=status.HTTP_201_CREATED)

