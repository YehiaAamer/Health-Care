import os
import joblib
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / 'resources' / 'cardio_model.pkl'
SCALER_PATH = BASE_DIR / 'resources' / 'cardio_scaler.pkl'

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
    gender_raw = data.get("gender", 1)
    if isinstance(gender_raw, str):
        gender_raw = 1 if gender_raw.lower() in ['male', '1'] else 2
    gender = float(gender_raw)
    
    height = float(data.get("height", 0))
    weight = float(data.get("weight", 0))
    systolic_bp = float(data.get("systolic_bp", 0))
    diastolic_bp = float(data.get("diastolic_bp", 0))
    cholesterol_raw = float(data.get("cholesterol", 0))
    glucose_raw = float(data.get("glucose", 0))
    
    cholesterol_value = float(normalize_cholesterol(cholesterol_raw))
    glucose_value = float(normalize_glucose(glucose_raw))
    
    is_arabic = data.get("is_arabic", True)

    features = np.array([[age, gender, height, weight, systolic_bp, diastolic_bp, cholesterol_value, glucose_value]])
    
    # Load model and scaler to ensure no cache
    fresh_model = joblib.load(MODEL_PATH)
    fresh_scaler = joblib.load(SCALER_PATH)
    
    features_scaled = fresh_scaler.transform(features)
    probability = fresh_model.predict_proba(features_scaled)[0, 1]
    
    print("--- DEPLOYMENT VERIFICATION LOG ---")
    print(f"Loaded model path: {MODEL_PATH}")
    print(f"Model File Timestamp: {os.path.getmtime(MODEL_PATH)}")
    print(f"Loaded scaler path: {SCALER_PATH}")
    print(f"Model type: {type(fresh_model)}")
    print(f"Scaler class: {type(fresh_scaler)}")
    print(f"Prediction probability source: LogisticRegression model via joblib")
    print(f"Feature vector before scaling: {features}")
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
        "low": "منخفض"
    }

    return {
        "probability": float(round(probability, 4)),
        "percentage": percentage,
        "risk_level": risk_level,
        "arabic_risk_level": arabic_risk_mapping.get(risk_level, "منخفض"),
        "message": message,
        "z_score": 0.0
    }
