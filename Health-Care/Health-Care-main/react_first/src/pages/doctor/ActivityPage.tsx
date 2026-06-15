import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  Activity,
  MessageSquare,
  Bell,
  History,
  ExternalLink,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiCall } from "@/hooks/useApiCall";
import { API_ENDPOINTS } from "@/lib/api";
import { reportsApi } from "@/api/reports";
import { notificationsApi } from "@/api/notifications";
import type { Prediction, Notification } from "@/types/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ActivityCategory = "prediction" | "message" | "notification" | "other";

interface ActivityItem {
  type?: string;
  icon?: string;
  title?: string;
  description?: string;
  related_id?: number;
  prediction_id?: number;
  report_id?: number;
  analysis_id?: number;
  message_id?: number;
  notification_id?: number;
  patient_id?: number;
  patient_user?: number;
  patient_user_id?: number;
  user_id?: number;
  patient_name?: string;
  status?: string;
  review_status?: string;
  decision?: string;
  action?: string;
  created_at?: string;
}

const PAGE_SIZE = 6;

export default function ActivityPage() {
  const { t, i18n } = useTranslation();
  const { execute: apiCall } = useApiCall();
  const navigate = useNavigate();

  const isRTL = i18n.language.startsWith("ar");
  const dateLocale = isRTL ? ar : enUS;

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] =
    useState<ActivityCategory>("prediction");
  const [page, setPage] = useState(1);

  const normalizeText = (value: unknown) => {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/[ًٌٍَُِّْ]/g, "")
      .replace(/[إأآا]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي");
  };

  const toNumberOrNull = (value: unknown) => {
    const numberValue = Number(value);
    return Number.isNaN(numberValue) || !numberValue ? null : numberValue;
  };

  const normalizeReviewStatus = (status: unknown) => {
    const value = normalizeText(status);

    if (
      value.includes("approved") ||
      value.includes("approve") ||
      value.includes("معتمد")
    ) {
      return "approved";
    }

    if (
      value.includes("rejected") ||
      value.includes("reject") ||
      value.includes("مرفوض")
    ) {
      return "rejected";
    }

    if (
      value.includes("needs followup") ||
      value.includes("needs follow up") ||
      value.includes("needs_followup") ||
      value.includes("followup") ||
      value.includes("يحتاج متابعه") ||
      value.includes("يحتاج متابعة")
    ) {
      return "needs_followup";
    }

    return "pending";
  };

  const getReportPatientId = (report: Prediction) => {
    const item = report as any;

    const candidates = [
      item.patient_id,
      item.patient_user,
      item.patient_user_id,
      item.user_id,
      item.patientId,
      item.patient?.id,
      item.patient?.user_id,
      item.patient_details?.id,
      item.patient_data?.id,
      item.patient_profile?.id,
      item.extra_fields?.patient_id,
      item.extra_fields?.patient_user,
      item.extra_fields?.user_id,
    ];

    for (const candidate of candidates) {
      const id = toNumberOrNull(candidate);
      if (id) return id;
    }

    return null;
  };

  const getReportPatientName = (report: Prediction) => {
    const item = report as any;

    return String(
      item.patient_name ||
        item.patient?.name ||
        item.patient?.full_name ||
        item.patient_details?.name ||
        item.patient_data?.name ||
        item.patient_profile?.name ||
        item.user?.full_name ||
        item.user?.name ||
        (isRTL ? "مريض غير محدد" : "Anonymous Patient")
    ).trim();
  };

  const buildReportActivity = (report: Prediction): ActivityItem => {
    const patientName = getReportPatientName(report);
    const patientId = getReportPatientId(report) || undefined;

    return {
      type: "prediction",
      title: isRTL ? "آخر تحليل" : "Latest Analysis",
      description: isRTL
        ? `تحليل من ${patientName}`
        : `Analysis from ${patientName}`,
      related_id: Number(report.id),
      prediction_id: Number(report.id),
      report_id: Number(report.id),
      patient_id: patientId,
      patient_name: patientName,
      review_status: report.review_status || "pending",
      status: report.review_status || "pending",
      created_at: report.created_at,
    };
  };

  const buildNotificationActivity = (
    notification: Notification
  ): ActivityItem => {
    const relatedId = toNumberOrNull(notification.related_object_id);

    return {
      type: "notification",
      title: notification.title || (isRTL ? "إشعار جديد" : "New Notification"),
      description: notification.body || "",
      related_id: relatedId || Number(notification.id),
      notification_id: Number(notification.id),
      prediction_id:
        notification.related_object_type === "prediction"
          ? relatedId || undefined
          : undefined,
      message_id:
        notification.related_object_type === "chat_thread"
          ? relatedId || undefined
          : undefined,
      created_at: notification.created_at,
    };
  };

  const fetchActivities = async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);

      const [activityRes, reportsRes, notificationsRes]: any =
        await Promise.all([
          apiCall(API_ENDPOINTS.DOCTOR_ACTIVITY),
          reportsApi.getReports({}),
          notificationsApi.getNotifications("doctor"),
        ]);

      const extractedApiActivities = Array.isArray(activityRes)
        ? activityRes
        : activityRes?.activities ||
          activityRes?.recent_activity ||
          activityRes?.results ||
          activityRes?.data ||
          [];

      const apiActivities = Array.isArray(extractedApiActivities)
        ? extractedApiActivities
        : [];

      const messageActivities = apiActivities.filter((activity: ActivityItem) => {
        const text = `${normalizeText(activity.type)} ${normalizeText(
          activity.title
        )} ${normalizeText(activity.description)}`;

        return (
          text.includes("message") ||
          text.includes("رساله") ||
          text.includes("رسالة")
        );
      });

      const reportsList = Array.isArray(reportsRes)
        ? reportsRes
        : reportsRes?.predictions ||
          reportsRes?.results ||
          reportsRes?.data ||
          [];

      const latestAnalysisActivities = reportsList
        .filter((report: Prediction) => {
          const status = normalizeReviewStatus(report.review_status || "pending");
          return status === "pending";
        })
        .map((report: Prediction) => buildReportActivity(report));

      const notificationActivities = Array.isArray(notificationsRes)
        ? notificationsRes.map((notification: Notification) =>
            buildNotificationActivity(notification)
          )
        : [];

      const mergedActivities = [
        ...latestAnalysisActivities,
        ...messageActivities,
        ...notificationActivities,
      ].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setActivities(mergedActivities);
    } catch (error) {
      console.error("Failed to load activity", error);
      toast.error(
        isRTL ? "فشل تحميل النشاطات الحديثة" : "Failed to load recent activity"
      );
      setActivities([]);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(true);

    const interval = window.setInterval(() => {
      fetchActivities(false);
    }, 10000);

    return () => window.clearInterval(interval);
  }, [i18n.language]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory]);

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

  const getActivityCategory = (activity: ActivityItem): ActivityCategory => {
    const type = normalizeText(activity.type);
    const title = normalizeText(activity.title);
    const description = normalizeText(activity.description);
    const combined = `${type} ${title} ${description}`;

    if (
      type.includes("message") ||
      combined.includes("message") ||
      combined.includes("رساله") ||
      combined.includes("رسالة")
    ) {
      return "message";
    }

    if (
      type.includes("notification") ||
      type.includes("high risk") ||
      type.includes("alert") ||
      combined.includes("notification") ||
      combined.includes("اشعار") ||
      combined.includes("إشعار") ||
      combined.includes("تنبيه")
    ) {
      return "notification";
    }

    if (
      type.includes("prediction") ||
      type.includes("analysis") ||
      combined.includes("analysis") ||
      combined.includes("prediction") ||
      combined.includes("report") ||
      combined.includes("تحليل") ||
      combined.includes("تقرير")
    ) {
      return "prediction";
    }

    return "notification";
  };

  const getPredictionId = (activity: ActivityItem) => {
    return toNumberOrNull(
      activity.prediction_id ||
        activity.report_id ||
        activity.analysis_id ||
        activity.related_id
    );
  };

  const getMessageId = (activity: ActivityItem) => {
    return toNumberOrNull(activity.message_id || activity.related_id);
  };

  const getNotificationId = (activity: ActivityItem) => {
    return toNumberOrNull(activity.notification_id || activity.related_id);
  };

  const getPatientId = (activity: ActivityItem) => {
    return toNumberOrNull(
      activity.patient_id ||
        activity.patient_user ||
        activity.patient_user_id ||
        activity.user_id
    );
  };

  const getActivityPatientName = (activity: ActivityItem) => {
    return String(activity.patient_name || "").trim();
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

  const getCategoryIcon = (category: ActivityCategory) => {
    switch (category) {
      case "prediction":
        return <Activity className="h-4 w-4" strokeWidth={2.4} />;
      case "message":
        return <MessageSquare className="h-4 w-4" strokeWidth={2.4} />;
      case "notification":
        return <Bell className="h-4 w-4" strokeWidth={2.4} />;
      default:
        return <Bell className="h-4 w-4" strokeWidth={2.4} />;
    }
  };

  const getCategoryStyle = (category: ActivityCategory) => {
    switch (category) {
      case "prediction":
        return "border-primary/15 bg-primary/10 text-primary";
      case "message":
        return "border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300";
      case "notification":
        return "border-sky-100 bg-sky-50 text-sky-600 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300";
      default:
        return "border-border bg-muted/40 text-muted-foreground";
    }
  };

  const getCategoryLabel = (category: ActivityCategory) => {
    switch (category) {
      case "prediction":
        return isRTL ? "آخر تحليل" : "Latest Analysis";
      case "message":
        return isRTL ? "الرسائل" : "Messages";
      case "notification":
        return isRTL ? "الإشعارات" : "Notifications";
      default:
        return isRTL ? "أخرى" : "Other";
    }
  };

  const getOpenHint = (category: ActivityCategory) => {
    switch (category) {
      case "prediction":
        return isRTL ? "فتح تحليل المريض نفسه" : "Open this patient analysis";
      case "message":
        return isRTL ? "فتح رسالة المريض نفسها" : "Open this patient message";
      case "notification":
        return isRTL ? "فتح الإشعار" : "Open notification";
      default:
        return "";
    }
  };

  const handleActivityClick = (activity: ActivityItem) => {
    const category = getActivityCategory(activity);
    const predictionId = getPredictionId(activity);
    const messageId = getMessageId(activity);
    const notificationId = getNotificationId(activity);
    const patientId = getPatientId(activity);
    const patientName = getActivityPatientName(activity);

    if (category === "prediction") {
      if (!predictionId) return;

      const queryParams = new URLSearchParams();
      queryParams.set("prediction_id", String(predictionId));
      queryParams.set("open_prediction_id", String(predictionId));

      if (patientId) {
        queryParams.set("patient_id", String(patientId));
        queryParams.set("open_patient_id", String(patientId));
      }

      if (patientName) {
        queryParams.set("patient_name", patientName);
        queryParams.set("open_patient_name", patientName);
      }

      navigate(`/doctor-dashboard/reports?${queryParams.toString()}`, {
        state: {
          predictionId,
          openPredictionId: predictionId,
          selectedPredictionId: predictionId,
          patientId,
          openPatientId: patientId,
          patientName,
          openPatientName: patientName,
          fromActivity: true,
        },
      });

      return;
    }

    if (category === "message") {
      if (!messageId) return;

      const queryParams = new URLSearchParams();
      queryParams.set("message_id", String(messageId));
      queryParams.set("open_message_id", String(messageId));

      if (patientId) {
        queryParams.set("patient_id", String(patientId));
        queryParams.set("open_patient_id", String(patientId));
      }

      if (patientName) {
        queryParams.set("patient_name", patientName);
        queryParams.set("open_patient_name", patientName);
      }

      navigate(`/doctor-dashboard/messages?${queryParams.toString()}`, {
        state: {
          messageId,
          openMessageId: messageId,
          selectedMessageId: messageId,
          patientId,
          openPatientId: patientId,
          patientName,
          openPatientName: patientName,
          fromActivity: true,
        },
      });

      return;
    }

    if (category === "notification") {
      if (predictionId) {
        navigate(
          `/doctor-dashboard/reports?prediction_id=${predictionId}&open_prediction_id=${predictionId}`,
          {
            state: {
              predictionId,
              openPredictionId: predictionId,
              selectedPredictionId: predictionId,
              fromActivity: true,
            },
          }
        );
        return;
      }

      navigate(
        `/doctor-dashboard/notifications?notification_id=${notificationId || ""}`,
        {
          state: {
            notificationId,
            openNotificationId: notificationId,
            fromActivity: true,
          },
        }
      );
    }
  };

  const isClickableActivity = (activity: ActivityItem) => {
    const category = getActivityCategory(activity);

    if (category === "prediction") return Boolean(getPredictionId(activity));
    if (category === "message") return Boolean(getMessageId(activity));
    if (category === "notification") return true;

    return false;
  };

  const groupedActivities = useMemo(() => {
    const groups: Record<ActivityCategory, ActivityItem[]> = {
      prediction: [],
      message: [],
      notification: [],
      other: [],
    };

    activities.forEach((activity) => {
      const category = getActivityCategory(activity);

      if (
        category === "prediction" ||
        category === "message" ||
        category === "notification"
      ) {
        groups[category].push(activity);
      }
    });

    return groups;
  }, [activities, i18n.language]);

  const categoryCards = useMemo(
    () => [
      {
        key: "prediction" as ActivityCategory,
        title: isRTL ? "آخر تحليل" : "Latest Analysis",
        count: groupedActivities.prediction.length,
      },
      {
        key: "message" as ActivityCategory,
        title: isRTL ? "الرسائل" : "Messages",
        count: groupedActivities.message.length,
      },
      {
        key: "notification" as ActivityCategory,
        title: isRTL ? "الإشعارات" : "Notifications",
        count: groupedActivities.notification.length,
      },
    ],
    [groupedActivities, isRTL]
  );

  const visibleActivities = groupedActivities[activeCategory];

  const totalPages = Math.max(1, Math.ceil(visibleActivities.length / PAGE_SIZE));

  const paginatedActivities = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return visibleActivities.slice(start, start + PAGE_SIZE);
  }, [visibleActivities, page, totalPages]);

  const goPrev = () => setPage((prev) => Math.max(1, prev - 1));
  const goNext = () => setPage((prev) => Math.min(totalPages, prev + 1));

  const totalShownActivities = categoryCards.reduce(
    (sum, item) => sum + item.count,
    0
  );

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-full w-full max-w-none pb-8 pt-8 text-foreground animate-in fade-in duration-700 md:pt-0"
    >
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("doctorDashboard.activity.title", {
              defaultValue: "Recent Activity",
            })}
          </h1>

          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {isRTL
              ? `${totalShownActivities} نشاط حديث`
              : `${totalShownActivities} recent activities`}
          </p>
        </div>

        {isLoading ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <Card
                  key={item}
                  className="rounded-3xl border border-border bg-card p-5 shadow-sm"
                >
                  <Skeleton className="h-9 w-9 rounded-2xl" />
                  <Skeleton className="mt-5 h-4 w-[120px] rounded-md" />
                  <Skeleton className="mt-4 h-7 w-[50px] rounded-md" />
                </Card>
              ))}
            </div>

            <Card className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
              <div className="space-y-5 p-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-[180px] rounded-md" />
                      <Skeleton className="h-3 w-full max-w-[520px] rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : totalShownActivities === 0 ? (
          <Card className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
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
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {categoryCards.map((card) => {
                const isActive = activeCategory === card.key;

                return (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => setActiveCategory(card.key)}
                    className={cn(
                      "group rounded-3xl border bg-card p-5 text-start shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
                      isActive
                        ? "border-primary/30 ring-4 ring-primary/10"
                        : "border-border hover:border-primary/20"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-2xl border shadow-sm",
                          getCategoryStyle(card.key)
                        )}
                      >
                        {getCategoryIcon(card.key)}
                      </div>

                      <Badge className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary shadow-none hover:bg-primary/10 hover:text-primary">
                        {card.count}
                      </Badge>
                    </div>

                    <h3 className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      {card.title}
                    </h3>

                    <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
                      {card.count}
                    </p>
                  </button>
                );
              })}
            </div>

            <Card className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b border-border bg-muted/30 p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-sm",
                      getCategoryStyle(activeCategory)
                    )}
                  >
                    {getCategoryIcon(activeCategory)}
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold tracking-tight text-foreground">
                      {getCategoryLabel(activeCategory)}
                    </h2>

                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                      {isRTL
                        ? `${visibleActivities.length} عنصر`
                        : `${visibleActivities.length} item${
                            visibleActivities.length === 1 ? "" : "s"
                          }`}
                    </p>
                  </div>
                </div>
              </div>

              {visibleActivities.length === 0 ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
                  <FileText
                    className="mb-3 h-9 w-9 text-muted-foreground"
                    strokeWidth={2.2}
                  />

                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {isRTL ? "لا يوجد بيانات هنا" : "No items here"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-border">
                    {paginatedActivities.map((activity, index) => {
                      const category = getActivityCategory(activity);
                      const cleanTitle =
                        hideIdsFromText(activity.title) ||
                        getCategoryLabel(category);

                      const cleanDescription = hideIdsFromText(
                        activity.description
                      );

                      const canOpen = isClickableActivity(activity);

                      return (
                        <button
                          key={`${category}-${
                            activity.related_id ||
                            activity.prediction_id ||
                            activity.message_id ||
                            activity.notification_id ||
                            activity.patient_id ||
                            activity.patient_name ||
                            index
                          }-${index}`}
                          type="button"
                          onClick={() => handleActivityClick(activity)}
                          disabled={!canOpen}
                          className={cn(
                            "group flex w-full items-start gap-4 p-5 text-start transition-colors",
                            canOpen
                              ? "cursor-pointer hover:bg-primary/[0.04]"
                              : "cursor-default"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-sm",
                              getCategoryStyle(category)
                            )}
                          >
                            {getCategoryIcon(category)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-2">
                                <h4 className="min-w-0 text-sm font-bold tracking-tight text-foreground">
                                  {cleanTitle}
                                </h4>

                                {canOpen && (
                                  <ExternalLink
                                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                                    strokeWidth={2.4}
                                  />
                                )}
                              </div>

                              <span className="shrink-0 whitespace-nowrap rounded-lg bg-muted/50 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                                {formatActivityDate(activity.created_at)}
                              </span>
                            </div>

                            {cleanDescription && (
                              <p className="text-sm font-medium leading-6 text-muted-foreground">
                                {cleanDescription}
                              </p>
                            )}

                            {canOpen && (
                              <p className="mt-2 text-xs font-bold text-primary opacity-80">
                                {getOpenHint(category)}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 border-t border-border bg-muted/20 p-4">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={page === 1}
                        onClick={isRTL ? goNext : goPrev}
                        className="h-10 w-10 rounded-full border-primary/30 bg-card text-primary hover:bg-primary/10 disabled:opacity-40"
                      >
                        {isRTL ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronLeft className="h-4 w-4" />
                        )}
                      </Button>

                      <div className="rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-muted-foreground shadow-sm">
                        {isRTL
                          ? `صفحة ${page} من ${totalPages}`
                          : `Page ${page} of ${totalPages}`}
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        disabled={page === totalPages}
                        onClick={isRTL ? goPrev : goNext}
                        className="h-10 w-10 rounded-full border-primary/30 bg-card text-primary hover:bg-primary/10 disabled:opacity-40"
                      >
                        {isRTL ? (
                          <ChevronLeft className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}