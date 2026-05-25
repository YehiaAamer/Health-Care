"""
XGBoost Client for Diabetes Prediction
التنبؤ الدقيق بالسكري باستخدام XGBoost المدرب على Pima Indians Dataset
"""
import os
import joblib
import pandas as pd
from pathlib import Path
from typing import Dict, Tuple

# تحديد المسار للموديل
BASE_DIR = Path(__file__).resolve().parent.parent / 'resources'
MODEL_PATH = BASE_DIR / 'diabetes_model.pkl'
SCALER_PATH = BASE_DIR / 'scaler.pkl'


class XGBoostPredictor:
    """Singleton class for XGBoost prediction"""
    
    _instance = None
    _model = None
    _scaler = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def load_model(self):
        """تحميل الموديل والـ scaler مرة واحدة فقط"""
        if self._model is None or self._scaler is None:
            if not MODEL_PATH.exists():
                raise FileNotFoundError(
                    f"ملف الموديل غير موجود: {MODEL_PATH}\n"
                    f"يرجى تشغيل train_model.py أولاً"
                )
            
            self._model = joblib.load(MODEL_PATH)
            self._scaler = joblib.load(SCALER_PATH)
    
    def predict(self, features: Dict) -> Tuple[float, str]:
        """
        التنبؤ بالسكري باستخدام XGBoost
        
        Args:
            features: dict يحتوي على المقاييس الطبية الثمانية
            
        Returns:
            tuple: (probability, risk_level)
                - probability: نسبة الاحتمال 0-100
                - risk_level: مستوى المخاطر
        """
        self.load_model()
        
        # ترتيب الحقول زي ما الموديل متدرب
        feature_order = [
            'pregnancies',
            'glucose',
            'blood_pressure',
            'skin_thickness',
            'insulin',
            'bmi',
            'diabetes_pedigree_function',
            'age'
        ]
        
        # استخراج القيم بالترتيب الصحيح
        X = pd.DataFrame(
            [[float(features.get(f, 0)) for f in feature_order]],
            columns=[
                'Pregnancies',
                'Glucose',
                'BloodPressure',
                'SkinThickness',
                'Insulin',
                'BMI',
                'DiabetesPedigreeFunction',
                'Age'
            ]
        )
        
        # Scaling
        X_scaled = self._scaler.transform(X)
        
        # التنبؤ
        prediction_proba = self._model.predict_proba(X_scaled)[0][1]
        probability = float(prediction_proba) * 100
        
        # تحديد مستوى المخاطر بناءً على النسبة
        risk_level = self._get_risk_level(probability)
        
        return probability, risk_level
    
    def _get_risk_level(self, probability: float) -> str:
        """تحديد مستوى المخاطر بناءً على النسبة المئوية"""
        if probability < 25:
            return "منخفض"
        elif probability < 50:
            return "متوسط"
        elif probability < 75:
            return "مرتفع"
        else:
            return "مرتفع جدًا"
    
    def get_feature_importance(self) -> Dict[str, float]:
        """
        الحصول على أهمية كل ميزة في الموديل
        
        Returns:
            dict: {feature_name: importance_score}
        """
        self.load_model()
        
        feature_names = [
            'Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness',
            'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age'
        ]
        
        importance = self._model.feature_importances_
        
        return {
            name: float(score) 
            for name, score in zip(feature_names, importance)
        }


# ═══════════════════════════════════════════════════════════════
# Convenience Functions
# ═══════════════════════════════════════════════════════════════

def predict_diabetes_xgboost(features: Dict) -> Tuple[float, str]:
    """
    دالة سهلة للتنبؤ بالسكري
    
    Args:
        features: dict يحتوي على المقاييس الطبية
        
    Returns:
        tuple: (probability, risk_level)
    """
    predictor = XGBoostPredictor()
    return predictor.predict(features)


def get_feature_importance() -> Dict[str, float]:
    """الحصول على أهمية الميزات"""
    predictor = XGBoostPredictor()
    return predictor.get_feature_importance()


# ═══════════════════════════════════════════════════════════════
# Test
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, 'utf-8')
    
    # اختبار الموديل
    test_features = {
        'pregnancies': 2,
        'glucose': 150,
        'blood_pressure': 80,
        'skin_thickness': 25,
        'insulin': 100,
        'bmi': 30.5,
        'diabetes_pedigree_function': 0.5,
        'age': 45
    }
    
    prob, risk = predict_diabetes_xgboost(test_features)
    print(f"Probability: {prob:.2f}%")
    print(f"Risk Level: {risk}")
    
    print("\nFeature Importance:")
    importance = get_feature_importance()
    for feature, score in sorted(importance.items(), key=lambda x: x[1], reverse=True):
        print(f"  {feature}: {score:.4f}")
