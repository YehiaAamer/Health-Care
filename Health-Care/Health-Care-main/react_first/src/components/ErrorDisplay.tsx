import {
  AlertTriangle,
  RefreshCw,
  WifiOff,
  Timer,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { APIError } from "@/lib/api";

interface ErrorDisplayProps {
  error: APIError | Error | string | null;
  onRetry?: () => void;
  showRetryButton?: boolean;
}

export function ErrorDisplay({
  error,
  onRetry,
  showRetryButton = true,
}: ErrorDisplayProps) {
  if (!error) return null;

  const getMessage = () => {
    if (typeof error === "string") return error;
    if (error instanceof APIError) return error.message;
    if (error instanceof Error) return error.message;
    return "حدث خطأ غير متوقع";
  };

  const getErrorType = () => {
    if (error instanceof APIError) {
      if (error.code === "NETWORK_ERROR") return "خطأ في الاتصال";
      if (error.code === "TIMEOUT") return "انتهت مهلة الاتصال";
      if (error.statusCode === 500) return "خطأ في الخادم";
    }
    return "حدث خطأ";
  };

  const getIcon = () => {
    if (error instanceof APIError) {
      if (error.code === "NETWORK_ERROR")
        return <WifiOff className="h-5 w-5 text-red-600 mt-0.5" />;

      if (error.code === "TIMEOUT")
        return <Timer className="h-5 w-5 text-red-600 mt-0.5" />;
    }

    return <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />;
  };

  return (
    <Alert className="border-red-500 bg-red-50">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {getIcon()}

          <div className="flex-1">
            <AlertTitle className="text-red-800 mb-1 font-semibold">
              {getErrorType()}
            </AlertTitle>

            <AlertDescription className="text-red-700 text-sm">
              {getMessage()}
            </AlertDescription>

            {error instanceof APIError && (
              <div className="mt-2 text-xs text-red-600 space-y-1">
                {error.code === "NETWORK_ERROR" && (
                  <>
                    <p>✓ تحقق من اتصالك بالإنترنت</p>
                    <p>✓ تأكد من أن الخادم يعمل</p>
                  </>
                )}

                {error.code === "TIMEOUT" && (
                  <>
                    <p>✓ حاول مرة أخرى</p>
                    <p>✓ قد يكون السيرفر مشغول</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Retry فقط */}
        {showRetryButton && onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="border-red-500 text-red-600 hover:bg-red-100 ml-4"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">إعادة</span>
          </Button>
        )}
      </div>
    </Alert>
  );
}
