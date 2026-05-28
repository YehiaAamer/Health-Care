import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiCall } from "@/hooks/useApiCall";
import { API_ENDPOINTS } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ActivityItem {
  type: string;
  icon: string;
  title: string;
  description: string;
  related_id: number;
  created_at: string;
}

export default function ActivityPage() {
  const { t, i18n } = useTranslation();
  const { execute: apiCall } = useApiCall();

  const isRTL = i18n.language.startsWith("ar");
  const dateLocale = isRTL ? ar : enUS;

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);

      const activityRes: any = await apiCall(API_ENDPOINTS.DOCTOR_ACTIVITY);

      setActivities(
        Array.isArray(activityRes)
          ? activityRes
          : activityRes?.activities ||
              activityRes?.recent_activity ||
              activityRes?.results ||
              activityRes?.data ||
              []
      );
    } catch (error) {
      console.error("Failed to load activity", error);
      toast.error("Failed to load recent activity");
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const hideIdsFromText = (text?: string) => {
    if (!text) return "";

    return text
      .replace(/\bID\s*[:#-]?\s*\d+\b/gi, "")
      .replace(/\bid\s*[:#-]?\s*\d+\b/gi, "")
      .replace(/\brelated[_\s-]?id\s*[:#-]?\s*\d+\b/gi, "")
      .replace(/\bpatient[_\s-]?id\s*[:#-]?\s*\d+\b/gi, "")
      .replace(/\bprediction[_\s-]?id\s*[:#-]?\s*\d+\b/gi, "")
      .replace(/\bappointment[_\s-]?id\s*[:#-]?\s*\d+\b/gi, "")
      .replace(/\breport[_\s-]?id\s*[:#-]?\s*\d+\b/gi, "")
      .replace(/\s*#\d+\b/g, "")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([.,:;!?])/g, "$1")
      .trim();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "prediction":
        return <Activity className="h-4 w-4" strokeWidth={2.4} />;

      case "review":
        return <Check className="h-4 w-4" strokeWidth={2.4} />;

      case "appointment":
        return <Calendar className="h-4 w-4" strokeWidth={2.4} />;

      case "message":
        return <MessageSquare className="h-4 w-4" strokeWidth={2.4} />;

      default:
        return <Bell className="h-4 w-4" strokeWidth={2.4} />;
    }
  };

  const getActivityStyle = (type: string) => {
    switch (type) {
      case "prediction":
        return "border-primary/15 bg-primary/10 text-primary";

      case "review":
        return "border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300";

      case "appointment":
        return "border-sky-100 bg-sky-50 text-sky-600 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300";

      case "message":
        return "border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300";

      default:
        return "border-border bg-muted/40 text-muted-foreground";
    }
  };

  const formatActivityDate = (date: string) => {
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

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-full w-full max-w-none pb-8 pt-8 text-foreground animate-in fade-in duration-700 md:pt-0"
    >
      <div className="space-y-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("doctorDashboard.activity.title", {
                defaultValue: "Recent Activity",
              })}
            </h1>

            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {t("doctorDashboard.activity.count", {
                count: activities.length,
                defaultValue: `${activities.length} activities`,
              })}
            </p>
          </div>
        </div>

        <Card className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
          {isLoading ? (
            <div className="space-y-5 p-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-2xl" />

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <Skeleton className="h-4 w-[180px] rounded-md" />
                      <Skeleton className="h-3 w-[90px] rounded-md" />
                    </div>

                    <Skeleton className="h-3 w-full max-w-[520px] rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <History className="h-7 w-7 opacity-80" strokeWidth={2.2} />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {t("doctorDashboard.activity.empty", {
                  defaultValue: "No recent activity",
                })}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {activities.map((activity, index) => {
                const cleanTitle = hideIdsFromText(activity.title);
                const cleanDescription = hideIdsFromText(activity.description);

                return (
                  <div
                    key={`${activity.type}-${activity.related_id}-${index}`}
                    className="group flex items-start gap-4 p-5 transition-colors hover:bg-primary/[0.03]"
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border shadow-sm",
                        getActivityStyle(activity.type)
                      )}
                    >
                      {getActivityIcon(activity.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <h4 className="min-w-0 text-sm font-bold tracking-tight text-foreground">
                          {cleanTitle}
                        </h4>

                        <span className="shrink-0 whitespace-nowrap rounded-lg bg-muted/50 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                          {formatActivityDate(activity.created_at)}
                        </span>
                      </div>

                      {cleanDescription && (
                        <p className="text-sm font-medium leading-6 text-muted-foreground">
                          {cleanDescription}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}