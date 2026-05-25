"""
اختبار XGBoost فقط (Medgamma معطل)
"""
import sys
import io
import os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, 'utf-8')

# إضافة backend للمسار
backend_path = os.path.join(os.path.dirname(__file__), 'backend', 'backendfirst')
sys.path.insert(0, backend_path)
os.chdir(backend_path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backendfirst.settings')

import django
django.setup()

print("=" * 70)
print("اختبار XGBoost فقط (Medgamma معطل)")
print("=" * 70)

from api.xgboost_client import predict_diabetes_xgboost, get_feature_importance

# ═══════════════════════════════════════════════════════════════
# اختبار الحالات
# ═══════════════════════════════════════════════════════════════

test_cases = [
    {
        "name": "منخفض الخطر - الحالة الطبيعية",
        "data": {
            'pregnancies': 0,
            'glucose': 85,
            'blood_pressure': 70,
            'skin_thickness': 20,
            'insulin': 50,
            'bmi': 22,
            'diabetes_pedigree_function': 0.3,
            'age': 25
        },
        "expected": "< 10%"
    },
    {
        "name": "متوسط الخطر",
        "data": {
            'pregnancies': 2,
            'glucose': 150,
            'blood_pressure': 80,
            'skin_thickness': 25,
            'insulin': 100,
            'bmi': 30.5,
            'diabetes_pedigree_function': 0.5,
            'age': 45
        },
        "expected": "50-75%"
    },
    {
        "name": "مرتفع الخطر",
        "data": {
            'pregnancies': 5,
            'glucose': 180,
            'blood_pressure': 90,
            'skin_thickness': 35,
            'insulin': 150,
            'bmi': 35,
            'diabetes_pedigree_function': 0.8,
            'age': 55
        },
        "expected": "> 75%"
    },
    {
        "name": "حالة المستخدم (السؤال الأصلي)",
        "data": {
            'pregnancies': 0,
            'glucose': 85,
            'blood_pressure': 70,
            'skin_thickness': 20,
            'insulin': 0,
            'bmi': 25,
            'diabetes_pedigree_function': 0.5,
            'age': 35
        },
        "expected": "5-10%"
    }
]

print("\n")
for i, case in enumerate(test_cases, 1):
    print(f"[{i}] {case['name']}")
    print("-" * 70)
    
    prob, risk = predict_diabetes_xgboost(case['data'])
    
    print(f"  الاحتمالية: {prob:.2f}%")
    print(f"  مستوى المخاطر: {risk}")
    print(f"  المتوقع: {case['expected']}")
    
    # التحقق من الدقة
    if "منخفض" in case['name'] or "< 10" in case['expected']:
        status = "✅" if prob < 10 else "⚠️"
    elif "مرتفع" in case['name'] or "> 75" in case['expected']:
        status = "✅" if prob >= 75 else "⚠️"
    else:
        status = "✅" if 25 <= prob <= 75 else "⚠️"
    
    print(f"  الحالة: {status}")
    print()

# ═══════════════════════════════════════════════════════════════
# أهمية الميزات
# ═══════════════════════════════════════════════════════════════

print("=" * 70)
print("أهمية الميزات في الموديل")
print("=" * 70)

importance = get_feature_importance()
for feature, score in sorted(importance.items(), key=lambda x: x[1], reverse=True):
    bar = "█" * int(score * 10)
    print(f"  {feature:25s} {score:.4f}  {bar}")

print("\n" + "=" * 70)
print("✅ الاختبار مكتمل - XGBoost فقط!")
print("=" * 70)
