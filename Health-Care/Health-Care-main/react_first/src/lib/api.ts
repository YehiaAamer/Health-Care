// API Configuration and Error Handling

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  PREDICT: `${API_BASE_URL}/api/predict/`,
  GET_PREDICTIONS: `${API_BASE_URL}/api/predictions/`,
  HISTORY: `${API_BASE_URL}/api/history/`,
  PROFILE: `${API_BASE_URL}/api/profile/`,

  DOCTOR_DASHBOARD: `${API_BASE_URL}/api/doctor/dashboard/`,
  DOCTOR_PENDING_PREDICTIONS: `${API_BASE_URL}/api/doctor/predictions/pending/`,
  DOCTOR_REVIEW_PREDICTION: (id: number) =>
    `${API_BASE_URL}/api/doctor/predictions/${id}/review/`,
  DOCTOR_RISK_DISTRIBUTION: `${API_BASE_URL}/api/doctor/risk-distribution/`,
  DOCTOR_PATIENTS: `${API_BASE_URL}/api/doctor/patients/`,
  DOCTOR_APPOINTMENTS_TODAY: `${API_BASE_URL}/api/doctor/appointments/today/`,
  DOCTOR_MESSAGES: `${API_BASE_URL}/api/doctor/messages/recent/`,
  DOCTOR_REPORTS: `${API_BASE_URL}/api/doctor/predictions/`,
  DOCTOR_ACTIVITY: `${API_BASE_URL}/api/doctor/activity/`,
  DOCTOR_PROFILE: `${API_BASE_URL}/api/doctor/profile/`,
  DOCTOR_NOTIFICATIONS: `${API_BASE_URL}/api/doctor/notifications/`,
} as const;

const TOKEN_STORAGE_KEY = "auth_tokens";

const PUBLIC_ENDPOINTS = [
  "/api/chatbot/",
  "/api/feature-importance/",
  "/api/ollama/health/",
];

function isPublicEndpoint(endpoint: string): boolean {
  return PUBLIC_ENDPOINTS.some((publicEndpoint) =>
    endpoint.includes(publicEndpoint)
  );
}

export class APIError extends Error {
  constructor(
    public code: string,
    public statusCode?: number,
    public originalError?: Error,
    message?: string
  ) {
    super(message || `API Error: ${code}`);
    this.name = "APIError";
  }
}

interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
};

interface APICallOptions extends RequestInit {
  retryConfig?: RetryConfig;
  timeout?: number;
  skipAuthRefresh?: boolean;
}

type AuthTokens = {
  access?: string;
  refresh?: string;
};

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStoredTokens(): AuthTokens | null {
  const storedTokens = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (!storedTokens) return null;

  try {
    return JSON.parse(storedTokens);
  } catch {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }
}

function saveTokens(tokens: AuthTokens) {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

function clearAuthStorage() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem("user");
  localStorage.removeItem("auth_user");
}

function shouldLogoutOn401(endpoint: string) {
  return (
    !endpoint.includes("/api/auth/login/") &&
    !endpoint.includes("/api/auth/register/") &&
    !endpoint.includes("/api/auth/token/refresh/") &&
    !isPublicEndpoint(endpoint)
  );
}

async function refreshAccessToken(): Promise<string | null> {
  const tokens = getStoredTokens();

  if (!tokens?.refresh) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: tokens.refresh }),
    });

    if (!response.ok) {
      clearAuthStorage();
      return null;
    }

    const data = await response.json();

    const newTokens: AuthTokens = {
      ...tokens,
      access: data.access,
      refresh: data.refresh || tokens.refresh,
    };

    saveTokens(newTokens);
    return newTokens.access || null;
  } catch {
    clearAuthStorage();
    return null;
  }
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;
  let currentDelay = config.delayMs;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (error instanceof APIError && [400, 401, 403, 404].includes(error.statusCode || 0)) {
        throw error;
      }

      if (attempt < config.maxRetries) {
        await delay(currentDelay);
        currentDelay *= config.backoffMultiplier;
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

function buildHeaders(fetchOptions: RequestInit, accessToken?: string) {
  const headers = new Headers();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const isFormData = fetchOptions.body instanceof FormData;

  if (!isFormData && fetchOptions.body) {
    headers.set("Content-Type", "application/json");
  }

  if (fetchOptions.headers) {
    Object.entries(fetchOptions.headers as Record<string, string>).forEach(
      ([key, value]) => {
        if (value !== null && value !== undefined) {
          headers.set(key, String(value));
        }
      }
    );
  }

  return headers;
}

export async function apiCall<T>(
  endpoint: string,
  options?: APICallOptions
): Promise<T> {
  const {
    retryConfig,
    timeout = 30000,
    skipAuthRefresh = false,
    ...fetchOptions
  } = options || {};

  const isAuthEndpoint = endpoint.includes("/auth/");
  const isProfileEndpoint = endpoint.includes("/profile/");

  const finalRetryConfig =
    isAuthEndpoint || isProfileEndpoint
      ? { maxRetries: 0, delayMs: 0, backoffMultiplier: 1 }
      : retryConfig || DEFAULT_RETRY_CONFIG;

  return retryWithBackoff(async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeout);

    try {
      const tokens = getStoredTokens();
      let headers = buildHeaders(fetchOptions, tokens?.access);

      let response = await fetch(endpoint, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      if (
        response.status === 401 &&
        headers.has("Authorization") &&
        isPublicEndpoint(endpoint)
      ) {
        const publicHeaders = new Headers(headers);
        publicHeaders.delete("Authorization");

        response = await fetch(endpoint, {
          ...fetchOptions,
          headers: publicHeaders,
          signal: controller.signal,
        });
      }

      if (
        response.status === 401 &&
        !skipAuthRefresh &&
        !isPublicEndpoint(endpoint) &&
        !endpoint.includes("/api/auth/login/") &&
        !endpoint.includes("/api/auth/token/refresh/")
      ) {
        const newAccessToken = await refreshAccessToken();

        if (newAccessToken) {
          headers = buildHeaders(fetchOptions, newAccessToken);

          response = await fetch(endpoint, {
            ...fetchOptions,
            headers,
            signal: controller.signal,
          });
        }
      }

      window.clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401 && shouldLogoutOn401(endpoint)) {
          clearAuthStorage();
        }

        await handleErrorResponse(response, endpoint);
      }

      try {
        return (await response.json()) as T;
      } catch (parseError) {
        throw new APIError(
          "INVALID_JSON",
          response.status,
          parseError as Error,
          "الخادم رجع استجابة غير صحيحة"
        );
      }
    } catch (error) {
      window.clearTimeout(timeoutId);

      if (error instanceof DOMException && error.name === "AbortError") {
        throw new APIError(
          "TIMEOUT",
          undefined,
          error,
          `انتهت مهلة الاتصال (${timeout}ms). الخادم قد لا يكون متاحًا.`
        );
      }

      if (error instanceof APIError) {
        throw error;
      }

      if (error instanceof TypeError) {
        throw new APIError(
          "NETWORK_ERROR",
          undefined,
          error,
          "فشل الاتصال بالخادم. تحقق من اتصالك بالإنترنت."
        );
      }

      throw new APIError(
        "UNKNOWN_ERROR",
        undefined,
        error as Error,
        "حدث خطأ غير متوقع"
      );
    }
  }, finalRetryConfig);
}

async function handleErrorResponse(
  response: Response,
  endpoint: string
): Promise<never> {
  let errorMessage = `Server Error: ${response.status}`;
  let errorCode = `HTTP_${response.status}`;

  try {
    const errorData = await response.json();

    errorMessage =
      errorData.detail ||
      errorData.message ||
      errorData.error ||
      errorData.non_field_errors?.[0] ||
      errorMessage;

    errorCode = errorData.code || errorCode;
  } catch {
    try {
      const text = await response.text();
      errorMessage = text || errorMessage;
    } catch {
      // ignore
    }
  }

  if (endpoint.includes("/api/auth/login/") && response.status === 401) {
    throw new APIError(
      "INVALID_CREDENTIALS",
      response.status,
      undefined,
      "البريد الإلكتروني أو كلمة المرور غير صحيحة."
    );
  }

  if (endpoint.includes("/api/auth/token/refresh/") && response.status === 401) {
    throw new APIError(
      "TOKEN_EXPIRED",
      response.status,
      undefined,
      "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى."
    );
  }

  const arabicMessage = getArabicErrorMessage(response.status, errorMessage);

  throw new APIError(errorCode, response.status, undefined, arabicMessage);
}

function getArabicErrorMessage(
  statusCode: number,
  serverMessage: string
): string {
  const messages: Record<number, string> = {
    400: "البيانات المرسلة غير صحيحة. يرجى التحقق والمحاولة مرة أخرى.",
    401: "انتهت الجلسة أو غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.",
    403: "ليس لديك صلاحية للوصول إلى هذا المورد.",
    404: "المورد المطلوب غير موجود.",
    500: "خطأ في الخادم. يرجى المحاولة لاحقاً.",
    502: "خطأ في الخادم. يرجى المحاولة لاحقاً.",
    503: "الخادم غير متاح حالياً. يرجى المحاولة لاحقاً.",
    504: "انتهت مهلة الاتصال بالخادم. يرجى المحاولة لاحقاً.",
  };

  return messages[statusCode] || `حدث خطأ: ${serverMessage}`;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) return error.message;
  if (error instanceof Error) return error.message;
  return "حدث خطأ غير متوقع";
}