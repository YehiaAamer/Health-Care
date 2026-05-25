"""
اختبار Chatbot السريع
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, 'utf-8')

import os
backend_path = os.path.join(os.path.dirname(__file__), 'backend', 'backendfirst')
sys.path.insert(0, backend_path)
os.chdir(backend_path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backendfirst.settings')

import django
django.setup()

from api.views import _get_fallback_response

print("=" * 70)
print("اختبار Fallback Responses")
print("=" * 70)

test_questions = [
    "ازيك",
    "مرحبا",
    "ليه النسبة عالية",
    "ازاي اخفض النسبة",
    "هل ده خطير",
    "علاج السكري ايه",
    "الجلوكوز الطبيعي كام",
    "الرياضة بتساعد",
    "اكل ايه",
    "لازم اشوف طبيب",
    "سؤال عشوائي مش متوقع",
]

for question in test_questions:
    response = _get_fallback_response(question)
    print(f"\nس: {question}")
    print(f"ج: {response}")

print("\n" + "=" * 70)
print("الاختبار مكتمل!")
print("=" * 70)
