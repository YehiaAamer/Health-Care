import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

  status?: string;
  review_status?: string;
  decision?: string;
  action?: string;
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
      .replace(
        /\b(id|report id|patient id|prediction id|appointment id)\s*#?\s*\d+\b/gi,
        ""
      )
      .replace(/\b(report|patient|prediction|appointment)\s*#\s*\d+\b/gi, "$1")
      .replace(/#\s*\d+\b/g, "")
      .replace(/\bID\b\s*:?\s*\d+\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([.,،:;!?])/g, "$1")
      .trim();
  };

  const normalizeValue = (value?: string | null) => {
    return String(value || "")
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .trim();
  };

  const isApprovedOrReviewedActivity = (activity: ActivityItem) => {
    const type = normalizeValue(activity?.type);
    const title = normalizeValue(activity?.title);
    const description = normalizeValue(activity?.description);
    const status = normalizeValue(activity?.status);
    const reviewStatus = normalizeValue(activity?.review_status);
    const decision = normalizeValue(activity?.decision);
    const action = normalizeValue(activity?.action);

    const combinedText = `${title} ${description} ${status} ${reviewStatus} ${decision} ${action}`;

    const finalStatuses = [
      "approved",
      "rejected",
      "needs followup",
      "needs follow up",
      "reviewed",
      "completed",
      "done",
      "تمت الموافقة",
      "مقبول",
      "مرفوض",
      "تمت المراجعة",
      "تمت مراجعة",
      "يحتاج متابعة",
    ];

    const isFinalStatus = finalStatuses.some((item) =>
      combinedText.includes(item)
    );

    return (
      type === "review" ||
      type === "approved" ||
      type === "rejected" ||
      isFinalStatus ||
      combinedText.includes("مراجعة تحليل") ||
      combinedText.includes("تمت مراجعة") ||
      combinedText.includes("reviewed") ||
      combinedText.includes("approved") ||
      combinedText.includes("rejected") ||
      combinedText.includes("needs followup") ||
      combinedText.includes("needs follow up")
    );
  };

  const pendingActivities = useMemo(() => {
    return safeActivities.filter(
      (activity) => !isApprovedOrReviewedActivity(activity)
    );
  }, [safeActivities]);

  const visibleActivities = useMemo(() => {
    return [...pendingActivities]
      .sort((a, b) => {
        const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;

        if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
        if (Number.isNaN(aTime)) return 1;
        if (Number.isNaN(bTime)) return -1;

        return bTime - aTime;
      })
      .slice(0, MAX_DASHBOARD_ACTIVITIES);
  }, [pendingActivities]);

  const emptyRowsCount = Math.max(
    MAX_DASHBOARD_ACTIVITIES - visibleActivities.length,
    0
  );

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
        return "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30";

      case "appointment":
        return "bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30";

      case "message":
        return "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30";

      default:
        return "bg-muted text-muted-foreground border-border";
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

  const openActivityReportFilter = (activity: ActivityItem) => {
    if (!activity.related_id) return;

    navigate(`/doctor-dashboard/reports?filterReportId=${activity.related_id}`, {
      state: {
        filterReportId: activity.related_id,
        fromRecentActivity: true,
        openDrawer: false,
      },
    });
  };

  const CardTitleBlock = () => (
    <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-3 px-4 pb-2 pt-4 sm:px-5 sm:pb-3 sm:pt-5">
      <CardTitle className="flex min-w-0 flex-1 items-center gap-2 text-sm font-bold tracking-tight text-foreground sm:text-base">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-8 sm:w-8">
          <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.3} />
        </span>

        <span className="min-w-0 whitespace-normal break-words">
          {t("doctorDashboard.activity.title")}
        </span>
      </CardTitle>

      {!isLoading && visibleActivities.length > 0 && (
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

  const cardClassName =
    "flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md";

  const PlaceholderRow = ({ index }: { index: number }) => (
    <div
      key={`placeholder-activity-row-${index}`}
      aria-hidden="true"
      className="min-h-[42px] sm:min-h-[46px]"
    />
  );

  if (isLoading) {
    return (
      <Card className={cardClassName}>
        <CardTitleBlock />

        <CardContent className="flex flex-col px-4 pb-3 pt-1 sm:px-5 sm:pb-4">
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: MAX_DASHBOARD_ACTIVITIES }).map((_, i) => (
              <div
                key={i}
                className="flex min-h-[42px] items-start gap-2.5 rounded-2xl px-1 py-1 sm:min-h-[46px]"
              >
                <Skeleton className="h-7 w-7 shrink-0 rounded-2xl sm:h-8 sm:w-8" />

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-3">
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

      <CardContent className="flex flex-col px-4 pb-3 pt-1 sm:px-5 sm:pb-4">
        <div
          className={cn(
            "relative flex flex-col gap-1.5",
            "before:absolute before:top-1 before:h-[calc(100%-8px)] before:w-0.5 before:bg-border",
            isRTL
              ? "before:right-3.5 before:translate-x-px sm:before:right-4"
              : "before:left-3.5 before:-translate-x-px sm:before:left-4"
          )}
        >
          {visibleActivities.length === 0 ? (
            <>
              <div className="relative flex min-h-[42px] items-start gap-2.5 rounded-2xl px-1 py-1 sm:min-h-[46px] sm:gap-3">
                <div className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm sm:h-8 sm:w-8">
                  <History
                    className="h-3 w-3 opacity-80 sm:h-3.5 sm:w-3.5"
                    strokeWidth={2.4}
                  />
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <h4 className="min-w-0 text-xs font-bold leading-4 tracking-tight text-foreground sm:text-sm sm:leading-5">
                    {t("doctorDashboard.activity.empty", {
                      defaultValue: "No pending activity",
                    })}
                  </h4>

                  <p className="whitespace-normal break-words text-[11px] font-medium leading-4 text-muted-foreground sm:text-xs sm:leading-5">
                    {isRTL
                      ? "سيتم عرض الأنشطة الجديدة التي تحتاج متابعة هنا."
                      : "New activities that need follow-up will appear here."}
                  </p>
                </div>
              </div>

              {Array.from({ length: MAX_DASHBOARD_ACTIVITIES - 1 }).map(
                (_, index) => (
                  <PlaceholderRow key={`empty-activity-row-${index}`} index={index} />
                )
              )}
            </>
          ) : (
            <>
              {visibleActivities.map((activity, index) => {
                const title = cleanActivityText(activity.title);
                const description = cleanActivityText(activity.description);
                const canOpenReportFilter = Boolean(activity.related_id);

                return (
                  <div
                    key={`${activity.type}-${activity.related_id || "no-id"}-${
                      activity.created_at
                    }-${index}`}
                    role={canOpenReportFilter ? "button" : undefined}
                    tabIndex={canOpenReportFilter ? 0 : undefined}
                    onClick={() => openActivityReportFilter(activity)}
                    onKeyDown={(event) => {
                      if (
                        canOpenReportFilter &&
                        (event.key === "Enter" || event.key === " ")
                      ) {
                        event.preventDefault();
                        openActivityReportFilter(activity);
                      }
                    }}
                    className={cn(
                      "group relative flex min-h-[42px] items-start gap-2.5 rounded-2xl px-1 py-1 sm:min-h-[46px] sm:gap-3",
                      "transition-colors duration-200",
                      canOpenReportFilter
                        ? "cursor-pointer hover:bg-muted/30"
                        : "cursor-default"
                    )}
                    title={
                      canOpenReportFilter
                        ? isRTL
                          ? "عرض التحليل في التقارير"
                          : "View report filter"
                        : undefined
                    }
                  >
                    <div
                      className={cn(
                        "z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-2xl border bg-card shadow-sm sm:h-8 sm:w-8",
                        "transition-all duration-300 group-hover:scale-105",
                        getActivityStyle(activity.type)
                      )}
                    >
                      {getActivityIcon(activity.type)}
                    </div>

                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="mb-0.5 flex items-start justify-between gap-2 sm:gap-3">
                        <h4 className="min-w-0 flex-1 whitespace-normal break-words text-xs font-bold leading-4 tracking-tight text-foreground sm:text-sm sm:leading-5">
                          {title || t("doctorDashboard.activity.title")}
                        </h4>

                        <span
                          className={cn(
                            "shrink-0 whitespace-nowrap rounded-lg bg-muted px-1.5 py-0.5",
                            "text-[8px] font-bold uppercase tracking-tight text-muted-foreground sm:px-2 sm:py-1 sm:text-[10px]",
                            isRTL ? "mr-1 sm:mr-2" : "ml-1 sm:ml-2"
                          )}
                        >
                          {formatActivityDate(activity.created_at)}
                        </span>
                      </div>

                      <p className="whitespace-normal break-words text-[11px] font-medium leading-4 text-muted-foreground sm:text-xs sm:leading-5">
                        {description}
                      </p>
                    </div>
                  </div>
                );
              })}

              {Array.from({ length: emptyRowsCount }).map((_, index) => (
                <PlaceholderRow
                  key={`placeholder-activity-row-${index}`}
                  index={index}
                />
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}