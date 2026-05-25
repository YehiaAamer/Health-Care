# api/views.py - XGBoost Only with Chatbot (Medgamma interpretation disabled)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from ..models import Prediction, ChatbotSession, ChatbotMessage
from ..services.xgboost_service import predict_diabetes_xgboost, get_feature_importance
# Medgamma imports for Chatbot only
from ..services.medgamma_service import chatbot_chat, MedgammaError


# ═══════════════════════════════════════════════════════════════
# Prediction Endpoint (XGBoost Only)
# ═══════════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def predict_diabetes(request):
    """
    التنبؤ بالسكري باستخدام XGBoost فقط
    (Medgamma معطل مؤقتاً)
    
    POST /api/predict/
    {
        "pregnancies": 2,
        "glucose": 150,
        "blood_pressure": 80,
        "skin_thickness": 25,
        "insulin": 100,
        "bmi": 30.5,
        "diabetes_pedigree_function": 0.5,
        "age": 45
    }
    """
    try:
        data = request.data

        # استخراج الحقول
        features = {
            "pregnancies": float(data.get('pregnancies', 0)),
            "glucose": float(data.get('glucose', 85)),
            "blood_pressure": float(data.get('blood_pressure', data.get('bloodPressure', 70))),
            "skin_thickness": float(data.get('skin_thickness', data.get('skinThickness', 20))),
            "insulin": float(data.get('insulin', 0)),
            "bmi": float(data.get('bmi', 25.0)),
            "diabetes_pedigree_function": float(data.get('diabetes_pedigree_function', data.get('diabetesPedigreeFunction', 0.5))),
            "age": int(float(data.get('age', 35)))
        }

        # ─────────────────────────────────────────────
        # XGBoost: الحساب الدقيق للنسبة
        # ─────────────────────────────────────────────
        try:
            probability, risk_level = predict_diabetes_xgboost(features)
            # print(f"[XGBoost] Probability: {probability:.2f}%, Risk: {risk_level}")
        except Exception as e:
            # print(f"[ERROR] XGBoost failed: {str(e)}")
            return Response({
                "error": f"فشل الحساب: {str(e)}",
                "type": "xgboost_error"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # ─────────────────────────────────────────────
        # رسالة تلقائية بناءً على النتيجة
        # ─────────────────────────────────────────────
        message = _generate_auto_message(probability, risk_level, features)

        # ─────────────────────────────────────────────
        # حفظ في قاعدة البيانات
        # ─────────────────────────────────────────────
        prediction = Prediction.objects.create(
            patient_user=request.user,
            pregnancies=features.get('pregnancies', 0),
            glucose=features.get('glucose', 85),
            blood_pressure=features.get('blood_pressure', 70),
            skin_thickness=features.get('skin_thickness', 20),
            insulin=features.get('insulin', 0),
            bmi=features.get('bmi', 25.0),
            diabetes_pedigree_function=features.get('diabetes_pedigree_function', 0.5),
            age=features.get('age', 35),
            probability=probability,
            risk_level=risk_level,
            message=message
        )

        # ─────────────────────────────────────────────
        # الاستجابة
        # ─────────────────────────────────────────────
        return Response({
            "probability": probability,
            "risk_level": risk_level,
            "message": message,
            "prediction_id": prediction.id,
            "model": "XGBoost"
        })

    except ValueError as e:
        return Response({
            "error": f"بيانات غير صحيحة: {str(e)}"
        }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        print(f"[ERROR] Unexpected error: {str(e)}")
        return Response({
            "error": f"حدث خطأ غير متوقع: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _generate_auto_message(probability, risk_level, features):
    """
    توليد رسالة تلقائية بناءً على النتيجة
    
    Args:
        probability: نسبة الاحتمال
        risk_level: مستوى المخاطر
        features: البيانات الطبية
        
    Returns:
        str: رسالة طبية
    """
    # تحديد عوامل الخطر
    risk_factors = []
    
    if features.get('glucose', 0) >= 126:
        risk_factors.append("ارتفاع الجلوكوز")
    elif features.get('glucose', 0) >= 100:
        risk_factors.append("مقدمات السكري (جلوكوز)")
    
    if features.get('bmi', 0) >= 30:
        risk_factors.append("السمنة")
    elif features.get('bmi', 0) >= 25:
        risk_factors.append("زيادة الوزن")
    
    if features.get('age', 0) >= 45:
        risk_factors.append("العمر فوق 45")
    
    if features.get('diabetes_pedigree_function', 0) >= 0.5:
        risk_factors.append("عامل وراثي")
    
    if features.get('insulin', 0) >= 25:
        risk_factors.append("مقاومة الإنسولين")
    
    # بناء الرسالة
    if not risk_factors:
        message = f"احتمالية الإصابة: {probability:.1f}% - مستوى المخاطر: {risk_level}. جميع القياسات ضمن المعدل الطبيعي."
    else:
        factors_str = "، ".join(risk_factors)
        message = f"احتمالية الإصابة: {probability:.1f}% - مستوى المخاطر: {risk_level}. عوامل الخطر: {factors_str}."
    
    # إضافة توصية
    if probability >= 75:
        message += " يُنصح بمراجعة طبيب فوراً."
    elif probability >= 50:
        message += " يُنصح بمراجعة طبيب وإجراء فحوصات إضافية."
    elif probability >= 25:
        message += " يُنصح باتباع نظام غذائي صحي وممارسة الرياضة."
    else:
        message += " استمر في الحفاظ على نمط حياة صحي."
    
    return message


def _get_fallback_response(user_message: str) -> str:
    """
    الحصول على رد افتراضي سريع لو Chatbot معطل

    Args:
        user_message: رسالة المستخدم

    Returns:
        str: رد افتراضي
    """
    user_message_lower = user_message.lower().strip()

    # تحيات عامة - ردود فورية
    greetings = {
        "ازيك": "أنا بخير، شكرًا! 😊 أنا مساعدك الطبي الذكي. اسألني عن السكري، التحاليل، أو أي سؤال صحي.",
        "ازيك يا": "أنا بخير، شكرًا! 😊 كيف يمكنني مساعدتك اليوم؟",
        "ايه الاخبار": "كل تمام! 😊 أنا هنا لمساعدتك. عندك أي سؤال عن صحتك أو السكري؟",
        "اخبارك": "بخير والحمد لله! 😊 كيف حالك انت؟ عندك أي سؤال طبي؟",
        "كيف حالك": "أنا بخير، شكرًا! 😊 أنا هنا لمساعدتك. ما سؤالك؟",
        "مرحبا": "مرحباً بك! 👋 أنا مساعدك الطبي الذكي. اسألني أي سؤال عن السكري أو صحتك.",
        "اهلا": "أهلاً وسهلاً! 👋 أنا مساعدك الطبي الذكي. كيف يمكنني مساعدتك؟",
        "السلام عليكم": "وعليكم السلام ورحمة الله! 👋 كيف يمكنني مساعدتك اليوم؟",
        "مع السلامة": "مع السلامة! اعتنِ بصحتك ولا تتردد في استشارة طبيب. 👋",
        "باي": "مع السلامة! 👋 اعتنِ بنفسك!",
        "شكرا": "عفواً! 😊 أنا هنا دائماً لمساعدتك. استشر طبيباً للمزيد من التفاصيل.",
        "مشكور": "العفو! 😊 الله يشفيك ويحفظك.",
        "يسلمو": "الله يسلمك! 😊 صحتك وسلامتك.",
        "عاش": "شكراً! 😊 أنا مساعدك الطبي. اسألني عن أي حاجة تخص صحتك.",
        "ممتاز": "الحمد لله! 😊 كيف يمكنني مساعدتك اليوم؟",
    }

    # التحقق من التحية أولاً
    for greeting, response in greetings.items():
        if greeting in user_message_lower:
            return response

    # أسئلة طبية شائعة - ردود فورية
    medical_fallbacks = {
        # التحاليل والنتائج
        "تحاليل": "تحاليل السكري الأساسية: جلوكوز صائم، جلوكوز تراكمي (HbA1c). لو عندك تحليل، قولي النتيجة وأنا أقولك إيه المعنى.",
        "التحاليل": "تحاليل السكري الأساسية: جلوكوز صائم، جلوكوز تراكمي (HbA1c). لو عندك تحليل، قولي النتيجة وأنا أقولك إيه المعنى.",
        "اخر تحليل": "ممتاز إنك بتتابع تحاليلك! لو تحب تشارك معايا نتائج تحليلك، أقدر أساعدك تفهمها ونقولك إيه الخطوات الجاية.",
        "اخر تحاليل": "ممتاز إنك بتتابع تحاليلك! لو تحب تشارك معايا نتائج تحليلك، أقدر أساعدك تفهمها ونقولك إيه الخطوات الجاية.",
        "نتيجة": "لو تحب تشارك معايا نتيجة تحليلك، أقدر أساعدك تفهمها ونقولك إيه الخطوات المناسبة لحالتك.",
        "نتائج": "لو تحب تشارك معايا نتائج تحليلك، أقدر أساعدك تفهمها ونقولك إيه الخطوات المناسبة لحالتك.",
        
        # التوصيات والنصائح
        "توصيات": "التوصيات الأساسية: 1) نظام غذائي صحي 2) رياضة 30 دقيقة يومياً 3) متابعة دورية 4) التزام بالأدوية لو موجودة.",
        "توصية": "التوصيات الأساسية: 1) نظام غذائي صحي 2) رياضة 30 دقيقة يومياً 3) متابعة دورية 4) التزام بالأدوية لو موجودة.",
        "نصائح": "نصائح مهمة: 1) قلل السكريات والنشويات 2) امشِ 30 دقيقة يومياً 3) اشرب مية كتير 4) نام كفاية 5) قلل التوتر.",
        "نصيحة": "نصيحة مهمة: اتبع نظام غذائي صحي، امشِ يومياً، والتزم بالأدوية لو موجودة. والمتابعة مع طبيب ضرورية.",
        "اعمل ايه": "الخطوات الأساسية: 1) نظام غذائي صحي 2) رياضة منتظمة 3) متابعة التحاليل 4) استشارة طبيب للمزيد.",
        "في حاجة اعملها": "نعم! الخطوات الأساسية: 1) نظام غذائي صحي 2) رياضة 30 دقيقة يومياً 3) متابعة دورية 4) استشارة طبيب.",
        "خطوات": "الخطوات الأساسية: 1) نظام غذائي صحي 2) رياضة منتظمة 3) متابعة التحاليل 4) استشارة طبيب للمزيد.",
        "المفروض": "المفروض تتابع مع طبيب، وتلتزم بنظام غذائي صحي، ورياضة يومية. ولو عندك تحليل، شارك معايا النتائج.",
        
        # أسئلة عامة
        "ليه النسبة": "النسبة بتتعتمد على عوامل كتير زي: الجلوكوز، BMI، العمر، والعامل الوراثي. كل عامل فيهم له تأثير.",
        "لماذا النسبة": "النسبة بتتعتمد على عوامل كتير زي: الجلوكوز، BMI، العمر، والعامل الوراثي.",
        "ازاي اخفض": "لتخفيض النسبة: 1) نظام غذائي قليل السكريات 2) رياضة 30 دقيقة يومياً 3) متابعة مع طبيب.",
        "كيف اخفض": "لتخفيض النسبة: 1) نظام غذائي قليل السكريات 2) رياضة 30 دقيقة يومياً 3) متابعة مع طبيب.",
        "هل ده خطير": "مستوى الخطر بيتحدد بناءً على النسبة. لو فوق 50% ينصح بمراجعة طبيب. لو تحت 25% فالوضع جيد.",
        "خطير": "مستوى الخطر بيتحدد بناءً على النسبة. لو فوق 50% ينصح بمراجعة طبيب فوراً.",
        "علاج": "العلاج الأساسي: نظام غذائي صحي + رياضة منتظمة + أدوية (لو وصفها الطبيب) + متابعة مستمرة.",
        "دواء": "الأدوية يحددها الطبيب حسب حالتك. الأشهر: Metformin. لكن النظام الغذائي والرياضة أساسيان.",
        "جلوكوز": "الجلوكوز الطبيعي (صائم): 70-99 mg/dL. لو 100-125 (مقدمات سكري). لو 126+ (احتمال سكري).",
        "ضغط": "الضغط الطبيعي: أقل من 120/80 mmHg. لو 130/80+ ينصح بمراجعة طبيب.",
        "وزن": "الوزن الزائد بيزيد خطر السكري. خسارة 5-10% من الوزن بتخفض الخطر بنسبة 30%.",
        "رياضة": "الرياضة بتخفض السكري. امشِ 30 دقيقة يومياً أو العب رياضة خفيفة 5 أيام في الأسبوع.",
        "اكل": "قلل: سكريات، نشويات، أكل مقلي. اكتر: خضار، بروتين، حبوب كاملة، سمك.",
        "طبيب": "نعم، استشارة الطبيب ضرورية للتشخيص الدقيق ووصف العلاج المناسب لحالتك.",
        "سكري": "السكري النوع 2 يمكن التحكم فيه بالنظام الغذائي، الرياضة، والأدوية. المتابعة المستمرة مهمة.",
        "نسبة": "النسبة بتاعتك محسوبة بدقة بناءً على تحليلك. اتبع توصيات الطبيب للحفاظ على صحتك.",
        "تحليل": "تحليل السكري بيشمل: جلوكوز صائم، جلوكوز تراكمي (HbA1c)، وأحياناً اختبار تحمل الجلوكوز.",
        "اعراض": "أعراض السكري: كثرة التبول، العطش، الجوع، التعب، تشوش الرؤية. لو عندك أعراض راجع طبيب.",
        "وقاية": "الوقاية من السكري: وزن صحي، رياضة منتظمة، أكل صحي، نوم كافٍ، وتقليل التوتر.",
        "نظام": "النظام الغذائي الصحي: اكتر خضار، بروتين خالي من الدهون، حبوب كاملة. قلل: سكريات، نشويات، أكل مقلي.",
        "رجيم": "الرجيم الصحي للسكري: تجنب السكريات البسيطة، قلل النشويات، اكتر من الألياف والبروتين.",
        "تمرين": "التمارين الرياضية: امشِ 30 دقيقة يومياً، اصعد السلم، العب رياضة خفيفة. الرياضة بتخفض الجلوكوز.",
        "إنسولين": "الإنسولين هرمون بيحول الجلوكوز لطاقة. مقاومة الإنسولين بتزيد خطر السكري النوع 2.",
        "مقدمات": "مقدمات السكري: الجلوكوز بين 100-125 mg/dL. تغيير النمط الحياتي بيقدر يمنع أو يؤخر السكري.",
        "متابعة": "المتابعة الدورية: قياس الجلوكوز كل 3-6 شهور، فحص العين سنوياً، فحص القدمين بانتظام.",
    }

    # البحث عن أفضل مطابقة طبية
    for keyword, response in medical_fallbacks.items():
        if keyword in user_message_lower:
            return response + " 🩺"

    # رد افتراضي عام - طبيعي أكثر
    return """أنا بخير، شكرًا! 😊

أنا مساعدك الطبي الذكي، موجود لمساعدتك في أي سؤال عن:
• السكري وتحاليله
• النظام الغذائي الصحي
• الرياضة والصحة العامة
• نصائح طبية عامة

اسألني في أي حاجة تخص صحتك! 🩺"""


# ═══════════════════════════════════════════════════════════════
# Chatbot Endpoint (Medgamma-based)
# ═══════════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chatbot_predict(request):
    """
    محادثة مع Chatbot الطبي (Medgamma)
    
    POST /api/chatbot/
    {
        "prediction_id": 1,
        "message": "ليه النسبة عالية؟",
        "conversation_id": 123  // اختياري
    }
    """
    try:
        data = request.data
        prediction_id = data.get('prediction_id')
        user_message = data.get('message', '').strip()
        conversation_id = data.get('conversation_id')
        
        if not user_message:
            return Response({
                "error": "الرسالة مطلوبة"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # جلب التحليل السابق
        if prediction_id:
            try:
                prediction = Prediction.objects.get(
                    id=prediction_id,
                    patient_user=request.user,
                )
                features = {
                    'glucose': prediction.glucose,
                    'blood_pressure': prediction.blood_pressure,
                    'bmi': prediction.bmi,
                    'age': prediction.age,
                }
                probability = prediction.probability
                risk_level = prediction.risk_level
            except Prediction.DoesNotExist:
                return Response({
                    "error": "التحليل غير موجود"
                }, status=status.HTTP_404_NOT_FOUND)
        else:
            # لو مفيش prediction_id، نجيب آخر تحليل للمستخدم
            if request.user.is_authenticated:
                last_prediction = Prediction.objects.filter(patient_user=request.user).first()
                if last_prediction:
                    prediction = last_prediction
                    prediction_id = last_prediction.id
                    features = {
                        'glucose': last_prediction.glucose,
                        'blood_pressure': last_prediction.blood_pressure,
                        'bmi': last_prediction.bmi,
                        'age': last_prediction.age,
                    }
                    probability = last_prediction.probability
                    risk_level = last_prediction.risk_level
                else:
                    # مفيش تحليلات خالص
                    features = {
                        'glucose': 85,
                        'blood_pressure': 70,
                        'bmi': 25,
                        'age': 35,
                    }
                    probability = 5.0
                    risk_level = "منخفض"
            else:
                # مش مسجل دخول
                features = {
                    'glucose': 85,
                    'blood_pressure': 70,
                    'bmi': 25,
                    'age': 35,
                }
                probability = 5.0
                risk_level = "منخفض"
        
        # جلب تاريخ المحادثة إذا موجود
        conversation_history = []
        session = None
        if conversation_id:
            try:
                session = ChatbotSession.objects.get(
                    id=conversation_id,
                    patient_user=request.user,
                )
            except ChatbotSession.DoesNotExist:
                return Response({
                    "error": "Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø© ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø©"
                }, status=status.HTTP_404_NOT_FOUND)

            messages = ChatbotMessage.objects.filter(
                session=session
            ).order_by('created_at')[:10]
            
            conversation_history = [
                {"role": msg.role, "content": msg.content}
                for msg in messages
            ]
        
        # ─────────────────────────────────────────────
        # استدعاء Chatbot
        # ─────────────────────────────────────────────
        try:
            # Avoid printing Arabic/user content to Windows console (can raise charmap encoding errors).
            print(f"[CHATBOT] Calling MedGemma (prediction_id={prediction_id}, conversation_id={conversation_id})")
            
            bot_response = chatbot_chat(
                features=features,
                probability=probability,
                risk_level=risk_level,
                question=user_message,
                conversation_history=conversation_history if conversation_history else None
            )
        except MedgammaError as me:
            print("[CHATBOT ERROR] Medgamma error")
            # لو MedGemma فشل، نرجع error واضح
            bot_response = f"عذراً، هناك مشكلة في الاتصال بالمساعد الطبي. يرجى المحاولة لاحقاً. (خطأ: {str(me)})"
        except Exception as e:
            print("[CHATBOT ERROR] Unexpected error")
            bot_response = f"عذراً، حدث خطأ غير متوقع. يرجى المحاولة لاحقاً. (خطأ: {str(e)})"
        
        # ─────────────────────────────────────────────
        # حفظ المحادثة
        # ─────────────────────────────────────────────
        if not conversation_id:
            # إنشاء محادثة جديدة
            session = ChatbotSession.objects.create(
                patient_user=request.user,
                prediction=prediction if prediction_id else None,
            )
            conversation_id = session.id
        
        # حفظ رسالة المستخدم
        ChatbotMessage.objects.create(
            session=session,
            role='user',
            content=user_message
        )
        
        # حفظ رد البوت
        assistant_chat_message = ChatbotMessage.objects.create(
            session=session,
            role='assistant',
            content=bot_response
        )
        
        # ─────────────────────────────────────────────
        # الاستجابة
        # ─────────────────────────────────────────────
        return Response({
            "conversation_id": conversation_id,
            "prediction_id": prediction_id,
            "user_message": user_message,
            "bot_response": bot_response,
            "timestamp": assistant_chat_message.created_at.isoformat()
        })

    except Exception as e:
        print("[ERROR] Chatbot error")
        return Response({
            "error": f"حدث خطأ: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ═══════════════════════════════════════════════════════════════
# Get Conversation History (Disabled for now)
# ═══════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([AllowAny])
def get_conversation_history(request, conversation_id):
    """
    جلب تاريخ محادثة - معطل مؤقتاً
    """
    return Response({
        "error": "الخدمة معطلة مؤقتاً",
        "status": "disabled"
    }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


# ═══════════════════════════════════════════════════════════════
# Get Past Predictions
# ═══════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_past_predictions(request):
    """جلب جميع التحاليل السابقة للمستخدم الحالي"""
    try:
        predictions = Prediction.objects.filter(patient_user=request.user)

        data = []
        for pred in predictions:
            data.append({
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
                "created_at": pred.created_at.isoformat()
            })

        return Response({
            "count": len(data),
            "predictions": data
        })
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_all_predictions(request):
    """
    جلب آخر 40 تحليل من كل المستخدمين (للمديرين فقط)
    
    GET /api/history/
    """
    try:
        # جلب آخر 40 تحليل مرتبة حسب الأحدث
        predictions = Prediction.objects.all().order_by('-created_at')[:40]

        data = []
        for pred in predictions:
            data.append({
                "id": pred.id,
                "user": {
                    "id": pred.patient_user.id if pred.patient_user else None,
                    "username": pred.patient_user.username if pred.patient_user else "Anonymous",
                    "email": pred.patient_user.email if pred.patient_user else None
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
                "created_at": pred.created_at.isoformat()
            })

        return Response({
            "count": len(data),
            "predictions": data
        })
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ═══════════════════════════════════════════════════════════════
# Feature Importance
# ═══════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([AllowAny])
def feature_importance(request):
    """
    الحصول على أهمية الميزات في الموديل
    
    GET /api/feature-importance/
    """
    try:
        importance = get_feature_importance()
        return Response({
            "feature_importance": importance,
            "description": {
                "Glucose": "مستوى الجلوكوز - أهم عامل",
                "BMI": "مؤشر كتلة الجسم",
                "Age": "العمر",
                "Pregnancies": "عدد مرات الحمل",
                "Insulin": "مستوى الإنسولين",
                "DiabetesPedigreeFunction": "العامل الوراثي",
                "BloodPressure": "ضغط الدم",
                "SkinThickness": "سماكة الجلد"
            }
        })
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ═══════════════════════════════════════════════════════════════
# Ollama Health Check (Disabled for now)
# ═══════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([AllowAny])
def ollama_health(request):
    """التحقق من حالة Ollama - معطل مؤقتاً"""
    return Response({
        "status": "disabled",
        "message": "الخدمة معطلة مؤقتاً - يتم استخدام XGBoost فقط"
    })
