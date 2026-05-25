"""
Simple Ollama Integration Test
"""
import requests
import json

def test_ollama_health():
    print("=" * 60)
    print("Testing Ollama Connection")
    print("=" * 60)
    
    try:
        response = requests.get("http://127.0.0.1:11434/api/tags", timeout=10)
        if response.status_code == 200:
            data = response.json()
            models = [m['name'] for m in data.get('models', [])]
            print(f"[OK] Ollama is connected")
            print(f"[OK] Available models: {len(models)}")
            for model in models:
                print(f"   - {model}")
            return True, models
        else:
            print(f"[ERROR] Status: {response.status_code}")
            return False, []
    except Exception as e:
        print(f"[ERROR] Connection failed: {e}")
        return False, []

def test_prediction(model_name):
    print("\n" + "=" * 60)
    print(f"Testing prediction with: {model_name}")
    print("=" * 60)
    
    prompt = """Patient data:
- Pregnancies: 2
- Glucose: 150 mg/dL
- Blood Pressure: 80 mmHg
- Skin Thickness: 25 mm
- Insulin: 100 mu U/ml
- BMI: 30.5
- Diabetes Pedigree Function: 0.5
- Age: 45 years

Calculate diabetes probability as percentage (0-100).

Respond in JSON only:
{"probability": <number>, "risk_level": "low|medium|high", "message": "<message>"}"""

    payload = {
        "model": model_name,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }
    
    try:
        print(f"[INFO] Processing... (may take a minute)")
        response = requests.post(
            "http://127.0.0.1:11434/api/generate",
            json=payload,
            timeout=120
        )
        
        if response.status_code == 200:
            data = response.json()
            response_text = data.get('response', '')
            
            import re
            if response_text.startswith('```'):
                json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
                if json_match:
                    response_text = json_match.group(1)
            
            try:
                result = json.loads(response_text)
                print(f"[OK] Result:")
                print(f"   Probability: {result.get('probability', 'N/A')}%")
                print(f"   Risk Level: {result.get('risk_level', 'N/A')}")
                print(f"   Message: {result.get('message', 'N/A')}")
                return True
            except:
                print(f"[WARN] Could not parse JSON:")
                print(f"   {response_text[:200]}")
                return False
        else:
            print(f"[ERROR] API Error: {response.status_code}")
            print(f"   {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"[ERROR] Timeout")
        return False
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        return False

def test_django_health():
    print("\n" + "=" * 60)
    print("Testing Django API Health")
    print("=" * 60)
    
    try:
        response = requests.get("http://localhost:8000/api/ollama/health/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"[OK] Django API connected")
            print(f"   Status: {data.get('status', 'N/A')}")
            print(f"   Message: {data.get('message', 'N/A')}")
            return True
        else:
            print(f"[WARN] Django API not available ({response.status_code})")
            return False
    except:
        print(f"[WARN] Django API not available")
        print(f"   Make sure to run: python manage.py runserver")
        return False

def main():
    # Test Ollama
    ollama_ok, models = test_ollama_health()
    
    if not ollama_ok:
        print("\n[ERROR] Ollama is not connected. Make sure it's running first.")
        return
    
    # Test available models
    results = {}
    
    for model in models[:2]:  # Test first 2 models
        results[model] = test_prediction(model)
    
    # Test Django API
    django_ok = test_django_health()
    results['Django API'] = django_ok
    
    # Summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    
    for test, passed in results.items():
        status = "[OK]" if passed else "[FAIL]"
        print(f"{status} {test}")
    
    print("\n" + "=" * 60)
    if any(results.values()):
        print("[SUCCESS] Some tests passed!")
    else:
        print("[WARN] All tests failed")
    print("=" * 60)

if __name__ == "__main__":
    main()
