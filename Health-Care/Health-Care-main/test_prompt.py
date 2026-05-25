# -*- coding: utf-8 -*-
import requests
import json
import sys
import io

# Fix encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, 'utf-8')

# بيانات اختبار
test_cases = [
    {
        "name": "Medium Risk Case",
        "data": {
            "pregnancies": 2,
            "glucose": 150,
            "blood_pressure": 80,
            "skin_thickness": 25,
            "insulin": 100,
            "bmi": 30.5,
            "diabetes_pedigree_function": 0.5,
            "age": 45
        }
    },
    {
        "name": "Low Risk Case",
        "data": {
            "pregnancies": 1,
            "glucose": 85,
            "blood_pressure": 70,
            "skin_thickness": 20,
            "insulin": 50,
            "bmi": 22,
            "diabetes_pedigree_function": 0.3,
            "age": 25
        }
    },
    {
        "name": "High Risk Case",
        "data": {
            "pregnancies": 5,
            "glucose": 180,
            "blood_pressure": 90,
            "skin_thickness": 35,
            "insulin": 150,
            "bmi": 35,
            "diabetes_pedigree_function": 0.8,
            "age": 55
        }
    }
]

SYSTEM_PROMPT = """أنت طبيب خبير في الغدد الصماء والسكري (Endocrinologist) متخصص في التنبؤ المبكر بمرض السكري النوع 2.

استخدم المعايير الطبية التالية لتحليل البيانات:

## القيم الطبيعية:
- Glucose (صائم): 70-99 mg/dL (طبيعي), 100-125 (مقدمات سكري), 126+ (سكري محتمل)
- Blood Pressure: أقل من 120/80 (طبيعي), 120-129/80-84 (مرتفع قليلاً), 130+/85+ (مرتفع)
- BMI: 18.5-24.9 (طبيعي), 25-29.9 (زيادة وزن), 30+ (سمنة)
- Insulin (صائم): 2.6-24.9 mu U/ml (طبيعي), 25+ (مقاومة إنسولين)
- Skin Thickness: 20-30mm (طبيعي), 35+ (قد يشير لمقاومة إنسولين)
- Age: الخطر يزداد بعد 45 سنة
- Pregnancies: 3+ حمل يزيد الخطر
- Diabetes Pedigree Function: 0.5+ يشير لخطر وراثي

## ارصد ONLY بصيغة JSON:
{
    "probability": <عدد من 0 إلى 100>,
    "risk_level": "<منخفض|متوسط|مرتفع|مرتفع جدًا>",
    "message": "<رسالة طبية بالعربية>"
}

## معايير تحديد المستوى:
- منخفض (أخضر): probability < 25%
- متوسط (أصفر): 25% ≤ probability < 50%
- مرتفع (برتقالي): 50% ≤ probability < 75%
- مرتفع جدًا (أحمر): probability ≥ 75%

كن دقيقاً في حسابك بناءً على تفاعل جميع العوامل."""

for case in test_cases:
    print("=" * 70)
    print(f"Test: {case['name']}")
    print("=" * 70)
    
    prompt = f"""تحليل حالة مريض للتنبؤ بمرض السكري النوع 2:

=== بيانات المريض ===
1. عدد مرات الحمل (Pregnancies): {case['data']['pregnancies']}
2. مستوى الجلوكوز (Glucose): {case['data']['glucose']} mg/dL
3. ضغط الدم (Blood Pressure): {case['data']['blood_pressure']} mmHg
4. سماكة الجلد (Skin Thickness): {case['data']['skin_thickness']} mm
5. مستوى الإنسولين (Insulin): {case['data']['insulin']} mu U/ml
6. مؤشر كتلة الجسم (BMI): {case['data']['bmi']}
7. العامل الوراثي (Diabetes Pedigree Function): {case['data']['diabetes_pedigree_function']}
8. العمر (Age): {case['data']['age']} سنة

احسب احتمالية الإصابة بالسكري كنسبة مئوية 0-100 بدقة."""

    payload = {
        "model": "MedAIBase/MedGemma1.5:4b",
        "prompt": prompt,
        "system": SYSTEM_PROMPT,
        "stream": False,
        "format": "json"
    }
    
    try:
        print("Processing...")
        response = requests.post(
            "http://127.0.0.1:11434/api/generate",
            json=payload,
            timeout=120
        )
        
        if response.status_code == 200:
            data = response.json()
            response_text = data.get('response', '')
            
            # Extract JSON
            import re
            if response_text.startswith('```'):
                json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
                if json_match:
                    response_text = json_match.group(1)
            
            try:
                result = json.loads(response_text)
                print(f"\nResult:")
                print(f"  Probability: {result.get('probability', 'N/A')}%")
                print(f"  Risk Level: {result.get('risk_level', 'N/A')}")
                msg = result.get('message', 'N/A')
                if len(str(msg)) > 100:
                    msg = str(msg)[:100] + "..."
                print(f"  Message: {msg}")
            except Exception as e:
                print(f"JSON Parse Error: {e}")
                print(f"Response: {response_text[:200]}")
        else:
            print(f"API Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"Error: {e}")
    
    print()
