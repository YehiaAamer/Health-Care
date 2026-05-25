import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClipboardList } from "lucide-react";
import type { Prediction } from "@/types/api";

interface PendingPredictionsProps {
  predictions: Prediction[];
  isLoading: boolean;
  onReview: (id: number) => void;
}

export default function PendingPredictions({
  predictions = [],
  isLoading,
  onReview,
}: PendingPredictionsProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const isRTL = i18n.language.startsWith("ar");
  const dateLocale = isRTL ? ar : enUS;

  const safePredictions = Array.isArray(predictions) ? predictions : [];

  const displayedPredictions = useMemo(() => {
    return [...safePredictions]
      .sort((a, b) => {
        const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;

        if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
        if (Number.isNaN(aTime)) return 1;
        if (Number.isNaN(bTime)) return -1;

        return bTime - aTime;
      })
      .slice(0, 5);
  }, [safePredictions]);

  const normalizeRiskLevel = (level?: string) => {
    return (level || "")
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/risk/g, "")
      .trim();
  };

  const getRiskClasses = (level?: string) => {
    const normalizedLevel = normalizeRiskLevel(level);

    if (
      normalizedLevel.includes("very high") ||
      normalizedLevel.includes("veryhigh") ||
      normalizedLevel.includes("critical") ||
      normalizedLevel.includes("severe") ||
      normalizedLevel.includes("مرتفع جدا") ||
      normalizedLevel.includes("مرتفع جدًا") ||
      normalizedLevel.includes("عالي جدا") ||
      normalizedLevel.includes("عالي جدًا")
    ) {
      return "border-red-100 bg-red-50 text-red-600";
    }

    if (
      normalizedLevel.includes("high") ||
      normalizedLevel.includes("مرتفع") ||
      normalizedLevel.includes("عالي")
    ) {
      return "border-orange-100 bg-orange-50 text-orange-600";
    }

    if (
      normalizedLevel.includes("medium") ||
      normalizedLevel.includes("moderate") ||
      normalizedLevel.includes("متوسط")
    ) {
      return "border-amber-100 bg-amber-50 text-amber-600";
    }

    if (
      normalizedLevel.includes("low") ||
      normalizedLevel.includes("منخفض") ||
      normalizedLevel.includes("قليل")
    ) {
      return "border-emerald-100 bg-emerald-50 text-emerald-600";
    }

    return "border-slate-100 bg-slate-50 text-slate-500";
  };

  const formatRiskLabel = (level?: string) => {
    if (!level) return "Unknown";

    return level
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/\brisk\b/gi, "")
      .trim();
  };

  const formatPredictionDate = (date?: string) => {
    try {
      if (!date) return "";

      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: dateLocale,
      });
    } catch {
      return "";
    }
  };

  const cardClassName =
    "flex h-full w-full flex-col rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-slate-200/60";

  if (isLoading) {
    return (
      <Card className={cardClassName}>
        <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-3 px-4 pb-2 pt-4 sm:px-5 sm:pb-3 sm:pt-5">
          <CardTitle className="flex min-w-0 flex-1 items-center gap-2 text-sm font-bold tracking-tight text-slate-900 sm:text-base">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-8 sm:w-8">
              <ClipboardList
                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                strokeWidth={2.3}
              />
            </span>

            <span className="min-w-0 truncate">
              {t("doctorDashboard.pendingReviews.title")}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col px-4 pb-3 pt-1 sm:px-5 sm:pb-4">
          <div className="flex min-h-0 flex-1 flex-col justify-between gap-1.5 sm:gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex min-h-[40px] items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/40 px-2.5 py-1.5 sm:min-h-[46px] sm:px-3 sm:py-2"
              >
                <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                  <Skeleton className="h-7 w-7 shrink-0 rounded-2xl sm:h-8 sm:w-8" />

                  <div className="min-w-0 space-y-1.5">
                    <Skeleton className="h-3 w-[130px] rounded-md sm:h-3.5 sm:w-[150px]" />
                    <Skeleton className="h-2.5 w-[90px] rounded-md sm:h-3 sm:w-[100px]" />
                  </div>
                </div>

                <Skeleton className="h-7 w-[70px] shrink-0 rounded-xl sm:h-8 sm:w-[82px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardClassName}>
      <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-3 px-4 pb-2 pt-4 sm:px-5 sm:pb-3 sm:pt-5">
        <CardTitle className="flex min-w-0 flex-1 items-center gap-2 text-sm font-bold tracking-tight text-slate-900 sm:text-base">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-8 sm:w-8">
            <ClipboardList
              className="h-3.5 w-3.5 sm:h-4 sm:w-4"
              strokeWidth={2.3}
            />
          </span>

          <span className="min-w-0 truncate">
            {t("doctorDashboard.pendingReviews.title")}
          </span>
        </CardTitle>

        {safePredictions.length > 5 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/doctor-dashboard/reports")}
            className="h-7 shrink-0 rounded-xl px-2 text-[9px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10 hover:text-primary sm:h-8 sm:px-2.5 sm:text-[10px]"
          >
            {t("doctorDashboard.pendingReviews.viewAll")}
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col px-0 pb-3 pt-1">
        {safePredictions.length === 0 ? (
          <div className="flex min-h-[150px] flex-1 flex-col items-center justify-center px-6 py-8 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <ClipboardList className="h-6 w-6 opacity-80" strokeWidth={2.2} />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              {t("doctorDashboard.pendingReviews.empty")}
            </p>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 border-y border-slate-100 bg-slate-50/70">
              <div className="grid grid-cols-[36%_28%_20%_16%] px-2 py-2 sm:grid-cols-[40%_26%_20%_14%] sm:px-6">
                <div className="text-start text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:text-[10px]">
                  {t("doctorDashboard.pendingReviews.patient")}
                </div>

                <div className="text-start text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:text-[10px]">
                  {t("doctorDashboard.pendingReviews.riskLevel")}
                </div>

                <div className="text-start text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:text-[10px]">
                  {t("doctorDashboard.pendingReviews.date")}
                </div>

                <div className="text-end text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:text-[10px]">
                  {t("doctorDashboard.pendingReviews.action")}
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col justify-between divide-y divide-slate-100">
              {displayedPredictions.map((pred) => (
                <div
                  key={pred.id}
                  className="grid min-h-[42px] grid-cols-[36%_28%_20%_16%] items-center px-2 py-1.5 transition-colors duration-200 hover:bg-slate-50/70 sm:min-h-[48px] sm:grid-cols-[40%_26%_20%_14%] sm:px-6 sm:py-2"
                >
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                      <Avatar className="h-7 w-7 shrink-0 rounded-2xl border border-slate-100 shadow-sm sm:h-8 sm:w-8">
                        <AvatarFallback className="rounded-2xl bg-primary/10 text-[11px] font-bold text-primary sm:text-xs">
                          {pred.patient_name?.charAt(0)?.toUpperCase() || "P"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-bold leading-4 tracking-tight text-slate-900 sm:text-sm">
                          {pred.patient_name || "Anonymous"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 px-1">
                    <span
                      className={`inline-flex max-w-full items-center rounded-xl border px-2 py-0.5 text-[7px] font-bold uppercase tracking-tight sm:px-2.5 sm:py-1 sm:text-[9px] ${getRiskClasses(
                        pred.risk_level
                      )}`}
                    >
                      <span className="truncate">
                        {formatRiskLabel(pred.risk_level)} (
                        {Math.round(pred.probability || 0)}%)
                      </span>
                    </span>
                  </div>

                  <div className="min-w-0 px-1">
                    <span className="block truncate text-[8px] font-semibold leading-4 text-slate-400 sm:text-[10px]">
                      {formatPredictionDate(pred.created_at)}
                    </span>
                  </div>

                  <div className="min-w-0 text-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onReview(pred.id)}
                      className="h-7 max-w-full rounded-xl px-1.5 text-[7px] font-bold uppercase tracking-wider text-primary hover:bg-primary/10 hover:text-primary sm:h-8 sm:px-3 sm:text-[10px] sm:tracking-widest"
                    >
                      <span className="truncate">
                        {t("doctorDashboard.pendingReviews.reviewBtn")}
                      </span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}