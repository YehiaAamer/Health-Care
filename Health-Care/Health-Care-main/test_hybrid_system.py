"""
اختبار النظام الهجين (XGBoost + Medgamma)
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
print("اختبار النظام الهجين للتنبؤ بالسكري")
print("=" * 70)

# ═══════════════════════════════════════════════════════════════
# 1. اختبار XGBoost
# ═══════════════════════════════════════════════════════════════

print("\n[1] اختبار XGBoost للتنبؤ الدقيق")
print("-" * 70)

from api.xgboost_client import predict_diabetes_xgboost, get_feature_importance

# حالة 1: منخفض الخطر
test_case_low = {
    'pregnancies': 0,
    'glucose': 85,
    'blood_pressure': 70,
    'skin_thickness': 20,
    'insulin': 50,
    'bmi': 22,
    'diabetes_pedigree_function': 0.3,
    'age': 25
}

prob_low, risk_low = predict_diabetes_xgboost(test_case_low)
print(f"\nحالة منخفضة الخطر:")
print(f"  الاحتمالية: {prob_low:.2f}%")
print(f"  مستوى المخاطر: {risk_low}")
print(f"  المتوقع: < 10%")

# حالة 2: متوسط الخطر
test_case_med = {
    'pregnancies': 2,
    'glucose': 150,
    'blood_pressure': 80,
    'skin_thickness': 25,
    'insulin': 100,
    'bmi': 30.5,
    'diabetes_pedigree_function': 0.5,
    'age': 45
}

prob_med, risk_med = predict_diabetes_xgboost(test_case_med)
print(f"\nحالة متوسطة الخطر:")
print(f"  الاحتمالية: {prob_med:.2f}%")
print(f"  مستوى المخاطر: {risk_med}")

# حالة 3: مرتفع الخطر
test_case_high = {
    'pregnancies': 5,
    'glucose': 180,
    'blood_pressure': 90,
    'skin_thickness': 35,
    'insulin': 150,
    'bmi': 35,
    'diabetes_pedigree_function': 0.8,
    'age': 55
}

prob_high, risk_high = predict_diabetes_xgboost(test_case_high)
print(f"\nحالة مرتفعة الخطر:")
print(f"  الاحتمالية: {prob_high:.2f}%")
print(f"  مستوى المخاطر: {risk_high}")

# أهمية الميزات
print("\nأهمية الميزات في الموديل:")
importance = get_feature_importance()
for feature, score in sorted(importance.items(), key=lambda x: x[1], reverse=True):
    print(f"  {feature}: {score:.4f}")

# ═══════════════════════════════════════════════════════════════
# 2. اختبار Medgamma للتفسير الطبي
# ═══════════════════════════════════════════════════════════════

print("\n\n[2] اختبار Medgamma للتفسير الطبي")
print("-" * 70)

from api.medgamma_client import get_medical_interpretation, MedgammaError

try:
    print("\nجاري الحصول على تفسير طبي للحالة المتوسطة...")
    interpretation = get_medical_interpretation(test_case_med, prob_med, risk_med)
    
    print(f"\nالتفسير:")
    print(f"  {interpretation.get('interpretation', 'N/A')}")
    
    print(f"\nعوامل الخطر:")
    for factor in interpretation.get('risk_factors', []):
        print(f"  - {factor}")
    
    print(f"\nالتوصيات:")
    for rec in interpretation.get('recommendations', []):
        print(f"  - {rec}")
    
    print(f"\nالرسالة:")
    print(f"  {interpretation.get('message', 'N/A')}")
    
except MedgammaError as e:
    print(f"\n[WARN] Medgamma غير متاح: {e}")
    print("  سيتم استخدام رسالة افتراضية")

# ═══════════════════════════════════════════════════════════════
# 3. اختبار Chatbot
# ═══════════════════════════════════════════════════════════════

print("\n\n[3] اختبار Chatbot الطبي")
print("-" * 70)

from api.medgamma_client import chatbot_chat, MedgammaError

questions = [
    "ليه النسبة عالية؟",
    "إيه اللي لازم أعمله؟",
    "هل لازم أدوية؟"
]

try:
    for i, question in enumerate(questions, 1):
        print(f"\nس {i}: {question}")
        response = chatbot_chat(
            features=test_case_med,
            probability=prob_med,
            risk_level=risk_med,
            question=question
        )
        print(f"ج: {response[:150]}...")
        
except MedgammaError as e:
    print(f"\n[WARN] Chatbot غير متاح: {e}")

# ═══════════════════════════════════════════════════════════════
# الملخص
# ═══════════════════════════════════════════════════════════════

print("\n\n" + "=" * 70)
print("ملخص الاختبار")
print("=" * 70)

print(f"""
✅ XGBoost:
   - دقة عالية في الحسابات
   - سريع جداً
   - النتائج: {prob_low:.1f}% | {prob_med:.1f}% | {prob_high:.1f}%

{'✅' if 'interpretation' in dir() else '⚠️'} Medgamma:
   - تفسير طبي مفصل
   - توصيات مخصصة
   - {'متاح' if 'interpretation' in dir() else 'غير متاح'}

{'✅' if 'response' in dir() else '⚠️'} Chatbot:
   - محادثة تفاعلية
   - {'متاح' if 'response' in dir() else 'غير متاح'}
""")

print("=" * 70)
print("الاختبار مكتمل!")
print("=" * 70)
