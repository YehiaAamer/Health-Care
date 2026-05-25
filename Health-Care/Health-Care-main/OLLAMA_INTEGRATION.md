# 🔮 Medgamma Integration via Ollama

## نظرة عامة

تم تحديث النظام لاستخدام **Medgamma1.5:4b** (أو أي موديل طبي متاح) عبر **Ollama** مباشرةً بدلاً من المعادلات البسيطة أو الموديلات المحلية.

---

## 🏗️ البنية الجديدة

```
Frontend (React)
    ↓
Backend (Django)
    ↓
Ollama API (localhost:11434)
    ↓
Medgamma1.5:4b Model (أو medllama2:latest كبديل)
```

---

## ⚙️ الإعدادات

### 1. تثبيت Ollama

تأكد من تثبيت Ollama على جهازك:
- Windows: https://ollama.com/download
- اتبع تعليمات التثبيت

### 2. تحميل الموديل

```bash
# تحميل Medgamma1.5:4b (يحتاج 8.8GB RAM)
ollama pull MedAIBase/MedGemma1.5:4b

# أو تحميل medllama2:latest (أخف - 3.8GB)
ollama pull medllama2:latest
```

### 3. التحقق من الموديلات المتاحة

```bash
ollama list
```

يجب أن ترى شيئاً مثل:
```
NAME                        ID              SIZE      MODIFIED
MedAIBase/MedGemma1.5:4b    f63a34b07cb0    7.8 GB    11 days ago
medllama2:latest            a53737ec0c72    3.8 GB    3 months ago
```

### 4. تشغيل Ollama

```bash
ollama serve
```

عادةً Ollama بيشغل كـ background service تلقائياً.

### 5. تحديث ملف `.env`

```env
# Medgamma / Ollama Configuration
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=MedAIBase/MedGemma1.5:4b

# إذا كان RAM غير كافٍ، استخدم الموديل الأخف
# OLLAMA_MODEL=medllama2:latest
```

---

## 🧪 الاختبار

### اختبار اتصال Ollama

```bash
curl http://127.0.0.1:11434/api/tags
```

### اختبار التنبؤ مباشرة

```bash
curl -X POST http://127.0.0.1:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "MedAIBase/MedGemma1.5:4b",
    "prompt": "مريض: جلوكوز 150, عمر 45, حامل مرتين. احسب احتمالية السكري",
    "stream": false,
    "format": "json"
  }'
```

### اختبار API الخاص بك

```bash
# التحقق من حالة Ollama
curl http://localhost:8000/api/ollama/health/

# إجراء تنبؤ
curl -X POST http://localhost:8000/api/predict/ \
  -H "Content-Type: application/json" \
  -d '{
    "pregnancies": 2,
    "glucose": 150,
    "blood_pressure": 80,
    "skin_thickness": 25,
    "insulin": 100,
    "bmi": 30.5,
    "diabetes_pedigree_function": 0.5,
    "age": 45
  }'
```

---

## 📊 الموديلات المتاحة

### 1. Medgamma1.5:4b (الأفضل)
- **الحجم**: 7.8 GB
- **الذاكرة المطلوبة**: 8.8 GB
- **الدقة**: عالية جداً
- **التخصص**: طبي عام

### 2. medllama2:latest (البديل)
- **الحجم**: 3.8 GB
- **الذاكرة المطلوبة**: 4-5 GB
- **الدقة**: جيدة
- **التخصص**: طبي عام

### 3. gemma3:4b (احتياطي)
- **الحجم**: 3.3 GB
- **الذاكرة المطلوبة**: 4 GB
- **الدقة**: جيدة
- **التخصص**: عام

---

## 🔄 آلية العمل

### 1. المستخدم يرسل البيانات

```json
{
  "pregnancies": 2,
  "glucose": 150,
  "blood_pressure": 80,
  "skin_thickness": 25,
  "insulin": 100,
  "bmi": 30.5,
  "diabetes_pedigree_function": 0.5,
  "age": 45
}
```

### 2. Backend يبني الـ Prompt

```python
SYSTEM_PROMPT = """أنت طبيب ذكاء اصطناعي متخصص في التنبؤ المبكر بمرض السكري..."""

USER_PROMPT = """بيانات المريض:
- عدد مرات الحمل: 2
- مستوى الجلوكوز: 150 mg/dL
- ...
احسب احتمالية الإصابة بالسكري"""
```

### 3. إرسال إلى Ollama

```python
response = requests.post(
    "http://127.0.0.1:11434/api/generate",
    json={
        "model": "MedAIBase/MedGemma1.5:4b",
        "prompt": user_prompt,
        "system": system_prompt,
        "format": "json"
    }
)
```

### 4. استجابة الموديل

```json
{
  "probability": 45.5,
  "risk_level": "متوسط",
  "message": "بناءً على البيانات، هناك احتمالية متوسطة..."
}
```

### 5. حفظ وعرض النتيجة

- حفظ في قاعدة البيانات
- عرض على المستخدم

---

## 🎯 الميزات

### ✅ التنبؤ الدقيق
- لا يعتمد على معادلات بسيطة
- يستخدم نموذج ذكاء اصطناعي طبي مدرب

### ✅ المرونة
- دعم موديلات متعددة
- Fallback تلقائي إذا فشل الموديل الأساسي

### ✅ الشفافية
- عرض الموديل المستخدم في الاستجابة
- رسائل خطأ واضحة

### ✅ التخزين
- حفظ جميع التحاليل في قاعدة البيانات
- إمكانية استرجاع التاريخ الكامل

---

## 🐛 حل المشاكل

### المشكلة: "not enough memory"

**السبب**: الموديل يحتاج RAM أكثر من المتاح

**الحل**:
```bash
# استخدم موديل أخف في .env
OLLAMA_MODEL=medllama2:latest
```

### المشكلة: "model not found"

**السبب**: الموديل مش محمل

**الحل**:
```bash
ollama pull MedAIBase/MedGemma1.5:4b
# أو
ollama pull medllama2:latest
```

### المشكلة: "connection refused"

**السبب**: Ollama مش شغال

**الحل**:
```bash
ollama serve
```

### المشكلة: timeout

**السبب**: الموديل بطيء أو مشغول

**الحل**:
- زيادة الـ timeout في `medgamma_client.py`
- إغلاق تطبيقات تانية لتحرير RAM

---

## 📁 الملفات المعدلة

| الملف | التعديل |
|-------|---------|
| `backend/.env` | إضافة OLLAMA_HOST و OLLAMA_MODEL |
| `backend/backendfirst/settings.py` | إضافة إعدادات Ollama |
| `backend/backendfirst/api/medgamma_client.py` | إعادة كتابة كاملة للتواصل مع Ollama |
| `backend/backendfirst/api/views.py` | تحديث predict_diabetes + إضافة ollama_health |
| `backend/backendfirst/api/urls.py` | إضافة endpoint الصحة |

---

## 🚀 التشغيل

### 1. تشغيل Backend

```bash
cd backend
python manage.py runserver
```

### 2. تشغيل Frontend

```bash
cd react_first
npm run dev
```

### 3. التأكد من Ollama

```bash
ollama list
# يجب أن يكون شغال تلقائياً
```

---

## 📊 مثال استجابة كاملة

```json
{
  "probability": 45.5,
  "risk_level": "متوسط",
  "message": "بناءً على البيانات المدخلة، احتمالية الإصابة بالسكري متوسطة. ينصح بمراجعة الطبيب وإجراء فحوصات إضافية.",
  "prediction_id": 123,
  "model": "medllama2:latest"
}
```

---

## ⚠️ ملاحظات مهمة

1. **الذاكرة**: Medgamma1.5:4b يحتاج 8.8GB RAM على الأقل
2. **الوقت**: التنبؤ قد يستغرق 10-60 ثانية حسب الموديل
3. **الدقة**: النتائج تقريبية ولا تغني عن استشارة طبيب
4. **الخصوصية**: البيانات محلية تماماً - لا تخرج من جهازك

---

## 🎉 جاهز للاستخدام!

النظام الآن يستخدم Medgamma عبر Ollama مباشرةً للتنبؤ الدقيق بالسكري!
