import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { reportsApi } from "@/api/reports";
import type { Prediction, ReviewStatus } from "@/types/api";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Search,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  Eye,
  Save,
  Check,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Pill,
} from "lucide-react";

import { toast } from "sonner";
import LoadingDots from "@/components/shared/LoadingDots";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function ReportsPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isArabic = i18n.language === "ar";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedReport, setSelectedReport] = useState<Prediction | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [reports, setReports] = useState<Prediction[]>([]);

  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const [doctorNotes, setDoctorNotes] = useState("");
  const [medication, setMedication] = useState("");
  const [decision, setDecision] = useState<ReviewStatus>("pending");

  const getMedicationValue = (report: Prediction) => {
    return (
      (report as any).medication ||
      (report as any).prescription ||
      (report as any).doctor_medication ||
      ""
    );
  };

  const fetchReports = async () => {
    try {
      setLoading(true);

      const data = await reportsApi.getReports({
        status: statusFilter || undefined,
      });

      setReports(data);

      const state = location.state as { openReportId?: number };

      if (state?.openReportId) {
        const reportToOpen = data.find((r) => r.id === state.openReportId);

        if (reportToOpen) {
          setSelectedReport(reportToOpen);
          setDecision((reportToOpen.review_status as ReviewStatus) || "pending");
          setDoctorNotes(reportToOpen.message || "");
          setMedication(getMedicationValue(reportToOpen));
          setIsDrawerOpen(true);

          window.history.replaceState({}, document.title);
        }
      }
    } catch (error) {
      console.error("Failed to fetch reports", error);
      toast.error(t("doctorDashboard.reports.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const filteredReports = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return reports.filter(
      (report) =>
        !searchValue ||
        (report.patient_name || "").toLowerCase().includes(searchValue)
    );
  }, [reports, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));

  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredReports.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredReports, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    return {
      total: reports.length,
      pending: reports.filter((r) => r.review_status === "pending").length,
      followUp: reports.filter((r) => r.review_status === "needs_followup")
        .length,
      approved: reports.filter((r) => r.review_status === "approved").length,
    };
  }, [reports]);

  const handleViewReport = (report: Prediction) => {
    setSelectedReport(report);
    setDoctorNotes(report.message || "");
    setMedication(getMedicationValue(report));
    setDecision((report.review_status as ReviewStatus) || "pending");
    setIsDrawerOpen(true);
  };

  const handleSaveReview = async () => {
    if (!selectedReport) return;

    try {
      setSubmitting(true);

      await reportsApi.submitReview(selectedReport.id, {
        decision,
        notes: doctorNotes,
        medication,
      } as any);

      toast.success(t("doctorDashboard.reports.saveSuccess"));
      setIsDrawerOpen(false);
      setSelectedReport(null);
      setDoctorNotes("");
      setMedication("");
      fetchReports();
    } catch (error) {
      console.error("Failed to save review", error);
      toast.error(t("doctorDashboard.reports.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "high":
      case "very high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "green";
      default:
        return "blue";
    }
  };

  const getRiskClasses = (level: string) => {
    switch (getRiskColor(level)) {
      case "red":
        return {
          text: "text-red-600 dark:text-red-300",
          bg: "bg-red-50 dark:bg-red-500/10",
          border: "border-red-100 dark:border-red-500/30",
          progress: "bg-red-500",
          badge:
            "bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30",
        };
      case "orange":
        return {
          text: "text-amber-600 dark:text-amber-300",
          bg: "bg-amber-50 dark:bg-amber-500/10",
          border: "border-amber-100 dark:border-amber-500/30",
          progress: "bg-amber-500",
          badge:
            "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
        };
      case "green":
        return {
          text: "text-emerald-600 dark:text-emerald-300",
          bg: "bg-emerald-50 dark:bg-emerald-500/10",
          border: "border-emerald-100 dark:border-emerald-500/30",
          progress: "bg-emerald-500",
          badge:
            "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
        };
      default:
        return {
          text: "text-primary",
          bg: "bg-primary/10",
          border: "border-primary/15",
          progress: "bg-primary",
          badge: "bg-primary/10 text-primary border-primary/15",
        };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="rounded-xl border border-border bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {t("doctorDashboard.reports.status.pending")}
          </Badge>
        );
      case "reviewed":
        return (
          <Badge className="rounded-xl border border-primary/15 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
            {t("doctorDashboard.reports.status.reviewed")}
          </Badge>
        );
      case "needs_followup":
        return (
          <Badge className="rounded-xl border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            {t("doctorDashboard.reports.status.needsFollowUp")}
          </Badge>
        );
      case "approved":
        return (
          <Badge className="rounded-xl border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            {t("doctorDashboard.reports.status.approved")}
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="rounded-xl border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {t("doctorDashboard.reports.status.rejected")}
          </Badge>
        );
      default:
        return (
          <Badge className="rounded-xl border border-border bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {status}
          </Badge>
        );
    }
  };

  const statCards = [
    {
      label: t("doctorDashboard.reports.stats.total"),
      value: stats.total,
      icon: FileText,
      className: "bg-primary/10 text-primary border-primary/15",
    },
    {
      label: t("doctorDashboard.reports.stats.pending"),
      value: stats.pending,
      icon: Clock,
      className:
        "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
    },
    {
      label: t("doctorDashboard.reports.stats.followUp"),
      value: stats.followUp,
      icon: Calendar,
      className: "bg-primary/10 text-primary border-primary/15",
    },
    {
      label: t("doctorDashboard.reports.stats.approved"),
      value: stats.approved,
      icon: CheckCircle2,
      className:
        "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
    },
  ];

  const statusSelectOptions = [
    { value: "all", label: isArabic ? "كل الحالات" : "All Review Statuses" },
    { value: "pending", label: t("doctorDashboard.reports.status.pending") },
    { value: "approved", label: t("doctorDashboard.reports.status.approved") },
    {
      value: "needs_followup",
      label: t("doctorDashboard.reports.status.needsFollowUp"),
    },
  ];

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
      activeClass:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
      iconClass:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
    {
      id: "rejected" as ReviewStatus,
      label: t("doctorDashboard.reports.drawer.actions.reject"),
      icon: X,
      activeClass:
        "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
      iconClass:
        "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300",
    },
    {
      id: "needs_followup" as ReviewStatus,
      label: t("doctorDashboard.reports.drawer.actions.followUp"),
      icon: Calendar,
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
      className="flex min-h-full w-full max-w-none flex-col space-y-6 pb-20 pt-8 text-foreground animate-in fade-in duration-700 md:pt-0"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("doctorDashboard.reports.title")}
        </h1>

        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          {t("doctorDashboard.reports.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card
            key={index}
            className="group flex flex-col gap-3 rounded-3xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-2xl border",
                stat.className
              )}
            >
              <stat.icon className="h-5 w-5" strokeWidth={2.3} />
            </div>

            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {stat.value}
              </p>

              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {stat.label}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="border-b border-border bg-muted/30 p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-sm font-bold text-foreground">
                    {t("doctorDashboard.reports.filter")}
                  </p>

                  <p className="text-[11px] font-semibold text-muted-foreground">
                    {filteredReports.length} result
                    {filteredReports.length === 1 ? "" : "s"} found
                  </p>
                </div>
              </div>

              {(statusFilter || search) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStatusFilter(null);
                    setSearch("");
                  }}
                  className="h-9 rounded-xl px-3 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 hover:text-red-600 dark:text-red-300 dark:hover:text-red-200"
                >
                  {t("doctorDashboard.reports.clearFilters")}
                </Button>
              )}
            </div>

            <div className="mx-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-full border border-border bg-background shadow-sm transition-all focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/10 md:h-12 md:flex-row md:items-center">
              <div className="group relative min-h-12 flex-1">
                <Search
                  className={cn(
                    "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary",
                    isArabic ? "right-4" : "left-4"
                  )}
                />

                <Input
                  placeholder={t("doctorDashboard.reports.searchPlaceholder")}
                  className={cn(
                    "h-12 rounded-none border-0 bg-transparent text-sm font-semibold text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0",
                    isArabic ? "pr-10 pl-10 text-right" : "pl-10 pr-10"
                  )}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary",
                      isArabic ? "left-4" : "right-4"
                    )}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="h-px w-full bg-border md:h-7 md:w-px" />

              <Select
                value={statusFilter || "all"}
                onValueChange={(value) =>
                  setStatusFilter(value === "all" ? null : value)
                }
                dir={isArabic ? "rtl" : "ltr"}
              >
                <SelectTrigger className="h-12 w-full rounded-none border-0 bg-transparent px-4 text-sm font-bold text-primary shadow-none transition-none hover:bg-primary/5 hover:text-primary focus:ring-0 focus:ring-offset-0 md:w-[230px]">
                  <SelectValue placeholder={isArabic ? "اختر الحالة" : "Status"} />
                </SelectTrigger>

                <SelectContent className="rounded-2xl border-border bg-popover p-1 text-popover-foreground shadow-xl">
                  {statusSelectOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="cursor-pointer rounded-xl text-sm font-semibold focus:bg-primary/10 focus:text-primary"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <LoadingDots />

              <p className="mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t("doctorDashboard.reports.loading")}
              </p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <FileText className="h-7 w-7 opacity-80" />
              </div>

              <p className="text-xs font-bold uppercase tracking-widest">
                {t("doctorDashboard.reports.noReports")}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4 p-4 md:hidden">
                {paginatedReports.map((report) => {
                  const riskClasses = getRiskClasses(report.risk_level || "");

                  return (
                    <Card
                      key={report.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleViewReport(report)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleViewReport(report);
                      }}
                      className="cursor-pointer rounded-3xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-all hover:border-primary/20 hover:bg-primary/[0.03]"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-11 w-11 shrink-0 border border-border shadow-sm">
                            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                              {report.patient_name
                                ?.split(" ")
                                .filter(Boolean)
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase() || "P"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-foreground">
                              {report.patient_name || "Anonymous"}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {getStatusBadge(report.review_status)}
                        </div>
                      </div>

                      <div className="mb-4 rounded-2xl bg-muted/30 p-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {t("doctorDashboard.reports.table.probability")}
                          </p>

                          <span
                            className={cn(
                              "text-sm font-bold tracking-tight",
                              riskClasses.text
                            )}
                          >
                            {Math.round(report.probability || 0)}%
                          </span>
                        </div>

                        <div className="h-2 w-full overflow-hidden rounded-full bg-background">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              riskClasses.progress
                            )}
                            style={{ width: `${report.probability || 0}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-2xl border border-border bg-background/60 p-3">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                            Glu
                          </p>

                          <p className="mt-1 text-sm font-bold text-foreground">
                            {report.glucose}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-border bg-background/60 p-3">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                            BMI
                          </p>

                          <p className="mt-1 text-sm font-bold text-foreground">
                            {report.bmi}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-border bg-background/60 p-3">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                            BP
                          </p>

                          <p className="mt-1 text-sm font-bold text-foreground">
                            {report.blood_pressure}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString(
                            i18n.language,
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </p>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 rounded-xl bg-primary/10 px-4 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewReport(report);
                          }}
                        >
                          <Eye
                            className={cn(
                              "h-3.5 w-3.5",
                              isArabic ? "ml-2" : "mr-2"
                            )}
                          />
                          {t("doctorDashboard.pendingReviews.reviewBtn")}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table
                  className="w-full border-collapse text-left"
                  dir={isArabic ? "rtl" : "ltr"}
                >
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="p-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {t("doctorDashboard.reports.table.patient")}
                      </th>

                      <th className="p-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {t("doctorDashboard.reports.table.probability")}
                      </th>

                      <th className="p-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {t("doctorDashboard.reports.table.indicators")}
                      </th>

                      <th className="p-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {t("doctorDashboard.reports.table.status")}
                      </th>

                      <th className="p-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {t("doctorDashboard.reports.table.date")}
                      </th>

                      <th className="p-5 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {t("doctorDashboard.reports.table.actions")}
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {paginatedReports.map((report) => {
                      const riskClasses = getRiskClasses(report.risk_level || "");

                      return (
                        <tr
                          key={report.id}
                          className="group cursor-pointer transition-colors hover:bg-muted/30"
                          onClick={() => handleViewReport(report)}
                        >
                          <td className="p-5">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-11 w-11 border border-border shadow-sm">
                                <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                                  {report.patient_name
                                    ?.split(" ")
                                    .filter(Boolean)
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase() || "P"}
                                </AvatarFallback>
                              </Avatar>

                              <div>
                                <p className="font-bold tracking-tight text-foreground">
                                  {report.patient_name || "Anonymous"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="p-5">
                            <div className="flex items-center gap-4">
                              <div className="h-2 max-w-[100px] flex-1 overflow-hidden rounded-full bg-muted">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-1000",
                                    riskClasses.progress
                                  )}
                                  style={{ width: `${report.probability || 0}%` }}
                                />
                              </div>

                              <span
                                className={cn(
                                  "text-xs font-bold tracking-tight",
                                  riskClasses.text
                                )}
                              >
                                {Math.round(report.probability || 0)}%
                              </span>
                            </div>
                          </td>

                          <td className="p-5">
                            <div className="flex items-center gap-6">
                              <div className="flex flex-col">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                  Glu
                                </span>

                                <span className="text-xs font-bold text-foreground">
                                  {report.glucose}
                                </span>
                              </div>

                              <div className="flex flex-col">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                  BMI
                                </span>

                                <span className="text-xs font-bold text-foreground">
                                  {report.bmi}
                                </span>
                              </div>

                              <div className="flex flex-col">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                  BP
                                </span>

                                <span className="text-xs font-bold text-foreground">
                                  {report.blood_pressure}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-5">
                            {getStatusBadge(report.review_status)}
                          </td>

                          <td className="p-5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              {new Date(report.created_at).toLocaleDateString(
                                i18n.language,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          </td>

                          <td className="p-5 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-10 rounded-xl bg-primary/10 px-5 text-[10px] font-bold uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewReport(report);
                              }}
                            >
                              <Eye
                                className={cn(
                                  "h-3.5 w-3.5",
                                  isArabic ? "ml-2" : "mr-2"
                                )}
                              />
                              {t("doctorDashboard.pendingReviews.reviewBtn")}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredReports.length > PAGE_SIZE && (
                <div className="flex justify-center border-t border-border bg-card px-5 py-4">
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      className="h-10 w-10 rounded-2xl border-border bg-background text-muted-foreground transition-all hover:border-primary/20 hover:bg-primary/10 hover:text-primary disabled:opacity-40"
                    >
                      {isArabic ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronLeft className="h-4 w-4" />
                      )}
                    </Button>

                    <div className="flex h-10 min-w-[120px] items-center justify-center rounded-2xl border border-border bg-muted/30 px-4">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        Page <span className="text-primary">{currentPage}</span>{" "}
                        of <span className="text-foreground">{totalPages}</span>
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      className="h-10 w-10 rounded-2xl border-border bg-background text-muted-foreground transition-all hover:border-primary/20 hover:bg-primary/10 hover:text-primary disabled:opacity-40"
                    >
                      {isArabic ? (
                        <ChevronLeft className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      <Dialog open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DialogContent className="max-h-[88vh] w-[92vw] max-w-4xl overflow-hidden rounded-[1.75rem] border border-border bg-card p-0 text-card-foreground shadow-2xl">
          {selectedReport && (
            <div className="flex max-h-[88vh] flex-col overflow-hidden bg-card text-card-foreground">
              <DialogHeader className="border-b border-border bg-card px-5 py-4 md:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <DialogTitle className="truncate text-lg font-bold tracking-tight text-foreground md:text-xl">
                        {isArabic ? "مراجعة التقرير" : "Report Review"}
                      </DialogTitle>

                      <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
                        {selectedReport.patient_name || "Anonymous Patient"}
                      </p>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto">
                <div className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-primary/10 px-5 py-4 md:px-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-12 w-12 shrink-0 border-2 border-background shadow-sm ring-1 ring-border">
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
                        <h2 className="truncate text-base font-bold tracking-tight text-foreground md:text-lg">
                          {selectedReport.patient_name || "Anonymous Patient"}
                        </h2>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted-foreground">
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
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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
                  <div className="border-b border-border px-5 md:px-6">
                    <TabsList className="h-12 w-full justify-start gap-7 bg-transparent p-0">
                      <TabsTrigger
                        value="prediction"
                        className="h-full rounded-none border-b-2 border-transparent px-0 text-[11px] font-bold uppercase tracking-widest text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                      >
                        {t("doctorDashboard.reports.drawer.tabs.prediction")}
                      </TabsTrigger>

                      <TabsTrigger
                        value="review"
                        className="h-full rounded-none border-b-2 border-transparent px-0 text-[11px] font-bold uppercase tracking-widest text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
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
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                          {t("doctorDashboard.reports.clinicalIndicators")}
                        </h4>

                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Full patient values
                        </span>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-border bg-background/40">
                        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                          <div className="divide-y divide-border">
                            {clinicalIndicators.slice(0, 4).map(
                              (indicator, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/30"
                                >
                                  <p className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    {indicator.label}
                                  </p>

                                  <div className="shrink-0 text-right">
                                    <span className="text-sm font-bold text-foreground">
                                      {indicator.value}
                                    </span>

                                    <span className="ml-1 text-[10px] font-semibold text-muted-foreground">
                                      {indicator.unit}
                                    </span>
                                  </div>
                                </div>
                              )
                            )}
                          </div>

                          <div className="divide-y divide-border">
                            {clinicalIndicators.slice(4).map(
                              (indicator, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/30"
                                >
                                  <p className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    {indicator.label}
                                  </p>

                                  <div className="shrink-0 text-right">
                                    <span className="text-sm font-bold text-foreground">
                                      {indicator.value}
                                    </span>

                                    <span className="ml-1 text-[10px] font-semibold text-muted-foreground">
                                      {indicator.unit}
                                    </span>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-primary" />

                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-primary">
                          {t("doctorDashboard.reports.aiInsight")}
                        </h4>
                      </div>

                      <p className="text-sm font-medium leading-6 text-foreground">
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
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
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
                                : "border-border bg-background text-muted-foreground hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                                decision === action.id
                                  ? action.iconClass
                                  : "bg-muted text-muted-foreground"
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

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                          {t("doctorDashboard.reports.notesTitle")}
                        </h4>

                        <textarea
                          className="h-36 w-full resize-none rounded-2xl border border-border bg-muted/30 p-4 text-sm font-medium leading-6 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/20 focus:bg-background focus:ring-4 focus:ring-primary/10"
                          placeholder={t("doctorDashboard.reports.notesPlaceholder")}
                          value={doctorNotes}
                          onChange={(e) => setDoctorNotes(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-primary" />

                          <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                            {isArabic
                              ? "الأدوية / الروشتة"
                              : "Medication / Prescription"}
                          </h4>
                        </div>

                        <textarea
                          className="h-36 w-full resize-none rounded-2xl border border-border bg-muted/30 p-4 text-sm font-medium leading-6 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/20 focus:bg-background focus:ring-4 focus:ring-primary/10"
                          placeholder={
                            isArabic
                              ? "اكتب اسم الدواء، الجرعة، عدد المرات، ومدة الاستخدام..."
                              : "Write medication name, dosage, frequency, and duration..."
                          }
                          value={medication}
                          onChange={(e) => setMedication(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {t("doctorDashboard.reports.notified")}
                      </p>

                      <Button
                        onClick={handleSaveReview}
                        disabled={submitting || decision === "pending"}
                        className="h-10 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60"
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