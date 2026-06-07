// src/pages/patient/PastReports.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { apiCall, API_ENDPOINTS } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  FileText,
  CalendarDays,
  Activity,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { useTranslation } from "react-i18next";
import { useIsVisible } from "@/hooks/useIsVisible";

type RiskLevel = "low" | "medium" | "high" | "very_high";
type RiskFilterValue = "all" | RiskLevel;

type IndicatorItem = {
  key: string;
  label: string;
  value: number | undefined;
};

type CardiovascularPrediction = {
  probability: number;
  percentage: number;
  risk_level: string;
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
  percentage?: number;
  risk_level: string;
  message: string;
  created_at: string;

  gender?: string | null;
  systolic_blood_pressure?: number | null;
  diastolic_blood_pressure?: number | null;
  weight?: number | null;
  height?: number | null;
  cholesterol?: number | null;

  cardiovascular_probability?: number | null;
  cardiovascular_percentage?: number | null;
  cardiovascular_risk_level?: string | null;
  cardiovascular_message?: string | null;
  cardiovascular_z_score?: number | null;

  disease_type?: "diabetes" | "cardiovascular";
  session_id?: string | null;

  extra_fields?: {
    gender?: string | null;
    weight?: number | null;
    height?: number | null;
    systolic_bp?: number | null;
    diastolic_bp?: number | null;
    cholesterol?: number | null;
    smoke?: boolean;
    alcohol?: boolean;
    physical_activity?: boolean;
  };
}

const DESKTOP_HEADER_HEIGHT = 72;
const REPORTS_PER_PAGE = 7;

const normalizePercentageValue = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;

  if (value <= 1) {
    return Number((value * 100).toFixed(2));
  }

  return Number(value.toFixed(2));
};

const getRiskLevelFromPercentage = (percentage: number): RiskLevel => {
  if (percentage >= 80) return "very_high";
  if (percentage >= 60) return "high";
  if (percentage >= 30) return "medium";
  return "low";
};

const normalizeTextValue = (value: unknown) => {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/\s+/g, " ");
};

const normalizeGenderValue = (
  value: unknown
): "male" | "female" | undefined => {
  const gender = normalizeTextValue(value);

  if (
    gender === "male" ||
    gender === "m" ||
    gender === "man" ||
    gender === "ذكر" ||
    gender === "رجل" ||
    gender === "ولد" ||
    gender === "boy"
  ) {
    return "male";
  }

  if (
    gender === "female" ||
    gender === "f" ||
    gender === "woman" ||
    gender === "انثى" ||
    gender === "أنثى" ||
    gender === "امرأة" ||
    gender === "بنت" ||
    gender === "girl"
  ) {
    return "female";
  }

  return undefined;
};

const normalizeAnyRiskLevel = (
  riskLevel?: string | null
): RiskLevel | "unknown" => {
  const risk = normalizeTextValue(riskLevel);

  if (
    risk === "very_high" ||
    risk === "very high" ||
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
    risk === "high" ||
    risk.includes("high") ||
    risk.includes("عالي") ||
    risk.includes("مرتفع")
  ) {
    return "high";
  }

  if (
    risk === "medium" ||
    risk === "moderate" ||
    risk.includes("medium") ||
    risk.includes("moderate") ||
    risk.includes("متوسط")
  ) {
    return "medium";
  }

  if (
    risk === "low" ||
    risk.includes("low") ||
    risk.includes("منخفض") ||
    risk.includes("قليل")
  ) {
    return "low";
  }

  return "unknown";
};

const getEffectiveRiskLevel = (
  riskLevel?: string | null
): RiskLevel | "unknown" => {
  return normalizeAnyRiskLevel(riskLevel);
};

const getCardioPrediction = (
  prediction: Prediction,
  allPredictions?: Prediction[]
): CardiovascularPrediction | null => {
  if (prediction.session_id && allPredictions) {
    const siblingCardio = allPredictions.find(
      (p) =>
        p.session_id === prediction.session_id &&
        p.disease_type === "cardiovascular"
    );

    if (siblingCardio) {
      const backendPercentage =
        normalizePercentageValue(siblingCardio.percentage) ??
        normalizePercentageValue(siblingCardio.probability);

      const backendRiskLevel = siblingCardio.risk_level;

      if (backendPercentage !== null && backendRiskLevel) {
        return {
          probability: Number((backendPercentage / 100).toFixed(4)),
          percentage: backendPercentage,
          risk_level: backendRiskLevel,
          message: siblingCardio.message || "",
          z_score: Number(siblingCardio.cardiovascular_z_score ?? 0),
          isFallback: false,
        };
      }
    }
  }

  const backendPercentage =
    normalizePercentageValue(prediction.cardiovascular_percentage) ??
    normalizePercentageValue(prediction.cardiovascular_probability);

  const backendRiskLevel = prediction.cardiovascular_risk_level;

  if (backendPercentage !== null && backendRiskLevel) {
    return {
      probability: Number((backendPercentage / 100).toFixed(4)),
      percentage: backendPercentage,
      risk_level: backendRiskLevel,
      message: prediction.cardiovascular_message || "",
      z_score: Number(prediction.cardiovascular_z_score ?? 0),
      isFallback: false,
    };
  }

  return null;
};

export default function PastReports() {
  const { user, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const actionsLabel = isArabic ? "الإجراءات" : "Actions";

  const heroRef = useRef(null);
  const contentRef = useRef(null);

  const heroVisible = useIsVisible(heroRef);
  const contentVisible = useIsVisible(contentRef);

  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [diabetesRiskFilter, setDiabetesRiskFilter] =
    useState<RiskFilterValue>("all");
  const [cardioRiskFilter, setCardioRiskFilter] =
    useState<RiskFilterValue>("all");

  const selectItemClassName =
    "cursor-pointer rounded-xl px-3 py-2.5 transition-colors hover:bg-primary/10 focus:bg-primary/10 focus:text-primary data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary [&>span:first-child]:hidden";

  const riskBadgeClassName =
    "inline-flex h-5 w-fit min-w-0 shrink-0 items-center justify-center rounded-full border px-2 text-[10px] font-medium leading-none transition-none sm:h-5 sm:px-2.5 sm:text-[11px]";

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

        setPredictions(data.predictions || []);

        if (data.predictions && data.predictions.length === 0) {
          toast.info(t("pastReportsPage.noReportsToast"));
        }
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError(t("pastReportsPage.fetchError"));
        toast.error(t("pastReportsPage.dataError"));
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && user) {
      fetchPredictions();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, t]);

  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => {
    return value.toLocaleString(isArabic ? "ar-EG" : "en-US", options);
  };

  const normalizeText = (value: unknown) => {
    return normalizeTextValue(value);
  };

  const getDiabetesPercentage = (prediction: Prediction) => {
    return (
      normalizePercentageValue(prediction.percentage) ??
      normalizePercentageValue(prediction.probability) ??
      0
    );
  };

  const getEffectiveDiabetesRiskLevel = (prediction: Prediction): RiskLevel => {
    return getRiskLevelFromPercentage(getDiabetesPercentage(prediction));
  };

  const getLocalizedRiskLabel = (riskLevel?: string | null) => {
    const normalized = getEffectiveRiskLevel(riskLevel);

    switch (normalized) {
      case "very_high":
        return isArabic ? "عالي جدًا" : "Very High";
      case "high":
        return isArabic ? "عالي" : "High";
      case "medium":
        return isArabic ? "متوسط" : "Medium";
      case "low":
        return isArabic ? "منخفض" : "Low";
      default:
        return isArabic ? "غير متاح" : "N/A";
    }
  };

  const getRiskSearchText = (riskLevel?: string | null) => {
    const normalized = normalizeAnyRiskLevel(riskLevel);

    switch (normalized) {
      case "very_high":
        return "very high very_high عالي جدا عالي جدًا مرتفع جدا مرتفع جدًا";
      case "high":
        return "high عالي مرتفع";
      case "medium":
        return "medium moderate متوسط";
      case "low":
        return "low منخفض قليل";
      default:
        return "";
    }
  };

  const getRiskBadgeColor = (riskLevel?: string | null) => {
    const normalized = getEffectiveRiskLevel(riskLevel);

    switch (normalized) {
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

  const getProbabilityTone = () => {
    return {
      wrap: "bg-primary/10",
      icon: "text-primary",
    };
  };

  const getPredictionGender = (prediction: Prediction) => {
    return normalizeGenderValue(
      prediction.gender ?? prediction.extra_fields?.gender
    );
  };

  const getPredictionNumberValue = (
    mainValue: number | null | undefined,
    fallbackValue: number | null | undefined,
    defaultValue: number
  ) => {
    if (typeof mainValue === "number" && !Number.isNaN(mainValue)) {
      return mainValue;
    }

    if (typeof fallbackValue === "number" && !Number.isNaN(fallbackValue)) {
      return fallbackValue;
    }

    return defaultValue;
  };

  const getReportValuesForNavigation = (prediction: Prediction) => {
    const height = getPredictionNumberValue(
      prediction.height,
      prediction.extra_fields?.height,
      170
    );

    const calculatedWeightFromBmi = Number(
      (Number(prediction.bmi ?? 0) * Math.pow(height / 100, 2)).toFixed(1)
    );

    const weight = getPredictionNumberValue(
      prediction.weight,
      prediction.extra_fields?.weight,
      calculatedWeightFromBmi > 0 ? calculatedWeightFromBmi : 70
    );

    const diastolicBloodPressure = getPredictionNumberValue(
      prediction.diastolic_blood_pressure,
      prediction.extra_fields?.diastolic_bp,
      prediction.blood_pressure ?? 80
    );

    const systolicBloodPressure = getPredictionNumberValue(
      prediction.systolic_blood_pressure,
      prediction.extra_fields?.systolic_bp,
      Math.min(diastolicBloodPressure + 40, 260)
    );

    const cholesterol = getPredictionNumberValue(
      prediction.cholesterol,
      prediction.extra_fields?.cholesterol,
      180
    );

    return {
      height,
      weight,
      cholesterol,
      systolicBloodPressure,
      diastolicBloodPressure,
    };
  };

  const normalizeIndicators = (indicators: IndicatorItem[]) => {
    return indicators
      .filter(
        (item) => typeof item.value === "number" && !Number.isNaN(item.value)
      )
      .sort((a, b) => Number(b.value) - Number(a.value))
      .slice(0, 3);
  };

  const getTopRiskIndicators = (prediction: Prediction) => {
    const reportValues = getReportValuesForNavigation(prediction);
    const normalizedGender = getPredictionGender(prediction);
    const isFemale = normalizedGender === "female";

    const diabetesIndicators: IndicatorItem[] = [
      ...(isFemale
        ? [
            {
              key: "pregnancies",
              label: t("dashboard.pregnancies"),
              value: prediction.pregnancies,
            },
          ]
        : []),
      {
        key: "glucose_diabetes",
        label: t("dashboard.glucose"),
        value: prediction.glucose,
      },
      {
        key: "blood_pressure_diabetes",
        label: isArabic ? "ضغط السكر" : "Diabetes BP",
        value: prediction.blood_pressure,
      },
      {
        key: "skin_thickness",
        label: t("dashboard.skinThickness"),
        value: prediction.skin_thickness,
      },
      {
        key: "insulin",
        label: t("dashboard.insulin"),
        value: prediction.insulin,
      },
      {
        key: "bmi",
        label: t("dashboard.bmi"),
        value: prediction.bmi,
      },
      {
        key: "diabetes_pedigree_function",
        label: isArabic ? "عامل الوراثة" : "Pedigree",
        value: prediction.diabetes_pedigree_function,
      },
      {
        key: "age_diabetes",
        label: t("dashboard.age"),
        value: prediction.age,
      },
    ];

    const cardioIndicators: IndicatorItem[] = [
      {
        key: "systolic_bp_cardio",
        label: isArabic ? "ضغط انقباضي" : "Systolic BP",
        value: reportValues.systolicBloodPressure,
      },
      {
        key: "diastolic_bp_cardio",
        label: isArabic ? "ضغط انبساطي" : "Diastolic BP",
        value: reportValues.diastolicBloodPressure,
      },
      {
        key: "cholesterol",
        label: isArabic ? "الكوليسترول" : "Cholesterol",
        value: reportValues.cholesterol,
      },
      {
        key: "weight",
        label: isArabic ? "الوزن" : "Weight",
        value: reportValues.weight,
      },
      {
        key: "height",
        label: isArabic ? "الطول" : "Height",
        value: reportValues.height,
      },
      {
        key: "glucose_cardio",
        label: t("dashboard.glucose"),
        value: prediction.glucose,
      },
      {
        key: "age_cardio",
        label: t("dashboard.age"),
        value: prediction.age,
      },
    ];

    return {
      diabetes: normalizeIndicators(diabetesIndicators),
      cardio: normalizeIndicators(cardioIndicators),
    };
  };

  const sortedPredictions = useMemo(() => {
    return [...predictions]
      .filter((p) => !p.disease_type || p.disease_type === "diabetes")
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [predictions]);

  const filteredPredictions = useMemo(() => {
    const query = normalizeText(searchTerm);

    return sortedPredictions.filter((pred) => {
      const cardio = getCardioPrediction(pred, predictions);
      const diabetesPercentage = getDiabetesPercentage(pred);

      const diabetesRiskLevel = getEffectiveDiabetesRiskLevel(pred);
      const cardioRiskLevel = getEffectiveRiskLevel(cardio?.risk_level);

      const matchesDiabetesFilter =
        diabetesRiskFilter === "all" ||
        diabetesRiskLevel === diabetesRiskFilter;

      const matchesCardioFilter =
        cardioRiskFilter === "all" || cardioRiskLevel === cardioRiskFilter;

      if (!matchesDiabetesFilter || !matchesCardioFilter) {
        return false;
      }

      if (!query) return true;

      const searchableText = normalizeText(
        [
          pred.id,

          "diabetes",
          "diabetic",
          "sugar",
          "blood sugar",
          "glucose",
          "السكري",
          "سكر",
          "السكر",
          "تحليل السكر",
          "مرض السكر",

          "cardio",
          "cardiovascular",
          "heart",
          "heart disease",
          "cardiovascular disease",
          "القلب",
          "قلب",
          "امراض القلب",
          "أمراض القلب",
          "الاوعية الدموية",
          "الأوعية الدموية",
          "القلب والأوعية الدموية",

          diabetesPercentage,
          diabetesPercentage.toFixed(1),
          diabetesPercentage.toFixed(2),
          `${diabetesPercentage}%`,
          `${diabetesPercentage.toFixed(1)}%`,
          `${diabetesPercentage.toFixed(2)}%`,

          diabetesRiskLevel,
          getLocalizedRiskLabel(diabetesRiskLevel),
          getRiskSearchText(diabetesRiskLevel),
          pred.risk_level,
          getRiskSearchText(pred.risk_level),

          cardio?.percentage,
          cardio?.percentage?.toFixed(1),
          cardio?.percentage?.toFixed(2),
          cardio ? `${cardio.percentage}%` : "",
          cardio ? `${cardio.percentage.toFixed(1)}%` : "",
          cardio ? `${cardio.percentage.toFixed(2)}%` : "",

          cardio?.risk_level,
          getLocalizedRiskLabel(cardio?.risk_level),
          getRiskSearchText(cardio?.risk_level),

          pred.created_at,
          new Date(pred.created_at).toLocaleDateString("en-US"),
          new Date(pred.created_at).toLocaleDateString("ar-EG"),
          new Date(pred.created_at).toLocaleDateString("ar-SA"),
        ].join(" ")
      );

      return searchableText.includes(query);
    });
  }, [
    sortedPredictions,
    predictions,
    searchTerm,
    diabetesRiskFilter,
    cardioRiskFilter,
    isArabic,
  ]);

  const averageDiabetesProbability = useMemo(() => {
    if (!sortedPredictions.length) return 0;

    return (
      sortedPredictions.reduce(
        (sum, prediction) => sum + getDiabetesPercentage(prediction),
        0
      ) / sortedPredictions.length
    );
  }, [sortedPredictions]);

  const averageCardioProbability = useMemo(() => {
    const cardioPredictions = sortedPredictions
      .map((prediction) => getCardioPrediction(prediction, predictions))
      .filter((cardio): cardio is CardiovascularPrediction => cardio !== null);

    if (!cardioPredictions.length) return 0;

    return (
      cardioPredictions.reduce((sum, cardio) => sum + cardio.percentage, 0) /
      cardioPredictions.length
    );
  }, [sortedPredictions, predictions]);

  const latestDate = sortedPredictions[0]
    ? new Date(sortedPredictions[0].created_at).toLocaleDateString(
        isArabic ? "ar-SA" : "en-US"
      )
    : "--";

  const totalPages = Math.ceil(filteredPredictions.length / REPORTS_PER_PAGE);

  const paginatedPredictions = useMemo(() => {
    const startIndex = (currentPage - 1) * REPORTS_PER_PAGE;
    const endIndex = startIndex + REPORTS_PER_PAGE;

    return filteredPredictions.slice(startIndex, endIndex);
  }, [filteredPredictions, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, diabetesRiskFilter, cardioRiskFilter]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getCardioDisplayPercentage = (
    cardio: CardiovascularPrediction | null
  ) => {
    if (!cardio) return isArabic ? "غير متاح" : "N/A";

    return `${formatNumber(cardio.percentage, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`;
  };

  const getCardioBadge = (cardio: CardiovascularPrediction | null) => {
    if (!cardio) {
      return (
        <Badge
          className={`${riskBadgeClassName} border-border bg-muted text-muted-foreground`}
        >
          {isArabic ? "غير متاح" : "N/A"}
        </Badge>
      );
    }

    return (
      <Badge
        className={`${riskBadgeClassName} ${getRiskBadgeColor(
          cardio.risk_level
        )}`}
      >
        {getLocalizedRiskLabel(cardio.risk_level)}
      </Badge>
    );
  };

  const buildReportState = (
  pred: Prediction,
  cardio: CardiovascularPrediction | null,
  diabetesPercentage: number,
  reportValues: ReturnType<typeof getReportValuesForNavigation>,
  normalizedGender: "male" | "female" | undefined
) => {
  const diabetesRiskLevel = getRiskLevelFromPercentage(diabetesPercentage);

  const reportGender =
    normalizedGender ??
    (Number(pred.pregnancies ?? 0) > 0 ? "female" : "male");

  const pregnancies =
    reportGender === "female" ? Number(pred.pregnancies ?? 0) : 0;

  const cardioPercentage = cardio?.percentage ?? 0;

  return {
    formData: {
      gender: reportGender,

      ...(reportGender === "female"
        ? {
            pregnancies,
          }
        : {}),

      glucose: pred.glucose,
      systolicBloodPressure: reportValues.systolicBloodPressure,
      diastolicBloodPressure: reportValues.diastolicBloodPressure,
      skinThickness: pred.skin_thickness,
      insulin: pred.insulin,
      weight: reportValues.weight,
      height: reportValues.height,
      cholesterol: reportValues.cholesterol,
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
      prediction_id: pred.id,
      probability: diabetesPercentage,
      percentage: diabetesPercentage,
      risk_level: diabetesRiskLevel,
      arabic_risk_level: getLocalizedRiskLabel(diabetesRiskLevel),
      message: pred.message,
    },

    cardiovascularPrediction: cardio
      ? {
          probability:
            cardioPercentage <= 1
              ? cardioPercentage
              : Number((cardioPercentage / 100).toFixed(4)),
          percentage: cardioPercentage,
          risk_level: cardio.risk_level,
          arabic_risk_level: getLocalizedRiskLabel(cardio.risk_level),
          message: cardio.message,
          z_score: cardio.z_score,
          isFallback: false,
        }
      : null,
  };
};
  const LoadingSkeleton = () => {
    return (
      <div className="w-full max-w-none animate-pulse space-y-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Card
              key={item}
              className="rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 shrink-0 rounded-2xl bg-muted" />
                <div className="flex-1">
                  <div className="mb-3 h-3 w-24 rounded bg-muted" />
                  <div className="h-8 w-32 rounded bg-muted" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="w-full max-w-none overflow-hidden rounded-[26px] border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-5 md:p-6">
          <div className="hidden w-full overflow-hidden rounded-[22px] border border-border xl:block">
            <div className="grid grid-cols-[2fr_1.55fr_1.1fr_1.1fr] gap-4 bg-muted/30 px-5 py-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-4 w-28 rounded bg-muted" />
              ))}
            </div>

            {[1, 2, 3, 4, 5].map((row) => (
              <div
                key={row}
                className="grid grid-cols-[2fr_1.55fr_1.1fr_1.1fr] items-center gap-4 border-t border-border px-5 py-5"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted" />
                  <div>
                    <div className="mb-2 h-5 w-28 rounded bg-muted" />
                    <div className="h-4 w-20 rounded bg-muted" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-muted" />
                  <div className="h-4 w-28 rounded bg-muted" />
                  <div className="h-4 w-24 rounded bg-muted" />
                </div>

                <div className="space-y-2">
                  <div className="h-4 w-24 rounded bg-muted" />
                  <div className="h-3 w-20 rounded bg-muted" />
                </div>

                <div className="mx-auto h-9 w-24 rounded-full bg-muted" />
              </div>
            ))}
          </div>

          <div className="grid gap-4 xl:hidden">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-border bg-card p-4 sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-muted" />

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 h-3 w-36 rounded bg-muted" />
                    <div className="mb-4 h-6 w-28 rounded bg-muted" />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-muted/40 p-3">
                        <div className="mb-3 h-3 w-28 rounded bg-muted" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 rounded bg-muted" />
                          <div className="h-4 w-28 rounded bg-muted" />
                          <div className="h-4 w-24 rounded bg-muted" />
                        </div>
                      </div>

                      <div className="rounded-xl bg-muted/40 p-3">
                        <div className="mb-3 h-3 w-16 rounded bg-muted" />
                        <div className="mb-2 h-4 w-28 rounded bg-muted" />
                        <div className="h-3 w-20 rounded bg-muted" />
                      </div>
                    </div>

                    <div className="mt-4 h-9 w-28 rounded-full bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div
        className="flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <Header variant="dashboard" />

        <main
          className="flex w-full max-w-none flex-1 items-center justify-center overflow-x-hidden px-4 sm:px-5 lg:px-6"
          style={{
            paddingTop: `${DESKTOP_HEADER_HEIGHT + 32}px`,
            paddingBottom: "32px",
          }}
        >
          <Alert className="w-full max-w-md border-yellow-500/30 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              {t("pastReportsPage.mustLogin")}
            </AlertDescription>
          </Alert>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col overflow-x-hidden bg-gradient-to-b from-background via-background to-accent/20 text-foreground"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Header variant="dashboard" />

      <main
        className="w-full max-w-none flex-1 overflow-x-hidden"
        style={{ paddingTop: `${DESKTOP_HEADER_HEIGHT}px` }}
      >
        <section className="w-full overflow-x-hidden border-b border-border bg-background">
          <div className="w-full max-w-none px-4 py-8 sm:px-5 md:py-10 lg:px-6">
            <div
              ref={heroRef}
              className={`transform-gpu transition-all duration-700 ease-out ${
                heroVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >
              <div className={isArabic ? "text-right" : "text-left"}>
                <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  {t("pastReportsPage.title")}
                </h1>

                <p className="max-w-2xl text-muted-foreground">
                  {t("pastReportsPage.subtitle")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="w-full max-w-none overflow-x-hidden px-4 py-8 sm:px-5 lg:px-6">
          <div
            ref={contentRef}
            className={`w-full max-w-none transform-gpu transition-all duration-700 ease-out ${
              contentVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            {isLoading && <LoadingSkeleton />}

            {error && !isLoading && (
              <Alert className="mb-6 border-red-500/30 bg-red-500/10">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-300" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {!isLoading && !error && sortedPredictions.length === 0 && (
              <Card className="rounded-[26px] border border-dashed border-border bg-card p-8 text-center text-card-foreground shadow-sm sm:p-12">
                <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />

                <h2 className="mb-2 text-2xl font-bold text-foreground">
                  {t("pastReportsPage.emptyTitle")}
                </h2>

                <p className="mx-auto mb-6 max-w-md text-muted-foreground">
                  {t("pastReportsPage.emptySubtitle")}
                </p>
              </Card>
            )}

            {!isLoading && !error && sortedPredictions.length > 0 && (
              <div className="w-full max-w-none space-y-8">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Card className="group relative overflow-hidden rounded-[26px] border border-border bg-card p-5 text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-primary/5 hover:shadow-lg">
                    <div className="absolute inset-x-0 top-0 h-1 bg-primary/70" />

                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-primary/15">
                        <FileText className="h-6 w-6" strokeWidth={2.4} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="mb-1 text-base font-semibold tracking-tight text-primary">
                          {t("pastReportsPage.totalReports")}
                        </p>

                        <p className="text-2xl font-bold tracking-tight text-foreground">
                          {formatNumber(sortedPredictions.length)}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="group relative overflow-hidden rounded-[26px] border border-border bg-card p-5 text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-primary/5 hover:shadow-lg">
                    <div className="absolute inset-x-0 top-0 h-1 bg-primary/70" />

                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-primary/15">
                        <CalendarDays className="h-6 w-6" strokeWidth={2.4} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="mb-1 text-base font-semibold tracking-tight text-primary">
                          {t("pastReportsPage.latestTest")}
                        </p>

                        <p className="truncate text-xl font-bold tracking-tight text-foreground">
                          {latestDate}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="group relative overflow-hidden rounded-[26px] border border-border bg-card p-5 text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-primary/5 hover:shadow-lg">
                    <div className="absolute inset-x-0 top-0 h-1 bg-primary/70" />

                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-primary/15">
                        <Activity className="h-6 w-6" strokeWidth={2.4} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="mb-3 text-base font-semibold tracking-tight text-primary">
                          {t("pastReportsPage.average")}
                        </p>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">
                                {isArabic ? "السكري" : "Diabetes"}
                              </p>

                              <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                                {formatNumber(averageDiabetesProbability, {
                                  minimumFractionDigits: 1,
                                  maximumFractionDigits: 1,
                                })}
                                %
                              </p>
                            </div>

                            <div className="h-10 w-px shrink-0 bg-border" />

                            <div
                              className={isArabic ? "text-left" : "text-right"}
                            >
                              <p className="text-xs font-medium text-muted-foreground">
                                {isArabic
                                  ? "القلب و الأوعية الدموية"
                                  : "Cardiovascular"}
                              </p>

                              <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                                {averageCardioProbability > 0
                                  ? `${formatNumber(averageCardioProbability, {
                                      minimumFractionDigits: 1,
                                      maximumFractionDigits: 1,
                                    })}%`
                                  : isArabic
                                  ? "غير متاح"
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="w-full max-w-none overflow-hidden rounded-[26px] border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-5 md:p-6">
                  <div className="mb-6 flex justify-center">
                    <div className="flex w-full max-w-5xl flex-col gap-2 rounded-[28px] border border-border bg-background p-2 shadow-sm transition-all duration-300 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10 md:flex-row md:items-center">
                      <div className="relative min-w-0 flex-1">
                        <Search
                          className={`absolute top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground ${
                            isArabic ? "right-4" : "left-4"
                          }`}
                        />

                        <Input
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                          }}
                          placeholder={
                            isArabic
                              ? "ابحث في السكر أو القلب أو النسبة أو التاريخ..."
                              : "Search diabetes, cardio, percentage, or date..."
                          }
                          className={`h-11 border-0 bg-transparent text-sm text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0 ${
                            isArabic
                              ? "pr-10 pl-3 text-right"
                              : "pl-10 pr-3 text-left"
                          }`}
                        />
                      </div>

                      <div className="hidden h-7 w-px bg-border md:block" />

                      <div className="grid grid-cols-2 gap-2 md:w-[360px]">
                        <Select
                          value={diabetesRiskFilter}
                          onValueChange={(value) => {
                            setDiabetesRiskFilter(value as RiskFilterValue);
                            setCurrentPage(1);
                          }}
                        >
                          <SelectTrigger
                            className={`h-10 rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-none transition-all hover:border-primary hover:bg-primary/10 hover:text-primary focus:ring-2 focus:ring-primary/20 ${
                              isArabic ? "text-right" : "text-left"
                            }`}
                          >
                            <SelectValue
                              placeholder={
                                isArabic ? "حالة السكر" : "Diabetes"
                              }
                            />
                          </SelectTrigger>

                          <SelectContent
                            align={isArabic ? "end" : "start"}
                            className="overflow-hidden rounded-2xl border border-primary/20 bg-popover p-1 text-popover-foreground shadow-lg"
                          >
                            <SelectItem
                              value="all"
                              className={selectItemClassName}
                            >
                              {isArabic ? "كل السكر" : "All Diabetes"}
                            </SelectItem>

                            <SelectItem
                              value="low"
                              className={selectItemClassName}
                            >
                              {isArabic ? "منخفض" : "Low"}
                            </SelectItem>

                            <SelectItem
                              value="medium"
                              className={selectItemClassName}
                            >
                              {isArabic ? "متوسط" : "Medium"}
                            </SelectItem>

                            <SelectItem
                              value="high"
                              className={selectItemClassName}
                            >
                              {isArabic ? "عالي" : "High"}
                            </SelectItem>

                            <SelectItem
                              value="very_high"
                              className={selectItemClassName}
                            >
                              {isArabic ? "عالي جدًا" : "Very High"}
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          value={cardioRiskFilter}
                          onValueChange={(value) => {
                            setCardioRiskFilter(value as RiskFilterValue);
                            setCurrentPage(1);
                          }}
                        >
                          <SelectTrigger
                            className={`h-10 rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-none transition-all hover:border-primary hover:bg-primary/10 hover:text-primary focus:ring-2 focus:ring-primary/20 ${
                              isArabic ? "text-right" : "text-left"
                            }`}
                          >
                            <SelectValue
                              placeholder={isArabic ? "حالة القلب" : "Cardio"}
                            />
                          </SelectTrigger>

                          <SelectContent
                            align={isArabic ? "end" : "start"}
                            className="overflow-hidden rounded-2xl border border-primary/20 bg-popover p-1 text-popover-foreground shadow-lg"
                          >
                            <SelectItem
                              value="all"
                              className={selectItemClassName}
                            >
                              {isArabic ? "كل القلب" : "All Cardio"}
                            </SelectItem>

                            <SelectItem
                              value="low"
                              className={selectItemClassName}
                            >
                              {isArabic ? "منخفض" : "Low"}
                            </SelectItem>

                            <SelectItem
                              value="medium"
                              className={selectItemClassName}
                            >
                              {isArabic ? "متوسط" : "Medium"}
                            </SelectItem>

                            <SelectItem
                              value="high"
                              className={selectItemClassName}
                            >
                              {isArabic ? "عالي" : "High"}
                            </SelectItem>

                            <SelectItem
                              value="very_high"
                              className={selectItemClassName}
                            >
                              {isArabic ? "عالي جدًا" : "Very High"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {(searchTerm ||
                    diabetesRiskFilter !== "all" ||
                    cardioRiskFilter !== "all") &&
                  filteredPredictions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center sm:p-10">
                      <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />

                      <h4 className="mb-2 text-lg font-semibold text-foreground">
                        {isArabic ? "لا توجد نتائج" : "No results found"}
                      </h4>

                      <p className="break-words text-muted-foreground">
                        {isArabic
                          ? "لا توجد تقارير مطابقة للبحث أو الفلاتر المختارة"
                          : "No reports match the current search or selected filters"}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="hidden w-full overflow-x-auto xl:block">
                        <div className="w-full min-w-[1120px] overflow-hidden rounded-[22px] border border-border bg-card">
                          <div className="grid grid-cols-[2.1fr_2.1fr_1fr_0.8fr] gap-4 bg-muted/30 px-5 py-4 text-sm font-semibold text-muted-foreground">
                            <span className="text-start">
                              {isArabic ? "نتائج التحاليل" : "Risk Results"}
                            </span>

                            <span className="text-start">
                              {t("dashboard.riskIndicators")}
                            </span>

                            <span className="whitespace-nowrap text-start">
                              {t("pastReportsPage.date")}
                            </span>

                            <span className="flex items-center justify-center whitespace-nowrap">
                              {actionsLabel}
                            </span>
                          </div>

                          {paginatedPredictions.map((pred) => {
                            const tone = getProbabilityTone();
                            const topIndicators = getTopRiskIndicators(pred);
                            const cardio = getCardioPrediction(
                              pred,
                              predictions
                            );
                            const reportValues =
                              getReportValuesForNavigation(pred);
                            const diabetesPercentage =
                              getDiabetesPercentage(pred);
                            const diabetesRiskLevel =
                              getRiskLevelFromPercentage(diabetesPercentage);
                            const normalizedGender =
                              getPredictionGender(pred);

                            return (
                              <div
                                key={pred.id}
                                className="grid grid-cols-[2.1fr_2.1fr_1fr_0.8fr] items-center gap-4 border-t border-border px-5 py-5 transition-all duration-300 ease-out hover:bg-muted/20"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.wrap}`}
                                    >
                                      <Activity
                                        className={`h-5 w-5 ${tone.icon}`}
                                      />
                                    </div>

                                    <div className="grid min-w-0 gap-1">
                                      <div className="flex min-w-0 items-center justify-between gap-2">
                                        <p className="min-w-0 truncate text-base font-semibold">
                                          <span className="text-primary">
                                            {isArabic
                                              ? "مخاطر السكري"
                                              : "Diabetes Risk"}
                                            :
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
                                          className={`${riskBadgeClassName} ${getRiskBadgeColor(
                                            diabetesRiskLevel
                                          )}`}
                                        >
                                          {getLocalizedRiskLabel(
                                            diabetesRiskLevel
                                          )}
                                        </Badge>
                                      </div>

                                      <div className="flex min-w-0 items-center justify-between gap-2">
                                        <p className="min-w-0 truncate text-base font-semibold">
                                          <span className="text-primary">
                                            {isArabic
                                              ? "مخاطر القلب"
                                              : "Cardio Risk"}
                                            :
                                          </span>{" "}
                                          <span className="font-normal text-muted-foreground">
                                            {getCardioDisplayPercentage(cardio)}
                                          </span>
                                        </p>

                                        {getCardioBadge(cardio)}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="min-w-0">
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="min-w-0 border-e border-border pe-3">
                                      <p className="mb-1.5 text-xs font-semibold text-primary">
                                        {isArabic ? "السكر" : "Diabetes"}
                                      </p>

                                      <div className="flex flex-col gap-1">
                                        {topIndicators.diabetes.map(
                                          (indicator) => (
                                            <div
                                              key={indicator.key}
                                              className="flex min-w-0 items-center gap-2"
                                            >
                                              <span className="truncate font-medium text-foreground">
                                                {indicator.label}:
                                              </span>

                                              <span className="whitespace-nowrap text-muted-foreground">
                                                {formatNumber(
                                                  Number(indicator.value)
                                                )}
                                              </span>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>

                                    <div className="min-w-0">
                                      <p className="mb-1.5 text-xs font-semibold text-primary">
                                        {isArabic
                                          ? "القلب و الأوعية الدموية"
                                          : "Cardiovascular"}
                                      </p>

                                      <div className="flex flex-col gap-1">
                                        {topIndicators.cardio.map(
                                          (indicator) => (
                                            <div
                                              key={indicator.key}
                                              className="flex min-w-0 items-center gap-2"
                                            >
                                              <span className="truncate font-medium text-foreground">
                                                {indicator.label}:
                                              </span>

                                              <span className="whitespace-nowrap text-muted-foreground">
                                                {formatNumber(
                                                  Number(indicator.value)
                                                )}
                                              </span>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-sm text-muted-foreground">
                                  <p className="whitespace-nowrap">
                                    {new Date(
                                      pred.created_at
                                    ).toLocaleDateString(
                                      isArabic ? "ar-SA" : "en-US"
                                    )}
                                  </p>

                                  <p className="mt-1 whitespace-nowrap text-xs text-muted-foreground">
                                    {new Date(
                                      pred.created_at
                                    ).toLocaleTimeString(
                                      isArabic ? "ar-EG" : "en-US",
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                      }
                                    )}
                                  </p>
                                </div>

                                <div className="flex items-center justify-center">
                                  <Link
                                    to="/report"
                                    state={buildReportState(
                                      pred,
                                      cardio,
                                      diabetesPercentage,
                                      reportValues,
                                      normalizedGender
                                    )}
                                  >
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="h-9 min-w-[108px] whitespace-nowrap rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary/90 hover:shadow-md"
                                    >
                                      {t("pastReportsPage.viewReport")}
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid gap-4 xl:hidden">
                        {paginatedPredictions.map((pred) => {
                          const topIndicators = getTopRiskIndicators(pred);
                          const cardio = getCardioPrediction(pred, predictions);
                          const reportValues =
                            getReportValuesForNavigation(pred);
                          const diabetesPercentage =
                            getDiabetesPercentage(pred);
                          const diabetesRiskLevel =
                            getRiskLevelFromPercentage(diabetesPercentage);
                          const normalizedGender = getPredictionGender(pred);

                          return (
                            <article
                              key={pred.id}
                              className="rounded-[22px] border border-border bg-card p-4 text-card-foreground shadow-sm transition-all duration-300 ease-out hover:border-primary/30 hover:shadow-md sm:p-5"
                            >
                              <div className="flex items-start gap-3 sm:gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                  <Activity className="h-5 w-5 text-primary" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="space-y-0.5">
                                    <div className="flex min-w-0 items-center justify-between gap-2">
                                      <p className="min-w-0 truncate text-base font-semibold leading-snug sm:text-lg">
                                        <span className="text-primary">
                                          {isArabic
                                            ? "مخاطر السكري"
                                            : "Diabetes Risk"}
                                          :
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
                                        className={`${riskBadgeClassName} ${getRiskBadgeColor(
                                          diabetesRiskLevel
                                        )}`}
                                      >
                                        {getLocalizedRiskLabel(
                                          diabetesRiskLevel
                                        )}
                                      </Badge>
                                    </div>

                                    <div className="flex min-w-0 items-center justify-between gap-2">
                                      <p className="min-w-0 truncate text-base font-semibold leading-snug sm:text-lg">
                                        <span className="text-primary">
                                          {isArabic
                                            ? "مخاطر القلب"
                                            : "Cardio Risk"}
                                          :
                                        </span>{" "}
                                        <span className="font-normal text-muted-foreground">
                                          {getCardioDisplayPercentage(cardio)}
                                        </span>
                                      </p>

                                      {getCardioBadge(cardio)}
                                    </div>
                                  </div>

                                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl bg-muted/30 p-3 sm:col-span-2">
                                      <p className="mb-3 text-xs text-muted-foreground">
                                        {t("dashboard.riskIndicators")}
                                      </p>

                                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="rounded-xl border border-border bg-background/50 p-3">
                                          <p className="mb-2 text-xs font-semibold text-primary">
                                            {isArabic ? "السكر" : "Diabetes"}
                                          </p>

                                          <div className="flex flex-col gap-1.5 text-sm">
                                            {topIndicators.diabetes.map(
                                              (indicator) => (
                                                <div
                                                  key={indicator.key}
                                                  className="flex items-center justify-between gap-3"
                                                >
                                                  <span className="truncate font-medium text-foreground">
                                                    {indicator.label}
                                                  </span>

                                                  <span className="whitespace-nowrap text-muted-foreground">
                                                    {formatNumber(
                                                      Number(indicator.value)
                                                    )}
                                                  </span>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </div>

                                        <div className="rounded-xl border border-border bg-background/50 p-3">
                                          <p className="mb-2 text-xs font-semibold text-primary">
                                            {isArabic
                                              ? "القلب و الأوعية الدموية"
                                              : "Cardiovascular"}
                                          </p>

                                          <div className="flex flex-col gap-1.5 text-sm">
                                            {topIndicators.cardio.map(
                                              (indicator) => (
                                                <div
                                                  key={indicator.key}
                                                  className="flex items-center justify-between gap-3"
                                                >
                                                  <span className="truncate font-medium text-foreground">
                                                    {indicator.label}
                                                  </span>

                                                  <span className="whitespace-nowrap text-muted-foreground">
                                                    {formatNumber(
                                                      Number(indicator.value)
                                                    )}
                                                  </span>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="rounded-2xl bg-muted/30 p-3 sm:col-span-2">
                                      <p className="mb-2 text-xs text-muted-foreground">
                                        {t("pastReportsPage.date")}
                                      </p>

                                      <p className="text-sm font-medium text-foreground">
                                        {new Date(
                                          pred.created_at
                                        ).toLocaleDateString(
                                          isArabic ? "ar-SA" : "en-US"
                                        )}
                                      </p>

                                      <p className="mt-1 text-xs text-muted-foreground">
                                        {new Date(
                                          pred.created_at
                                        ).toLocaleTimeString(
                                          isArabic ? "ar-EG" : "en-US",
                                          {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: true,
                                          }
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  <div
                                    className={`mt-4 flex ${
                                      isArabic ? "justify-start" : "justify-end"
                                    }`}
                                  >
                                    <Link
                                      to="/report"
                                      state={buildReportState(
                                        pred,
                                        cardio,
                                        diabetesPercentage,
                                        reportValues,
                                        normalizedGender
                                      )}
                                      className="inline-flex"
                                    >
                                      <Button
                                        type="button"
                                        size="sm"
                                        className="h-9 min-w-[118px] rounded-full bg-primary px-5 text-xs font-semibold text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary/90 hover:shadow-md sm:h-10 sm:min-w-[132px] sm:px-6 sm:text-sm"
                                      >
                                        {t("pastReportsPage.viewReport")}
                                      </Button>
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>

                      {totalPages > 1 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-5">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="rounded-xl"
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(prev - 1, 1))
                            }
                            disabled={currentPage === 1}
                            aria-label="Previous page"
                          >
                            {isArabic ? (
                              <ChevronRight className="h-4 w-4" />
                            ) : (
                              <ChevronLeft className="h-4 w-4" />
                            )}
                          </Button>

                          {Array.from({ length: totalPages }, (_, index) => {
                            const page = index + 1;
                            const isActive = currentPage === page;

                            return (
                              <Button
                                key={page}
                                type="button"
                                variant={isActive ? "default" : "outline"}
                                className="h-9 min-w-9 rounded-xl px-3"
                                onClick={() => setCurrentPage(page)}
                              >
                                {page.toLocaleString(
                                  isArabic ? "ar-EG" : "en-US"
                                )}
                              </Button>
                            );
                          })}

                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="rounded-xl"
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(prev + 1, totalPages)
                              )
                            }
                            disabled={currentPage === totalPages}
                            aria-label="Next page"
                          >
                            {isArabic ? (
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
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}