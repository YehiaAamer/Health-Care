"""
اختبار تكامل Medgamma1.5:4b عبر Ollama
تشغيل هذا السكريبت للتحقق من أن النظام يعمل بشكل صحيح
"""
import os
import sys
import django

# إضافة backend إلى المسار
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# إعداد Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backendfirst.backendfirst.settings')
django.setup()

from backendfirst.api.medgamma_client import predict_via_medgamma, check_ollama_health

def test_ollama_connection():
    """اختبار اتصال Ollama"""
    print("=" * 60)
    print("🔌 اختبار اتصال Ollama")
    print("=" * 60)
    
    health = check_ollama_health()
    
    print(f"الحالة: {health.get('status')}")
    print(f"الرسالة: {health.get('message')}")
    print(f"الموديلات المتاحة: {health.get('models', [])}")
    print(f"الموديل مطلوب: {health.get('model_available', False)}")
    
    if health.get('status') == 'ok':
        print("✅ اتصال Ollama ناجح")
        return True
    else:
        print("❌ فشل اتصال Ollama")
        return False

def test_prediction():
    """اختبار التنبؤ بالسكري"""
    print("\n" + "=" * 60)
    print("🔮 اختبار التنبؤ بالسكري")
    print("=" * 60)
    
    # بيانات اختبارية
    test_features = {
        "pregnancies": 2,
        "glucose": 150,
        "blood_pressure": 80,
        "skin_thickness": 25,
        "insulin": 100,
        "bmi": 30.5,
        "diabetes_pedigree_function": 0.5,
        "age": 45
    }
    
    print(f"بيانات الإدخال: {test_features}")
    print("\n⏳ جاري المعالجة... (قد يستغرق دقيقة أو دقيقتين)")
    
    try:
        result = predict_via_medgamma(test_features, timeout=120)
        
        print("\n✅ النتيجة:")
        print(f"  - الاحتمالية: {result.get('probability'):.2f}%")
        print(f"  - مستوى المخاطر: {result.get('risk_level')}")
        print(f"  - الرسالة: {result.get('message')}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ خطأ في التنبؤ: {str(e)}")
        return False

def test_api_endpoint():
    """اختبار API endpoint مباشرة"""
    print("\n" + "=" * 60)
    print("🌐 اختبار API Endpoint")
    print("=" * 60)
    
    import requests
    
    api_url = "http://127.0.0.1:8000/api/ollama/health/"
    
    try:
        response = requests.get(api_url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ استجابة API ناجحة")
            print(f"  الحالة: {data.get('status')}")
            print(f"  الرسالة: {data.get('message')}")
            return True
        else:
            print(f"❌ خطأ API: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ لا يمكن الاتصال بـ API على {api_url}")
        print("   تأكد من تشغيل Django server: python manage.py runserver")
        return False
    except Exception as e:
        print(f"❌ خطأ: {str(e)}")
        return False

def main():
    """الوظيفة الرئيسية"""
    print("\n" + "🎯 " * 20)
    print("اختبار تكامل Medgamma1.5:4b عبر Ollama")
    print("🎯 " * 20 + "\n")
    
    results = {
        "اتصال Ollama": test_ollama_connection(),
        "التنبؤ بالسكري": test_prediction(),
        "API Endpoint": test_api_endpoint()
    }
    
    print("\n" + "=" * 60)
    print("📊 ملخص النتائج")
    print("=" * 60)
    
    for test, passed in results.items():
        status = "✅ ناجح" if passed else "❌ فشل"
        print(f"{test}: {status}")
    
    all_passed = all(results.values())
    
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 جميع الاختبارات ناجحة!")
    else:
        print("⚠️ بعض الاختبارات فشلت")
        print("\n💡 الحلول المقترحة:")
        print("   1. تأكد من تشغيل Ollama: ollama serve")
        print("   2. تأكد من وجود الموديل: ollama list")
        print("   3. تأكد من تشغيل Django: python manage.py runserver")
    print("=" * 60)
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
