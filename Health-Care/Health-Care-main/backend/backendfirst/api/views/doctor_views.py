# api/doctor_views.py - Doctor Dashboard API Views

from datetime import datetime

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
    UserProfile,
)
from ..doctor_permissions import IsApprovedDoctor


def _patient_name(patient):
    return (
        f"{patient.first_name} {patient.last_name}".strip()
        or patient.username
        or patient.email
    )


def _date_to_iso(value):
    if not value:
        return None

    if hasattr(value, "isoformat"):
        return value.isoformat()

    return str(value)


def _time_to_hhmm(value):
    if not value:
        return None

    if hasattr(value, "strftime"):
        return value.strftime("%H:%M")

    return str(value)[:5]


def _parse_date(value):
    if not value:
        return None

    if hasattr(value, "year") and hasattr(value, "month") and hasattr(value, "day"):
        return value

    value = str(value).strip()

    try:
        return datetime.strptime(value[:10], "%Y-%m-%d").date()
    except ValueError:
        return None


def _parse_time(value):
    if not value:
        return None

    if hasattr(value, "hour") and hasattr(value, "minute"):
        return value

    value = str(value).strip().upper()

    for fmt in ("%H:%M", "%H:%M:%S", "%I:%M %p"):
        try:
            return datetime.strptime(value, fmt).time()
        except ValueError:
            continue

    return None


def _clean_prediction_extra_fields(pred):
    extra_fields = dict(pred.extra_fields or {})

    extra_fields.pop("smoke", None)
    extra_fields.pop("alcohol", None)
    extra_fields.pop("physical_activity", None)

    extra_fields.update({
        "pregnancies": pred.pregnancies,
        "blood_pressure": pred.blood_pressure,
        "skin_thickness": pred.skin_thickness,
        "insulin": pred.insulin,
        "diabetes_pedigree_function": pred.diabetes_pedigree_function,
    })

    return extra_fields


def _serialize_appointment(appt):
    patient = appt.patient_user
    profile = getattr(patient, "profile", None)
    patient_name = _patient_name(patient)
    appointment_date = _date_to_iso(appt.appointment_date)
    appointment_time = _time_to_hhmm(appt.appointment_time)

    return {
        "id": appt.id,
        "patient_id": patient.id,
        "patient_user": patient.id,
        "patient_name": patient_name,
        "patient": {
            "id": patient.id,
            "name": patient_name,
            "email": patient.email,
            "profile_picture": profile.profile_picture if profile else None,
        },
        "appointment_date": appointment_date,
        "appointment_time": appointment_time,
        "time": appointment_time,
        "status": appt.status,
        "type": appt.appointment_type,
        "appointment_type": appt.appointment_type,
        "reason": appt.notes or appt.appointment_type or "Medical Consultation",
        "notes": appt.notes,
        "prediction_id": appt.prediction_id,
        "created_at": appt.created_at.isoformat() if appt.created_at else None,
        "updated_at": appt.updated_at.isoformat() if appt.updated_at else None,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def doctor_dashboard_stats(request):
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

    predictions = Prediction.objects.filter(
        patient_user_id__in=patient_ids,
        disease_type__in=specialties,
    )

    today = timezone.localdate()

    return Response({
        "total_patients": assignments.count(),
        "total_predictions": predictions.count(),
        "pending_reviews": predictions.filter(review_status="pending").count(),
        "today_appointments": Appointment.objects.filter(
            doctor_user=doctor,
            appointment_date__gte=today,
            status="scheduled",
        ).count(),
        "high_risk_count": predictions.filter(probability__gte=75).count(),
        "unread_notifications": Notification.objects.filter(
            user=doctor,
            is_read=False,
        ).count(),
        "unread_messages": DoctorPatientChatMessage.objects.filter(
            thread__assignment__doctor_user=doctor,
            thread__assignment__status="active",
            read_at__isnull=True,
        ).exclude(sender_user=doctor).count(),
        "specialties": specialties,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def pending_predictions(request):
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
        .order_by("-created_at")
    )

    data = []

    for pred in predictions:
        patient = pred.patient_user
        profile = getattr(patient, "profile", None)
        patient_name = _patient_name(patient)
        extra_fields = _clean_prediction_extra_fields(pred)

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
            "pregnancies": pred.pregnancies,
            "blood_pressure": pred.blood_pressure,
            "skin_thickness": pred.skin_thickness,
            "insulin": pred.insulin,
            "diabetes_pedigree_function": pred.diabetes_pedigree_function,
            "review_status": pred.review_status,
            "disease_type": pred.disease_type,
            "extra_fields": extra_fields,
            "created_at": pred.created_at.isoformat(),
            "patient_name": patient_name,
        })

    return Response({"count": len(data), "predictions": data})


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def all_patient_predictions(request):
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
        .order_by("-created_at")
    )

    if risk_level:
        predictions = predictions.filter(risk_level__iexact=risk_level)

    if review_status:
        predictions = predictions.filter(review_status=review_status)

    data = []

    for pred in predictions:
        patient = pred.patient_user
        patient_name = _patient_name(patient)
        extra_fields = _clean_prediction_extra_fields(pred)

        data.append({
            "id": pred.id,
            "patient_id": patient.id,
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
            "extra_fields": extra_fields,
            "created_at": pred.created_at.isoformat(),
            "message": pred.message,
        })

    return Response({"count": len(data), "predictions": data})


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def review_prediction(request, prediction_id):
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

    review, _ = PredictionReview.objects.update_or_create(
        prediction=prediction,
        doctor_user=doctor,
        defaults={"decision": decision, "notes": notes},
    )

    prediction.review_status = decision
    prediction.save(update_fields=["review_status"])

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


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def risk_distribution(request):
    doctor = request.user
    doctor_profile_obj = getattr(doctor, "doctorprofile", None)
    specialties = (
        doctor_profile_obj.get_allowed_disease_types()
        if doctor_profile_obj
        else ["diabetes"]
    )

    disease_type = request.query_params.get("disease_type") or specialties[0]

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


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def doctor_patients(request):
    doctor = request.user

    if request.method == "POST":
        first_name = str(request.data.get("first_name", "")).strip()
        last_name = str(request.data.get("last_name", "")).strip()
        email = str(request.data.get("email", "")).strip().lower()
        phone = str(request.data.get("phone", "")).strip()

        if not first_name or not last_name or not email:
            return Response(
                {"error": "الاسم الأول واسم العائلة والبريد الإلكتروني مطلوبين"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        patient = User.objects.filter(email=email).first()

        if patient:
            patient.first_name = first_name
            patient.last_name = last_name
            patient.email = email
            patient.save(update_fields=["first_name", "last_name", "email"])

            profile, _ = UserProfile.objects.get_or_create(user=patient)
            profile.role = UserProfile.ROLE_PATIENT
            if phone:
                profile.phone = phone
            profile.save()
        else:
            username_base = (
                email.split("@")[0]
                .replace(".", "_")
                .replace("-", "_")
                .replace("+", "_")
            )

            username = username_base
            counter = 1

            while User.objects.filter(username=username).exists():
                username = f"{username_base}_{counter}"
                counter += 1

            patient = User.objects.create_user(
                username=username,
                email=email,
                password="password123",
                first_name=first_name,
                last_name=last_name,
            )

            profile, _ = UserProfile.objects.get_or_create(user=patient)
            profile.role = UserProfile.ROLE_PATIENT
            profile.phone = phone or None
            profile.save()

        assignment, created = DoctorPatientAssignment.objects.get_or_create(
            doctor_user=doctor,
            patient_user=patient,
            defaults={"status": "active"},
        )

        if not created:
            assignment.status = "active"
            assignment.save(update_fields=["status"])

        DoctorPatientChatThread.objects.get_or_create(assignment=assignment)

        patient_name = _patient_name(patient)

        return Response(
            {
                "id": patient.id,
                "username": patient.username,
                "first_name": patient.first_name,
                "last_name": patient.last_name,
                "name": patient_name,
                "email": patient.email,
                "phone": profile.phone if profile else None,
                "assignment_status": "active",
                "latest_prediction": None,
                "predictions": [],
                "temporary_password": "password123",
                "message": "تم إضافة المريض وربطه بالدكتور بنجاح",
            },
            status=status.HTTP_201_CREATED,
        )

    search = request.query_params.get("search", "").strip()

    assignments = (
        DoctorPatientAssignment.objects
        .filter(doctor_user=doctor, status="active")
        .select_related("patient_user", "patient_user__profile")
        .order_by("-created_at")
    )

    if search:
        assignments = assignments.filter(
            Q(patient_user__first_name__icontains=search)
            | Q(patient_user__last_name__icontains=search)
            | Q(patient_user__email__icontains=search)
        )

    data = []

    for assignment in assignments:
        patient = assignment.patient_user
        profile = getattr(patient, "profile", None)

        latest = (
            Prediction.objects
            .filter(patient_user=patient)
            .order_by("-created_at")
            .first()
        )

        patient_name = _patient_name(patient)

        data.append({
            "id": patient.id,
            "patient_id": patient.id,
            "patient_user": patient.id,
            "username": patient.username,
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "name": patient_name,
            "patient_name": patient_name,
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
        extra_fields = _clean_prediction_extra_fields(pred)

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
            "extra_fields": extra_fields,
            "message": pred.message,
            "created_at": pred.created_at.isoformat(),
        })

    patient_name = _patient_name(patient)

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


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def doctor_appointments(request):
    doctor = request.user

    if request.method == "POST":
        patient_id = request.data.get("patient_id")
        appointment_date_raw = request.data.get("appointment_date")
        appointment_time_raw = request.data.get("appointment_time")
        reason = str(request.data.get("reason", "")).strip()
        appointment_type = str(
            request.data.get("appointment_type", "consultation")
        ).strip() or "consultation"

        appointment_date = _parse_date(appointment_date_raw)
        appointment_time = _parse_time(appointment_time_raw)

        if not patient_id or not appointment_date or not appointment_time:
            return Response(
                {
                    "error": (
                        "patient_id, appointment_date and appointment_time "
                        "are required in valid format"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        assignment_exists = DoctorPatientAssignment.objects.filter(
            doctor_user=doctor,
            patient_user_id=patient_id,
            status="active",
        ).exists()

        if not assignment_exists:
            return Response(
                {"error": "هذا المريض غير مربوط بهذا الدكتور"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            patient = User.objects.get(id=patient_id)
        except User.DoesNotExist:
            return Response(
                {"error": "المريض غير موجود"},
                status=status.HTTP_404_NOT_FOUND,
            )

        appointment = Appointment.objects.create(
            doctor_user=doctor,
            patient_user=patient,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            appointment_type=appointment_type,
            notes=reason,
            status="scheduled",
        )

        Notification.objects.create(
            user=patient,
            type="appointment",
            title="تم حجز موعد جديد",
            body=(
                f"قام الطبيب بحجز موعد لك بتاريخ "
                f"{appointment_date.isoformat()} الساعة "
                f"{appointment_time.strftime('%H:%M')}."
            ),
            related_object_id=appointment.id,
            related_object_type="appointment",
        )

        return Response(
            _serialize_appointment(appointment),
            status=status.HTTP_201_CREATED,
        )

    appointments = (
        Appointment.objects
        .filter(doctor_user=doctor)
        .select_related("patient_user", "patient_user__profile", "prediction")
        .order_by("appointment_date", "appointment_time")
    )

    data = [_serialize_appointment(appt) for appt in appointments]

    return Response({"count": len(data), "appointments": data})


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def today_appointments(request):
    doctor = request.user
    today = timezone.localdate()

    appointments = (
        Appointment.objects
        .filter(
            doctor_user=doctor,
            appointment_date__gte=today,
            status="scheduled",
        )
        .select_related("patient_user", "patient_user__profile", "prediction")
        .order_by("appointment_date", "appointment_time")[:5]
    )

    data = [_serialize_appointment(appt) for appt in appointments]

    return Response({"count": len(data), "appointments": data})


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
    doctor = request.user

    assignments = DoctorPatientAssignment.objects.filter(
        doctor_user=doctor,
        status="active",
    )

    for assignment in assignments:
        DoctorPatientChatThread.objects.get_or_create(assignment=assignment)

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

        patient_name = _patient_name(patient)

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

    return Response({"count": len(data), "messages": data})


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def send_thread_message(request, thread_id):
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


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def recent_activity(request):
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
        patient_name = _patient_name(pred.patient_user)

        activities.append({
            "type": "prediction",
            "icon": "activity",
            "title": "تحليل جديد",
            "description": f"تحليل جديد من {patient_name}",
            "related_id": pred.id,
            "prediction_id": pred.id,
            "patient_id": pred.patient_user.id,
            "patient_name": patient_name,
            "created_at": pred.created_at.isoformat(),
        })

    recent_msgs = (
        DoctorPatientChatMessage.objects
        .filter(thread__assignment__doctor_user=doctor)
        .exclude(sender_user=doctor)
        .select_related("sender_user")
        .order_by("-created_at")[:5]
    )

    for msg in recent_msgs:
        patient_name = _patient_name(msg.sender_user)

        activities.append({
            "type": "message",
            "icon": "message-square",
            "title": "رسالة جديدة",
            "description": f"رسالة من {patient_name}",
            "related_id": msg.thread_id,
            "message_id": msg.thread_id,
            "patient_id": msg.sender_user.id,
            "patient_name": patient_name,
            "created_at": msg.created_at.isoformat(),
        })

    activities.sort(key=lambda item: item["created_at"], reverse=True)

    return Response({"count": len(activities[:15]), "activities": activities[:15]})


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def doctor_profile(request):
    doctor = request.user
    profile = getattr(doctor, "profile", None)
    doctor_profile_obj = getattr(doctor, "doctorprofile", None)

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
        "patient_count": DoctorPatientAssignment.objects.filter(
            doctor_user=doctor,
            status="active",
        ).count(),
        "review_count": PredictionReview.objects.filter(
            doctor_user=doctor
        ).count(),
        "date_joined": doctor.date_joined.isoformat(),
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsApprovedDoctor])
def doctor_notifications(request):
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