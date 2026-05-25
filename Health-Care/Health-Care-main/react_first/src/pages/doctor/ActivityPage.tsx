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
      className="min-h-full w-full max-w-none pb-8 pt-8 animate-in fade-in duration-700 md:pt-0"
    >
      <div className="space-y-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {t("doctorDashboard.activity.title", {
                defaultValue: "Recent Activity",
              })}
            </h1>

            <p className="mt-1 text-sm font-medium text-slate-500">
              {activities.length} activities
            </p>
          </div>
        </div>

        <Card className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
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

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                {t("doctorDashboard.activity.empty", {
                  defaultValue: "No recent activity",
                })}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activities.map((activity, index) => (
                <div
                  key={`${activity.type}-${activity.related_id}-${index}`}
                  className="group flex items-start gap-4 p-5 transition-colors hover:bg-slate-50/70"
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border bg-white shadow-sm",
                      getActivityStyle(activity.type)
                    )}
                  >
                    {getActivityIcon(activity.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <h4 className="min-w-0 text-sm font-bold tracking-tight text-slate-900">
                        {activity.title}
                      </h4>

                      <span className="shrink-0 whitespace-nowrap rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-slate-400">
                        {formatActivityDate(activity.created_at)}
                      </span>
                    </div>

                    <p className="text-sm font-medium leading-6 text-slate-500">
                      {activity.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}