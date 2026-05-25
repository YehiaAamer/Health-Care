"""
Medgamma Client for Medical Interpretation & Chatbot
التفسير الطبي والمحادثة باستخدام Medgamma عبر Ollama
"""
import os
import json
import requests
from django.conf import settings
from typing import Dict, List, Optional

# ═══════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════

OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'http://127.0.0.1:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'MedAIBase/MedGemma1.5:4b')

# Fallback models
FALLBACK_MODELS = ['medllama2:latest', 'gemma3:4b']

# ═══════════════════════════════════════════════════════════════
# Medical Interpretation Prompts
# ═══════════════════════════════════════════════════════════════

INTERPRETATION_PROMPT = """You are an expert endocrinologist. 

Given the patient's data and diabetes risk probability from XGBoost model, provide:
1. A brief interpretation of the result
2. Key risk factors present
3. Personalized medical recommendations

Patient Data:
- Pregnancies: {pregnancies}
- Glucose: {glucose} mg/dL
- Blood Pressure: {blood_pressure} mmHg
- Skin Thickness: {skin_thickness} mm
- Insulin: {insulin} mu U/ml
- BMI: {bmi}
- Diabetes Pedigree Function: {diabetes_pedigree_function}
- Age: {age} years

XGBoost Prediction:
- Probability: {probability}%
- Risk Level: {risk_level}

Respond in JSON format ONLY:
{{
  "interpretation": "<brief medical interpretation in Arabic>",
  "risk_factors": ["<factor1>", "<factor2>", ...],
  "recommendations": ["<recommendation1>", "<recommendation2>", ...],
  "message": "<concise summary message in Arabic>"
}}"""

# ═══════════════════════════════════════════════════════════════
# Chatbot Prompts
# ═══════════════════════════════════════════════════════════════

CHATBOT_SYSTEM_PROMPT = """أنت مساعد طبي ذكي.

القواعد:
1. **أجب مباشرة على سؤال المستخدم أولاً**
2. استخدم بيانات المريض فقط للتوضيح إذا لزم الأمر
3. إجابات مختصرة (20-40 كلمة)
4. لغة عربية واضحة
5. ذكّر باستشارة الطبيب في النهاية
"""

CHATBOT_USER_PROMPT = """سؤال المريض: {question}

---
معلومات المريض (للرجوع إليها فقط إذا لزم الأمر):
- الجلوكوز: {glucose} mg/dL
- BMI: {bmi}
- العمر: {age} سنة
- نتيجة التحليل: {probability}% ({risk_level})
---

أجب على السؤال مباشرة:"""

# ═══════════════════════════════════════════════════════════════
# Custom Exceptions
# ═══════════════════════════════════════════════════════════════

class MedgammaError(Exception):
    """خطأ في التواصل مع Medgamma"""
    pass


class OllamaConnectionError(MedgammaError):
    """خطأ في الاتصال بـ Ollama"""
    pass


class OllamaModelError(MedgammaError):
    """خطأ في الموديل أو الاستجابة"""
    pass


# ═══════════════════════════════════════════════════════════════
# Medical Interpretation Function
# ═══════════════════════════════════════════════════════════════

def get_medical_interpretation(features: Dict, probability: float, risk_level: str) -> Dict:
    """
    الحصول على تفسير طبي من Medgamma
    
    Args:
        features: dict يحتوي على المقاييس الطبية
        probability: نسبة الاحتمال من XGBoost
        risk_level: مستوى المخاطر من XGBoost
        
    Returns:
        dict: {
            "interpretation": str,
            "risk_factors": List[str],
            "recommendations": List[str],
            "message": str
        }
    """
    prompt = INTERPRETATION_PROMPT.format(
        pregnancies=features.get('pregnancies', 0),
        glucose=features.get('glucose', 85),
        blood_pressure=features.get('blood_pressure', 70),
        skin_thickness=features.get('skin_thickness', 20),
        insulin=features.get('insulin', 0),
        bmi=features.get('bmi', 25),
        diabetes_pedigree_function=features.get('diabetes_pedigree_function', 0.5),
        age=features.get('age', 35),
        probability=probability,
        risk_level=risk_level
    )
    
    result = _call_ollama_json(OLLAMA_MODEL, prompt, timeout=120)  # 120 ثانية
    
    return {
        "interpretation": result.get('interpretation', ''),
        "risk_factors": result.get('risk_factors', []),
        "recommendations": result.get('recommendations', []),
        "message": result.get('message', ''),
        "probability": probability,
        "risk_level": risk_level
    }


# ═══════════════════════════════════════════════════════════════
# Chatbot Function
# ═══════════════════════════════════════════════════════════════

def chatbot_chat(features: Dict, probability: float, risk_level: str,
                question: str, conversation_history: Optional[List[Dict]] = None) -> str:
    """
    محادثة مع Chatbot الطبي - نسخة سريعة
    
    Args:
        features: dict يحتوي على المقاييس الطبية
        probability: نسبة الاحتمال من XGBoost
        risk_level: مستوى المخاطر من XGBoost
        question: سؤال المستخدم
        conversation_history: تاريخ المحادثة (اختياري)
        
    Returns:
        str: رد الموديل
    """
    user_prompt = CHATBOT_USER_PROMPT.format(
        glucose=features.get('glucose', 85),
        blood_pressure=features.get('blood_pressure', 70),
        bmi=features.get('bmi', 25),
        age=features.get('age', 35),
        probability=probability,
        risk_level=risk_level,
        question=question
    )
    
    # تجاهل conversation history للسرعة (للمرة الأولى)
    result = _call_ollama_text(
        OLLAMA_MODEL,
        user_prompt,
        CHATBOT_SYSTEM_PROMPT,
        timeout=30  # 30 ثانية فقط - أسرع
    )
    
    return result


# ═══════════════════════════════════════════════════════════════
# Internal Helper Functions
# ═══════════════════════════════════════════════════════════════

def _call_ollama_json(model: str, prompt: str, timeout: int = 60) -> Dict:
    """استدعاء Ollama مع توقع استجابة JSON"""
    
    url = f"{OLLAMA_HOST.rstrip('/')}/api/generate"
    
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.3,
            "top_p": 0.9,
            "num_predict": 512,
        }
    }
    
    try:
        response = requests.post(
            url,
            json=payload,
            timeout=timeout,
            headers={"Content-Type": "application/json"}
        )
    except requests.exceptions.Timeout:
        raise OllamaConnectionError(f"انتهت مهلة الاتصال ({timeout} ثانية)")
    except requests.exceptions.ConnectionError:
        raise OllamaConnectionError(f"فشل الاتصال بـ Ollama على {OLLAMA_HOST}")
    except requests.exceptions.RequestException as e:
        raise OllamaConnectionError(f"خطأ في الاتصال: {str(e)}")
    
    if response.status_code != 200:
        try:
            error_data = response.json()
            error_msg = error_data.get('error', response.text)
        except:
            error_msg = response.text
        raise OllamaModelError(f"Ollama API error ({response.status_code}): {error_msg}")
    
    try:
        response_data = response.json()
    except json.JSONDecodeError as e:
        raise OllamaModelError(f"استجابة غير صحيحة من Ollama: {str(e)}")
    
    if 'response' not in response_data:
        raise OllamaModelError("الاستجابة لا تحتوي على حقل 'response'")
    
    response_text = response_data['response'].strip()
    
    # استخراج JSON من response
    try:
        import re
        if response_text.startswith('```'):
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)
        
        result = json.loads(response_text)
        return result
        
    except json.JSONDecodeError as e:
        raise OllamaModelError(f"فشل تحليل JSON: {str(e)}")


def _call_ollama_text(model: str, prompt: str, system: str = None, timeout: int = 60) -> str:
    """استدعاء Ollama مع توقع استجابة نصية"""
    
    url = f"{OLLAMA_HOST.rstrip('/')}/api/generate"
    
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.5,
            "top_p": 0.9,
            "num_predict": 256,
        }
    }
    
    if system:
        payload['system'] = system
    
    try:
        response = requests.post(
            url,
            json=payload,
            timeout=timeout,
            headers={"Content-Type": "application/json"}
        )
    except requests.exceptions.Timeout:
        raise OllamaConnectionError(f"انتهت مهلة الاتصال ({timeout} ثانية)")
    except requests.exceptions.ConnectionError:
        raise OllamaConnectionError(f"فشل الاتصال بـ Ollama على {OLLAMA_HOST}")
    except requests.exceptions.RequestException as e:
        raise OllamaConnectionError(f"خطأ في الاتصال: {str(e)}")
    
    if response.status_code != 200:
        try:
            error_data = response.json()
            error_msg = error_data.get('error', response.text)
        except:
            error_msg = response.text
        raise OllamaModelError(f"Ollama API error ({response.status_code}): {error_msg}")
    
    try:
        response_data = response.json()
    except json.JSONDecodeError as e:
        raise OllamaModelError(f"استجابة غير صحيحة من Ollama: {str(e)}")
    
    if 'response' not in response_data:
        raise OllamaModelError("الاستجابة لا تحتوي على حقل 'response'")
    
    return response_data['response'].strip()


# ═══════════════════════════════════════════════════════════════
# Health Check
# ═══════════════════════════════════════════════════════════════

def check_ollama_health() -> Dict:
    """
    التحقق من صحة اتصال Ollama
    
    Returns:
        dict: {"status": "ok"|"error", "message": str, "models": list}
    """
    try:
        response = requests.get(f"{OLLAMA_HOST}/api/tags", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            models = [m.get('name', '') for m in data.get('models', [])]
            
            return {
                "status": "ok",
                "message": "Ollama متصل بنجاح",
                "models": models,
                "model_available": OLLAMA_MODEL in models or any(OLLAMA_MODEL.split(':')[0] in m for m in models)
            }
        else:
            return {
                "status": "error",
                "message": f"Ollama API error: {response.status_code}"
            }
            
    except requests.exceptions.ConnectionError:
        return {
            "status": "error",
            "message": f"لا يمكن الاتصال بـ Ollama على {OLLAMA_HOST}"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
