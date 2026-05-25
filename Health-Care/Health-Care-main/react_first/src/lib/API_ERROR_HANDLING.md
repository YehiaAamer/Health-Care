# 📘 API Error Handling Guide

## 📍 نظرة عامة

هذا المشروع يستخدم نظام error handling متقدم مع retry mechanism و timeout handling.

---

## 🚀 الاستخدام الأساسي

### 1️⃣ استخدام `apiCall` function مباشرة

```typescript
import { apiCall, API_ENDPOINTS } from '@/lib/api';

const result = await apiCall<PredictionResult>(
  API_ENDPOINTS.PREDICT,
  {
    method: 'POST',
    body: JSON.stringify(data),
    timeout: 30000,  // 30 ثواني
    retryConfig: {
      maxRetries: 3,
      delayMs: 1000,
      backoffMultiplier: 2,
    },
  }
);
```

### 2️⃣ استخدام `useApiCall` Hook (الأفضل)

```typescript
import { useApiCall } from '@/hooks/useApiCall';
import { API_ENDPOINTS } from '@/lib/api';

function MyComponent() {
  const { execute, data, error, isLoading } = useApiCall({
    onSuccess: (data) => console.log('نجح!', data),
    onError: (error) => console.error('خطأ:', error),
  });

  const handleSubmit = async (values) => {
    await execute(API_ENDPOINTS.PREDICT, {
      method: 'POST',
      body: JSON.stringify(values),
    });
  };

  return (
    <>
      {error && <ErrorDisplay error={error} />}
      {/* ... */}
    </>
  );
}
```

---

## 🛡️ معالجة الأخطاء

### الأنواع المختلفة للأخطاء:

```typescript
import { APIError, getErrorMessage } from '@/lib/api';

try {
  const result = await apiCall(endpoint, options);
} catch (error) {
  if (error instanceof APIError) {
    console.log('Error Code:', error.code);
    // NETWORK_ERROR, TIMEOUT, INVALID_JSON, HTTP_4xx, HTTP_5xx إلخ

    console.log('Status Code:', error.statusCode);
    // 400, 401, 500, 503, إلخ

    console.log('Message:', error.message);
    // رسالة عربية واضحة
  }

  // أو استخدم helper function
  const message = getErrorMessage(error);
  toast.error(message);
}
```

---

## ⚙️ تخصيص الإعدادات

### تغيير Retry Configuration:

```typescript
// أعيد المحاولة مرة واحدة فقط مع تأخير أقصر
const result = await apiCall(endpoint, {
  retryConfig: {
    maxRetries: 1,      // عدد إعادة المحاولات
    delayMs: 500,       // التأخير الأولي بالـ milliseconds
    backoffMultiplier: 2, // مضروب زيادة التأخير
  },
});

// بدون retry على الإطلاق
const result = await apiCall(endpoint, {
  retryConfig: {
    maxRetries: 0,
  },
});
```

### تغيير Timeout:

```typescript
const result = await apiCall(endpoint, {
  timeout: 60000, // 60 ثانية
});
```

---

## 📊 خريطة Error Codes

| Code | المعنى | الحل |
|------|--------|------|
| `NETWORK_ERROR` | فشل الاتصال بالإنترنت | تحقق من الاتصال |
| `TIMEOUT` | انتهت مهلة الاتصال (30s افتراضياً) | أعد المحاولة أو زد الـ timeout |
| `INVALID_JSON` | الخادم رجع JSON غير صحيح | تحقق من API response |
| `HTTP_400` | بيانات غير صحيحة | تحقق من المدخلات |
| `HTTP_401` | غير مصرح (بحاجة تسجيل دخول) | قم بتسجيل الدخول |
| `HTTP_403` | ممنوع (بدون صلاحيات) | تحقق من الصلاحيات |
| `HTTP_404` | المورد غير موجود | تحقق من الـ endpoint |
| `HTTP_500` | خطأ في الخادم | أعد المحاولة لاحقاً |
| `HTTP_503` | الخادم غير متاح | الخادم تحت الصيانة |

---

## 🎯 أفضل الممارسات

### 1️⃣ استخدم الـ Hook بدل الـ function مباشرة:

```typescript
// ❌ غير مفضل
const [error, setError] = useState(null);
const [loading, setLoading] = useState(false);

// ✅ مفضل
const { error, isLoading, execute } = useApiCall();
```

### 2️⃣ اعرض رسائل خطأ واضحة:

```typescript
// ❌ غير مفضل
toast.error('Error occurred');

// ✅ مفضل
toast.error(getErrorMessage(error));
```

### 3️⃣ استخدم ErrorDisplay Component:

```typescript
<ErrorDisplay 
  error={error} 
  onRetry={() => execute(...)}
  onDismiss={() => reset()}
/>
```

### 4️⃣ أضف proper logging في الـ development:

```typescript
if (import.meta.env.DEV) {
  console.table({
    endpoint,
    method: 'POST',
    status: response.status,
    responseTime: `${Date.now() - startTime}ms`,
  });
}
```

---

## 🔍 Debugging Tips

### تفعيل Verbose Logging:

```typescript
// قم بإضافة هذا في البيئة الـ development
if (import.meta.env.DEV) {
  // الـ console.log في api.ts سيظهر تفاصيل كل attempt
  console.log('🔄 Attempt 1 of 3');
  console.log('⚠️ Attempt 1 failed. Retrying in 1000ms...');
  console.log('✅ Request successful');
}
```

### استخدم Network Tab في DevTools:

1. اضغط F12 → Network tab
2. شغّل الـ request
3. شوف:
   - Status code
   - Response headers
   - Response body
   - Request timing

---

## ⚠️ الأخطاء الشائعة

### ❌ عدم معالجة الـ Timeout:

```typescript
// غير صحيح - قد يستنزف الـ memory
setInterval(() => {
  fetch(url); // بدون timeout
}, 1000);

// ✅ صحيح
await apiCall(endpoint, { timeout: 30000 });
```

### ❌ Retry بدون اختبار الحالة:

```typescript
// ❌ قد يسبب حلقة لا نهائية
while (true) {
  await apiCall(endpoint);
}

// ✅ صحيح - مدمج في apiCall
const result = await apiCall(endpoint, {
  retryConfig: { maxRetries: 3 },
});
```

### ❌ عدم parsing الـ error response:

```typescript
// ❌ لا تعرف ما هو الخطأ الفعلي
if (!response.ok) {
  throw new Error('Failed');
}

// ✅ صحيح - معالجة مفصلة
await handleErrorResponse(response);
```

---

## 📈 مثال عملي كامل

```typescript
import { useApiCall } from '@/hooks/useApiCall';
import { API_ENDPOINTS } from '@/lib/api';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { toast } from 'sonner';

export function PredictionForm() {
  const { execute, data, error, isLoading, reset } = useApiCall({
    onSuccess: () => {
      toast.success('✅ تم التحليل بنجاح');
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = async (values: FormValues) => {
    reset(); // مسح الأخطاء السابقة
    
    try {
      const result = await execute(API_ENDPOINTS.PREDICT, {
        method: 'POST',
        body: JSON.stringify(values),
        timeout: 30000,
        retryConfig: {
          maxRetries: 2,
          delayMs: 1000,
          backoffMultiplier: 2,
        },
      });

      // استخدم النتيجة
      navigate('/report', { state: result });
    } catch (err) {
      // الخطأ معالج تلقائياً من قبل Hook
    }
  };

  return (
    <>
      {error && (
        <ErrorDisplay 
          error={error}
          onRetry={() => handleSubmit(...)}
          onDismiss={reset}
        />
      )}
      
      {isLoading && <Loader />}
      
      <form onSubmit={handleSubmit}>
        {/* ... */}
      </form>
    </>
  );
}
```

---

## 🆘 الحصول على المساعدة

إذا واجهت مشاكل:

1. check الـ browser console (F12)
2. شوف الـ Network tab
3. تحقق من الـ API logs in terminal
4. استخدم `console.table()` لعرض البيانات

---

## 📚 المراجع

- [API Utility Functions](./api.ts)
- [Custom Hook](../hooks/useApiCall.ts)
- [Error Display Component](../components/ErrorDisplay.tsx)
- [Main Usage Example](../pages/DiagnosisWizard.tsx)
