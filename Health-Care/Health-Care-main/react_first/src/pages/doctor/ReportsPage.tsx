import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
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

type ReportsLocationState = {
  openReportId?: number | string;
  filterReportId?: number | string;
  patientId?: number | string;
  patientName?: string;
  diseaseType?: string;
  fromPatientArchive?: boolean;
  openDrawer?: boolean;
};

type KeyIndicator = {
  label: string;
  value: string | number;
  unit: string;
  severity: number;
};

export default function ReportsPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isArabic = i18n.language === "ar";

  const ignoreRouteFiltersRef = useRef(false);

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

  const getText = (
    key: string,
    arabicFallback: string,
    englishFallback: string
  ) => {
    const fallback = isArabic ? arabicFallback : englishFallback;
    const translated = t(key);

    return translated === key ? fallback : translated;
  };

  const labels = {
    title: getText("doctorDashboard.reports.title", "التقارير", "Reports"),
    subtitle: getText(
      "doctorDashboard.reports.subtitle",
      "راجع تقارير المرضى وقرارات المتابعة الطبية.",
      "Review patient reports and medical follow-up decisions."
    ),
    filter: getText(
      "doctorDashboard.reports.filter",
      "فلترة التقارير",
      "Filter Reports"
    ),
    resultFound: isArabic ? "نتيجة" : "result found",
    resultsFound: isArabic ? "نتيجة" : "results found",
    searchPlaceholder: getText(
      "doctorDashboard.reports.searchPlaceholder",
      "ابحث باسم المريض...",
      "Search by patient name..."
    ),
    loading: getText(
      "doctorDashboard.reports.loading",
      "جاري تحميل التقارير",
      "Loading reports"
    ),
    noReports: getText(
      "doctorDashboard.reports.noReports",
      "لا توجد تقارير",
      "No reports found"
    ),
    tablePatient: getText(
      "doctorDashboard.reports.table.patient",
      "المريض",
      "Patient"
    ),
    tableProbability: getText(
      "doctorDashboard.reports.table.probability",
      "نسبة الخطورة",
      "Probability"
    ),
    tableIndicators: isArabic ? "أهم المؤشرات" : "Key Indicators",
    tableStatus: getText(
      "doctorDashboard.reports.table.status",
      "حالة المراجعة",
      "Review Status"
    ),
    tableDate: getText("doctorDashboard.reports.table.date", "التاريخ", "Date"),
    tableActions: getText(
      "doctorDashboard.reports.table.actions",
      "الإجراء",
      "Actions"
    ),
    reviewBtn: getText(
      "doctorDashboard.pendingReviews.reviewBtn",
      "مراجعة",
      "Review"
    ),
    clinicalDecision: getText(
      "doctorDashboard.reports.clinicalDecision",
      "قرار المراجعة الطبية",
      "Medical Review Decision"
    ),
    notesTitle: getText(
      "doctorDashboard.reports.notesTitle",
      "ملاحظات الطبيب",
      "Doctor Notes"
    ),
    notesPlaceholder: getText(
      "doctorDashboard.reports.notesPlaceholder",
      "اكتب ملاحظاتك الطبية هنا...",
      "Write your medical notes here..."
    ),
    notified: getText(
      "doctorDashboard.reports.notified",
      "سيتم حفظ القرار وإتاحته في سجل المريض.",
      "The decision will be saved and reflected in the patient record."
    ),
    saveReview: getText(
      "doctorDashboard.reports.drawer.saveReview",
      "حفظ المراجعة",
      "Save Review"
    ),
    predictionTab: getText(
      "doctorDashboard.reports.drawer.tabs.prediction",
      "التوقع",
      "Prediction"
    ),
    reviewTab: getText(
      "doctorDashboard.reports.drawer.tabs.review",
      "المراجعة",
      "Review"
    ),
    approve: getText(
      "doctorDashboard.reports.drawer.actions.approve",
      "اعتماد",
      "Approve"
    ),
    reject: getText(
      "doctorDashboard.reports.drawer.actions.reject",
      "رفض",
      "Reject"
    ),
    followUp: getText(
      "doctorDashboard.reports.drawer.actions.followUp",
      "يحتاج متابعة",
      "Needs Follow-up"
    ),
    fullPatientValues: isArabic ? "قيم المريض الكاملة" : "Full patient values",
    reportReview: isArabic ? "مراجعة التقرير" : "Report Review",
    aiProbability: isArabic ? "نسبة الخطورة" : "Risk Probability",
    risk: isArabic ? "الخطورة" : "Risk",
    statusPlaceholder: isArabic ? "اختر حالة المراجعة" : "Review Status",
    allStatuses: isArabic ? "كل حالات المراجعة" : "All Review Statuses",
    page: isArabic ? "صفحة" : "Page",
    of: isArabic ? "من" : "of",
    anonymous: isArabic ? "مريض غير محدد" : "Anonymous",
    close: isArabic ? "إغلاق" : "Close",
    medicationTitle: isArabic ? "الأدوية / الروشتة" : "Medication / Prescription",
    medicationPlaceholder: isArabic
      ? "اكتب اسم الدواء، الجرعة، عدد المرات، ومدة الاستخدام..."
      : "Write medication name, dosage, frequency, and duration...",
  };

  const normalizeId = (value: unknown) => {
    const numericId = Number(String(value ?? "").replace(/\D/g, ""));
    return Number.isNaN(numericId) ? 0 : numericId;
  };

  const toNumber = (value: unknown) => {
    if (value === null || value === undefined || value === "") return 0;
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? 0 : numericValue;
  };

  const clearTemporaryReportFilters = () => {
    const params = new URLSearchParams(window.location.search);

    params.delete("filterReportId");
    params.delete("openReportId");
    params.delete("patientId");
    params.delete("patientName");
    params.delete("diseaseType");
    params.delete("fromPatientArchive");
    params.delete("openDrawer");

    const cleanSearch = params.toString();
    const cleanUrl = `${window.location.pathname}${cleanSearch ? `?${cleanSearch}` : ""}`;

    const currentHistoryState = window.history.state;

    const nextHistoryState =
      currentHistoryState && typeof currentHistoryState === "object"
        ? {
            ...currentHistoryState,
            usr: null,
          }
        : currentHistoryState;

    window.history.replaceState(nextHistoryState, document.title, cleanUrl);
  };

  const getMedicationValue = (report: Prediction) => {
    return (
      (report as any).medication ||
      (report as any).prescription ||
      (report as any).doctor_medication ||
      ""
    );
  };

  const getReportPatientId = (report: Prediction) => {
    const item = report as any;

    return normalizeId(
      item.patient_id ||
        item.patient ||
        item.patient_user_id ||
        item.user_id ||
        item.patientId ||
        item.patient_details?.id ||
        item.patient_data?.id ||
        item.patient_profile?.id ||
        item.patient?.id
    );
  };

  const getExtraValue = (
    report: Prediction,
    keys: string[],
    fallback = "N/A"
  ) => {
    const item = report as any;
    const extra = report.extra_fields || {};

    for (const key of keys) {
      const value = extra?.[key] ?? item?.[key];

      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }

    return fallback;
  };

  const getGenderValue = (report: Prediction) => {
    return getExtraValue(report, ["gender", "sex"], "N/A");
  };

  const isFemaleGender = (value: unknown) => {
    const normalized = String(value || "").trim().toLowerCase();

    return (
      normalized === "female" ||
      normalized === "f" ||
      normalized === "woman" ||
      normalized === "girl" ||
      normalized === "أنثى" ||
      normalized === "انثى" ||
      normalized === "بنت"
    );
  };

  const getPregnanciesValue = (report: Prediction) => {
    return getExtraValue(
      report,
      ["pregnancies", "pregnancy"],
      report.pregnancies ?? "N/A"
    );
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "pending":
        return isArabic ? "قيد المراجعة" : "Pending";
      case "reviewed":
        return isArabic ? "تمت المراجعة" : "Reviewed";
      case "needs_followup":
        return isArabic ? "يحتاج متابعة" : "Needs Follow-up";
      case "approved":
        return isArabic ? "معتمد" : "Approved";
      case "rejected":
        return isArabic ? "مرفوض" : "Rejected";
      default:
        return status || (isArabic ? "غير محدد" : "Unknown");
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);

      const state = (location.state || {}) as ReportsLocationState;
      const shouldIgnoreRouteFilters = ignoreRouteFiltersRef.current;

      const patientIdFromState = shouldIgnoreRouteFilters
        ? 0
        : normalizeId(state.patientId);

      const patientIdFromUrl = shouldIgnoreRouteFilters
        ? 0
        : normalizeId(searchParams.get("patientId"));

      const selectedPatientId = patientIdFromState || patientIdFromUrl;

      const selectedPatientName = shouldIgnoreRouteFilters
        ? ""
        : String(state.patientName || searchParams.get("patientName") || "")
            .trim()
            .toLowerCase();

      const selectedDiseaseType = shouldIgnoreRouteFilters
        ? ""
        : state.diseaseType || searchParams.get("diseaseType") || "";

      const openReportId = shouldIgnoreRouteFilters
        ? 0
        : normalizeId(state.openReportId) ||
          normalizeId(searchParams.get("openReportId"));

      const filterReportId = shouldIgnoreRouteFilters
        ? 0
        : normalizeId(state.filterReportId) ||
          normalizeId(searchParams.get("filterReportId"));

      const fromPatientArchive = shouldIgnoreRouteFilters
        ? false
        : Boolean(state.fromPatientArchive || searchParams.get("fromPatientArchive"));

      const shouldOpenDrawer =
        openReportId > 0 && state.openDrawer !== false && !fromPatientArchive;

      const hasTemporaryFilters =
        selectedPatientId > 0 ||
        !!selectedPatientName ||
        !!selectedDiseaseType ||
        openReportId > 0 ||
        filterReportId > 0 ||
        fromPatientArchive;

      const data = await reportsApi.getReports({
        status: statusFilter || undefined,
      });

      const filteredData = data.filter((report: Prediction) => {
        const item = report as any;

        const reportId = normalizeId(item.id);
        const reportPatientId = getReportPatientId(report);
        const reportPatientName = String(item.patient_name || "")
          .trim()
          .toLowerCase();

        const matchesReport = !filterReportId || reportId === filterReportId;

        const matchesPatient =
          !selectedPatientId ||
          reportPatientId === selectedPatientId ||
          (!!selectedPatientName && reportPatientName === selectedPatientName);

        const matchesDisease =
          !selectedDiseaseType || item.disease_type === selectedDiseaseType;

        return matchesReport && matchesPatient && matchesDisease;
      });

      setReports(filteredData);

      if (shouldOpenDrawer) {
        const reportToOpen = filteredData.find(
          (report) => Number(report.id) === openReportId
        );

        if (reportToOpen) {
          setSelectedReport(reportToOpen);
          setDecision((reportToOpen.review_status as ReviewStatus) || "pending");
          setDoctorNotes(reportToOpen.message || "");
          setMedication(getMedicationValue(reportToOpen));
          setIsDrawerOpen(true);
        }
      }

      if (hasTemporaryFilters && !shouldIgnoreRouteFilters) {
        ignoreRouteFiltersRef.current = true;
        clearTemporaryReportFilters();
      }
    } catch (error) {
      console.error("Failed to fetch reports", error);
      toast.error(
        getText(
          "doctorDashboard.reports.fetchError",
          "فشل تحميل التقارير",
          "Failed to fetch reports"
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, location.search]);

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
  }, [search, statusFilter, location.search]);

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

      toast.success(
        getText(
          "doctorDashboard.reports.saveSuccess",
          "تم حفظ المراجعة بنجاح",
          "Review saved successfully"
        )
      );

      setIsDrawerOpen(false);
      setSelectedReport(null);
      setDoctorNotes("");
      setMedication("");
      fetchReports();
    } catch (error) {
      console.error("Failed to save review", error);
      toast.error(
        getText(
          "doctorDashboard.reports.saveError",
          "فشل حفظ المراجعة",
          "Failed to save review"
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getRiskColor = (level: string) => {
    const normalized = level?.toLowerCase()?.trim();

    if (
      [
        "very high",
        "very_high",
        "veryhigh",
        "critical",
        "مرتفع جدًا",
        "مرتفع جداً",
        "حرج",
      ].includes(normalized)
    ) {
      return "red";
    }

    if (["high", "مرتفع"].includes(normalized)) return "orange";
    if (["medium", "متوسط"].includes(normalized)) return "orange";
    if (["low", "منخفض"].includes(normalized)) return "green";

    return "blue";
  };

  const getRiskClasses = (level: string) => {
    switch (getRiskColor(level)) {
      case "red":
        return {
          text: "text-red-600 dark:text-red-300",
          bg: "bg-red-50 dark:bg-red-500/10",
          border: "border-red-100 dark:border-red-500/30",
          progress: "bg-red-500",
        };
      case "orange":
        return {
          text: "text-amber-600 dark:text-amber-300",
          bg: "bg-amber-50 dark:bg-amber-500/10",
          border: "border-amber-100 dark:border-amber-500/30",
          progress: "bg-amber-500",
        };
      case "green":
        return {
          text: "text-emerald-600 dark:text-emerald-300",
          bg: "bg-emerald-50 dark:bg-emerald-500/10",
          border: "border-emerald-100 dark:border-emerald-500/30",
          progress: "bg-emerald-500",
        };
      default:
        return {
          text: "text-primary",
          bg: "bg-primary/10",
          border: "border-primary/15",
          progress: "bg-primary",
        };
    }
  };

  const getIndicatorSeverity = (label: string, value: unknown) => {
    const numericValue = toNumber(value);
    const normalizedLabel = label.toLowerCase();

    if (normalizedLabel.includes("glucose") || label.includes("الجلوكوز")) {
      if (numericValue >= 200) return 100;
      if (numericValue >= 126) return 85;
      if (numericValue >= 100) return 60;
      return 20;
    }

    if (normalizedLabel.includes("systolic") || label.includes("الانقباضي")) {
      if (numericValue >= 180) return 100;
      if (numericValue >= 140) return 85;
      if (numericValue >= 130) return 65;
      return 20;
    }

    if (normalizedLabel.includes("diastolic") || label.includes("الانبساطي")) {
      if (numericValue >= 120) return 100;
      if (numericValue >= 90) return 85;
      if (numericValue >= 80) return 65;
      return 20;
    }

    if (
      normalizedLabel.includes("cholesterol") ||
      label.includes("الكوليسترول")
    ) {
      if (numericValue >= 240) return 90;
      if (numericValue >= 200) return 70;
      return 20;
    }

    if (normalizedLabel.includes("insulin") || label.includes("الإنسولين")) {
      if (numericValue > 25) return 80;
      if (numericValue > 15) return 55;
      return 20;
    }

    if (normalizedLabel.includes("pedigree") || label.includes("العامل الوراثي")) {
      if (numericValue >= 1) return 85;
      if (numericValue >= 0.5) return 65;
      return 20;
    }

    if (normalizedLabel.includes("skin") || label.includes("سماكة الجلد")) {
      if (numericValue >= 40) return 70;
      if (numericValue >= 30) return 55;
      return 20;
    }

    if (normalizedLabel.includes("age") || label.includes("العمر")) {
      if (numericValue >= 60) return 65;
      if (numericValue >= 45) return 50;
      return 20;
    }

    if (normalizedLabel.includes("weight") || label.includes("الوزن")) {
      if (numericValue >= 100) return 55;
      if (numericValue >= 85) return 40;
      return 20;
    }

    if (normalizedLabel.includes("pregnancies") || label.includes("الحمل")) {
      if (numericValue >= 8) return 65;
      if (numericValue >= 4) return 45;
      return 20;
    }

    return 10;
  };

  const buildKeyIndicators = (report: Prediction): KeyIndicator[] => {
    const gender = getGenderValue(report);
    const showPregnancies = isFemaleGender(gender);

    const diabetesDiastolicValue =
      getExtraValue(report, [
        "diastolic_bp",
        "diastolicBloodPressure",
        "diastolic_blood_pressure",
      ]) ||
      report.blood_pressure ||
      "N/A";

    const diabetesIndicators: KeyIndicator[] = [
      {
        label: isArabic ? "الجلوكوز" : "Glu",
        value: report.glucose || "N/A",
        unit: "",
        severity: getIndicatorSeverity("glucose", report.glucose),
      },
      {
        label: isArabic ? "DIA BP" : "Dia BP",
        value: diabetesDiastolicValue,
        unit: "",
        severity: getIndicatorSeverity("diastolic", diabetesDiastolicValue),
      },
      {
        label: isArabic ? "الإنسولين" : "Ins",
        value: report.insulin || "N/A",
        unit: "",
        severity: getIndicatorSeverity("insulin", report.insulin),
      },
      {
        label: isArabic ? "سُمك الجلد" : "Skin",
        value: report.skin_thickness || "N/A",
        unit: "",
        severity: getIndicatorSeverity("skin", report.skin_thickness),
      },
      {
        label: isArabic ? "وراثي" : "DPF",
        value: report.diabetes_pedigree_function || "N/A",
        unit: "",
        severity: getIndicatorSeverity(
          "pedigree",
          report.diabetes_pedigree_function
        ),
      },
      {
        label: isArabic ? "العمر" : "Age",
        value: report.age || "N/A",
        unit: "",
        severity: getIndicatorSeverity("age", report.age),
      },
      ...(showPregnancies
        ? [
            {
              label: isArabic ? "الحمل" : "Preg",
              value: getPregnanciesValue(report),
              unit: "",
              severity: getIndicatorSeverity(
                "pregnancies",
                getPregnanciesValue(report)
              ),
            },
          ]
        : []),
    ];

    const cardiovascularSystolicValue = getExtraValue(report, [
      "systolic_bp",
      "systolicBloodPressure",
      "systolic_blood_pressure",
    ]);

    const cardiovascularDiastolicValue = getExtraValue(report, [
      "diastolic_bp",
      "diastolicBloodPressure",
      "diastolic_blood_pressure",
    ]);

    const cardiovascularIndicators: KeyIndicator[] = [
      {
        label: isArabic ? "SYS BP" : "Sys BP",
        value: cardiovascularSystolicValue,
        unit: "",
        severity: getIndicatorSeverity("systolic", cardiovascularSystolicValue),
      },
      {
        label: isArabic ? "DIA BP" : "Dia BP",
        value: cardiovascularDiastolicValue,
        unit: "",
        severity: getIndicatorSeverity("diastolic", cardiovascularDiastolicValue),
      },
      {
        label: isArabic ? "الكوليسترول" : "Chol",
        value: getExtraValue(report, ["cholesterol"]),
        unit: "",
        severity: getIndicatorSeverity(
          "cholesterol",
          getExtraValue(report, ["cholesterol"])
        ),
      },
      {
        label: isArabic ? "الجلوكوز" : "Glu",
        value: report.glucose || "N/A",
        unit: "",
        severity: getIndicatorSeverity("glucose", report.glucose),
      },
      {
        label: isArabic ? "العمر" : "Age",
        value: report.age || "N/A",
        unit: "",
        severity: getIndicatorSeverity("age", report.age),
      },
      {
        label: isArabic ? "الوزن" : "Weight",
        value: getExtraValue(report, ["weight"]),
        unit: "",
        severity: getIndicatorSeverity(
          "weight",
          getExtraValue(report, ["weight"])
        ),
      },
    ];

    const source =
      report.disease_type === "cardiovascular"
        ? cardiovascularIndicators
        : diabetesIndicators;

    return source
      .filter((indicator) => indicator.value !== "N/A")
      .sort((a, b) => b.severity - a.severity)
      .slice(0, 3);
  };

  const renderKeyIndicators = (report: Prediction) => {
    const keyIndicators = buildKeyIndicators(report);

    if (keyIndicators.length === 0) {
      return (
        <span className="text-xs font-bold text-muted-foreground">
          {isArabic ? "لا توجد مؤشرات" : "No indicators"}
        </span>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-2 md:max-w-[190px] md:gap-x-4 md:gap-y-1">
        {keyIndicators.map((indicator, index) => (
          <div
            key={`${indicator.label}-${index}`}
            className="min-w-0 rounded-2xl border border-border bg-background/60 p-3 md:rounded-none md:border-0 md:bg-transparent md:p-0"
          >
            <p className="truncate text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground md:tracking-[0.16em]">
              {indicator.label}
            </p>

            <p className="mt-1 truncate text-xs font-bold text-foreground">
              {indicator.value}
              {indicator.unit && (
                <span className="ml-1 text-[9px] font-semibold text-muted-foreground">
                  {indicator.unit}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="rounded-xl border border-border bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shadow-none transition-none hover:bg-muted hover:text-muted-foreground">
            {getStatusLabel(status)}
          </Badge>
        );
      case "reviewed":
        return (
          <Badge className="rounded-xl border border-primary/15 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary shadow-none transition-none hover:bg-primary/10 hover:text-primary">
            {getStatusLabel(status)}
          </Badge>
        );
      case "needs_followup":
        return (
          <Badge className="rounded-xl border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-600 shadow-none transition-none hover:bg-amber-50 hover:text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/10 dark:hover:text-amber-300">
            {getStatusLabel(status)}
          </Badge>
        );
      case "approved":
        return (
          <Badge className="rounded-xl border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600 shadow-none transition-none hover:bg-emerald-50 hover:text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300">
            {getStatusLabel(status)}
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="rounded-xl border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-red-600 shadow-none transition-none hover:bg-red-50 hover:text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/10 dark:hover:text-red-300">
            {getStatusLabel(status)}
          </Badge>
        );
      default:
        return (
          <Badge className="rounded-xl border border-border bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shadow-none transition-none hover:bg-muted hover:text-muted-foreground">
            {getStatusLabel(status)}
          </Badge>
        );
    }
  };

  const statCards = [
    {
      label: getText(
        "doctorDashboard.reports.stats.total",
        "إجمالي التقارير",
        "Total Reports"
      ),
      value: stats.total,
      icon: FileText,
      className: "bg-primary/10 text-primary border-primary/15",
    },
    {
      label: getText(
        "doctorDashboard.reports.stats.pending",
        "قيد المراجعة",
        "Pending"
      ),
      value: stats.pending,
      icon: Clock,
      className:
        "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
    },
    {
      label: getText(
        "doctorDashboard.reports.stats.followUp",
        "يحتاج متابعة",
        "Needs Follow-up"
      ),
      value: stats.followUp,
      icon: Calendar,
      className: "bg-primary/10 text-primary border-primary/15",
    },
    {
      label: getText(
        "doctorDashboard.reports.stats.approved",
        "معتمد",
        "Approved"
      ),
      value: stats.approved,
      icon: CheckCircle2,
      className:
        "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
    },
  ];

  const statusSelectOptions = [
    { value: "all", label: labels.allStatuses },
    { value: "pending", label: getStatusLabel("pending") },
    { value: "approved", label: getStatusLabel("approved") },
    { value: "needs_followup", label: getStatusLabel("needs_followup") },
  ];

  const clinicalIndicators = selectedReport
    ? (() => {
        const gender = getGenderValue(selectedReport);
        const showPregnancies = isFemaleGender(gender);

        const baseIdentityIndicators = [
          {
            label: isArabic ? "النوع" : "Gender",
            value: gender,
            unit: "",
          },
          ...(showPregnancies
            ? [
                {
                  label: isArabic ? "عدد مرات الحمل" : "Pregnancies",
                  value: getPregnanciesValue(selectedReport),
                  unit: "",
                },
              ]
            : []),
        ];

        if (selectedReport.disease_type === "cardiovascular") {
          return [
            ...baseIdentityIndicators,
            {
              label: isArabic ? "الجلوكوز" : "Glucose",
              value: selectedReport.glucose || "N/A",
              unit: "mg/dL",
            },
            {
              label: isArabic ? "الكوليسترول" : "Cholesterol",
              value: getExtraValue(selectedReport, ["cholesterol"]),
              unit: "mg/dL",
            },
            {
              label: isArabic ? "الضغط الانقباضي" : "Systolic BP",
              value: getExtraValue(selectedReport, [
                "systolic_bp",
                "systolicBloodPressure",
                "systolic_blood_pressure",
              ]),
              unit: "mmHg",
            },
            {
              label: isArabic ? "الضغط الانبساطي" : "Diastolic BP",
              value: getExtraValue(selectedReport, [
                "diastolic_bp",
                "diastolicBloodPressure",
                "diastolic_blood_pressure",
              ]),
              unit: "mmHg",
            },
            {
              label: isArabic ? "الوزن" : "Weight",
              value: getExtraValue(selectedReport, ["weight"]),
              unit: "kg",
            },
            {
              label: isArabic ? "الطول" : "Height",
              value: getExtraValue(selectedReport, ["height"]),
              unit: "cm",
            },
            {
              label: isArabic ? "العمر" : "Age",
              value: selectedReport.age,
              unit: isArabic ? "سنة" : "Years",
            },
          ];
        }

        return [
          ...baseIdentityIndicators,
          {
            label: isArabic ? "الجلوكوز" : "Glucose",
            value: selectedReport.glucose || "N/A",
            unit: "mg/dL",
          },
          {
            label: isArabic ? "الضغط الانبساطي" : "Diastolic BP",
            value:
              getExtraValue(selectedReport, [
                "diastolic_bp",
                "diastolicBloodPressure",
                "diastolic_blood_pressure",
              ]) ||
              selectedReport.blood_pressure ||
              "N/A",
            unit: "mmHg",
          },
          {
            label: isArabic ? "الإنسولين" : "Insulin",
            value: selectedReport.insulin || "N/A",
            unit: "mu U/ml",
          },
          {
            label: isArabic ? "سماكة الجلد" : "Skin Thickness",
            value: selectedReport.skin_thickness || "N/A",
            unit: "mm",
          },
          {
            label: isArabic ? "العمر" : "Age",
            value: selectedReport.age,
            unit: isArabic ? "سنة" : "Years",
          },
          {
            label: isArabic
              ? "العامل الوراثي للسكري"
              : "Diabetes Pedigree Function",
            value: selectedReport.diabetes_pedigree_function || "N/A",
            unit: "",
          },
          {
            label: isArabic ? "الوزن" : "Weight",
            value: getExtraValue(selectedReport, ["weight"]),
            unit: "kg",
          },
          {
            label: isArabic ? "الطول" : "Height",
            value: getExtraValue(selectedReport, ["height"]),
            unit: "cm",
          },
        ];
      })()
    : [];

  const reviewActions = [
    {
      id: "approved" as ReviewStatus,
      label: labels.approve,
      icon: Check,
      activeClass:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
      iconClass:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
    {
      id: "rejected" as ReviewStatus,
      label: labels.reject,
      icon: X,
      activeClass:
        "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
      iconClass:
        "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300",
    },
    {
      id: "needs_followup" as ReviewStatus,
      label: labels.followUp,
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
          {labels.title}
        </h1>

        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          {labels.subtitle}
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
                    {labels.filter}
                  </p>

                  <p className="text-[11px] font-semibold text-muted-foreground">
                    {filteredReports.length}{" "}
                    {filteredReports.length === 1
                      ? labels.resultFound
                      : labels.resultsFound}
                  </p>
                </div>
              </div>
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
                  placeholder={labels.searchPlaceholder}
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
                onValueChange={(value) => {
                  ignoreRouteFiltersRef.current = true;
                  clearTemporaryReportFilters();
                  setSelectedReport(null);
                  setIsDrawerOpen(false);
                  setSearch("");
                  setCurrentPage(1);
                  setStatusFilter(value === "all" ? null : value);
                }}
                dir={isArabic ? "rtl" : "ltr"}
              >
                <SelectTrigger className="h-12 w-full rounded-none border-0 bg-transparent px-4 text-sm font-bold text-primary shadow-none transition-none hover:bg-primary/5 hover:text-primary focus:ring-0 focus:ring-offset-0 md:w-[230px]">
                  <SelectValue placeholder={labels.statusPlaceholder} />
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
                {labels.loading}
              </p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <FileText className="h-7 w-7 opacity-80" />
              </div>

              <p className="text-xs font-bold uppercase tracking-widest">
                {labels.noReports}
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
                              {report.patient_name || labels.anonymous}
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
                            {labels.tableProbability}
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

                      <div className="mb-4">{renderKeyIndicators(report)}</div>

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
                          {labels.reviewBtn}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table
                  className={cn(
                    "w-full table-fixed border-collapse",
                    isArabic ? "text-right" : "text-left"
                  )}
                  dir={isArabic ? "rtl" : "ltr"}
                >
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="w-[24%] p-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {labels.tablePatient}
                      </th>

                      <th className="w-[18%] p-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {labels.tableProbability}
                      </th>

                      <th className="w-[28%] p-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {labels.tableIndicators}
                      </th>

                      <th className="w-[14%] p-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {labels.tableStatus}
                      </th>

                      <th className="w-[12%] p-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {labels.tableDate}
                      </th>

                      <th className="w-[14%] p-5 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {labels.tableActions}
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
                          <td className="p-5 align-middle">
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

                              <div className="min-w-0">
                                <p className="truncate font-bold tracking-tight text-foreground">
                                  {report.patient_name || labels.anonymous}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="p-5 align-middle">
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

                          <td className="p-5 align-middle">
                            {renderKeyIndicators(report)}
                          </td>

                          <td className="p-5 align-middle">
                            {getStatusBadge(report.review_status)}
                          </td>

                          <td className="p-5 align-middle">
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

                          <td className="p-5 text-center align-middle">
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
                              {labels.reviewBtn}
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
                        {labels.page}{" "}
                        <span className="text-primary">{currentPage}</span>{" "}
                        {labels.of}{" "}
                        <span className="text-foreground">{totalPages}</span>
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
        <DialogContent className="max-h-[88vh] w-[92vw] max-w-4xl overflow-hidden rounded-[1.75rem] border border-border bg-card p-0 text-card-foreground shadow-2xl [&>button]:hidden">
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
                        {labels.reportReview}
                      </DialogTitle>

                      <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
                        {selectedReport.patient_name || labels.anonymous}
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
                          {selectedReport.patient_name || labels.anonymous}
                        </h2>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                          <span>
                            {selectedReport.age} {isArabic ? "سنة" : "Years"}
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
                          {labels.aiProbability}
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
                          {labels.risk}
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
                        {labels.predictionTab}
                      </TabsTrigger>

                      <TabsTrigger
                        value="review"
                        className="h-full rounded-none border-b-2 border-transparent px-0 text-[11px] font-bold uppercase tracking-widest text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                      >
                        {labels.reviewTab}
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
                          {labels.fullPatientValues}
                        </h4>
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
                  </TabsContent>

                  <TabsContent
                    value="review"
                    className="m-0 space-y-4 p-5 animate-in fade-in duration-300 md:p-6"
                  >
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        {labels.clinicalDecision}
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
                          {labels.notesTitle}
                        </h4>

                        <textarea
                          className="h-36 w-full resize-none rounded-2xl border border-border bg-muted/30 p-4 text-sm font-medium leading-6 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/20 focus:bg-background focus:ring-4 focus:ring-primary/10"
                          placeholder={labels.notesPlaceholder}
                          value={doctorNotes}
                          onChange={(e) => setDoctorNotes(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-primary" />

                          <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                            {labels.medicationTitle}
                          </h4>
                        </div>

                        <textarea
                          className="h-36 w-full resize-none rounded-2xl border border-border bg-muted/30 p-4 text-sm font-medium leading-6 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/20 focus:bg-background focus:ring-4 focus:ring-primary/10"
                          placeholder={labels.medicationPlaceholder}
                          value={medication}
                          onChange={(e) => setMedication(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {labels.notified}
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

                            {labels.saveReview}
                          </div>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="flex justify-end border-t border-border bg-card px-5 py-4 md:px-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDrawerOpen(false)}
                  className="h-10 rounded-2xl border-primary/30 bg-transparent px-6 text-sm font-bold text-primary hover:bg-primary/10 hover:text-primary"
                >
                  {labels.close}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}