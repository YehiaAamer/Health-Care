import {
  useMemo,
  useState,
  type MouseEvent,
  type KeyboardEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  Calendar,
  Check,
  ClipboardList,
  FileText,
  Pill,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import LoadingDots from "@/components/shared/LoadingDots";
import { cn } from "@/lib/utils";
import { reportsApi } from "@/api/reports";
import type { Prediction, ReviewStatus } from "@/types/api";

interface PendingPredictionsProps {
  predictions: Prediction[];
  isLoading: boolean;
  onReview?: (id: number, event?: MouseEvent<HTMLElement>) => void;
}

type KeyIndicator = {
  label: string;
  value: string | number;
  unit: string;
  severity: number;
};

const MAX_VISIBLE_ROWS = 5;

export default function PendingPredictions({
  predictions = [],
  isLoading,
}: PendingPredictionsProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const isRTL = i18n.language.startsWith("ar");
  const dateLocale = isRTL ? ar : enUS;

  const [selectedReport, setSelectedReport] = useState<Prediction | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [medication, setMedication] = useState("");
  const [decision, setDecision] = useState<ReviewStatus>("pending");

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
      .slice(0, MAX_VISIBLE_ROWS);
  }, [safePredictions]);

  const emptyRowsCount = Math.max(
    MAX_VISIBLE_ROWS - displayedPredictions.length,
    0
  );

  const getText = (
    key: string,
    arabicFallback: string,
    englishFallback: string
  ) => {
    const fallback = isRTL ? arabicFallback : englishFallback;
    const translated = t(key);

    return translated === key ? fallback : translated;
  };

  const labels = {
    title: getText(
      "doctorDashboard.pendingReviews.title",
      "المراجعات المعلقة",
      "Pending Reviews"
    ),
    viewAll: getText(
      "doctorDashboard.pendingReviews.viewAll",
      "عرض الكل",
      "View All"
    ),
    empty: getText(
      "doctorDashboard.pendingReviews.empty",
      "لا توجد مراجعات معلقة",
      "No pending reviews"
    ),
    patient: getText(
      "doctorDashboard.pendingReviews.patient",
      "المريض",
      "Patient"
    ),
    riskLevel: getText(
      "doctorDashboard.pendingReviews.riskLevel",
      "مستوى الخطورة",
      "Risk Level"
    ),
    date: getText("doctorDashboard.pendingReviews.date", "التاريخ", "Date"),
    action: getText(
      "doctorDashboard.pendingReviews.action",
      "الإجراء",
      "Action"
    ),
    reviewBtn: getText(
      "doctorDashboard.pendingReviews.reviewBtn",
      "مراجعة",
      "Review"
    ),
    reportReview: isRTL ? "مراجعة التقرير" : "Report Review",
    anonymous: isRTL ? "مريض غير محدد" : "Anonymous",
    riskProbability: isRTL ? "نسبة الخطورة" : "Risk Probability",
    risk: isRTL ? "الخطورة" : "Risk",
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
    fullPatientValues: isRTL ? "قيم المريض الكاملة" : "Full patient values",
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
    medicationTitle: isRTL ? "الأدوية / الروشتة" : "Medication / Prescription",
    medicationPlaceholder: isRTL
      ? "اكتب اسم الدواء، الجرعة، عدد المرات، ومدة الاستخدام..."
      : "Write medication name, dosage, frequency, and duration...",
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
    close: isRTL ? "إغلاق" : "Close",
  };

  const normalizeRiskLevel = (level?: string) => {
    return (level || "")
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/risk/g, "")
      .trim();
  };

  const toNumber = (value: unknown) => {
    if (value === null || value === undefined || value === "") return 0;

    const numericValue = Number(value);

    return Number.isNaN(numericValue) ? 0 : numericValue;
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

  const getMedicationValue = (report: Prediction) => {
    return (
      (report as any).medication ||
      (report as any).prescription ||
      (report as any).doctor_medication ||
      ""
    );
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
      return {
        badge:
          "border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
        text: "text-red-600 dark:text-red-300",
        bg: "bg-red-50 dark:bg-red-500/10",
        border: "border-red-100 dark:border-red-500/30",
        progress: "bg-red-500",
      };
    }

    if (
      normalizedLevel.includes("high") ||
      normalizedLevel.includes("مرتفع") ||
      normalizedLevel.includes("عالي")
    ) {
      return {
        badge:
          "border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300",
        text: "text-orange-600 dark:text-orange-300",
        bg: "bg-orange-50 dark:bg-orange-500/10",
        border: "border-orange-100 dark:border-orange-500/30",
        progress: "bg-orange-500",
      };
    }

    if (
      normalizedLevel.includes("medium") ||
      normalizedLevel.includes("moderate") ||
      normalizedLevel.includes("متوسط")
    ) {
      return {
        badge:
          "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
        text: "text-amber-600 dark:text-amber-300",
        bg: "bg-amber-50 dark:bg-amber-500/10",
        border: "border-amber-100 dark:border-amber-500/30",
        progress: "bg-amber-500",
      };
    }

    if (
      normalizedLevel.includes("low") ||
      normalizedLevel.includes("منخفض") ||
      normalizedLevel.includes("قليل")
    ) {
      return {
        badge:
          "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
        text: "text-emerald-600 dark:text-emerald-300",
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        border: "border-emerald-100 dark:border-emerald-500/30",
        progress: "bg-emerald-500",
      };
    }

    return {
      badge: "border-border bg-muted text-muted-foreground",
      text: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/15",
      progress: "bg-primary",
    };
  };

  const formatRiskLabel = (level?: string) => {
    if (!level) return isRTL ? "غير محدد" : "Unknown";

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

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "pending":
        return isRTL ? "قيد المراجعة" : "Pending";
      case "reviewed":
        return isRTL ? "تمت المراجعة" : "Reviewed";
      case "needs_followup":
        return isRTL ? "يحتاج متابعة" : "Needs Follow-up";
      case "approved":
        return isRTL ? "معتمد" : "Approved";
      case "rejected":
        return isRTL ? "مرفوض" : "Rejected";
      default:
        return status || (isRTL ? "غير محدد" : "Unknown");
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

    if (
      normalizedLabel.includes("pedigree") ||
      label.includes("العامل الوراثي")
    ) {
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

    const diabetesIndicators: KeyIndicator[] = [
      {
        label: "Dia BP",
        value:
          getExtraValue(report, [
            "diastolic_bp",
            "diastolicBloodPressure",
            "diastolic_blood_pressure",
          ]) ||
          report.blood_pressure ||
          "N/A",
        unit: "mmHg",
        severity: getIndicatorSeverity(
          isRTL ? "الضغط الانبساطي" : "Diastolic BP",
          getExtraValue(report, [
            "diastolic_bp",
            "diastolicBloodPressure",
            "diastolic_blood_pressure",
          ]) || report.blood_pressure
        ),
      },
      {
        label: "Glu",
        value: report.glucose || "N/A",
        unit: "mg/dL",
        severity: getIndicatorSeverity(
          isRTL ? "الجلوكوز" : "Glucose",
          report.glucose
        ),
      },
      {
        label: "Insulin",
        value: report.insulin || "N/A",
        unit: "",
        severity: getIndicatorSeverity(
          isRTL ? "الإنسولين" : "Insulin",
          report.insulin
        ),
      },
      {
        label: "Skin",
        value: report.skin_thickness || "N/A",
        unit: "",
        severity: getIndicatorSeverity(
          isRTL ? "سماكة الجلد" : "Skin Thickness",
          report.skin_thickness
        ),
      },
      {
        label: "Pedigree",
        value: report.diabetes_pedigree_function || "N/A",
        unit: "",
        severity: getIndicatorSeverity(
          isRTL ? "العامل الوراثي" : "Pedigree",
          report.diabetes_pedigree_function
        ),
      },
      {
        label: "Age",
        value: report.age || "N/A",
        unit: "",
        severity: getIndicatorSeverity(isRTL ? "العمر" : "Age", report.age),
      },
      ...(showPregnancies
        ? [
            {
              label: "Preg",
              value: getPregnanciesValue(report),
              unit: "",
              severity: getIndicatorSeverity(
                isRTL ? "الحمل" : "Pregnancies",
                getPregnanciesValue(report)
              ),
            },
          ]
        : []),
    ];

    const cardiovascularIndicators: KeyIndicator[] = [
      {
        label: "Sys BP",
        value: getExtraValue(report, [
          "systolic_bp",
          "systolicBloodPressure",
          "systolic_blood_pressure",
        ]),
        unit: "mmHg",
        severity: getIndicatorSeverity(
          isRTL ? "الضغط الانقباضي" : "Systolic BP",
          getExtraValue(report, [
            "systolic_bp",
            "systolicBloodPressure",
            "systolic_blood_pressure",
          ])
        ),
      },
      {
        label: "Dia BP",
        value: getExtraValue(report, [
          "diastolic_bp",
          "diastolicBloodPressure",
          "diastolic_blood_pressure",
        ]),
        unit: "mmHg",
        severity: getIndicatorSeverity(
          isRTL ? "الضغط الانبساطي" : "Diastolic BP",
          getExtraValue(report, [
            "diastolic_bp",
            "diastolicBloodPressure",
            "diastolic_blood_pressure",
          ])
        ),
      },
      {
        label: "Chol",
        value: getExtraValue(report, ["cholesterol"]),
        unit: "mg/dL",
        severity: getIndicatorSeverity(
          isRTL ? "الكوليسترول" : "Cholesterol",
          getExtraValue(report, ["cholesterol"])
        ),
      },
      {
        label: "Glu",
        value: report.glucose || "N/A",
        unit: "mg/dL",
        severity: getIndicatorSeverity(
          isRTL ? "الجلوكوز" : "Glucose",
          report.glucose
        ),
      },
      {
        label: "Age",
        value: report.age || "N/A",
        unit: "",
        severity: getIndicatorSeverity(isRTL ? "العمر" : "Age", report.age),
      },
      {
        label: "Weight",
        value: getExtraValue(report, ["weight"]),
        unit: "kg",
        severity: getIndicatorSeverity(
          isRTL ? "الوزن" : "Weight",
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
          {isRTL ? "لا توجد مؤشرات" : "No indicators"}
        </span>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-x-4 gap-y-1 sm:gap-x-5">
        {keyIndicators.map((indicator, index) => (
          <div key={`${indicator.label}-${index}`} className="min-w-0">
            <p className="truncate text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {indicator.label}
            </p>

            <p className="mt-1 truncate text-xs font-bold text-foreground">
              {indicator.value}
            </p>
          </div>
        ))}
      </div>
    );
  };

  const clinicalIndicators = selectedReport
    ? (() => {
        const gender = getGenderValue(selectedReport);
        const showPregnancies = isFemaleGender(gender);

        const baseIdentityIndicators = [
          {
            label: isRTL ? "النوع" : "Gender",
            value: gender,
            unit: "",
          },
          ...(showPregnancies
            ? [
                {
                  label: isRTL ? "عدد مرات الحمل" : "Pregnancies",
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
              label: isRTL ? "الجلوكوز" : "Glucose",
              value: selectedReport.glucose || "N/A",
              unit: "mg/dL",
            },
            {
              label: isRTL ? "الكوليسترول" : "Cholesterol",
              value: getExtraValue(selectedReport, ["cholesterol"]),
              unit: "mg/dL",
            },
            {
              label: isRTL ? "الضغط الانقباضي" : "Systolic BP",
              value: getExtraValue(selectedReport, [
                "systolic_bp",
                "systolicBloodPressure",
                "systolic_blood_pressure",
              ]),
              unit: "mmHg",
            },
            {
              label: isRTL ? "الضغط الانبساطي" : "Diastolic BP",
              value: getExtraValue(selectedReport, [
                "diastolic_bp",
                "diastolicBloodPressure",
                "diastolic_blood_pressure",
              ]),
              unit: "mmHg",
            },
            {
              label: isRTL ? "الوزن" : "Weight",
              value: getExtraValue(selectedReport, ["weight"]),
              unit: "kg",
            },
            {
              label: isRTL ? "الطول" : "Height",
              value: getExtraValue(selectedReport, ["height"]),
              unit: "cm",
            },
            {
              label: isRTL ? "العمر" : "Age",
              value: selectedReport.age,
              unit: isRTL ? "سنة" : "Years",
            },
          ];
        }

        return [
          ...baseIdentityIndicators,
          {
            label: isRTL ? "الجلوكوز" : "Glucose",
            value: selectedReport.glucose || "N/A",
            unit: "mg/dL",
          },
          {
            label: isRTL ? "الضغط الانبساطي" : "Diastolic BP",
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
            label: isRTL ? "الإنسولين" : "Insulin",
            value: selectedReport.insulin || "N/A",
            unit: "mu U/ml",
          },
          {
            label: isRTL ? "سماكة الجلد" : "Skin Thickness",
            value: selectedReport.skin_thickness || "N/A",
            unit: "mm",
          },
          {
            label: isRTL ? "العمر" : "Age",
            value: selectedReport.age,
            unit: isRTL ? "سنة" : "Years",
          },
          {
            label: isRTL
              ? "العامل الوراثي للسكري"
              : "Diabetes Pedigree Function",
            value: selectedReport.diabetes_pedigree_function || "N/A",
            unit: "",
          },
          {
            label: isRTL ? "الوزن" : "Weight",
            value: getExtraValue(selectedReport, ["weight"]),
            unit: "kg",
          },
          {
            label: isRTL ? "الطول" : "Height",
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
    ? getRiskClasses(selectedReport.risk_level)
    : getRiskClasses("");

  const openPendingReportsPage = () => {
    navigate("/doctor-dashboard/reports?status=pending", {
      state: {
        status: "pending",
        fromPendingReviews: true,
      },
    });
  };

  const openReviewDrawer = (
    report: Prediction,
    event?: MouseEvent<HTMLElement>
  ) => {
    event?.preventDefault();
    event?.stopPropagation();

    setSelectedReport(report);
    setDecision((report.review_status as ReviewStatus) || "pending");
    setDoctorNotes(report.message || "");
    setMedication(getMedicationValue(report));
    setIsDrawerOpen(true);
  };

  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    report: Prediction
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openReviewDrawer(report);
    }
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

  const cardClassName =
    "flex h-full min-h-[335px] w-full flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md";

  if (isLoading) {
    return (
      <Card className={cardClassName}>
        <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-3 px-4 pb-2 pt-4 sm:px-5 sm:pb-3 sm:pt-5">
          <CardTitle className="flex min-w-0 flex-1 items-center gap-2 text-sm font-bold tracking-tight text-foreground sm:text-base">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-8 sm:w-8">
              <ClipboardList
                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                strokeWidth={2.3}
              />
            </span>

            <span className="min-w-0 truncate">{labels.title}</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col px-4 pb-3 pt-1 sm:px-5 sm:pb-4">
          <div className="flex flex-1 flex-col gap-1.5 sm:gap-2">
            {Array.from({ length: MAX_VISIBLE_ROWS }).map((_, i) => (
              <div
                key={i}
                className="flex min-h-[42px] items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-2.5 py-1.5 sm:min-h-[48px] sm:px-3 sm:py-2"
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
    <>
      <Card className={cardClassName}>
        <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-3 px-4 pb-2 pt-4 sm:px-5 sm:pb-3 sm:pt-5">
          <CardTitle className="flex min-w-0 flex-1 items-center gap-2 text-sm font-bold tracking-tight text-foreground sm:text-base">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-8 sm:w-8">
              <ClipboardList
                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                strokeWidth={2.3}
              />
            </span>

            <span className="min-w-0 truncate">{labels.title}</span>
          </CardTitle>

          {safePredictions.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={openPendingReportsPage}
              className="h-7 shrink-0 rounded-xl px-2 text-[9px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10 hover:text-primary sm:h-8 sm:px-2.5 sm:text-[10px]"
            >
              {labels.viewAll}
            </Button>
          )}
        </CardHeader>

        <CardContent className="flex flex-1 flex-col px-0 pb-3 pt-1">
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="shrink-0 border-y border-border bg-muted/30">
              <div className="grid grid-cols-[36%_28%_20%_16%] px-2 py-2 sm:grid-cols-[40%_26%_20%_14%] sm:px-6">
                <div className="text-start text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[10px]">
                  {labels.patient}
                </div>

                <div className="text-start text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[10px]">
                  {labels.riskLevel}
                </div>

                <div className="text-start text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[10px]">
                  {labels.date}
                </div>

                <div className="text-end text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[10px]">
                  {labels.action}
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col divide-y divide-border">
              {safePredictions.length === 0 ? (
                <>
                  <div className="flex min-h-[48px] items-center justify-center px-6 py-2 text-center sm:min-h-[54px]">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      {labels.empty}
                    </p>
                  </div>

                  {Array.from({ length: MAX_VISIBLE_ROWS - 1 }).map(
                    (_, index) => (
                      <div
                        key={`empty-row-${index}`}
                        aria-hidden="true"
                        className="min-h-[42px] sm:min-h-[48px]"
                      />
                    )
                  )}
                </>
              ) : (
                <>
                  {displayedPredictions.map((pred) => {
                    const riskClasses = getRiskClasses(pred.risk_level);

                    return (
                      <div
                        key={pred.id}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => handleRowKeyDown(event, pred)}
                        className="grid min-h-[42px] grid-cols-[36%_28%_20%_16%] items-center px-2 py-1.5 transition-colors duration-200 hover:bg-muted/30 focus:bg-muted/30 focus:outline-none sm:min-h-[48px] sm:grid-cols-[40%_26%_20%_14%] sm:px-6 sm:py-2"
                      >
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                            <Avatar className="h-7 w-7 shrink-0 rounded-2xl border border-border shadow-sm sm:h-8 sm:w-8">
                              <AvatarFallback className="rounded-2xl bg-primary/10 text-[11px] font-bold text-primary sm:text-xs">
                                {pred.patient_name?.charAt(0)?.toUpperCase() ||
                                  "P"}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0">
                              <p className="truncate text-[11px] font-bold leading-4 tracking-tight text-foreground sm:text-sm">
                                {pred.patient_name || labels.anonymous}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="min-w-0 px-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "inline-flex max-w-full items-center rounded-xl border px-2 py-0.5 text-[7px] font-bold uppercase tracking-tight sm:px-2.5 sm:py-1 sm:text-[9px]",
                              riskClasses.badge
                            )}
                          >
                            <span className="truncate">
                              {formatRiskLabel(pred.risk_level)} (
                              {Math.round(pred.probability || 0)}%)
                            </span>
                          </Badge>
                        </div>

                        <div className="min-w-0 px-1">
                          <span className="block truncate text-[8px] font-semibold leading-4 text-muted-foreground sm:text-[10px]">
                            {formatPredictionDate(pred.created_at)}
                          </span>
                        </div>

                        <div className="min-w-0 text-end">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={(event) => openReviewDrawer(pred, event)}
                            className="h-7 max-w-full rounded-xl px-1.5 text-[7px] font-bold uppercase tracking-wider text-primary hover:bg-primary/10 hover:text-primary sm:h-8 sm:px-3 sm:text-[10px] sm:tracking-widest"
                          >
                            <span className="truncate">{labels.reviewBtn}</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {Array.from({ length: emptyRowsCount }).map((_, index) => (
                    <div
                      key={`placeholder-row-${index}`}
                      aria-hidden="true"
                      className="min-h-[42px] sm:min-h-[48px]"
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DialogContent className="max-h-[88vh] w-[92vw] max-w-4xl overflow-hidden rounded-[1.75rem] border border-border bg-card p-0 text-card-foreground shadow-2xl [&>button]:hidden">
          {selectedReport && (
            <div
              dir={isRTL ? "rtl" : "ltr"}
              className="flex max-h-[88vh] flex-col overflow-hidden bg-card text-card-foreground"
            >
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
                            {selectedReport.age} {isRTL ? "سنة" : "Years"}
                          </span>

                          <span>•</span>

                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-primary" />

                            {selectedReport.created_at
                              ? new Date(
                                  selectedReport.created_at
                                ).toLocaleDateString(i18n.language, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "--"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="rounded-full border border-primary/15 bg-primary/10 px-4 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {labels.riskProbability}
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
                            {clinicalIndicators
                              .slice(0, 4)
                              .map((indicator, index) => (
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
                              ))}
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
    </>
  );
}