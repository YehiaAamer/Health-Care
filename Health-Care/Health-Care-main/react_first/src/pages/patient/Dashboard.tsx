// src/pages/patient/Dashboard.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Beaker,
  Plus,
  Search,
  FileText,
  Activity,
  Clock3,
  ShieldCheck,
  AlertTriangle,
  Stethoscope,
  PhoneCall,
  Globe,
} from "lucide-react";
import Header from "@/components/shared/Header";
import NotificationBell from "@/components/shared/NotificationBell";
import PatientSidebar from "@/components/patient/PatientSidebar";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiCall, API_ENDPOINTS } from "@/lib/api";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  Line,
  Area,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type RiskLevel = "low" | "medium" | "high" | "very_high";
type CardiovascularRiskLevel = RiskLevel;
type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

type CardiovascularPrediction = {
  probability: number;
  percentage: number;
  risk_level: CardiovascularRiskLevel;
  message: string;
  z_score: number;
  isFallback?: boolean;
};

interface Prediction {
  id: number;
  pregnancies: number;
  glucose: number;
  blood_pressure: number;
  skin_thickness: number;
  insulin: number;
  bmi: number;
  diabetes_pedigree_function: number;
  age: number;
  probability: number;
  risk_level: string;
  message: string;
  created_at: string;
  disease_type?: string;
  session_id?: string;

  gender?: "male" | "female" | string;
  systolic_blood_pressure?: number;
  diastolic_blood_pressure?: number;
  weight?: number;
  height?: number;
  cholesterol?: number;

  cardiovascular_probability?: number;
  cardiovascular_percentage?: number;
  cardiovascular_risk_level?: string;
  cardiovascular_message?: string;
  cardiovascular_z_score?: number;
}

type RiskDistributionItem = {
  key: RiskLevel;
  name: string;
  range: string;
  value: number;
  percentage: number;
  color: string;
};

type RiskIndicatorItem = {
  key: string;
  label: string;
  value: number;
  severity: number;
};

type RangeSummary = {
  average: number;
  diabetesAverage: number;
  cardioAverage: number;
  reports: number;
  highestPercentage: number;
  highestLevel: RiskLevel | "unknown";
  highestDiabetesPercentage: number;
  highestDiabetesLevel: RiskLevel | "unknown";
  highestCardioPercentage: number;
  highestCardioLevel: RiskLevel | "unknown";
};

const CARDIO_COEFFICIENTS = {
  intercept: -11.2,
  age: 0.055,
  gender: 0.42,
  height: -0.012,
  weight: 0.035,
  ap_hi: 0.052,
  ap_lo: 0.028,
  cholesterol: 0.48,
  gluc: 0.32,
};

const RISK_COLORS: Record<RiskLevel, string> = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  very_high: "#ef4444",
};

const DIABETES_CHART_COLOR = "#EC4899";
const CARDIO_CHART_COLOR = "#64748b";

const sigmoid = (z: number) => {
  return 1 / (1 + Math.exp(-z));
};

const normalizeCholesterolForCardio = (cholesterol: number) => {
  if (cholesterol >= 240) return 3;
  if (cholesterol >= 200) return 2;
  return 1;
};

const normalizeGlucoseForCardio = (glucose: number) => {
  if (glucose >= 126) return 3;
  if (glucose >= 100) return 2;
  return 1;
};

const getRiskLevelFromPercentage = (percentage: number): RiskLevel => {
  if (percentage >= 80) return "very_high";
  if (percentage >= 60) return "high";
  if (percentage >= 30) return "medium";
  return "low";
};

const getCardioRiskLevel = (percentage: number): CardiovascularRiskLevel => {
  return getRiskLevelFromPercentage(percentage);
};

const normalizePercentageValue = (value?: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;

  if (value <= 1) {
    return Number((value * 100).toFixed(2));
  }

  return Number(value.toFixed(2));
};

const normalizeAnyRiskLevel = (riskLevel?: string): RiskLevel | "unknown" => {
  const risk = String(riskLevel || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");

  if (
    risk.includes("very_high") ||
    risk.includes("very high") ||
    risk.includes("عالي جدًا") ||
    risk.includes("عالي جدا") ||
    risk.includes("مرتفع جدًا") ||
    risk.includes("مرتفع جدا")
  ) {
    return "very_high";
  }

  if (
    risk.includes("high") ||
    risk.includes("عالي") ||
    risk.includes("مرتفع")
  ) {
    return "high";
  }

  if (
    risk.includes("medium") ||
    risk.includes("moderate") ||
    risk.includes("متوسط")
  ) {
    return "medium";
  }

  if (
    risk.includes("low") ||
    risk.includes("منخفض") ||
    risk.includes("قليل")
  ) {
    return "low";
  }

  return "unknown";
};

const normalizeGenderValue = (gender?: string) => {
  const value = String(gender ?? "").trim().toLowerCase();

  if (
    value === "female" ||
    value === "f" ||
    value === "woman" ||
    value === "girl" ||
    value === "أنثى" ||
    value === "انثى" ||
    value === "بنت"
  ) {
    return "female";
  }

  if (
    value === "male" ||
    value === "m" ||
    value === "man" ||
    value === "boy" ||
    value === "ذكر" ||
    value === "راجل"
  ) {
    return "male";
  }

  return "unknown";
};

const shouldShowPregnanciesInput = (prediction: Prediction) => {
  const normalizedGender = normalizeGenderValue(prediction.gender);

  if (normalizedGender === "female") return true;
  if (normalizedGender === "male") return false;

  return Number(prediction.pregnancies ?? 0) > 0;
};

const normalizeCardioRiskLevel = (
  riskLevel?: string
): CardiovascularRiskLevel | null => {
  const normalized = normalizeAnyRiskLevel(riskLevel);
  return normalized === "unknown" ? null : normalized;
};

const getCardioRiskMessage = (
  riskLevel: CardiovascularRiskLevel,
  t: TranslateFn
) => {
  return t(`dashboard.cardioMessages.${riskLevel}`);
};

const calculateCardiovascularPredictionFromValues = ({
  age,
  gender,
  height,
  weight,
  systolicBloodPressure,
  diastolicBloodPressure,
  cholesterol,
  glucose,
  t,
  isFallback = false,
}: {
  age: number;
  gender: "male" | "female";
  height: number;
  weight: number;
  systolicBloodPressure: number;
  diastolicBloodPressure: number;
  cholesterol: number;
  glucose: number;
  t: TranslateFn;
  isFallback?: boolean;
}): CardiovascularPrediction => {
  const genderValue = gender === "male" ? 1 : 0;
  const cholesterolValue = normalizeCholesterolForCardio(cholesterol);
  const glucoseValue = normalizeGlucoseForCardio(glucose);

  const z =
    CARDIO_COEFFICIENTS.intercept +
    CARDIO_COEFFICIENTS.age * age +
    CARDIO_COEFFICIENTS.gender * genderValue +
    CARDIO_COEFFICIENTS.height * height +
    CARDIO_COEFFICIENTS.weight * weight +
    CARDIO_COEFFICIENTS.ap_hi * systolicBloodPressure +
    CARDIO_COEFFICIENTS.ap_lo * diastolicBloodPressure +
    CARDIO_COEFFICIENTS.cholesterol * cholesterolValue +
    CARDIO_COEFFICIENTS.gluc * glucoseValue;

  const probability = sigmoid(z);
  const percentage = Number((probability * 100).toFixed(2));
  const riskLevel = getCardioRiskLevel(percentage);

  return {
    probability: Number(probability.toFixed(4)),
    percentage,
    risk_level: riskLevel,
    message: getCardioRiskMessage(riskLevel, t),
    z_score: Number(z.toFixed(4)),
    isFallback,
  };
};

const getCardioPrediction = (
  prediction: Prediction,
  t: TranslateFn,
  allPredictions?: Prediction[]
): CardiovascularPrediction => {
  if (prediction.session_id && allPredictions) {
    const siblingCardio = allPredictions.find(
      (p) =>
        p.session_id === prediction.session_id &&
        p.disease_type === "cardiovascular"
    );

    if (siblingCardio) {
      const backendPercentage =
        normalizePercentageValue(siblingCardio.cardiovascular_percentage) ??
        normalizePercentageValue(siblingCardio.cardiovascular_probability) ??
        normalizePercentageValue(siblingCardio.probability);

      const backendRiskLevel = normalizeCardioRiskLevel(
        siblingCardio.cardiovascular_risk_level || siblingCardio.risk_level
      );

      if (backendPercentage !== null) {
        const finalRiskLevel =
          backendRiskLevel ?? getRiskLevelFromPercentage(backendPercentage);

        return {
          probability: Number((backendPercentage / 100).toFixed(4)),
          percentage: backendPercentage,
          risk_level: finalRiskLevel,
          message:
            siblingCardio.cardiovascular_message ||
            siblingCardio.message ||
            getCardioRiskMessage(finalRiskLevel, t),
          z_score: Number(siblingCardio.cardiovascular_z_score ?? 0),
          isFallback: false,
        };
      }
    }
  }

  const backendPercentage =
    normalizePercentageValue(prediction.cardiovascular_percentage) ??
    normalizePercentageValue(prediction.cardiovascular_probability);

  const backendRiskLevel = normalizeCardioRiskLevel(
    prediction.cardiovascular_risk_level
  );

  if (backendPercentage !== null) {
    const finalRiskLevel =
      backendRiskLevel ?? getRiskLevelFromPercentage(backendPercentage);

    return {
      probability: Number((backendPercentage / 100).toFixed(4)),
      percentage: backendPercentage,
      risk_level: finalRiskLevel,
      message:
        prediction.cardiovascular_message ||
        getCardioRiskMessage(finalRiskLevel, t),
      z_score: Number(prediction.cardiovascular_z_score ?? 0),
      isFallback: false,
    };
  }

  const height = prediction.height ?? 170;

  const calculatedWeightFromBmi = Number(
    (Number(prediction.bmi ?? 0) * Math.pow(height / 100, 2)).toFixed(1)
  );

  const weight =
    prediction.weight ??
    (calculatedWeightFromBmi > 0 ? calculatedWeightFromBmi : 70);

  const diastolicBloodPressure =
    prediction.diastolic_blood_pressure ?? prediction.blood_pressure ?? 80;

  const systolicBloodPressure =
    prediction.systolic_blood_pressure ??
    Math.min(diastolicBloodPressure + 40, 260);

  const cholesterol = prediction.cholesterol ?? 180;

  const normalizedGender = normalizeGenderValue(prediction.gender);
  const gender = normalizedGender === "male" ? "male" : "female";

  return calculateCardiovascularPredictionFromValues({
    age: prediction.age,
    gender,
    height,
    weight,
    systolicBloodPressure,
    diastolicBloodPressure,
    cholesterol,
    glucose: prediction.glucose,
    t,
    isFallback: true,
  });
};

const getSeverityScore = (
  value: number,
  thresholds: {
    normal: number;
    medium: number;
    high: number;
    veryHigh: number;
  }
) => {
  if (value >= thresholds.veryHigh) return 4;
  if (value >= thresholds.high) return 3;
  if (value >= thresholds.medium) return 2;
  if (value >= thresholds.normal) return 1;
  return 0;
};

const normalizeIndicatorsBySeverity = (indicators: RiskIndicatorItem[]) => {
  return indicators
    .filter((item) => item.severity > 0 && !Number.isNaN(item.value))
    .sort((a, b) => {
      if (b.severity !== a.severity) return b.severity - a.severity;
      return b.value - a.value;
    })
    .slice(0, 3);
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
    useState(false);
  const [selectedRange, setSelectedRange] = useState<
    "weekly" | "monthly" | null
  >(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await apiCall<{
          count: number;
          predictions: Prediction[];
        }>(API_ENDPOINTS.GET_PREDICTIONS, {
          method: "GET",
        });

        const allPredictions = data.predictions || [];

        const filtered = allPredictions
          .filter((p) => !p.disease_type || p.disease_type === "diabetes")
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );

        setPredictions(allPredictions.length ? allPredictions : filtered);
      } catch (err) {
        console.error("Error fetching predictions:", err);
        setError(t("dashboard.fetchError"));
        toast.error(t("dashboard.dataError"));
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchPredictions();
  }, [user, t]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
      toast.error(t("dashboard.logoutError"));
    }
  };

  const handleToggleLanguage = async () => {
    const newLang = isArabic ? "en" : "ar";
    await i18n.changeLanguage(newLang);
  };

  const getLocalizedRiskLabel = (riskLevel?: string) => {
    const normalized = normalizeAnyRiskLevel(riskLevel);

    switch (normalized) {
      case "very_high":
        return t("dashboard.extra.riskLevels.veryHigh");
      case "high":
        return t("dashboard.extra.riskLevels.high");
      case "medium":
        return t("dashboard.extra.riskLevels.medium");
      case "low":
        return t("dashboard.extra.riskLevels.low");
      default:
        return "--";
    }
  };

  const getRiskTextClass = (riskLevel?: string) => {
    const normalized = normalizeAnyRiskLevel(riskLevel);

    if (normalized === "very_high") return "text-red-600";
    if (normalized === "high") return "text-orange-500";
    if (normalized === "medium") return "text-yellow-500";
    if (normalized === "low") return "text-green-500";
    return "text-muted-foreground";
  };

  const getRiskBadgeColor = (riskLevel?: string) => {
    switch (normalizeAnyRiskLevel(riskLevel)) {
      case "low":
        return "border-green-200 bg-green-100 text-green-700 hover:border-green-200 hover:bg-green-100 hover:text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300 dark:hover:bg-green-500/10 dark:hover:text-green-300";
      case "medium":
        return "border-yellow-200 bg-yellow-100 text-yellow-700 hover:border-yellow-200 hover:bg-yellow-100 hover:text-yellow-700 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-300 dark:hover:bg-yellow-500/10 dark:hover:text-yellow-300";
      case "high":
        return "border-orange-200 bg-orange-100 text-orange-700 hover:border-orange-200 hover:bg-orange-100 hover:text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300 dark:hover:bg-orange-500/10 dark:hover:text-orange-300";
      case "very_high":
        return "border-red-200 bg-red-100 text-red-700 hover:border-red-200 hover:bg-red-100 hover:text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/10 dark:hover:text-red-300";
      default:
        return "border-border bg-muted text-muted-foreground hover:border-border hover:bg-muted hover:text-muted-foreground";
    }
  };

  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => {
    return value.toLocaleString(isArabic ? "ar-EG" : "en-US", options);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(isArabic ? "ar-SA" : "en-US");
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString(isArabic ? "ar-SA" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getMonthKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}`;
  };

  const formatMonthLabel = (date: Date) => {
    return date.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
      month: "short",
    });
  };

  const getDiabetesPercentage = (prediction: Prediction) => {
    return normalizePercentageValue(prediction.probability) ?? 0;
  };

  // مهم:
  // هنا الريسك بتاع السكر بقى بيتحسب من النسبة الراجعة من الباك فقط،
  // ومبقاش بياخد risk_level من الباك عشان مايحصلش تعارض زي 30.95% وتظهر Low.
  const getEffectiveDiabetesRiskLevel = (prediction: Prediction): RiskLevel => {
    const percentage = getDiabetesPercentage(prediction);
    return getRiskLevelFromPercentage(percentage);
  };

  const diabetesPredictions = useMemo(() => {
    return predictions
      .filter((p) => !p.disease_type || p.disease_type === "diabetes")
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [predictions]);

  const getAverageValue = (values: number[]) => {
    if (!values.length) return null;

    return Number(
      (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)
    );
  };

  const getHighestRiskFromPredictions = (sourcePredictions: Prediction[]) => {
    if (!sourcePredictions.length) {
      return {
        percentage: 0,
        level: "unknown" as RiskLevel | "unknown",
        diabetesPercentage: 0,
        diabetesLevel: "unknown" as RiskLevel | "unknown",
        cardioPercentage: 0,
        cardioLevel: "unknown" as RiskLevel | "unknown",
      };
    }

    let highestPercentage = 0;
    let highestLevel: RiskLevel | "unknown" = "unknown";

    let highestDiabetesPercentage = 0;
    let highestDiabetesLevel: RiskLevel | "unknown" = "unknown";

    let highestCardioPercentage = 0;
    let highestCardioLevel: RiskLevel | "unknown" = "unknown";

    sourcePredictions.forEach((prediction) => {
      const diabetesPercentage = getDiabetesPercentage(prediction);
      const diabetesLevel = getEffectiveDiabetesRiskLevel(prediction);

      if (diabetesPercentage > highestDiabetesPercentage) {
        highestDiabetesPercentage = diabetesPercentage;
        highestDiabetesLevel = diabetesLevel;
      }

      if (diabetesPercentage > highestPercentage) {
        highestPercentage = diabetesPercentage;
        highestLevel = diabetesLevel;
      }

      const cardio = getCardioPrediction(prediction, t, predictions);

      if (cardio.percentage > highestCardioPercentage) {
        highestCardioPercentage = cardio.percentage;
        highestCardioLevel = cardio.risk_level;
      }

      if (cardio.percentage > highestPercentage) {
        highestPercentage = cardio.percentage;
        highestLevel = cardio.risk_level;
      }
    });

    return {
      percentage: Number(highestPercentage.toFixed(2)),
      level: highestLevel,
      diabetesPercentage: Number(highestDiabetesPercentage.toFixed(2)),
      diabetesLevel: highestDiabetesLevel,
      cardioPercentage: Number(highestCardioPercentage.toFixed(2)),
      cardioLevel: highestCardioLevel,
    };
  };

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

  const normalizeSearchText = (value: unknown) => {
    return String(value ?? "")
      .toLowerCase()
      .trim()
      .normalize("NFKD")
      .replace(/[\u064B-\u065F]/g, "")
      .replace(/\s+/g, " ");
  };

  const latestPrediction = diabetesPredictions[0];

  const latestCardioPrediction = useMemo(() => {
    if (!latestPrediction) return null;
    return getCardioPrediction(latestPrediction, t, predictions);
  }, [latestPrediction, t, predictions]);

  const latestDiabetesRiskLevel = useMemo(() => {
    if (!latestPrediction) return null;
    return getEffectiveDiabetesRiskLevel(latestPrediction);
  }, [latestPrediction]);

  const latestRiskTextColor = useMemo(() => {
    if (!latestDiabetesRiskLevel) return "text-foreground";
    return getRiskTextClass(latestDiabetesRiskLevel);
  }, [latestDiabetesRiskLevel]);

  const latestCardioRiskTextColor = useMemo(() => {
    if (!latestCardioPrediction) return "text-foreground";
    return getRiskTextClass(latestCardioPrediction.risk_level);
  }, [latestCardioPrediction]);

  const averageRisk = useMemo(() => {
    if (!diabetesPredictions.length) return 0;

    const total = diabetesPredictions.reduce((sum, pred) => {
      return sum + getDiabetesPercentage(pred);
    }, 0);

    return total / diabetesPredictions.length;
  }, [diabetesPredictions]);

  const averageCardioRisk = useMemo(() => {
    if (!diabetesPredictions.length) return 0;

    const total = diabetesPredictions.reduce((sum, pred) => {
      return sum + getCardioPrediction(pred, t, predictions).percentage;
    }, 0);

    return total / diabetesPredictions.length;
  }, [diabetesPredictions, predictions, t]);

  const rangePredictions = useMemo(() => {
    if (!selectedRange) return [];

    const now = new Date();

    if (selectedRange === "weekly") {
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(now.getDate() - 27);

      return [...diabetesPredictions]
        .filter(
          (pred) => new Date(pred.created_at).getTime() >= startDate.getTime()
        )
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
    }

    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return [...diabetesPredictions]
      .filter((pred) => {
        const date = new Date(pred.created_at).getTime();

        return date >= startDate.getTime() && date < endDate.getTime();
      })
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
  }, [diabetesPredictions, selectedRange]);

  const inputsChartData = useMemo(() => {
    if (!latestPrediction) return [];

    const isFemale = shouldShowPregnanciesInput(latestPrediction);

    const systolicBloodPressure =
      latestPrediction.systolic_blood_pressure ??
      Math.min((latestPrediction.blood_pressure ?? 80) + 40, 260);

    const diastolicBloodPressure =
      latestPrediction.diastolic_blood_pressure ??
      latestPrediction.blood_pressure;

    const height = latestPrediction.height ?? 170;

    const calculatedWeightFromBmi = Number(
      (Number(latestPrediction.bmi ?? 0) * Math.pow(height / 100, 2)).toFixed(1)
    );

    const weight =
      latestPrediction.weight ??
      (calculatedWeightFromBmi > 0 ? calculatedWeightFromBmi : 70);

    const cholesterol = latestPrediction.cholesterol ?? 180;

    return [
      ...(isFemale
        ? [
            {
              key: "pregnancies",
              inputLabel: t("dashboard.extra.inputs.pregnancies"),
              displayValue: formatNumber(latestPrediction.pregnancies ?? 0),
              diabetesValue: latestPrediction.pregnancies ?? 0,
              cardioValue: null,
            },
          ]
        : []),

      {
        key: "glucose",
        inputLabel: t("dashboard.extra.inputs.glucose"),
        displayValue: formatNumber(latestPrediction.glucose),
        diabetesValue: latestPrediction.glucose,
        cardioValue: latestPrediction.glucose,
      },

      {
        key: "systolic_bp",
        inputLabel: t("dashboard.extra.inputs.systolic"),
        displayValue: formatNumber(systolicBloodPressure),
        diabetesValue: null,
        cardioValue: systolicBloodPressure,
      },

      {
        key: "diastolic_bp",
        inputLabel: t("dashboard.extra.inputs.diastolic"),
        displayValue: formatNumber(diastolicBloodPressure),
        diabetesValue: null,
        cardioValue: diastolicBloodPressure,
      },

      {
        key: "skin_thickness",
        inputLabel: t("dashboard.extra.inputs.skinThickness"),
        displayValue: formatNumber(latestPrediction.skin_thickness),
        diabetesValue: latestPrediction.skin_thickness,
        cardioValue: null,
      },

      {
        key: "insulin",
        inputLabel: t("dashboard.extra.inputs.insulin"),
        displayValue: formatNumber(latestPrediction.insulin),
        diabetesValue: latestPrediction.insulin,
        cardioValue: null,
      },

      {
        key: "pedigree",
        inputLabel: t("dashboard.extra.inputs.pedigree"),
        displayValue: formatNumber(
          Number(latestPrediction.diabetes_pedigree_function),
          {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          }
        ),
        diabetesValue: Number(latestPrediction.diabetes_pedigree_function),
        cardioValue: null,
      },

      {
        key: "age",
        inputLabel: t("dashboard.extra.inputs.age"),
        displayValue: formatNumber(latestPrediction.age),
        diabetesValue: latestPrediction.age,
        cardioValue: latestPrediction.age,
      },

      {
        key: "weight",
        inputLabel: t("dashboard.extra.inputs.weight"),
        displayValue: formatNumber(weight, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }),
        diabetesValue: weight,
        cardioValue: weight,
      },

      {
        key: "height",
        inputLabel: t("dashboard.extra.inputs.height"),
        displayValue: formatNumber(height),
        diabetesValue: height,
        cardioValue: height,
      },

      {
        key: "cholesterol",
        inputLabel: t("dashboard.extra.inputs.cholesterol"),
        displayValue: formatNumber(cholesterol),
        diabetesValue: null,
        cardioValue: cholesterol,
      },
    ];
  }, [latestPrediction, isArabic, t]);

  const riskDistributionData = useMemo<RiskDistributionItem[]>(() => {
    const sourcePredictions = selectedRange ? rangePredictions : diabetesPredictions;

    const counts: Record<RiskLevel, number> = {
      low: 0,
      medium: 0,
      high: 0,
      very_high: 0,
    };

    sourcePredictions.forEach((pred) => {
      const diabetesRisk = getEffectiveDiabetesRiskLevel(pred);
      const cardioRisk = getCardioPrediction(pred, t, predictions).risk_level;

      counts[diabetesRisk] += 1;
      counts[cardioRisk] += 1;
    });

    const totalRiskCount =
      counts.low + counts.medium + counts.high + counts.very_high;

    const getRiskDistributionPercentage = (value: number) => {
      if (!totalRiskCount) return 0;

      return Number(((value / totalRiskCount) * 100).toFixed(0));
    };

    return [
      {
        key: "low",
        name: t("dashboard.extra.riskLevels.low"),
        range: "0 - 30",
        value: counts.low,
        percentage: getRiskDistributionPercentage(counts.low),
        color: RISK_COLORS.low,
      },
      {
        key: "medium",
        name: t("dashboard.extra.riskLevels.medium"),
        range: "30 - 60",
        value: counts.medium,
        percentage: getRiskDistributionPercentage(counts.medium),
        color: RISK_COLORS.medium,
      },
      {
        key: "high",
        name: t("dashboard.extra.riskLevels.high"),
        range: "60 - 80",
        value: counts.high,
        percentage: getRiskDistributionPercentage(counts.high),
        color: RISK_COLORS.high,
      },
      {
        key: "very_high",
        name: t("dashboard.extra.riskLevels.veryHigh"),
        range: "80 - 100",
        value: counts.very_high,
        percentage: getRiskDistributionPercentage(counts.very_high),
        color: RISK_COLORS.very_high,
      },
    ];
  }, [diabetesPredictions, rangePredictions, selectedRange, predictions, t]);

  const rangeSummary = useMemo<RangeSummary | null>(() => {
    if (!selectedRange) return null;

    const diabetesValues = rangePredictions.map(getDiabetesPercentage);
    const cardioValues = rangePredictions.map(
      (prediction) => getCardioPrediction(prediction, t, predictions).percentage
    );

    const allRiskValues = [...diabetesValues, ...cardioValues];

    const average =
      allRiskValues.length > 0
        ? allRiskValues.reduce((sum, value) => sum + value, 0) /
          allRiskValues.length
        : 0;

    const diabetesAverage =
      diabetesValues.length > 0
        ? diabetesValues.reduce((sum, value) => sum + value, 0) /
          diabetesValues.length
        : 0;

    const cardioAverage =
      cardioValues.length > 0
        ? cardioValues.reduce((sum, value) => sum + value, 0) /
          cardioValues.length
        : 0;

    const highestRisk = getHighestRiskFromPredictions(rangePredictions);

    return {
      average: Number(average.toFixed(2)),
      diabetesAverage: Number(diabetesAverage.toFixed(2)),
      cardioAverage: Number(cardioAverage.toFixed(2)),
      reports: rangePredictions.length,
      highestPercentage: highestRisk.percentage,
      highestLevel: highestRisk.level,
      highestDiabetesPercentage: highestRisk.diabetesPercentage,
      highestDiabetesLevel: highestRisk.diabetesLevel,
      highestCardioPercentage: highestRisk.cardioPercentage,
      highestCardioLevel: highestRisk.cardioLevel,
    };
  }, [rangePredictions, selectedRange, predictions, t]);

  const rangeTrendChartData = useMemo(() => {
    if (!selectedRange) return [];

    const now = new Date();

    if (selectedRange === "weekly") {
      return Array.from({ length: 4 }, (_, index) => {
        const weekStart = new Date(now);
        weekStart.setHours(0, 0, 0, 0);
        weekStart.setDate(now.getDate() - (27 - index * 7));

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const weekPredictions = diabetesPredictions.filter((prediction) => {
          const predictionTime = new Date(prediction.created_at).getTime();

          return (
            predictionTime >= weekStart.getTime() &&
            predictionTime < weekEnd.getTime()
          );
        });

        const diabetesValues = weekPredictions.map(getDiabetesPercentage);

        const cardioValues = weekPredictions.map(
          (prediction) => getCardioPrediction(prediction, t, predictions).percentage
        );

        const diabetesAverage = getAverageValue(diabetesValues);
        const cardioAverage = getAverageValue(cardioValues);

        const allWeeklyValues = [...diabetesValues, ...cardioValues];
        const weeklyAverage = getAverageValue(allWeeklyValues);

        return {
          key: `week-${index + 1}`,
          label: t("dashboard.extra.weekNumber", {
            number: formatNumber(index + 1),
          }),
          diabetesRisk: diabetesAverage,
          cardioRisk: cardioAverage,
          averageRisk: weeklyAverage,
          averageLabel:
            weeklyAverage === null
              ? "--"
              : `${formatNumber(weeklyAverage, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}%`,
          reports: weekPredictions.length,
        };
      });
    }

    const monthSlots = Array.from({ length: 12 }, (_, index) => {
      return new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    });

    return monthSlots.map((monthDate) => {
      const monthKey = getMonthKey(monthDate);

      const monthPredictions = diabetesPredictions.filter((prediction) => {
        const predictionDate = new Date(prediction.created_at);

        return getMonthKey(predictionDate) === monthKey;
      });

      const diabetesValues = monthPredictions.map(getDiabetesPercentage);

      const cardioValues = monthPredictions.map(
        (prediction) => getCardioPrediction(prediction, t, predictions).percentage
      );

      const diabetesAverage = getAverageValue(diabetesValues);
      const cardioAverage = getAverageValue(cardioValues);

      const allMonthlyValues = [...diabetesValues, ...cardioValues];
      const monthlyAverage = getAverageValue(allMonthlyValues);

      return {
        key: monthKey,
        label: formatMonthLabel(monthDate),
        diabetesRisk: diabetesAverage,
        cardioRisk: cardioAverage,
        averageRisk: monthlyAverage,
        averageLabel:
          monthlyAverage === null
            ? "--"
            : `${formatNumber(monthlyAverage, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}%`,
        reports: monthPredictions.length,
      };
    });
  }, [diabetesPredictions, selectedRange, isArabic, predictions, t]);  const searchedPredictions = useMemo(() => {
    const query = normalizeSearchText(searchTerm);

    const sortedPredictions = [...diabetesPredictions].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    if (!query) return sortedPredictions.slice(0, 3);

    return sortedPredictions
      .filter((pred) => {
        const cardio = getCardioPrediction(pred, t, predictions);
        const diabetesRiskLevel = getEffectiveDiabetesRiskLevel(pred);

        const localizedDate = new Date(pred.created_at).toLocaleDateString(
          isArabic ? "ar-SA" : "en-US"
        );

        const searchableContent = normalizeSearchText(
          [
            pred.id,
            pred.pregnancies,
            pred.glucose,
            pred.blood_pressure,
            pred.skin_thickness,
            pred.insulin,
            pred.diabetes_pedigree_function,
            pred.age,
            pred.weight,
            pred.height,
            getDiabetesPercentage(pred),
            diabetesRiskLevel,
            getLocalizedRiskLabel(diabetesRiskLevel),
            pred.message,
            cardio.percentage,
            cardio.risk_level,
            getLocalizedRiskLabel(cardio.risk_level),
            cardio.message,
            localizedDate,
          ].join(" ")
        );

        return searchableContent.includes(query);
      })
      .slice(0, 3);
  }, [diabetesPredictions, searchTerm, isArabic, predictions, t]);

  const desktopContentOffsetClass = isArabic
    ? isDesktopSidebarCollapsed
      ? "xl:pr-[88px]"
      : "xl:pr-[260px]"
    : isDesktopSidebarCollapsed
    ? "xl:pl-[88px]"
    : "xl:pl-[260px]";

  const displayedPredictions = searchedPredictions;

  const smoothSectionClass =
    "animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out";

  const diabetesLabel = t("dashboard.extra.diabetes");
  const cardioLabel = t("dashboard.extra.cardiovascular");

  const buildRiskIndicators = (pred: Prediction) => {
    const height = pred.height ?? 170;

    const calculatedWeightFromBmi = Number(
      (Number(pred.bmi ?? 0) * Math.pow(height / 100, 2)).toFixed(1)
    );

    const weight =
      pred.weight ??
      (calculatedWeightFromBmi > 0 ? calculatedWeightFromBmi : 70);

    const systolicBloodPressure =
      pred.systolic_blood_pressure ??
      Math.min((pred.blood_pressure ?? 80) + 40, 260);

    const diastolicBloodPressure =
      pred.diastolic_blood_pressure ?? pred.blood_pressure ?? 80;

    const cholesterol = pred.cholesterol ?? 180;

    const diabetesIndicators = normalizeIndicatorsBySeverity([
      ...(shouldShowPregnanciesInput(pred)
        ? [
            {
              key: "pregnancies",
              label: t("dashboard.extra.inputs.pregnancies"),
              value: Number(pred.pregnancies ?? 0),
              severity: getSeverityScore(Number(pred.pregnancies ?? 0), {
                normal: 1,
                medium: 3,
                high: 5,
                veryHigh: 8,
              }),
            },
          ]
        : []),

      {
        key: "glucose",
        label: t("dashboard.extra.inputs.glucose"),
        value: Number(pred.glucose ?? 0),
        severity: getSeverityScore(Number(pred.glucose ?? 0), {
          normal: 100,
          medium: 126,
          high: 180,
          veryHigh: 250,
        }),
      },

      {
        key: "diabetes_bp",
        label: t("dashboard.extra.inputs.diabetesBloodPressure"),
        value: Number(pred.blood_pressure ?? 0),
        severity: getSeverityScore(Number(pred.blood_pressure ?? 0), {
          normal: 80,
          medium: 90,
          high: 100,
          veryHigh: 120,
        }),
      },

      {
        key: "skin_thickness",
        label: t("dashboard.extra.inputs.skinThickness"),
        value: Number(pred.skin_thickness ?? 0),
        severity: getSeverityScore(Number(pred.skin_thickness ?? 0), {
          normal: 25,
          medium: 35,
          high: 45,
          veryHigh: 55,
        }),
      },

      {
        key: "insulin",
        label: t("dashboard.extra.inputs.insulin"),
        value: Number(pred.insulin ?? 0),
        severity: getSeverityScore(Number(pred.insulin ?? 0), {
          normal: 25,
          medium: 100,
          high: 200,
          veryHigh: 400,
        }),
      },

      {
        key: "weight_diabetes",
        label: t("dashboard.extra.inputs.weight"),
        value: Number(weight),
        severity: getSeverityScore(Number(weight), {
          normal: 80,
          medium: 100,
          high: 120,
          veryHigh: 150,
        }),
      },

      {
        key: "height_diabetes",
        label: t("dashboard.extra.inputs.height"),
        value: Number(height),
        severity: 1,
      },

      {
        key: "pedigree",
        label: t("dashboard.extra.inputs.pedigree"),
        value: Number(pred.diabetes_pedigree_function ?? 0),
        severity: getSeverityScore(
          Number(pred.diabetes_pedigree_function ?? 0),
          {
            normal: 0.5,
            medium: 0.8,
            high: 1.2,
            veryHigh: 1.8,
          }
        ),
      },

      {
        key: "age_diabetes",
        label: t("dashboard.extra.inputs.age"),
        value: Number(pred.age ?? 0),
        severity: getSeverityScore(Number(pred.age ?? 0), {
          normal: 45,
          medium: 55,
          high: 65,
          veryHigh: 75,
        }),
      },
    ]);

    const cardioIndicators = normalizeIndicatorsBySeverity([
      {
        key: "systolic_bp",
        label: t("dashboard.extra.inputs.systolic"),
        value: Number(systolicBloodPressure),
        severity: getSeverityScore(Number(systolicBloodPressure), {
          normal: 120,
          medium: 130,
          high: 140,
          veryHigh: 180,
        }),
      },

      {
        key: "diastolic_bp",
        label: t("dashboard.extra.inputs.diastolic"),
        value: Number(diastolicBloodPressure),
        severity: getSeverityScore(Number(diastolicBloodPressure), {
          normal: 80,
          medium: 90,
          high: 100,
          veryHigh: 120,
        }),
      },

      {
        key: "cholesterol",
        label: t("dashboard.extra.inputs.cholesterol"),
        value: Number(cholesterol),
        severity: getSeverityScore(Number(cholesterol), {
          normal: 200,
          medium: 240,
          high: 280,
          veryHigh: 320,
        }),
      },

      {
        key: "weight",
        label: t("dashboard.extra.inputs.weight"),
        value: Number(weight),
        severity: getSeverityScore(Number(weight), {
          normal: 80,
          medium: 100,
          high: 120,
          veryHigh: 150,
        }),
      },

      {
        key: "glucose_cardio",
        label: t("dashboard.extra.inputs.glucose"),
        value: Number(pred.glucose ?? 0),
        severity: getSeverityScore(Number(pred.glucose ?? 0), {
          normal: 100,
          medium: 126,
          high: 180,
          veryHigh: 250,
        }),
      },

      {
        key: "age_cardio",
        label: t("dashboard.extra.inputs.age"),
        value: Number(pred.age ?? 0),
        severity: getSeverityScore(Number(pred.age ?? 0), {
          normal: 45,
          medium: 55,
          high: 65,
          veryHigh: 75,
        }),
      },
    ]);

    return {
      height,
      weight,
      systolicBloodPressure,
      diastolicBloodPressure,
      cholesterol,
      diabetesIndicators,
      cardioIndicators,
    };
  };

  const latestScoresBlock = (
    <div
      className={`flex w-full flex-col gap-2 text-right sm:w-auto xl:flex-row xl:flex-wrap xl:items-center xl:justify-start xl:gap-x-4 xl:gap-y-2 ${
        isArabic ? "items-end" : "items-end xl:text-left"
      }`}
    >
      <div className="flex w-full flex-wrap items-center justify-end gap-1.5 xl:w-auto xl:justify-start">
        <span className="text-[11px] font-semibold text-muted-foreground">
          {t("dashboard.extra.latestDiabetesScore")}
        </span>

        <span className="text-[11px] font-bold text-foreground">
          {latestPrediction
            ? `${formatNumber(getDiabetesPercentage(latestPrediction), {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}%`
            : "--"}
        </span>

        {latestPrediction && latestDiabetesRiskLevel && (
          <Badge
            className={`border px-2 py-0 text-[10px] transition-none ${getRiskBadgeColor(
              latestDiabetesRiskLevel
            )}`}
          >
            {getLocalizedRiskLabel(latestDiabetesRiskLevel)}
          </Badge>
        )}
      </div>

      <div className="flex w-full flex-wrap items-center justify-end gap-1.5 xl:w-auto xl:justify-start">
        <span className="text-[11px] font-semibold text-muted-foreground">
          {t("dashboard.extra.latestCardioScore")}
        </span>

        <span className="text-[11px] font-bold text-foreground">
          {latestCardioPrediction
            ? `${formatNumber(latestCardioPrediction.percentage, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}%`
            : "--"}
        </span>

        {latestCardioPrediction && (
          <Badge
            className={`border px-2 py-0 text-[10px] transition-none ${getRiskBadgeColor(
              latestCardioPrediction.risk_level
            )}`}
          >
            {getLocalizedRiskLabel(latestCardioPrediction.risk_level)}
          </Badge>
        )}
      </div>
    </div>
  );

  const renderInputAxisTick = ({
    x,
    y,
    payload,
  }: {
    x: number;
    y: number;
    payload: { value: string };
  }) => {
    const item = inputsChartData.find((input) => input.key === payload.value);

    if (!item) return null;

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          textAnchor="middle"
          fill="hsl(var(--muted-foreground))"
          fontSize={9}
        >
          <tspan x="0" dy="0">
            {item.inputLabel}
          </tspan>
          <tspan x="0" dy="14" fontWeight={700} fill="hsl(var(--foreground))">
            {item.displayValue}
          </tspan>
        </text>
      </g>
    );
  };

  const renderRangeAxisTick = ({
    x,
    y,
    payload,
  }: {
    x: number;
    y: number;
    payload: { value: string };
  }) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          textAnchor="middle"
          fill="hsl(var(--muted-foreground))"
          fontSize={10}
        >
          <tspan x="0" dy="0">
            {payload.value}
          </tspan>
        </text>
      </g>
    );
  };

  const renderRiskPieLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    name: string;
  }) => {
    if (!percent || percent <= 0) return null;

    const radius = innerRadius + (outerRadius - innerRadius) * 0.58;
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[10px] font-bold"
      >
        {name}
      </text>
    );
  };

const buildReportState = (pred: Prediction) => {
  const cardio = getCardioPrediction(pred, t, predictions);
  const diabetesPercentage = getDiabetesPercentage(pred);
  const diabetesRiskLevel = getEffectiveDiabetesRiskLevel(pred);

  const normalizedGender = normalizeGenderValue(pred.gender);

  const reportGender =
    normalizedGender === "male" || normalizedGender === "female"
      ? normalizedGender
      : Number(pred.pregnancies ?? 0) > 0
      ? "female"
      : "male";

  const height = pred.height ?? 170;

  const calculatedWeightFromBmi = Number(
    (Number(pred.bmi ?? 0) * Math.pow(height / 100, 2)).toFixed(1)
  );

  const weight =
    pred.weight ?? (calculatedWeightFromBmi > 0 ? calculatedWeightFromBmi : 70);

  const diastolicBloodPressure =
    pred.diastolic_blood_pressure ?? pred.blood_pressure ?? 80;

  const systolicBloodPressure =
    pred.systolic_blood_pressure ??
    Math.min(diastolicBloodPressure + 40, 260);

  const cholesterol = pred.cholesterol ?? 180;

  const pregnancies =
    reportGender === "female" ? Number(pred.pregnancies ?? 0) : 0;

  return {
    formData: {
      gender: reportGender,

      ...(reportGender === "female"
        ? {
            pregnancies,
          }
        : {}),

      glucose: pred.glucose,
      systolicBloodPressure,
      diastolicBloodPressure,
      skinThickness: pred.skin_thickness,
      insulin: pred.insulin,
      weight,
      height,
      cholesterol,
      diabetesPedigreeFunction: pred.diabetes_pedigree_function,
      age: pred.age,
    },

    probability: diabetesPercentage,
    percentage: diabetesPercentage,
    riskLevel: diabetesRiskLevel,
    message: pred.message,
    predictionId: pred.id,
    sessionId: pred.session_id,

    diabetesPrediction: {
      probability: diabetesPercentage,
      percentage: diabetesPercentage,
      risk_level: diabetesRiskLevel,
      message: pred.message,
      prediction_id: pred.id,
    },

    cardiovascularPrediction: {
      ...cardio,
      probability:
        cardio.percentage <= 1
          ? cardio.percentage
          : Number((cardio.percentage / 100).toFixed(4)),
      percentage: cardio.percentage,
    },
  };
};
  const visibleRiskDistributionData = riskDistributionData.filter(
    (item) => item.value > 0
  );

  return (
    <div
      className="flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Header variant="dashboard" />

      <main className="w-full max-w-none flex-1 overflow-x-hidden px-3 pb-4 pt-16 sm:px-4 lg:px-5 xl:pt-0">
        <div className="relative w-full max-w-none">
          <PatientSidebar
            user={user}
            isArabic={isArabic}
            predictionsLength={diabetesPredictions.length}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            isDesktopSidebarCollapsed={isDesktopSidebarCollapsed}
            setIsDesktopSidebarCollapsed={setIsDesktopSidebarCollapsed}
            handleLogout={handleLogout}
          />

          <div
            className={`w-full min-w-0 space-y-4 transition-all duration-300 ease-out ${desktopContentOffsetClass}`}
          >
            <div
              className={`flex flex-col gap-3 pt-1 xl:pt-5 ${smoothSectionClass}`}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div className={isArabic ? "text-right" : "text-left"}>
                    <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      {t("dashboard.welcome")}{" "}
                      {user ? `${user.first_name || user.email}!` : ""}
                    </h1>

                    <p className="mt-1 max-w-full text-lg font-medium leading-snug text-muted-foreground sm:max-w-none">
                      {t("dashboard.analysisOverview")}
                    </p>

                    <div className="mt-2 text-xs font-semibold text-muted-foreground">
                      <span>{formattedDateTime}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 lg:hidden">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleToggleLanguage}
                      className="h-10 w-10 rounded-full text-primary hover:bg-primary/10 hover:text-primary"
                      aria-label={t("dashboard.extra.aria.toggleLanguage")}
                    >
                      <Globe className="h-5 w-5" />
                    </Button>

                    <NotificationBell isArabic={isArabic} />
                  </div>
                </div>

                <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:max-w-[650px] lg:grid-cols-[auto_auto_minmax(0,1fr)_auto]">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleLanguage}
                    className="hidden h-10 w-10 rounded-full text-primary hover:bg-primary/10 hover:text-primary lg:inline-flex"
                    aria-label={t("dashboard.extra.aria.toggleLanguage")}
                  >
                    <Globe className="h-5 w-5" />
                  </Button>

                  <NotificationBell
                    isArabic={isArabic}
                    className="hidden lg:block"
                  />

                  <div className="relative w-full min-w-0">
                    <Search
                      className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${
                        isArabic ? "right-3" : "left-3"
                      }`}
                    />

                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t("dashboard.search")}
                      className={`h-10 w-full rounded-full border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/30 ${
                        isArabic
                          ? "pr-9 pl-10 text-right"
                          : "pl-9 pr-10 text-left"
                      }`}
                    />

                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground ${
                          isArabic ? "left-3" : "right-3"
                        }`}
                        aria-label={t("dashboard.clearSearch")}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <Link to="/diagnosis" className="w-full sm:w-auto">
                    <Button className="h-10 w-full gap-2 whitespace-nowrap sm:w-auto">
                      <Plus className="h-5 w-5" />
                      {t("dashboard.newTest")}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <section
              className={`grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 ${smoothSectionClass}`}
            >
              <Card className="group relative overflow-hidden rounded-[18px] border border-border bg-card p-4 text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-primary/5 hover:shadow-lg">
                <div className="absolute inset-x-0 top-0 h-1 bg-primary/70" />

                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>

                <p className="mb-3 text-sm font-semibold text-primary">
                  {t("dashboard.extra.averageRisk")}
                </p>

                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-muted-foreground">
                      {diabetesLabel}
                    </p>

                    <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                      {diabetesPredictions.length
                        ? `${formatNumber(averageRisk, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}%`
                        : "--"}
                    </p>
                  </div>

                  <div className="h-12 w-px shrink-0 bg-border" />

                  <div
                    className={`min-w-0 flex-1 ${
                      isArabic ? "text-left" : "text-right"
                    }`}
                  >
                    <p className="truncate text-xs font-medium text-muted-foreground">
                      {cardioLabel}
                    </p>

                    <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                      {diabetesPredictions.length
                        ? `${formatNumber(averageCardioRisk, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}%`
                        : "--"}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="group relative overflow-hidden rounded-[18px] border border-border bg-card p-4 text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-primary/5 hover:shadow-lg">
                <div className="absolute inset-x-0 top-0 h-1 bg-primary/70" />

                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>

                <p className="mb-3 text-sm font-semibold text-primary">
                  {t("dashboard.extra.latestStatus")}
                </p>

                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-muted-foreground">
                      {diabetesLabel}
                    </p>

                    <p
                      className={`mt-1 truncate text-2xl font-bold tracking-tight ${latestRiskTextColor}`}
                    >
                      {latestDiabetesRiskLevel
                        ? getLocalizedRiskLabel(latestDiabetesRiskLevel)
                        : "--"}
                    </p>
                  </div>

                  <div className="h-12 w-px shrink-0 bg-border" />

                  <div
                    className={`min-w-0 flex-1 ${
                      isArabic ? "text-left" : "text-right"
                    }`}
                  >
                    <p className="truncate text-xs font-medium text-muted-foreground">
                      {cardioLabel}
                    </p>

                    <p
                      className={`mt-1 truncate text-2xl font-bold tracking-tight ${latestCardioRiskTextColor}`}
                    >
                      {latestCardioPrediction
                        ? getLocalizedRiskLabel(
                            latestCardioPrediction.risk_level
                          )
                        : "--"}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="group relative overflow-hidden rounded-[18px] border border-border bg-card p-4 text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-primary/5 hover:shadow-lg">
                <div className="absolute inset-x-0 top-0 h-1 bg-primary/70" />

                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>

                <p className="mb-1.5 text-sm font-semibold text-primary">
                  {t("dashboard.savedReports")}
                </p>

                <h3 className="text-2xl font-bold text-foreground">
                  {formatNumber(diabetesPredictions.length)}
                </h3>
              </Card>

              <Card className="group relative overflow-hidden rounded-[18px] border border-border bg-card p-4 text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-primary/5 hover:shadow-lg">
                <div className="absolute inset-x-0 top-0 h-1 bg-primary/70" />

                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Clock3 className="h-5 w-5 text-primary" />
                </div>

                <p className="mb-1.5 text-sm font-semibold text-primary">
                  {t("dashboard.lastCheckup")}
                </p>

                <h3 className="text-xl font-bold text-foreground">
                  {latestPrediction
                    ? formatDate(latestPrediction.created_at)
                    : "--"}
                </h3>
              </Card>
            </section>

            <section
              className={`grid grid-cols-1 items-start gap-4 ${smoothSectionClass}`}
            >
              <Card className="rounded-[22px] border border-border bg-card p-4 text-card-foreground shadow-sm md:p-5">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className={isArabic ? "text-right" : "text-left"}>
                    <h3 className="text-xl font-bold text-foreground md:text-2xl">
                      {t("dashboard.recentAnalyses")}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {diabetesPredictions.length > 3 && !selectedRange && (
                      <Link to="/past-reports">
                        <Button variant="outline" size="sm">
                          {t("dashboard.allReports")}
                        </Button>
                      </Link>
                    )}

                    <Button
                      variant={selectedRange === "weekly" ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setSelectedRange((prev) =>
                          prev === "weekly" ? null : "weekly"
                        )
                      }
                    >
                      {t("dashboard.weekly")}
                    </Button>

                    <Button
                      variant={selectedRange === "monthly" ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setSelectedRange((prev) =>
                          prev === "monthly" ? null : "monthly"
                        )
                      }
                    >
                      {t("dashboard.monthly")}
                    </Button>
                  </div>
                </div>

                <div className="mb-4 rounded-[20px] border border-border bg-gradient-to-b from-primary/5 via-background to-background p-3 md:p-4">
                  <div className="space-y-4">
                    {inputsChartData.length > 0 ? (
                      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[1.35fr_.65fr]">
                        <div className="h-full rounded-[20px] border border-border bg-card p-3 text-card-foreground shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-4 md:p-5">
                          {selectedRange && rangeSummary ? (
                            <>
                              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <h4 className="font-semibold text-foreground">
                                    {selectedRange === "weekly"
                                      ? t("dashboard.extra.weeklyRiskTrend")
                                      : t("dashboard.extra.monthlyRiskTrend")}
                                  </h4>

                                  <p className="text-xs text-muted-foreground">
                                    {selectedRange === "weekly"
                                      ? t("dashboard.extra.weeklyRiskTrendDesc")
                                      : t("dashboard.extra.monthlyRiskTrendDesc")}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                  <span className="inline-flex items-center gap-2">
                                    <span
                                      className="h-2.5 w-2.5 rounded-full"
                                      style={{
                                        backgroundColor: DIABETES_CHART_COLOR,
                                      }}
                                    />
                                    {diabetesLabel}
                                  </span>

                                  <span className="inline-flex items-center gap-2">
                                    <span
                                      className="h-2.5 w-2.5 rounded-full"
                                      style={{
                                        backgroundColor: CARDIO_CHART_COLOR,
                                      }}
                                    />
                                    {cardioLabel}
                                  </span>
                                </div>
                              </div>

                              <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                                <div className="rounded-2xl border border-border bg-primary/5 p-3 transition-all duration-300 hover:border-primary/25 hover:bg-primary/10 hover:shadow-sm">
                                  <p className="mb-3 text-xs font-semibold text-primary">
                                    {selectedRange === "weekly"
                                      ? t("dashboard.extra.weeklyAverage")
                                      : t("dashboard.extra.monthlyAverage")}
                                  </p>

                                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-medium text-muted-foreground">
                                        {diabetesLabel}
                                      </p>

                                      <h5 className="mt-1 whitespace-nowrap text-xl font-bold text-foreground sm:text-2xl">
                                        {`${formatNumber(
                                          rangeSummary.diabetesAverage,
                                          {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          }
                                        )}%`}
                                      </h5>
                                    </div>

                                    <div className="hidden h-12 w-px shrink-0 bg-border sm:block" />

                                    <div
                                      className={`min-w-0 ${
                                        isArabic ? "sm:text-left" : "sm:text-right"
                                      }`}
                                    >
                                      <p className="truncate text-xs font-medium text-muted-foreground">
                                        {cardioLabel}
                                      </p>

                                      <h5 className="mt-1 whitespace-nowrap text-xl font-bold text-foreground sm:text-2xl">
                                        {`${formatNumber(
                                          rangeSummary.cardioAverage,
                                          {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          }
                                        )}%`}
                                      </h5>
                                    </div>
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-border bg-primary/5 p-3 transition-all duration-300 hover:border-primary/25 hover:bg-primary/10 hover:shadow-sm">
                                  <p className="text-xs font-semibold text-primary">
                                    {selectedRange === "weekly"
                                      ? t("dashboard.extra.reportsThisWeek")
                                      : t("dashboard.extra.reportsDisplayedMonths")}
                                  </p>

                                  <h5 className="mt-1 text-2xl font-bold text-foreground">
                                    {formatNumber(rangeSummary.reports)}
                                  </h5>
                                </div>

                                <div className="rounded-2xl border border-border bg-primary/5 p-3 transition-all duration-300 hover:border-primary/25 hover:bg-primary/10 hover:shadow-sm">
                                  <p className="mb-3 text-xs font-semibold text-primary">
                                    {selectedRange === "weekly"
                                      ? t("dashboard.extra.highestWeeklyRisk")
                                      : t("dashboard.extra.highestDisplayedRisk")}
                                  </p>

                                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-medium text-muted-foreground">
                                        {diabetesLabel}
                                      </p>

                                      <div className="mt-1">
                                        <h5 className="whitespace-nowrap text-xl font-bold text-foreground sm:text-2xl">
                                          {`${formatNumber(
                                            rangeSummary.highestDiabetesPercentage,
                                            {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            }
                                          )}%`}
                                        </h5>

                                        <span
                                          className={`text-xs font-bold ${getRiskTextClass(
                                            rangeSummary.highestDiabetesLevel
                                          )}`}
                                        >
                                          {getLocalizedRiskLabel(
                                            rangeSummary.highestDiabetesLevel
                                          )}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="hidden h-14 w-px shrink-0 bg-border sm:block" />

                                    <div
                                      className={`min-w-0 ${
                                        isArabic ? "sm:text-left" : "sm:text-right"
                                      }`}
                                    >
                                      <p className="truncate text-xs font-medium text-muted-foreground">
                                        {cardioLabel}
                                      </p>

                                      <div className="mt-1">
                                        <h5 className="whitespace-nowrap text-xl font-bold text-foreground sm:text-2xl">
                                          {`${formatNumber(
                                            rangeSummary.highestCardioPercentage,
                                            {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            }
                                          )}%`}
                                        </h5>

                                        <span
                                          className={`text-xs font-bold ${getRiskTextClass(
                                            rangeSummary.highestCardioLevel
                                          )}`}
                                        >
                                          {getLocalizedRiskLabel(
                                            rangeSummary.highestCardioLevel
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="h-[330px] w-full overflow-visible">
                                <ResponsiveContainer width="100%" height="100%">
                                  <ComposedChart
                                    data={rangeTrendChartData}
                                    margin={{
                                      top: 14,
                                      right: 38,
                                      left: 8,
                                      bottom: 28,
                                    }}
                                  >
                                    <defs>
                                      <linearGradient
                                        id="diabetesRiskShadow"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                      >
                                        <stop
                                          offset="0%"
                                          stopColor={DIABETES_CHART_COLOR}
                                          stopOpacity={0.26}
                                        />
                                        <stop
                                          offset="75%"
                                          stopColor={DIABETES_CHART_COLOR}
                                          stopOpacity={0.04}
                                        />
                                        <stop
                                          offset="100%"
                                          stopColor={DIABETES_CHART_COLOR}
                                          stopOpacity={0}
                                        />
                                      </linearGradient>

                                      <linearGradient
                                        id="cardioRiskShadow"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                      >
                                        <stop
                                          offset="0%"
                                          stopColor={CARDIO_CHART_COLOR}
                                          stopOpacity={0.24}
                                        />
                                        <stop
                                          offset="75%"
                                          stopColor={CARDIO_CHART_COLOR}
                                          stopOpacity={0.04}
                                        />
                                        <stop
                                          offset="100%"
                                          stopColor={CARDIO_CHART_COLOR}
                                          stopOpacity={0}
                                        />
                                      </linearGradient>
                                    </defs>

                                    <CartesianGrid
                                      strokeDasharray="4 4"
                                      vertical={false}
                                      stroke="hsl(var(--border))"
                                    />

                                    <XAxis
                                      dataKey="label"
                                      tickLine={false}
                                      axisLine={false}
                                      interval={0}
                                      height={52}
                                      tickMargin={14}
                                      padding={{ left: 24, right: 24 }}
                                      tick={renderRangeAxisTick}
                                    />

                                    <YAxis
                                      tickLine={false}
                                      axisLine={false}
                                      width={38}
                                      tickMargin={8}
                                      domain={[0, 100]}
                                      tick={{
                                        fontSize: 10,
                                        fill: "hsl(var(--muted-foreground))",
                                      }}
                                      tickFormatter={(value) => `${value}%`}
                                    />

                                    <Tooltip
                                      cursor={{
                                        stroke: "hsl(var(--border))",
                                        strokeDasharray: "4 4",
                                      }}
                                      contentStyle={{
                                        borderRadius: "14px",
                                        border: "1px solid hsl(var(--border))",
                                        background: "hsl(var(--card))",
                                        color: "hsl(var(--card-foreground))",
                                        boxShadow:
                                          "0 14px 35px rgba(15,23,42,0.18)",
                                      }}
                                      labelStyle={{
                                        color: "hsl(var(--foreground))",
                                      }}
                                      itemStyle={{
                                        color: "hsl(var(--foreground))",
                                      }}
                                      formatter={(
                                        value: number | null,
                                        name: string
                                      ) => [
                                        value === null
                                          ? "--"
                                          : `${formatNumber(Number(value), {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            })}%`,
                                        name === "cardioRisk"
                                          ? cardioLabel
                                          : name === "diabetesRisk"
                                          ? diabetesLabel
                                          : t(
                                              "dashboard.extra.analysisAverage"
                                            ),
                                      ]}
                                      labelFormatter={(label) => {
                                        const point = rangeTrendChartData.find(
                                          (item) => item.label === label
                                        );

                                        if (!point) return label;

                                        return `${label} - ${t(
                                          "dashboard.extra.analysisAverage"
                                        )}: ${point.averageLabel} - ${t(
                                          "dashboard.extra.reports"
                                        )}: ${formatNumber(point.reports)}`;
                                      }}
                                    />

                                    <Area
                                      type="monotone"
                                      dataKey="diabetesRisk"
                                      stroke="none"
                                      fill="url(#diabetesRiskShadow)"
                                      connectNulls
                                      isAnimationActive={true}
                                      animationBegin={80}
                                      animationDuration={650}
                                      animationEasing="ease-out"
                                    />

                                    <Area
                                      type="monotone"
                                      dataKey="cardioRisk"
                                      stroke="none"
                                      fill="url(#cardioRiskShadow)"
                                      connectNulls
                                      isAnimationActive={true}
                                      animationBegin={120}
                                      animationDuration={650}
                                      animationEasing="ease-out"
                                    />

                                    <Line
                                      type="monotone"
                                      dataKey="diabetesRisk"
                                      stroke={DIABETES_CHART_COLOR}
                                      strokeWidth={3}
                                      connectNulls
                                      isAnimationActive={true}
                                      animationBegin={140}
                                      animationDuration={650}
                                      animationEasing="ease-out"
                                      dot={{
                                        r: 3,
                                        strokeWidth: 2,
                                        fill: "hsl(var(--background))",
                                        stroke: DIABETES_CHART_COLOR,
                                      }}
                                      activeDot={{
                                        r: 5,
                                        strokeWidth: 2,
                                        fill: "hsl(var(--background))",
                                        stroke: DIABETES_CHART_COLOR,
                                      }}
                                    />

                                    <Line
                                      type="monotone"
                                      dataKey="cardioRisk"
                                      stroke={CARDIO_CHART_COLOR}
                                      strokeWidth={3}
                                      connectNulls
                                      isAnimationActive={true}
                                      animationBegin={180}
                                      animationDuration={650}
                                      animationEasing="ease-out"
                                      dot={{
                                        r: 3,
                                        strokeWidth: 2,
                                        fill: "hsl(var(--background))",
                                        stroke: CARDIO_CHART_COLOR,
                                      }}
                                      activeDot={{
                                        r: 5,
                                        strokeWidth: 2,
                                        fill: "hsl(var(--background))",
                                        stroke: CARDIO_CHART_COLOR,
                                      }}
                                    />
                                  </ComposedChart>
                                </ResponsiveContainer>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="mb-3 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                                <div className="min-w-0">
                                  <h4 className="whitespace-nowrap font-semibold text-foreground">
                                    {t("dashboard.extra.analysisInputs")}
                                  </h4>

                                  <p className="max-w-full text-xs leading-relaxed text-muted-foreground xl:whitespace-nowrap">
                                    {t("dashboard.extra.analysisInputsDesc")}
                                  </p>
                                </div>

                                <div className="flex w-full max-w-full flex-col items-end gap-2 text-right xl:w-auto xl:items-end">
                                  <div className="flex flex-wrap items-center justify-end gap-3 text-xs text-muted-foreground xl:justify-start">
                                    <span className="inline-flex items-center gap-2">
                                      <span
                                        className="h-2.5 w-2.5 rounded-full"
                                        style={{
                                          backgroundColor:
                                            DIABETES_CHART_COLOR,
                                        }}
                                      />
                                      {diabetesLabel}
                                    </span>

                                    <span className="inline-flex items-center gap-2">
                                      <span
                                        className="h-2.5 w-2.5 rounded-full"
                                        style={{
                                          backgroundColor: CARDIO_CHART_COLOR,
                                        }}
                                      />
                                      {cardioLabel}
                                    </span>
                                  </div>

                                  {latestScoresBlock}
                                </div>
                              </div>

                              <div className="h-[380px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <ComposedChart
                                    data={inputsChartData}
                                    margin={{
                                      top: 18,
                                      right: 30,
                                      left: 18,
                                      bottom: 38,
                                    }}
                                  >
                                    <defs>
                                      <linearGradient
                                        id="diabetesInputShadow"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                      >
                                        <stop
                                          offset="0%"
                                          stopColor={DIABETES_CHART_COLOR}
                                          stopOpacity={0.24}
                                        />
                                        <stop
                                          offset="80%"
                                          stopColor={DIABETES_CHART_COLOR}
                                          stopOpacity={0.04}
                                        />
                                        <stop
                                          offset="100%"
                                          stopColor={DIABETES_CHART_COLOR}
                                          stopOpacity={0}
                                        />
                                      </linearGradient>

                                      <linearGradient
                                        id="cardioInputShadow"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                      >
                                        <stop
                                          offset="0%"
                                          stopColor={CARDIO_CHART_COLOR}
                                          stopOpacity={0.22}
                                        />
                                        <stop
                                          offset="80%"
                                          stopColor={CARDIO_CHART_COLOR}
                                          stopOpacity={0.04}
                                        />
                                        <stop
                                          offset="100%"
                                          stopColor={CARDIO_CHART_COLOR}
                                          stopOpacity={0}
                                        />
                                      </linearGradient>
                                    </defs>

                                    <CartesianGrid
                                      strokeDasharray="4 4"
                                      vertical={false}
                                      stroke="hsl(var(--border))"
                                    />

                                    <XAxis
                                      dataKey="key"
                                      tickLine={false}
                                      axisLine={false}
                                      interval={0}
                                      height={78}
                                      tickMargin={10}
                                      tick={renderInputAxisTick}
                                    />

                                    <YAxis
                                      tickLine={false}
                                      axisLine={false}
                                      width={38}
                                      tickMargin={8}
                                      tick={{
                                        fontSize: 10,
                                        fill: "hsl(var(--muted-foreground))",
                                      }}
                                    />

                                    <Tooltip
                                      cursor={{
                                        stroke: "hsl(var(--border))",
                                        strokeDasharray: "4 4",
                                      }}
                                      contentStyle={{
                                        borderRadius: "14px",
                                        border: "1px solid hsl(var(--border))",
                                        background: "hsl(var(--card))",
                                        color: "hsl(var(--card-foreground))",
                                        boxShadow:
                                          "0 14px 35px rgba(15,23,42,0.18)",
                                      }}
                                      labelStyle={{
                                        color: "hsl(var(--foreground))",
                                      }}
                                      itemStyle={{
                                        color: "hsl(var(--foreground))",
                                      }}
                                      formatter={(
                                        value: number,
                                        name: string
                                      ) => [
                                        formatNumber(Number(value), {
                                          minimumFractionDigits: 0,
                                          maximumFractionDigits: 3,
                                        }),
                                        name === "cardioValue"
                                          ? cardioLabel
                                          : diabetesLabel,
                                      ]}
                                      labelFormatter={(key) => {
                                        const item = inputsChartData.find(
                                          (input) => input.key === key
                                        );

                                        return item
                                          ? `${item.inputLabel}: ${item.displayValue}`
                                          : "";
                                      }}
                                    />

                                    <Area
                                      type="monotone"
                                      dataKey="diabetesValue"
                                      stroke="none"
                                      fill="url(#diabetesInputShadow)"
                                      connectNulls
                                      isAnimationActive={true}
                                      animationBegin={80}
                                      animationDuration={650}
                                      animationEasing="ease-out"
                                    />

                                    <Area
                                      type="monotone"
                                      dataKey="cardioValue"
                                      stroke="none"
                                      fill="url(#cardioInputShadow)"
                                      connectNulls
                                      isAnimationActive={true}
                                      animationBegin={120}
                                      animationDuration={650}
                                      animationEasing="ease-out"
                                    />

                                    <Line
                                      type="monotone"
                                      dataKey="diabetesValue"
                                      stroke={DIABETES_CHART_COLOR}
                                      strokeWidth={3}
                                      connectNulls
                                      isAnimationActive={true}
                                      animationBegin={140}
                                      animationDuration={650}
                                      animationEasing="ease-out"
                                      dot={{
                                        r: 3,
                                        strokeWidth: 2,
                                        fill: "hsl(var(--background))",
                                        stroke: DIABETES_CHART_COLOR,
                                      }}
                                      activeDot={{
                                        r: 5,
                                        strokeWidth: 2,
                                        fill: "hsl(var(--background))",
                                        stroke: DIABETES_CHART_COLOR,
                                      }}
                                    />

                                    <Line
                                      type="monotone"
                                      dataKey="cardioValue"
                                      stroke={CARDIO_CHART_COLOR}
                                      strokeWidth={3}
                                      connectNulls
                                      isAnimationActive={true}
                                      animationBegin={180}
                                      animationDuration={650}
                                      animationEasing="ease-out"
                                      dot={{
                                        r: 3,
                                        strokeWidth: 2,
                                        fill: "hsl(var(--background))",
                                        stroke: CARDIO_CHART_COLOR,
                                      }}
                                      activeDot={{
                                        r: 5,
                                        strokeWidth: 2,
                                        fill: "hsl(var(--background))",
                                        stroke: CARDIO_CHART_COLOR,
                                      }}
                                    />
                                  </ComposedChart>
                                </ResponsiveContainer>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex h-full flex-col rounded-[20px] border border-border bg-card p-3 text-card-foreground shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-4 md:p-5">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <h4 className="font-semibold text-foreground">
                                {t("dashboard.extra.riskDistribution")}
                              </h4>

                              <p className="text-xs text-muted-foreground">
                                {t("dashboard.extra.riskDistributionDesc")}
                              </p>
                            </div>

                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                              <Activity className="h-5 w-5 text-primary" />
                            </div>
                          </div>

                          <div className="grid flex-1 grid-cols-1 items-center gap-3 md:grid-cols-[0.9fr_1.1fr] xl:grid-cols-1 2xl:grid-cols-[0.9fr_1.1fr]">
                            <div
                              className={`space-y-2.5 ${
                                isArabic
                                  ? "order-2 md:order-1 xl:order-2 2xl:order-1 text-right"
                                  : "order-1 text-left"
                              }`}
                            >
                              {riskDistributionData.map((item) => (
                                <div
                                  key={item.key}
                                  className="flex items-center justify-between gap-3"
                                >
                                  <div
                                    className={`flex min-w-0 items-center gap-2 ${
                                      isArabic ? "flex-row-reverse" : ""
                                    }`}
                                  >
                                    <span
                                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                                      style={{ backgroundColor: item.color }}
                                    />

                                    <p className="truncate text-sm font-semibold text-foreground">
                                      {item.range}
                                    </p>
                                  </div>

                                  <span className="shrink-0 text-sm font-bold text-muted-foreground">
                                    {item.percentage}%
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div
                              className={`h-[330px] w-full ${
                                isArabic
                                  ? "order-1 md:order-2 xl:order-1 2xl:order-2"
                                  : "order-2"
                              }`}
                            >
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={
                                      visibleRiskDistributionData.length
                                        ? visibleRiskDistributionData
                                        : riskDistributionData
                                    }
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={42}
                                    outerRadius={118}
                                    paddingAngle={1}
                                    stroke="hsl(var(--card))"
                                    strokeWidth={2}
                                    labelLine={false}
                                    label={renderRiskPieLabel}
                                  >
                                    {(visibleRiskDistributionData.length
                                      ? visibleRiskDistributionData
                                      : riskDistributionData
                                    ).map((item) => (
                                      <Cell key={item.key} fill={item.color} />
                                    ))}
                                  </Pie>

                                  <Tooltip
                                    contentStyle={{
                                      borderRadius: "14px",
                                      border: "1px solid hsl(var(--border))",
                                      background: "hsl(var(--card))",
                                      color: "hsl(var(--card-foreground))",
                                      boxShadow:
                                        "0 10px 30px rgba(0,0,0,0.18)",
                                    }}
                                    formatter={(value: number, name: string) => {
                                      const item = riskDistributionData.find(
                                        (riskItem) => riskItem.name === name
                                      );

                                      return [
                                        item
                                          ? `${item.percentage}%`
                                          : formatNumber(value),
                                        name,
                                      ];
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                        {t("dashboard.noData")}
                      </div>
                    )}
                  </div>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-border bg-card p-4"
                      >
                        <div className="mb-3 h-4 w-48 rounded bg-muted" />
                        <div className="mb-2 h-3 w-32 rounded bg-muted" />
                        <div className="h-3 w-24 rounded bg-muted" />
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                      <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <h4 className="mb-2 font-semibold text-foreground">
                      {t("dashboard.unableToLoadAnalyses")}
                    </h4>
                    <p className="text-sm text-red-500">{error}</p>
                  </div>
                ) : diabetesPredictions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <Beaker className="h-7 w-7 text-primary" />
                    </div>
                    <h4 className="mb-2 text-lg font-semibold text-foreground">
                      {t("dashboard.noPreviousAnalyses")}
                    </h4>
                    <p className="mx-auto mb-6 max-w-md text-muted-foreground">
                      {t("dashboard.healthTipText")}
                    </p>
                    <Link to="/diagnosis">
                      <Button>{t("dashboard.firstTestNow")}</Button>
                    </Link>
                  </div>
                ) : searchTerm && displayedPredictions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <Search className="h-7 w-7 text-primary" />
                    </div>
                    <h4 className="mb-2 text-lg font-semibold text-foreground">
                      {t("dashboard.noData")}
                    </h4>
                    <p className="text-muted-foreground">{searchTerm}</p>
                  </div>
                ) : (
                  <>
                    <div className="hidden w-full overflow-hidden lg:block">
                      <div className="w-full overflow-hidden rounded-[20px] border border-border bg-card">
                        <div className="grid grid-cols-[minmax(250px,2fr)_minmax(180px,1.25fr)_minmax(110px,1fr)_minmax(120px,1fr)] gap-4 border-b border-border bg-muted/30 px-5 py-4 text-sm font-semibold text-muted-foreground">
                          <span className="text-start">
                            {t("dashboard.recentAnalyses")}
                          </span>
                          <span className="text-start">
                            {t("dashboard.riskIndicators")}
                          </span>
                          <span className="whitespace-nowrap text-start">
                            {t("dashboard.date")}
                          </span>
                          <span className="whitespace-nowrap text-center">
                            {t("dashboard.action")}
                          </span>
                        </div>

                        {displayedPredictions.map((pred) => {
                          const cardio = getCardioPrediction(pred, t, predictions);
                          const diabetesPercentage =
                            getDiabetesPercentage(pred);
                          const diabetesRiskLevel =
                            getEffectiveDiabetesRiskLevel(pred);
                          const { diabetesIndicators, cardioIndicators } =
                            buildRiskIndicators(pred);

                          return (
                            <div
                              key={pred.id}
                              className="grid grid-cols-[minmax(250px,2fr)_minmax(180px,1.25fr)_minmax(110px,1fr)_minmax(120px,1fr)] items-center gap-4 border-t border-border px-5 py-4 hover:bg-muted/20"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                    <Activity className="h-5 w-5 text-primary" />
                                  </div>

                                  <div className="grid grid-cols-[minmax(0,auto)_max-content] items-center gap-x-2 gap-y-2">
                                    <p className="truncate font-semibold">
                                      <span className="text-primary">
                                        {t("dashboard.extra.diabetesRisk")}:
                                      </span>{" "}
                                      <span className="font-normal text-muted-foreground">
                                        {formatNumber(diabetesPercentage, {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}
                                        %
                                      </span>
                                    </p>

                                    <Badge
                                      className={`justify-self-start border text-xs transition-none ${getRiskBadgeColor(
                                        diabetesRiskLevel
                                      )}`}
                                    >
                                      {getLocalizedRiskLabel(diabetesRiskLevel)}
                                    </Badge>

                                    <p className="truncate font-semibold">
                                      <span className="text-primary">
                                        {t("dashboard.extra.cardioRisk")}:
                                      </span>{" "}
                                      <span className="font-normal text-muted-foreground">
                                        {formatNumber(cardio.percentage, {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}
                                        %
                                      </span>
                                    </p>

                                    <Badge
                                      className={`justify-self-start border text-xs transition-none ${getRiskBadgeColor(
                                        cardio.risk_level
                                      )}`}
                                    >
                                      {getLocalizedRiskLabel(cardio.risk_level)}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <div className="min-w-0">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div className="min-w-0 border-e border-border pe-3">
                                    <p className="mb-1.5 text-xs font-semibold text-primary">
                                      {diabetesLabel}
                                    </p>

                                    <div className="flex flex-col gap-1">
                                      {diabetesIndicators.length > 0 ? (
                                        diabetesIndicators.map((indicator) => (
                                          <div
                                            key={indicator.key}
                                            className="flex min-w-0 items-center gap-2"
                                          >
                                            <span className="truncate font-medium text-foreground">
                                              {indicator.label}:
                                            </span>

                                            <span className="whitespace-nowrap text-muted-foreground">
                                              {formatNumber(
                                                Number(indicator.value),
                                                {
                                                  maximumFractionDigits: 2,
                                                }
                                              )}
                                            </span>
                                          </div>
                                        ))
                                      ) : (
                                        <span className="text-xs text-muted-foreground">
                                          {t(
                                            "dashboard.extra.noHighIndicators"
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="min-w-0">
                                    <p className="mb-1.5 text-xs font-semibold text-primary">
                                      {cardioLabel}
                                    </p>

                                    <div className="flex flex-col gap-1">
                                      {cardioIndicators.length > 0 ? (
                                        cardioIndicators.map((indicator) => (
                                          <div
                                            key={indicator.key}
                                            className="flex min-w-0 items-center gap-2"
                                          >
                                            <span className="truncate font-medium text-foreground">
                                              {indicator.label}:
                                            </span>

                                            <span className="whitespace-nowrap text-muted-foreground">
                                              {formatNumber(
                                                Number(indicator.value),
                                                {
                                                  maximumFractionDigits: 2,
                                                }
                                              )}
                                            </span>
                                          </div>
                                        ))
                                      ) : (
                                        <span className="text-xs text-muted-foreground">
                                          {t(
                                            "dashboard.extra.noHighIndicators"
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="text-sm text-muted-foreground">
                                <p className="whitespace-nowrap">
                                  {formatDate(pred.created_at)}
                                </p>
                                <p className="mt-1 whitespace-nowrap text-xs text-muted-foreground">
                                  {formatTime(pred.created_at)}
                                </p>
                              </div>

                              <div className="flex items-center justify-center gap-2">
                                <Link
                                  to="/report"
                                  state={buildReportState(pred)}
                                >
                                  <Button
                                    type="button"
                                    className="h-10 whitespace-nowrap rounded-full bg-primary px-6 font-semibold text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary/90 hover:shadow-md"
                                  >
                                    {t("dashboard.viewReport")}
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-3 lg:hidden">
                      {displayedPredictions.map((pred) => {
                        const cardio = getCardioPrediction(pred, t, predictions);
                        const diabetesPercentage = getDiabetesPercentage(pred);
                        const diabetesRiskLevel =
                          getEffectiveDiabetesRiskLevel(pred);
                        const { diabetesIndicators, cardioIndicators } =
                          buildRiskIndicators(pred);

                        return (
                          <div
                            key={pred.id}
                            className="rounded-[18px] border border-border bg-card p-4 text-card-foreground"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                <Activity className="h-5 w-5 text-primary" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="grid grid-cols-[minmax(0,auto)_max-content] items-center gap-x-2 gap-y-2">
                                  <p className="font-semibold leading-snug">
                                    <span className="text-primary">
                                      {t("dashboard.extra.diabetesRisk")}:
                                    </span>{" "}
                                    <span className="font-normal text-muted-foreground">
                                      {formatNumber(diabetesPercentage, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                      %
                                    </span>
                                  </p>

                                  <Badge
                                    className={`justify-self-start border text-xs transition-none ${getRiskBadgeColor(
                                      diabetesRiskLevel
                                    )}`}
                                  >
                                    {getLocalizedRiskLabel(diabetesRiskLevel)}
                                  </Badge>

                                  <p className="font-semibold leading-snug">
                                    <span className="text-primary">
                                      {t("dashboard.extra.cardioRiskShort")}:
                                    </span>{" "}
                                    <span className="font-normal text-muted-foreground">
                                      {formatNumber(cardio.percentage, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                      %
                                    </span>
                                  </p>

                                  <Badge
                                    className={`justify-self-start border text-xs transition-none ${getRiskBadgeColor(
                                      cardio.risk_level
                                    )}`}
                                  >
                                    {getLocalizedRiskLabel(cardio.risk_level)}
                                  </Badge>
                                </div>

                                <div className="mt-3 rounded-xl bg-muted/30 p-3">
                                  <p className="mb-2 text-xs font-semibold text-muted-foreground">
                                    {t("dashboard.riskIndicators")}
                                  </p>

                                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl border border-border bg-background/60 p-3">
                                      <p className="mb-2 text-xs font-semibold text-primary">
                                        {diabetesLabel}
                                      </p>

                                      <div className="flex flex-col gap-1.5 text-sm">
                                        {diabetesIndicators.length > 0 ? (
                                          diabetesIndicators.map((indicator) => (
                                            <div
                                              key={indicator.key}
                                              className="flex min-w-0 items-center justify-between gap-2"
                                            >
                                              <span className="truncate font-medium text-foreground">
                                                {indicator.label}
                                              </span>

                                              <span className="whitespace-nowrap text-muted-foreground">
                                                {formatNumber(
                                                  Number(indicator.value),
                                                  {
                                                    maximumFractionDigits: 2,
                                                  }
                                                )}
                                              </span>
                                            </div>
                                          ))
                                        ) : (
                                          <span className="text-xs text-muted-foreground">
                                            {t(
                                              "dashboard.extra.noHighIndicators"
                                            )}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="rounded-xl border border-border bg-background/60 p-3">
                                      <p className="mb-2 text-xs font-semibold text-primary">
                                        {cardioLabel}
                                      </p>

                                      <div className="flex flex-col gap-1.5 text-sm">
                                        {cardioIndicators.length > 0 ? (
                                          cardioIndicators.map((indicator) => (
                                            <div
                                              key={indicator.key}
                                              className="flex min-w-0 items-center justify-between gap-2"
                                            >
                                              <span className="truncate font-medium text-foreground">
                                                {indicator.label}
                                              </span>

                                              <span className="whitespace-nowrap text-muted-foreground">
                                                {formatNumber(
                                                  Number(indicator.value),
                                                  {
                                                    maximumFractionDigits: 2,
                                                  }
                                                )}
                                              </span>
                                            </div>
                                          ))
                                        ) : (
                                          <span className="text-xs text-muted-foreground">
                                            {t(
                                              "dashboard.extra.noHighIndicators"
                                            )}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 rounded-xl bg-muted/30 p-3">
                                  <p className="mb-1 text-xs text-muted-foreground">
                                    {t("dashboard.date")}
                                  </p>

                                  <p className="text-sm text-muted-foreground">
                                    {formatDate(pred.created_at)}
                                  </p>

                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {formatTime(pred.created_at)}
                                  </p>
                                </div>

                                <div
                                  className={`mt-4 flex ${
                                    isArabic ? "justify-start" : "justify-end"
                                  }`}
                                >
                                  <Link
                                    to="/report"
                                    state={buildReportState(pred)}
                                  >
                                    <Button
                                      type="button"
                                      className="h-10 min-w-[132px] rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary/90 hover:shadow-md sm:min-w-[150px]"
                                    >
                                      {t("dashboard.viewReport")}
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </Card>
            </section>

            <section
              className={`grid grid-cols-1 items-start gap-4 ${smoothSectionClass}`}
            >
              <Card className="rounded-[22px] border border-border bg-card p-4 text-card-foreground shadow-sm md:p-5">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-foreground">
                    {t("dashboard.lastDoctorContact")}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("dashboard.lastDoctorContactDesc")}
                  </p>
                </div>

                <div className="rounded-[18px] border border-border bg-primary/5 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                        <Stethoscope className="h-6 w-6 text-primary" />
                      </div>

                      <div className="min-w-0">
                        <h4 className="truncate text-lg font-semibold text-foreground">
                          {t("dashboard.doctorCardTitle")}
                        </h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t("dashboard.doctorCardText")}
                        </p>
                      </div>
                    </div>

                    <Link to="/consultations">
                      <Button variant="outline" className="gap-2">
                        <PhoneCall className="h-4 w-4" />
                        {t("dashboard.openConsultations")}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;