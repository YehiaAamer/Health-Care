import requests
import json
import sys
import io

# Fix encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, 'utf-8')

prompt = """تحليل حالة مريض للتنبؤ بمرض السكري النوع 2:

=== بيانات المريض ===
1. عدد مرات الحمل (Pregnancies): 2
2. مستوى الجلوكوز (Glucose): 150 mg/dL
3. ضغط الدم (Blood Pressure): 80 mmHg
4. سماكة الجلد (Skin Thickness): 25 mm
5. مستوى الإنسولين (Insulin): 100 mu U/ml
6. مؤشر كتلة الجسم (BMI): 30.5
7. العامل الوراثي (Diabetes Pedigree Function): 0.5
8. العمر (Age): 45 سنة

احسب احتمالية الإصابة بالسكري كنسبة مئوية 0-100."""

system_prompt = """أنت طبيب خبير في الغدد الصماء والسكري.

ارصد ONLY بصيغة JSON:
{
    "probability": <عدد من 0 إلى 100>,
    "risk_level": "<منخفض|متوسط|مرتفع|مرتفع جدًا>",
    "message": "<رسالة طبية بالعربية>"
}"""

payload = {
    "model": "MedAIBase/MedGemma1.5:4b",
    "prompt": prompt,
    "system": system_prompt,
    "stream": False,
    "format": "json"
}

response = requests.post(
    "http://127.0.0.1:11434/api/generate",
    json=payload,
    timeout=120
)

if response.status_code == 200:
    data = response.json()
    response_text = data.get('response', '')
    
    print("=" * 70)
    print("RAW RESPONSE:")
    print("=" * 70)
    print(response_text)
    print()
    print("=" * 70)
    print("REPR:")
    print("=" * 70)
    print(repr(response_text))
