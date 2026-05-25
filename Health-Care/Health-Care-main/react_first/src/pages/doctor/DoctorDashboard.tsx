import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useApiCall } from "@/hooks/useApiCall";
import { API_ENDPOINTS } from "@/lib/api";
import { toast } from "sonner";

import StatsCards from "@/components/doctor/StatsCards";
import PendingPredictions from "@/components/doctor/PendingPredictions";
import RiskDistributionChart from "@/components/doctor/RiskDistributionChart";
import AppointmentsToday from "@/components/doctor/AppointmentsToday";
import RecentActivity from "@/components/doctor/RecentActivity";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  FileText,
  Calendar,
  Check,
  X,
  RefreshCw,
  Save,
  Search,
  Bell,
  Globe,
} from "lucide-react";

import LoadingDots from "@/components/shared/LoadingDots";
import { cn } from "@/lib/utils";
import type { Prediction, ReviewStatus } from "@/types/api";

export default function DoctorDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { execute: apiCall } = useApiCall();

  const isArabic = i18n.language === "ar";

  const [stats, setStats] = useState<any>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [riskData, setRiskData] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const [selectedReport, setSelectedReport] = useState<Prediction | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [decision, setDecision] = useState<ReviewStatus>("pending");
  const [submitting, setSubmitting] = useState(false);

  const [loading, setLoading] = useState({
    stats: true,
    predictions: true,
    riskData: true,
    appointments: true,
    activities: true,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedDateTime = currentDateTime.toLocaleString(
    isArabic ? "ar-EG" : "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        const statsRes: any = await apiCall(API_ENDPOINTS.DOCTOR_DASHBOARD);

        if (!isMounted) return;

        setStats(statsRes?.stats || statsRes?.dashboard || statsRes || null);
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
        toast.error("Failed to load dashboard stats");
      } finally {
        if (isMounted) {
          setLoading((prev) => ({ ...prev, stats: false }));
        }
      }

      try {
        const predsRes: any = await apiCall(
          API_ENDPOINTS.DOCTOR_PENDING_PREDICTIONS
        );

        if (!isMounted) return;

        setPredictions(
          Array.isArray(predsRes)
            ? predsRes
            : predsRes?.predictions ||
                predsRes?.pending_predictions ||
                predsRes?.results ||
                predsRes?.data ||
                []
        );
      } catch (error) {
        console.error("Failed to load pending reviews", error);
        toast.error("Failed to load pending reviews");
      } finally {
        if (isMounted) {
          setLoading((prev) => ({ ...prev, predictions: false }));
        }
      }

      try {
        const riskRes: any = await apiCall(
          API_ENDPOINTS.DOCTOR_RISK_DISTRIBUTION
        );

        if (!isMounted) return;

        setRiskData(
          riskRes?.risk_distribution ||
            riskRes?.distribution_data ||
            riskRes?.riskData ||
            riskRes ||
            null
        );
      } catch (error) {
        console.error("Failed to load risk data", error);
        setRiskData(null);
      } finally {
        if (isMounted) {
          setLoading((prev) => ({ ...prev, riskData: false }));
        }
      }

      try {
        const appointmentsRes: any = await apiCall(
          API_ENDPOINTS.DOCTOR_APPOINTMENTS_TODAY
        );

        if (!isMounted) return;

        setAppointments(
          Array.isArray(appointmentsRes)
            ? appointmentsRes
            : appointmentsRes?.appointments ||
                appointmentsRes?.today_appointments ||
                appointmentsRes?.results ||
                appointmentsRes?.data ||
                []
        );
      } catch (error) {
        console.error("Failed to load today's appointments", error);
        setAppointments([]);
      } finally {
        if (isMounted) {
          setLoading((prev) => ({ ...prev, appointments: false }));
        }
      }

      try {
        const activityRes: any = await apiCall(API_ENDPOINTS.DOCTOR_ACTIVITY);

        if (!isMounted) return;

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
        console.error("Failed to load recent activity", error);
        setActivities([]);
      } finally {
        if (isMounted) {
          setLoading((prev) => ({ ...prev, activities: false }));
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [apiCall]);

  const handleChangeLanguage = () => {
    const nextLanguage = isArabic ? "en" : "ar";
    i18n.changeLanguage(nextLanguage);
  };

  const getRiskClasses = (level: string) => {
    switch (level?.toLowerCase()) {
      case "high":
      case "very high":
        return {
          text: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-100",
          badge: "bg-red-50 text-red-600 border-red-100",
        };

      case "medium":
        return {
          text: "text-amber-600",
          bg: "bg-amber-50",
          border: "border-amber-100",
          badge: "bg-amber-50 text-amber-600 border-amber-100",
        };

      case "low":
        return {
          text: "text-emerald-600",
          bg: "bg-emerald-50",
          border: "border-emerald-100",
          badge: "bg-emerald-50 text-emerald-600 border-emerald-100",
        };

      default:
        return {
          text: "text-primary",
          bg: "bg-primary/10",
          border: "border-primary/15",
          badge: "bg-primary/10 text-primary border-primary/15",
        };
    }
  };

  const handleReviewPrediction = (id: number) => {
    const report = predictions.find((item) => item.id === id);

    if (!report) {
      toast.error(isArabic ? "لم يتم العثور على التقرير" : "Report not found");
      return;
    }

    setSelectedReport(report);
    setDoctorNotes(report.message || "");
    setDecision((report.review_status as ReviewStatus) || "pending");
    setIsReviewOpen(true);
  };

  const handleSaveReview = async () => {
    if (!selectedReport) return;

    if (decision === "pending") {
      toast.error(
        isArabic ? "اختر قرار المراجعة أولاً" : "Please choose a review decision"
      );
      return;
    }

    try {
      setSubmitting(true);

      await apiCall(API_ENDPOINTS.DOCTOR_REVIEW_PREDICTION(selectedReport.id), {
        method: "POST",
        body: JSON.stringify({
          decision,
          notes: doctorNotes,
        }),
      });

      toast.success(
        isArabic ? "تم حفظ المراجعة بنجاح" : "Review saved successfully"
      );

      setIsReviewOpen(false);
      setSelectedReport(null);

      setPredictions((prev) =>
        prev.filter((prediction) => prediction.id !== selectedReport.id)
      );
    } catch (error) {
      console.error("Failed to save review", error);
      toast.error(isArabic ? "فشل حفظ المراجعة" : "Failed to save review");
    } finally {
      setSubmitting(false);
    }
  };

  const clinicalIndicators = selectedReport
    ? [
        {
          label: t("dashboard.glucose"),
          value: selectedReport.glucose,
          unit: "mg/dL",
        },
        {
          label: t("dashboard.bloodPressure"),
          value: selectedReport.blood_pressure,
          unit: "mmHg",
        },
        {
          label: t("dashboard.bmi"),
          value: selectedReport.bmi,
          unit: "kg/m²",
        },
        {
          label: t("dashboard.insulin"),
          value: selectedReport.insulin,
          unit: "mu U/ml",
        },
        {
          label: isArabic ? "سماكة الجلد" : "Skin",
          value: selectedReport.skin_thickness,
          unit: "mm",
        },
        {
          label: t("dashboard.age"),
          value: selectedReport.age,
          unit: "Years",
        },
        {
          label: t("dashboard.diabetesPedigree"),
          value: selectedReport.diabetes_pedigree_function,
          unit: "Score",
        },
        {
          label: t("dashboard.pregnancies"),
          value: selectedReport.pregnancies,
          unit: "Count",
        },
      ]
    : [];

  const reviewActions = [
    {
      id: "approved" as ReviewStatus,
      label: t("doctorDashboard.reports.drawer.actions.approve"),
      icon: Check,
      activeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      iconClass: "bg-emerald-100 text-emerald-600",
    },
    {
      id: "rejected" as ReviewStatus,
      label: t("doctorDashboard.reports.drawer.actions.reject"),
      icon: X,
      activeClass: "border-red-200 bg-red-50 text-red-700",
      iconClass: "bg-red-100 text-red-600",
    },
    {
      id: "needs_followup" as ReviewStatus,
      label: t("doctorDashboard.reports.drawer.actions.followUp"),
      icon: RefreshCw,
      activeClass: "border-primary/25 bg-primary/10 text-primary",
      iconClass: "bg-primary/15 text-primary",
    },
  ];

  const selectedRiskClasses = selectedReport
    ? getRiskClasses(selectedReport.risk_level || "")
    : getRiskClasses("");

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-full w-full max-w-none pb-8 pt-8 animate-in fade-in duration-700 md:pt-0"
    >
      <div className="w-full space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {t("doctorDashboard.welcome")},{" "}
              {user?.first_name || user?.username}
            </h2>

            <p className="mt-1 max-w-full text-lg font-medium leading-snug text-slate-500 sm:max-w-none">
              {t("doctorDashboard.subtitle")}
            </p>

            <div className="mt-2 text-xs font-semibold text-slate-500">
              <span>{formattedDateTime}</span>
            </div>
          </div>

          <div className="flex w-full items-center gap-3 lg:w-auto">
            <div className="group relative min-w-0 flex-1 lg:w-96 lg:flex-none">
              <Search
                className={cn(
                  "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary",
                  isArabic ? "right-5" : "left-5"
                )}
              />

              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={t("doctorDashboard.searchPlaceholder")}
                className={cn(
                  "h-12 w-full rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm shadow-slate-200/50 outline-none transition-all placeholder:text-slate-400 focus:border-primary/25 focus:ring-4 focus:ring-primary/10",
                  isArabic ? "pr-14 pl-10 text-right" : "pl-14 pr-10"
                )}
              />

              {searchValue && (
                <button
                  type="button"
                  onClick={() => setSearchValue("")}
                  className={cn(
                    "absolute top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-primary/10 text-primary transition-none hover:bg-primary/10 hover:text-primary",
                    isArabic ? "left-2" : "right-2"
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleChangeLanguage}
              className="h-12 w-12 shrink-0 rounded-2xl bg-white text-primary shadow-sm shadow-slate-200/50 transition-none hover:bg-white hover:text-primary"
            >
              <Globe className="h-5 w-5" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative h-12 w-12 shrink-0 rounded-2xl bg-white text-primary shadow-sm shadow-slate-200/50 transition-none hover:bg-white hover:text-primary"
            >
              <Bell className="h-5 w-5" />

              {stats?.unread_notifications > 0 && (
                <span
                  className={cn(
                    "absolute top-3 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500",
                    isArabic ? "left-3" : "right-3"
                  )}
                />
              )}
            </Button>
          </div>
        </div>

        <StatsCards stats={stats} isLoading={loading.stats} />

        <div className="grid w-full grid-cols-1 items-stretch gap-5 xl:grid-cols-12">
          <div className="flex min-w-0 flex-col gap-5 xl:col-span-8">
            <PendingPredictions
              predictions={predictions}
              isLoading={loading.predictions}
              onReview={handleReviewPrediction}
            />

            <RecentActivity
              activities={activities}
              isLoading={loading.activities}
            />
          </div>

          <div className="flex h-full min-w-0 flex-col gap-5 xl:col-span-4">
            <RiskDistributionChart
              data={riskData}
              isLoading={loading.riskData || loading.predictions}
            />

            <AppointmentsToday
              appointments={appointments}
              isLoading={loading.appointments}
            />
          </div>
        </div>
      </div>

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-h-[88vh] w-[92vw] max-w-4xl overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-0 shadow-2xl">
          {selectedReport && (
            <div className="flex max-h-[88vh] flex-col overflow-hidden bg-white font-sans">
              <DialogHeader className="border-b border-slate-100 bg-white px-5 py-4 md:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <DialogTitle className="truncate text-lg font-bold tracking-tight text-slate-900 md:text-xl">
                        {t("doctorDashboard.reports.drawer.reportId", {
                          id: selectedReport.id,
                        })}
                      </DialogTitle>

                      <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                        {selectedReport.patient_name || "Anonymous Patient"}
                      </p>
                    </div>
                  </div>

                  <Badge
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
                      selectedRiskClasses.badge
                    )}
                  >
                    {selectedReport.risk_level} Risk
                  </Badge>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto">
                <div className="border-b border-slate-100 bg-gradient-to-br from-primary/5 via-white to-primary/10 px-5 py-4 md:px-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-12 w-12 shrink-0 border-2 border-white shadow-sm ring-1 ring-slate-100">
                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                          {selectedReport.patient_name
                            ?.split(" ")
                            .filter(Boolean)
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase() || "P"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <h2 className="truncate text-base font-bold tracking-tight text-slate-900 md:text-lg">
                          {selectedReport.patient_name || "Anonymous Patient"}
                        </h2>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
                          <span>ID #{selectedReport.id}</span>
                          <span>•</span>
                          <span>
                            {selectedReport.age} {t("dashboard.age")}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-primary" />
                            {new Date(
                              selectedReport.created_at
                            ).toLocaleDateString(i18n.language, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="rounded-full border border-primary/15 bg-primary/10 px-4 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          AI Probability
                        </span>

                        <span className="ml-2 text-lg font-bold text-primary">
                          {Math.round(selectedReport.probability || 0)}%
                        </span>
                      </div>

                      <div
                        className={cn(
                          "rounded-full border px-4 py-2",
                          selectedRiskClasses.bg,
                          selectedRiskClasses.border
                        )}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Risk
                        </span>

                        <span
                          className={cn(
                            "ml-2 text-sm font-bold",
                            selectedRiskClasses.text
                          )}
                        >
                          {selectedReport.risk_level}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="prediction" className="w-full">
                  <div className="border-b border-slate-100 px-5 md:px-6">
                    <TabsList className="h-12 w-full justify-start gap-7 bg-transparent p-0">
                      <TabsTrigger
                        value="prediction"
                        className="h-full rounded-none border-b-2 border-transparent px-0 text-[11px] font-bold uppercase tracking-widest text-slate-400 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                      >
                        {t("doctorDashboard.reports.drawer.tabs.prediction")}
                      </TabsTrigger>

                      <TabsTrigger
                        value="review"
                        className="h-full rounded-none border-b-2 border-transparent px-0 text-[11px] font-bold uppercase tracking-widest text-slate-400 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                      >
                        {t("doctorDashboard.reports.drawer.tabs.review")}
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent
                    value="prediction"
                    className="m-0 space-y-5 p-5 animate-in fade-in duration-300 md:p-6"
                  >
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        {t("doctorDashboard.reports.clinicalIndicators")}
                      </h4>

                      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                        <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                          <div className="divide-y divide-slate-100">
                            {clinicalIndicators.slice(0, 4).map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50/70"
                              >
                                <p className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                  {item.label}
                                </p>

                                <div className="shrink-0 text-right">
                                  <span className="text-sm font-bold text-slate-900">
                                    {item.value}
                                  </span>

                                  <span className="ml-1 text-[10px] font-semibold text-slate-400">
                                    {item.unit}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="divide-y divide-slate-100">
                            {clinicalIndicators.slice(4).map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50/70"
                              >
                                <p className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                  {item.label}
                                </p>

                                <div className="shrink-0 text-right">
                                  <span className="text-sm font-bold text-slate-900">
                                    {item.value}
                                  </span>

                                  <span className="ml-1 text-[10px] font-semibold text-slate-400">
                                    {item.unit}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                      <h4 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-primary">
                        {t("doctorDashboard.reports.aiInsight")}
                      </h4>

                      <p className="text-sm font-medium leading-6 text-slate-700">
                        {selectedReport.message ||
                          "Based on the clinical indicators provided, the AI model has identified risk patterns. Medical review is recommended."}
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="review"
                    className="m-0 space-y-4 p-5 animate-in fade-in duration-300 md:p-6"
                  >
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        {t("doctorDashboard.reports.clinicalDecision")}
                      </h4>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {reviewActions.map((action) => (
                          <button
                            key={action.id}
                            type="button"
                            onClick={() => setDecision(action.id)}
                            className={cn(
                              "flex items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-300",
                              decision === action.id
                                ? action.activeClass
                                : "border-slate-100 bg-white text-slate-500 hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                                decision === action.id
                                  ? action.iconClass
                                  : "bg-slate-50 text-slate-400"
                              )}
                            >
                              <action.icon className="h-4 w-4" />
                            </div>

                            <span className="text-[11px] font-bold uppercase tracking-widest">
                              {action.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      className="h-32 w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-700 outline-none transition-all focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/10"
                      placeholder={t("doctorDashboard.reports.notesPlaceholder")}
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                    />

                    <div className="flex justify-end border-t border-slate-100 pt-4">
                      <Button
                        onClick={handleSaveReview}
                        disabled={submitting || decision === "pending"}
                        className="h-10 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                      >
                        {submitting ? (
                          <LoadingDots color="white" />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            {t("doctorDashboard.reports.drawer.saveReview")}
                          </div>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}