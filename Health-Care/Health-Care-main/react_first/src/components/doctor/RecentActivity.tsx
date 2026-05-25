import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  Activity,
  Check,
  Calendar,
  MessageSquare,
  Bell,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  type: string;
  icon: string;
  title: string;
  description: string;
  related_id?: number;
  created_at: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  isLoading: boolean;
}

const MAX_DASHBOARD_ACTIVITIES = 5;

export default function RecentActivity({
  activities = [],
  isLoading,
}: RecentActivityProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const isRTL = i18n.language.startsWith("ar");
  const dateLocale = isRTL ? ar : enUS;

  const safeActivities = Array.isArray(activities) ? activities : [];

  const cleanActivityText = (value?: string | null) => {
    if (!value) return "";

    return String(value)
      .replace(/\b(id|report id|patient id|prediction id|appointment id)\s*#?\s*\d+\b/gi, "")
      .replace(/\b(report|patient|prediction|appointment)\s*#\s*\d+\b/gi, "$1")
      .replace(/#\s*\d+\b/g, "")
      .replace(/\bID\b\s*:?\s*\d+\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([.,،:;!?])/g, "$1")
      .trim();
  };

  const visibleActivities = useMemo(() => {
    return [...safeActivities]
      .sort((a, b) => {
        const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;

        if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
        if (Number.isNaN(aTime)) return 1;
        if (Number.isNaN(bTime)) return -1;

        return bTime - aTime;
      })
      .slice(0, MAX_DASHBOARD_ACTIVITIES);
  }, [safeActivities]);

  const cardClassName =
    "flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-slate-200/60";

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "prediction":
        return (
          <Activity
            className="h-3 w-3 sm:h-3.5 sm:w-3.5"
            strokeWidth={2.4}
          />
        );
      case "review":
        return (
          <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.4} />
        );
      case "appointment":
        return (
          <Calendar
            className="h-3 w-3 sm:h-3.5 sm:w-3.5"
            strokeWidth={2.4}
          />
        );
      case "message":
        return (
          <MessageSquare
            className="h-3 w-3 sm:h-3.5 sm:w-3.5"
            strokeWidth={2.4}
          />
        );
      default:
        return (
          <Bell className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.4} />
        );
    }
  };

  const getActivityStyle = (type: string) => {
    switch (type) {
      case "prediction":
        return "bg-primary/10 text-primary border-primary/15";
      case "review":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "appointment":
        return "bg-sky-50 text-sky-600 border-sky-100";
      case "message":
        return "bg-amber-50 text-amber-600 border-amber-100";
      default:
        return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  const formatActivityDate = (date?: string) => {
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

  const CardTitleBlock = () => (
    <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-3 px-4 pb-2 pt-4 sm:px-5 sm:pb-3 sm:pt-5">
      <CardTitle className="flex min-w-0 flex-1 items-center gap-2 text-sm font-bold tracking-tight text-slate-900 sm:text-base">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-8 sm:w-8">
          <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.3} />
        </span>

        <span className="min-w-0 truncate">
          {t("doctorDashboard.activity.title")}
        </span>
      </CardTitle>

      {!isLoading && safeActivities.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate("/doctor-dashboard/activity")}
          className="h-7 shrink-0 rounded-xl px-2 text-[9px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10 hover:text-primary sm:h-8 sm:px-2.5 sm:text-[10px]"
        >
          {t("doctorDashboard.activity.viewAll", {
            defaultValue: "View All",
          })}
        </Button>
      )}
    </CardHeader>
  );

  if (isLoading) {
    return (
      <Card className={cardClassName}>
        <CardTitleBlock />

        <CardContent className="flex min-h-0 flex-1 flex-col px-4 pb-3 pt-1 sm:px-5 sm:pb-4">
          <div className="flex min-h-0 flex-1 flex-col justify-between gap-1.5 sm:gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex min-h-[40px] items-start gap-2.5">
                <Skeleton className="h-7 w-7 shrink-0 rounded-2xl sm:h-8 sm:w-8" />

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-3 w-[130px] rounded-md sm:h-3.5 sm:w-[160px]" />
                    <Skeleton className="h-2.5 w-[60px] rounded-md sm:h-3 sm:w-[80px]" />
                  </div>

                  <Skeleton className="h-2.5 w-full max-w-[420px] rounded-md sm:h-3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardClassName}>
      <CardTitleBlock />

      <CardContent className="flex min-h-0 flex-1 flex-col px-4 pb-3 pt-1 sm:px-5 sm:pb-4">
        {safeActivities.length === 0 ? (
          <div className="flex min-h-[150px] flex-1 flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <History className="h-6 w-6 opacity-80" strokeWidth={2.2} />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              {t("doctorDashboard.activity.empty")}
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "relative flex min-h-0 flex-1 flex-col justify-between gap-1.5 sm:gap-2",
              "before:absolute before:top-1 before:h-[calc(100%-8px)] before:w-0.5 before:bg-slate-100",
              isRTL
                ? "before:right-3.5 before:translate-x-px sm:before:right-4"
                : "before:left-3.5 before:-translate-x-px sm:before:left-4"
            )}
          >
            {visibleActivities.map((activity, index) => {
              const title = cleanActivityText(activity.title);
              const description = cleanActivityText(activity.description);

              return (
                <div
                  key={`${activity.type}-${activity.created_at}-${index}`}
                  className="group relative flex min-h-[40px] items-start gap-2.5 sm:min-h-[46px] sm:gap-3"
                >
                  <div
                    className={cn(
                      "z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-2xl border bg-white shadow-sm sm:h-8 sm:w-8",
                      "transition-all duration-300 group-hover:scale-105",
                      getActivityStyle(activity.type)
                    )}
                  >
                    {getActivityIcon(activity.type)}
                  </div>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="mb-0.5 flex items-start justify-between gap-2 sm:mb-1 sm:gap-3">
                      <h4 className="min-w-0 truncate text-xs font-bold leading-4 tracking-tight text-slate-900 sm:text-sm">
                        {title}
                      </h4>

                      <span
                        className={cn(
                          "shrink-0 whitespace-nowrap rounded-lg bg-slate-50 px-1.5 py-0.5",
                          "text-[8px] font-bold uppercase tracking-tight text-slate-400 sm:px-2 sm:py-1 sm:text-[10px]",
                          isRTL ? "mr-1 sm:mr-2" : "ml-1 sm:ml-2"
                        )}
                      >
                        {formatActivityDate(activity.created_at)}
                      </span>
                    </div>

                    <p className="line-clamp-1 text-[11px] font-medium leading-4 text-slate-500 sm:line-clamp-2 sm:text-xs sm:leading-5">
                      {description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}