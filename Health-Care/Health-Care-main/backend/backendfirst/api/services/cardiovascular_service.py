import os
import math
from pathlib import Path
import joblib
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / 'resources' / 'cardio_model.pkl'
SCALER_PATH = BASE_DIR / 'resources' / 'cardio_scaler.pkl'

_model = None
_scaler = None


def load_cardio_model():
    global _model, _scaler

    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Cardio model file not found: {MODEL_PATH}")
        _model = joblib.load(MODEL_PATH)

    if _scaler is None:
        if not SCALER_PATH.exists():
            raise FileNotFoundError(f"Cardio scaler file not found: {SCALER_PATH}")
        _scaler = joblib.load(SCALER_PATH)

    return _model, _scaler


def normalize_gender(gender: str) -> int:
    value = str(gender or "male").strip().lower()

    # Cardio dataset usually uses:
    # 1 = female
    # 2 = male
    if value in ["male", "m", "ذكر", "man"]:
        return 2

    if value in ["female", "f", "أنثى", "انثى", "woman"]:
        return 1

    return 2


def normalize_cholesterol(cholesterol: float) -> int:
    # Frontend sends mg/dL, but trained dataset expects category 1/2/3
    cholesterol = float(cholesterol or 0)

    if cholesterol >= 240:
        return 3
    if cholesterol >= 200:
        return 2
    return 1


def normalize_glucose(glucose: float) -> int:
    # Frontend sends mg/dL, but trained dataset expects category 1/2/3
    glucose = float(glucose or 0)

    if glucose >= 126:
        return 3
    if glucose >= 100:
        return 2
    return 1


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
        return "يشير النموذج إلى وجود خطورة منخفضة للإصابة بأمراض القلب والأوعية الدموية بناءً على المؤشرات السريرية المدخلة."

    if risk_level == "very_high":
        return "The model indicates a very high cardiovascular risk based on the provided clinical indicators."
    if risk_level == "high":
        return "The model indicates a high cardiovascular risk based on the provided clinical indicators."
    if risk_level == "medium":
        return "The model indicates a moderate cardiovascular risk based on the provided clinical indicators."
    return "The model indicates a low cardiovascular risk based on the provided clinical indicators."


def predict_cardiovascular(data: dict) -> dict:
    # Combine both versions (caching/fallbacks for production + logging/diagnostics for verification)
    model, scaler = load_cardio_model()

    age = float(data.get("age", data.get("Age", 35)))
    gender_raw = data.get("gender", data.get("Gender", "male"))
    
    if isinstance(gender_raw, str):
        gender = normalize_gender(gender_raw)
    else:
        gender = float(gender_raw)

    height = float(data.get("height", data.get("Height", 170)))
    weight = float(data.get("weight", data.get("Weight", 70)))
    
    systolic_bp = float(data.get("systolic_bp", data.get("Systolic BP", data.get("systolicBloodPressure", 120))))
    diastolic_bp = float(data.get("diastolic_bp", data.get("Diastolic BP", data.get("diastolicBloodPressure", 80))))

    # Support raw cholesterol and glucose values (converting to 1/2/3) or directly categorized ones
    cholesterol_raw = data.get("cholesterol", data.get("Cholesterol", 180))
    try:
        chol_float = float(cholesterol_raw)
        if chol_float > 3:
            cholesterol = normalize_cholesterol(chol_float)
        else:
            cholesterol = int(chol_float)
    except Exception:
        cholesterol = normalize_cholesterol(180)

    glucose_raw = data.get("glucose", data.get("Glucose", 85))
    try:
        gluc_float = float(glucose_raw)
        if gluc_float > 3:
            glucose = normalize_glucose(gluc_float)
        else:
            glucose = int(gluc_float)
    except Exception:
        glucose = normalize_glucose(85)

    is_arabic = bool(data.get("is_arabic", data.get("isArabic", True)))

    features = np.array([[
        age,
        float(gender),
        height,
        weight,
        systolic_bp,
        diastolic_bp,
        float(cholesterol),
        float(glucose),
    ]])

    # Print logs from deployment verification
    try:
        print("--- DEPLOYMENT VERIFICATION LOG ---")
        print(f"Loaded model path: {MODEL_PATH}")
        if MODEL_PATH.exists():
            print(f"Model File Timestamp: {os.path.getmtime(MODEL_PATH)}")
        print(f"Loaded scaler path: {SCALER_PATH}")
        print(f"Model type: {type(model)}")
        print(f"Scaler class: {type(scaler)}")
        print(f"Prediction probability source: LogisticRegression model via joblib")
        print(f"Feature vector before scaling: {features}")
    except Exception as e:
        print(f"Logging warning: {e}")

    features_scaled = scaler.transform(features)
    probability = float(model.predict_proba(features_scaled)[0, 1])

    print(f"Feature vector after scaling: {features_scaled}")
    print(f"Final probability: {probability}")
    print("-----------------------------------")

    percentage = round(probability * 100, 2)
    risk_level = get_cardio_risk_level(percentage)
    message = get_cardio_risk_message(risk_level, is_arabic)

    arabic_risk_mapping = {
        "very_high": "مرتفع جدًا",
        "high": "مرتفع",
        "medium": "متوسط",
        "low": "منخفض",
    }

    return {
        "probability": round(probability, 4),
        "percentage": percentage,
        "risk_level": risk_level,
        "arabic_risk_level": arabic_risk_mapping.get(risk_level, "منخفض"),
        "message": message,
        "z_score": 0.0,
    }
