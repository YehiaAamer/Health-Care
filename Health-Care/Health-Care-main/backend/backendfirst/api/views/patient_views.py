# api/views.py - XGBoost Only with Chatbot (Medgamma interpretation disabled)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser

from ..models import Prediction, ChatbotSession, ChatbotMessage, DoctorPatientAssignment
from ..services.xgboost_service import predict_diabetes_xgboost, get_feature_importance
from ..services.medgamma_service import chatbot_chat, MedgammaError, is_medical_query
from ..services.cardiovascular_service import predict_cardiovascular
from ..services.notification_service import create_notification

import uuid


def get_doctor_allowed_diseases(doctor):
    doctor_profile = getattr(doctor, "doctorprofile", None)

    if doctor_profile and hasattr(doctor_profile, "get_allowed_disease_types"):
        return doctor_profile.get_allowed_disease_types()

    return []


def get_assignment_for_disease(patient_user, disease_type):
    assignments = (
        DoctorPatientAssignment.objects
        .filter(patient_user=patient_user, status="active")
        .select_related("doctor_user")
    )

    for assignment in assignments:
        allowed_diseases = get_doctor_allowed_diseases(assignment.doctor_user)

        if disease_type in allowed_diseases:
            return assignment

    return None


def notify_assigned_doctors_for_prediction(
    patient_user,
    prediction,
    probability,
    disease_type,
    disease_label="",
):
    assignments = (
        DoctorPatientAssignment.objects
        .filter(patient_user=patient_user, status="active")
        .select_related("doctor_user")
    )

    patient_name = (
        f"{patient_user.first_name} {patient_user.last_name}".strip()
        or patient_user.username
        or patient_user.email
    )

    for assignment in assignments:
        doctor = assignment.doctor_user
        allowed_diseases = get_doctor_allowed_diseases(doctor)

        if disease_type not in allowed_diseases:
            continue

        create_notification(
            user=doctor,
            type="new_prediction",
            title=f"تحليل جديد للمراجعة {disease_label}".strip(),
            body=f"المريض {patient_name} قام بعمل تحليل {disease_label.replace('-', '').strip()} جديد ويحتاج مراجعة.",
            related_object_id=prediction.id,
            related_object_type="prediction",
        )

        if float(probability) >= 50.0:
            create_notification(
                user=doctor,
                type="high_risk_alert",
                title=f"تنبيه خطورة عالية {disease_label}".strip(),
                body=f"تم رصد خطورة عالية في تحليل {disease_label.replace('-', '').strip()} للمريض {patient_name}.",
                related_object_id=prediction.id,
                related_object_type="prediction",
            )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def predict_diabetes(request):
    try:
        data = request.data

        features = {
            "pregnancies": float(data.get("pregnancies", 0)),
            "glucose": float(data.get("glucose", 85)),
            "blood_pressure": float(
                data.get("blood_pressure", data.get("bloodPressure", 70))
            ),
            "skin_thickness": float(
                data.get("skin_thickness", data.get("skinThickness", 20))
            ),
            "insulin": float(data.get("insulin", 0)),
            "bmi": float(data.get("bmi", 25.0)),
            "diabetes_pedigree_function": float(
                data.get(
                    "diabetes_pedigree_function",
                    data.get("diabetesPedigreeFunction", 0.5),
                )
            ),
            "age": int(float(data.get("age", 35))),
        }

        try:
            probability, risk_level = predict_diabetes_xgboost(features)
        except Exception as e:
            return Response(
                {
                    "error": f"فشل الحساب: {str(e)}",
                    "type": "xgboost_error",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        message = _generate_auto_message(probability, risk_level, features)

        diabetes_assignment = get_assignment_for_disease(
            request.user,
            Prediction.DISEASE_DIABETES,
        )

        extra_fields = {
            "pregnancies": features.get("pregnancies", 0),
            "blood_pressure": features.get("blood_pressure", 70),
            "skin_thickness": features.get("skin_thickness", 20),
            "insulin": features.get("insulin", 0),
            "diabetes_pedigree_function": features.get(
                "diabetes_pedigree_function", 0.5
            ),
        }

        prediction = Prediction.objects.create(
            patient_user=request.user,
            assignment=diabetes_assignment,
            disease_type=Prediction.DISEASE_DIABETES,
            extra_fields=extra_fields,
            pregnancies=features.get("pregnancies", 0),
            glucose=features.get("glucose", 85),
            blood_pressure=features.get("blood_pressure", 70),
            skin_thickness=features.get("skin_thickness", 20),
            insulin=features.get("insulin", 0),
            bmi=features.get("bmi", 25.0),
            diabetes_pedigree_function=features.get(
                "diabetes_pedigree_function", 0.5
            ),
            age=features.get("age", 35),
            probability=probability,
            risk_level=risk_level,
            message=message,
        )

        notify_assigned_doctors_for_prediction(
            patient_user=request.user,
            prediction=prediction,
            probability=probability,
            disease_type=Prediction.DISEASE_DIABETES,
            disease_label="- سكري",
        )

        return Response(
            {
                "probability": probability,
                "risk_level": risk_level,
                "message": message,
                "prediction_id": prediction.id,
                "model": "XGBoost",
            }
        )

    except ValueError as e:
        return Response(
            {"error": f"بيانات غير صحيحة: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    except Exception as e:
        print(f"[ERROR] Unexpected error: {str(e)}")
        return Response(
            {"error": f"حدث خطأ غير متوقع: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def predict_v2(request):
    try:
        data = request.data

        weight = float(data.get("weight", 70))
        height = float(data.get("height", 170))
        gender = str(data.get("gender", "male"))

        systolic_bp = float(
            data.get("systolicBloodPressure", data.get("systolic_bp", 120))
        )
        diastolic_bp = float(
            data.get("diastolicBloodPressure", data.get("diastolic_bp", 80))
        )

        cholesterol = float(data.get("cholesterol", 180))
        age = int(float(data.get("age", 35)))

        pregnancies = float(data.get("pregnancies", 0))
        glucose = float(data.get("glucose", 85))

        skin_thickness = float(
            data.get("skinThickness", data.get("skin_thickness", 20))
        )

        insulin = float(data.get("insulin", 0))

        diabetes_pedigree = float(
            data.get(
                "diabetesPedigreeFunction",
                data.get("diabetes_pedigree_function", 0.5),
            )
        )

        height_m = height / 100.0
        bmi = float(weight / (height_m * height_m)) if height_m > 0 else 25.0

        features_diabetes = {
            "pregnancies": pregnancies,
            "glucose": glucose,
            "blood_pressure": diastolic_bp,
            "skin_thickness": skin_thickness,
            "insulin": insulin,
            "bmi": bmi,
            "diabetes_pedigree_function": diabetes_pedigree,
            "age": age,
        }

        try:
            diabetes_prob, diabetes_risk = predict_diabetes_xgboost(
                features_diabetes
            )
        except Exception as e:
            return Response(
                {"error": f"XGBoost failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        diabetes_message = _generate_auto_message(
            diabetes_prob,
            diabetes_risk,
            features_diabetes,
        )

        features_cardio = {
            "age": age,
            "gender": gender,
            "height": height,
            "weight": weight,
            "systolic_bp": systolic_bp,
            "diastolic_bp": diastolic_bp,
            "cholesterol": cholesterol,
            "glucose": glucose,
        }

        cardio_result = predict_cardiovascular(features_cardio)

        diabetes_assignment = get_assignment_for_disease(
            request.user,
            Prediction.DISEASE_DIABETES,
        )

        cardio_assignment = get_assignment_for_disease(
            request.user,
            Prediction.DISEASE_CARDIOVASCULAR,
        )

        session_uuid = uuid.uuid4()

        extra_fields = {
            "gender": gender,
            "weight": weight,
            "height": height,
            "systolic_bp": systolic_bp,
            "diastolic_bp": diastolic_bp,
            "cholesterol": cholesterol,
            "pregnancies": pregnancies,
            "insulin": insulin,
            "skin_thickness": skin_thickness,
            "diabetes_pedigree_function": diabetes_pedigree,
        }

        pred_diabetes = Prediction.objects.create(
            patient_user=request.user,
            assignment=diabetes_assignment,
            disease_type=Prediction.DISEASE_DIABETES,
            session_id=session_uuid,
            extra_fields=extra_fields,
            pregnancies=pregnancies,
            glucose=glucose,
            blood_pressure=diastolic_bp,
            skin_thickness=skin_thickness,
            insulin=insulin,
            bmi=bmi,
            diabetes_pedigree_function=diabetes_pedigree,
            age=age,
            probability=diabetes_prob,
            risk_level=diabetes_risk,
            message=diabetes_message,
        )

        pred_cardio = Prediction.objects.create(
            patient_user=request.user,
            assignment=cardio_assignment,
            disease_type=Prediction.DISEASE_CARDIOVASCULAR,
            session_id=session_uuid,
            extra_fields=extra_fields,
            pregnancies=pregnancies,
            glucose=glucose,
            blood_pressure=diastolic_bp,
            skin_thickness=skin_thickness,
            insulin=insulin,
            bmi=bmi,
            diabetes_pedigree_function=diabetes_pedigree,
            age=age,
            probability=cardio_result["percentage"],
            risk_level=cardio_result["arabic_risk_level"],
            message=cardio_result["message"],
        )

        notify_assigned_doctors_for_prediction(
            patient_user=request.user,
            prediction=pred_diabetes,
            probability=diabetes_prob,
            disease_type=Prediction.DISEASE_DIABETES,
            disease_label="- سكري",
        )

        notify_assigned_doctors_for_prediction(
            patient_user=request.user,
            prediction=pred_cardio,
            probability=cardio_result["percentage"],
            disease_type=Prediction.DISEASE_CARDIOVASCULAR,
            disease_label="- قلب",
        )

        return Response(
            {
                "session_id": str(session_uuid),
                "diabetes": {
                    "prediction_id": pred_diabetes.id,
                    "probability": diabetes_prob,
                    "risk_level": diabetes_risk,
                    "message": diabetes_message,
                },
                "cardiovascular": {
                    "prediction_id": pred_cardio.id,
                    "probability": cardio_result["percentage"],
                    "risk_level": cardio_result["arabic_risk_level"],
                    "message": cardio_result["message"],
                },
            }
        )

    except ValueError as e:
        return Response(
            {"error": f"Invalid data: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    except Exception as e:
        return Response(
            {"error": f"Unexpected error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


def _generate_auto_message(probability, risk_level, features):
    risk_factors = []

    if features.get("glucose", 0) >= 126:
        risk_factors.append("ارتفاع الجلوكوز")
    elif features.get("glucose", 0) >= 100:
        risk_factors.append("مقدمات السكري (جلوكوز)")

    if features.get("bmi", 0) >= 30:
        risk_factors.append("السمنة")
    elif features.get("bmi", 0) >= 25:
        risk_factors.append("زيادة الوزن")

    if features.get("age", 0) >= 45:
        risk_factors.append("العمر فوق 45")

    if features.get("diabetes_pedigree_function", 0) >= 0.5:
        risk_factors.append("عامل وراثي")

    if features.get("insulin", 0) >= 25:
        risk_factors.append("مقاومة الإنسولين")

    if not risk_factors:
        message = (
            f"احتمالية الإصابة: {probability:.1f}% - مستوى المخاطر: {risk_level}. "
            "جميع القياسات ضمن المعدل الطبيعي."
        )
    else:
        factors_str = "، ".join(risk_factors)
        message = (
            f"احتمالية الإصابة: {probability:.1f}% - مستوى المخاطر: {risk_level}. "
            f"عوامل الخطر: {factors_str}."
        )

    if probability >= 75:
        message += " يُنصح بمراجعة طبيب فوراً."
    elif probability >= 50:
        message += " يُنصح بمراجعة طبيب وإجراء فحوصات إضافية."
    elif probability >= 25:
        message += " يُنصح باتباع نظام غذائي صحي وممارسة الرياضة."
    else:
        message += " استمر في الحفاظ على نمط حياة صحي."

    return message


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def chatbot_predict(request):
    try:
        data = request.data
        prediction_id = data.get("prediction_id")
        user_message = data.get("message", "").strip()
        conversation_id = data.get("conversation_id")

        if not user_message:
            return Response(
                {"error": "الرسالة مطلوبة"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_prediction = None
        diabetes_prediction = None
        cardio_prediction = None

        if is_medical_query(user_message):
            if prediction_id:
                try:
                    target_prediction = Prediction.objects.get(
                        id=prediction_id,
                        patient_user=request.user,
                    )
                except Prediction.DoesNotExist:
                    return Response(
                        {"error": "التحليل غير موجود"},
                        status=status.HTTP_404_NOT_FOUND,
                    )
            else:
                target_prediction = (
                    Prediction.objects
                    .filter(patient_user=request.user)
                    .order_by("-created_at")
                    .first()
                )

            if target_prediction:
                prediction_id = target_prediction.id

                if target_prediction.session_id:
                    session_predictions = Prediction.objects.filter(
                        session_id=target_prediction.session_id
                    )
                    diabetes_prediction = session_predictions.filter(
                        disease_type=Prediction.DISEASE_DIABETES
                    ).first()
                    cardio_prediction = session_predictions.filter(
                        disease_type=Prediction.DISEASE_CARDIOVASCULAR
                    ).first()

                if (
                    not diabetes_prediction
                    and target_prediction.disease_type == Prediction.DISEASE_DIABETES
                ):
                    diabetes_prediction = target_prediction

                if (
                    not cardio_prediction
                    and target_prediction.disease_type
                    == Prediction.DISEASE_CARDIOVASCULAR
                ):
                    cardio_prediction = target_prediction

        conversation_history = []
        session = None

        if conversation_id:
            try:
                session = ChatbotSession.objects.get(
                    id=conversation_id,
                    patient_user=request.user,
                )
            except ChatbotSession.DoesNotExist:
                return Response(
                    {"error": "المحادثة غير موجودة"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            messages = (
                ChatbotMessage.objects
                .filter(session=session)
                .order_by("created_at")[:10]
            )

            conversation_history = [
                {"role": msg.role, "content": msg.content}
                for msg in messages
            ]

        try:
            bot_response = chatbot_chat(
                diabetes_prediction=diabetes_prediction,
                cardio_prediction=cardio_prediction,
                question=user_message,
                conversation_history=conversation_history
                if conversation_history
                else None,
            )
        except MedgammaError as me:
            bot_response = (
                "عذراً، هناك مشكلة في الاتصال بالمساعد الطبي. "
                f"يرجى المحاولة لاحقاً. (خطأ: {str(me)})"
            )
        except Exception as e:
            bot_response = (
                "عذراً، حدث خطأ غير متوقع. "
                f"يرجى المحاولة لاحقاً. (خطأ: {str(e)})"
            )

        if not conversation_id:
            session = ChatbotSession.objects.create(
                patient_user=request.user,
                prediction=target_prediction if prediction_id else None,
            )
            conversation_id = session.id

        ChatbotMessage.objects.create(
            session=session,
            role="user",
            content=user_message,
        )

        assistant_chat_message = ChatbotMessage.objects.create(
            session=session,
            role="assistant",
            content=bot_response,
        )

        return Response(
            {
                "conversation_id": conversation_id,
                "prediction_id": prediction_id,
                "user_message": user_message,
                "bot_response": bot_response,
                "timestamp": assistant_chat_message.created_at.isoformat(),
            }
        )

    except Exception as e:
        return Response(
            {"error": f"حدث خطأ: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def get_conversation_history(request, conversation_id):
    return Response(
        {
            "error": "الخدمة معطلة مؤقتاً",
            "status": "disabled",
        },
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_past_predictions(request):
    try:
        predictions = Prediction.objects.filter(patient_user=request.user)

        data = []

        for pred in predictions:
            extra_fields = pred.extra_fields or {}
            extra_fields.pop("smoke", None)
            extra_fields.pop("alcohol", None)
            extra_fields.pop("physical_activity", None)
            extra_fields.update(
                {
                    "pregnancies": pred.pregnancies,
                    "insulin": pred.insulin,
                    "skin_thickness": pred.skin_thickness,
                    "diabetes_pedigree_function": pred.diabetes_pedigree_function,
                }
            )

            data.append(
                {
                    "id": pred.id,
                    "pregnancies": pred.pregnancies,
                    "glucose": pred.glucose,
                    "blood_pressure": pred.blood_pressure,
                    "skin_thickness": pred.skin_thickness,
                    "insulin": pred.insulin,
                    "bmi": pred.bmi,
                    "diabetes_pedigree_function": pred.diabetes_pedigree_function,
                    "age": pred.age,
                    "probability": pred.probability,
                    "risk_level": pred.risk_level,
                    "message": pred.message,
                    "disease_type": pred.disease_type,
                    "session_id": str(pred.session_id) if pred.session_id else None,
                    "extra_fields": extra_fields,
                    "created_at": pred.created_at.isoformat(),
                }
            )

        return Response(
            {
                "count": len(data),
                "predictions": data,
            }
        )

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["GET"])
@permission_classes([IsAdminUser])
def get_all_predictions(request):
    try:
        predictions = Prediction.objects.all().order_by("-created_at")[:40]

        data = []

        for pred in predictions:
            extra_fields = pred.extra_fields or {}
            extra_fields.pop("smoke", None)
            extra_fields.pop("alcohol", None)
            extra_fields.pop("physical_activity", None)
            extra_fields.update(
                {
                    "pregnancies": pred.pregnancies,
                    "insulin": pred.insulin,
                    "skin_thickness": pred.skin_thickness,
                    "diabetes_pedigree_function": pred.diabetes_pedigree_function,
                }
            )

            data.append(
                {
                    "id": pred.id,
                    "user": {
                        "id": pred.patient_user.id if pred.patient_user else None,
                        "username": pred.patient_user.username
                        if pred.patient_user
                        else "Anonymous",
                        "email": pred.patient_user.email
                        if pred.patient_user
                        else None,
                    },
                    "pregnancies": pred.pregnancies,
                    "glucose": pred.glucose,
                    "blood_pressure": pred.blood_pressure,
                    "skin_thickness": pred.skin_thickness,
                    "insulin": pred.insulin,
                    "bmi": pred.bmi,
                    "diabetes_pedigree_function": pred.diabetes_pedigree_function,
                    "age": pred.age,
                    "probability": pred.probability,
                    "risk_level": pred.risk_level,
                    "message": pred.message,
                    "disease_type": pred.disease_type,
                    "session_id": str(pred.session_id) if pred.session_id else None,
                    "extra_fields": extra_fields,
                    "created_at": pred.created_at.isoformat(),
                }
            )

        return Response(
            {
                "count": len(data),
                "predictions": data,
            }
        )

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def feature_importance(request):
    try:
        importance = get_feature_importance()

        return Response(
            {
                "feature_importance": importance,
                "description": {
                    "Glucose": "مستوى الجلوكوز - أهم عامل",
                    "BMI": "مؤشر كتلة الجسم",
                    "Age": "العمر",
                    "Pregnancies": "عدد مرات الحمل",
                    "Insulin": "مستوى الإنسولين",
                    "DiabetesPedigreeFunction": "العامل الوراثي",
                    "BloodPressure": "ضغط الدم",
                    "SkinThickness": "سماكة الجلد",
                },
            }
        )

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def ollama_health(request):
    return Response(
        {
            "status": "disabled",
            "message": "الخدمة معطلة مؤقتاً - يتم استخدام XGBoost فقط",
        }
    )