import math

CARDIO_COEFFICIENTS = {
    "intercept": -11.2,
    "age": 0.055,
    "gender": 0.42,
    "height": -0.012,
    "weight": 0.035,
    "ap_hi": 0.052,
    "ap_lo": 0.028,
    "cholesterol": 0.48,
    "gluc": 0.32,
}

def sigmoid(z: float) -> float:
    return 1 / (1 + math.exp(-z))

def get_cardio_risk_level(percentage: float) -> str:
    if percentage >= 80:
        return "very_high"
    if percentage >= 60:
        return "high"
    if percentage >= 30:
        return "medium"
    return "low"

def get_cardio_risk_message(risk_level: str, is_arabic: bool = True) -> str:
    if is_arabic:
        if risk_level == "very_high":
            return "يشير النموذج إلى وجود خطورة عالية جدًا للإصابة بأمراض القلب والأوعية الدموية بناءً على المؤشرات السريرية المدخلة."
        if risk_level == "high":
            return "يشير النموذج إلى وجود خطورة عالية للإصابة بأمراض القلب والأوعية الدموية بناءً على المؤشرات السريرية المدخلة."
        if risk_level == "medium":
            return "يشير النموذج إلى وجود خطورة متوسطة للإصابة بأمراض القلب والأوعية الدموية بناءً على المؤشرات السريرية المدخلة."
        if risk_level == "low":
            return "يشير النموذج إلى وجود خطورة منخفضة للإصابة بأمراض القلب والأوعية الدموية بناءً على المؤشرات السريرية المدخلة."
        return "تم إنشاء توقع خطورة القلب والأوعية الدموية بناءً على المؤشرات السريرية المدخلة."
    else:
        if risk_level == "very_high":
            return "The model indicates a very high cardiovascular risk based on the provided clinical indicators."
        if risk_level == "high":
            return "The model indicates a high cardiovascular risk based on the provided clinical indicators."
        if risk_level == "medium":
            return "The model indicates a moderate cardiovascular risk based on the provided clinical indicators."
        if risk_level == "low":
            return "The model indicates a low cardiovascular risk based on the provided clinical indicators."
        return "The model generated a cardiovascular risk prediction based on the provided clinical indicators."

def normalize_cholesterol(cholesterol: float) -> int:
    if cholesterol >= 240:
        return 3
    if cholesterol >= 200:
        return 2
    return 1

def normalize_glucose(glucose: float) -> int:
    if glucose >= 126:
        return 3
    if glucose >= 100:
        return 2
    return 1

def predict_cardiovascular(data: dict) -> dict:
    age = float(data.get("age", 0))
    gender_str = str(data.get("gender", "male")).lower()
    gender_value = 1 if gender_str == "male" else 0
    height = float(data.get("height", 0))
    weight = float(data.get("weight", 0))
    systolic_bp = float(data.get("systolic_bp", 0))
    diastolic_bp = float(data.get("diastolic_bp", 0))
    cholesterol = float(data.get("cholesterol", 0))
    glucose = float(data.get("glucose", 0))
    
    # is_arabic is currently not passed from frontend explicitly, but usually response messages are arabic in backend
    is_arabic = data.get("is_arabic", True)

    cholesterol_value = normalize_cholesterol(cholesterol)
    glucose_value = normalize_glucose(glucose)

    z = (
        CARDIO_COEFFICIENTS["intercept"] +
        CARDIO_COEFFICIENTS["age"] * age +
        CARDIO_COEFFICIENTS["gender"] * gender_value +
        CARDIO_COEFFICIENTS["height"] * height +
        CARDIO_COEFFICIENTS["weight"] * weight +
        CARDIO_COEFFICIENTS["ap_hi"] * systolic_bp +
        CARDIO_COEFFICIENTS["ap_lo"] * diastolic_bp +
        CARDIO_COEFFICIENTS["cholesterol"] * cholesterol_value +
        CARDIO_COEFFICIENTS["gluc"] * glucose_value
    )

    probability = sigmoid(z)
    percentage = round(probability * 100, 2)
    risk_level = get_cardio_risk_level(percentage)
    message = get_cardio_risk_message(risk_level, is_arabic)
    
    # Map back to Arabic risk levels as used in diabetes logic if necessary
    # Or keep as is, but diabetes logic returns "مرتفع" etc. Let's align with what diabetes returns for consistency in DB.
    arabic_risk_mapping = {
        "very_high": "مرتفع جدًا",
        "high": "مرتفع",
        "medium": "متوسط",
        "low": "منخفض"
    }

    return {
        "probability": float(round(probability, 4)),
        "percentage": percentage,
        "risk_level": risk_level, # DB often stores English mapping or Arabic based on what diabetes did. Let's return both or map later. We'll stick to 'risk_level' and let the view adapt if needed.
        "arabic_risk_level": arabic_risk_mapping.get(risk_level, "منخفض"),
        "message": message,
        "z_score": float(round(z, 4))
    }
