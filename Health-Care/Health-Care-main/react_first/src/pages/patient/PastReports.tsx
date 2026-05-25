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
}

const DESKTOP_HEADER_HEIGHT = 72;

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

  const REPORTS_PER_PAGE = 7;

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

  const formatNumber = (
    value: number,
    options?: Intl.NumberFormatOptions
  ) => {
    return value.toLocaleString(isArabic ? "ar-EG" : "en-US", options);
  };

  const normalizeText = (value: unknown) => {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u064B-\u065F]/g, "")
      .replace(/\s+/g, " ");
  };

  const normalizeRiskLevel = (riskLevel?: string) => {
    const risk = normalizeText(riskLevel);

    if (
      risk.includes("very high") ||
      risk.includes("high") ||
      risk.includes("مرتفع جدًا") ||
      risk.includes("مرتفع جدا") ||
      risk.includes("مرتفع") ||
      risk.includes("عالي")
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

  const getLocalizedRiskLabel = (riskLevel?: string) => {
    const normalized = normalizeRiskLevel(riskLevel);

    switch (normalized) {
      case "high":
        return isArabic ? "عالي" : "High";
      case "medium":
        return isArabic ? "متوسط" : "Medium";
      case "low":
        return isArabic ? "منخفض" : "Low";
      default:
        return isArabic ? "غير معروف" : "Unknown";
    }
  };

  const getRiskSearchText = (riskLevel?: string) => {
    const normalized = normalizeRiskLevel(riskLevel);

    switch (normalized) {
      case "high":
        return "high very high عالي مرتفع مرتفع جدا";
      case "medium":
        return "medium moderate متوسط";
      case "low":
        return "low منخفض قليل";
      default:
        return "";
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (normalizeRiskLevel(riskLevel)) {
      case "low":
        return "border-green-200 bg-green-100 text-green-700 hover:border-green-200 hover:bg-green-100 hover:text-green-700";
      case "medium":
        return "border-yellow-200 bg-yellow-100 text-yellow-700 hover:border-yellow-200 hover:bg-yellow-100 hover:text-yellow-700";
      case "high":
        return "border-red-200 bg-red-100 text-red-700 hover:border-red-200 hover:bg-red-100 hover:text-red-700";
      default:
        return "border-gray-200 bg-gray-100 text-gray-700 hover:border-gray-200 hover:bg-gray-100 hover:text-gray-700";
    }
  };

  const getProbabilityTone = () => {
    return {
      wrap: "bg-primary/10",
      icon: "text-primary",
    };
  };

  const getTopRiskIndicators = (prediction: Prediction) => {
    const indicators = [
      {
        key: "pregnancies",
        label: t("dashboard.pregnancies"),
        value: prediction.pregnancies,
      },
      {
        key: "glucose",
        label: t("dashboard.glucose"),
        value: prediction.glucose,
      },
      {
        key: "blood_pressure",
        label: t("dashboard.bloodPressure"),
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
        value: Number(prediction.bmi),
      },
      {
        key: "diabetes_pedigree_function",
        label: t("dashboard.diabetesPedigree"),
        value: Number(prediction.diabetes_pedigree_function),
      },
      {
        key: "age",
        label: t("dashboard.age"),
        value: prediction.age,
      },
    ];

    return indicators.sort((a, b) => b.value - a.value).slice(0, 3);
  };

  const sortedPredictions = useMemo(() => {
    return [...predictions].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [predictions]);

  const filteredPredictions = useMemo(() => {
    const query = normalizeText(searchTerm);

    if (!query) return sortedPredictions;

    return sortedPredictions.filter((pred) => {
      const probabilityText = normalizeText(
        [
          pred.probability,
          pred.probability.toFixed(1),
          pred.probability.toFixed(2),
          `${pred.probability}%`,
          `${pred.probability.toFixed(1)}%`,
          `${pred.probability.toFixed(2)}%`,
          pred.risk_level,
          getLocalizedRiskLabel(pred.risk_level),
          getRiskSearchText(pred.risk_level),
        ].join(" ")
      );

      return probabilityText.includes(query);
    });
  }, [sortedPredictions, searchTerm, isArabic]);

  const averageProbability = useMemo(() => {
    if (!sortedPredictions.length) return 0;

    return (
      sortedPredictions.reduce((sum, p) => sum + p.probability, 0) /
      sortedPredictions.length
    );
  }, [sortedPredictions]);

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
  }, [searchTerm]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const LoadingSkeleton = () => {
    return (
      <div className="w-full max-w-none space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <Card
              key={item}
              className="p-5 shadow-sm border-0 bg-background rounded-3xl"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-muted shrink-0" />
                <div className="flex-1">
                  <div className="h-3 w-24 bg-muted rounded mb-3" />
                  <div className="h-8 w-32 bg-muted rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="w-full max-w-none rounded-[26px] border bg-background p-4 sm:p-5 md:p-6 shadow-sm overflow-hidden">
          <div className="hidden xl:block w-full overflow-hidden rounded-[22px] border">
            <div className="grid grid-cols-[2fr_1.55fr_1.1fr_1.1fr] gap-4 bg-muted/30 px-5 py-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-4 w-28 bg-muted rounded" />
              ))}
            </div>

            {[1, 2, 3, 4, 5].map((row) => (
              <div
                key={row}
                className="grid grid-cols-[2fr_1.55fr_1.1fr_1.1fr] gap-4 items-center px-5 py-5 border-t"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted" />
                  <div>
                    <div className="h-5 w-28 bg-muted rounded mb-2" />
                    <div className="h-4 w-20 bg-muted rounded" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-4 w-28 bg-muted rounded" />
                  <div className="h-4 w-24 bg-muted rounded" />
                </div>

                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>

                <div className="mx-auto h-10 w-28 bg-muted rounded-xl" />
              </div>
            ))}
          </div>

          <div className="grid gap-4 xl:hidden">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="rounded-[22px] border p-4 sm:p-5 bg-background"
              >
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-xl bg-muted shrink-0" />

                  <div className="min-w-0 flex-1">
                    <div className="h-3 w-36 bg-muted rounded mb-2" />
                    <div className="h-6 w-28 bg-muted rounded mb-4" />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-muted/40 p-3">
                        <div className="h-3 w-28 bg-muted rounded mb-3" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-muted rounded" />
                          <div className="h-4 w-28 bg-muted rounded" />
                          <div className="h-4 w-24 bg-muted rounded" />
                        </div>
                      </div>

                      <div className="rounded-xl bg-muted/40 p-3">
                        <div className="h-3 w-16 bg-muted rounded mb-3" />
                        <div className="h-4 w-28 bg-muted rounded mb-2" />
                        <div className="h-3 w-20 bg-muted rounded" />
                      </div>
                    </div>

                    <div className="h-10 w-full bg-muted rounded-xl mt-4" />
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
        className="min-h-screen flex flex-col bg-background overflow-x-hidden"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <Header variant="dashboard" />

        <main
          className="flex-1 w-full max-w-none px-4 sm:px-5 lg:px-6 flex items-center justify-center overflow-x-hidden"
          style={{
            paddingTop: `${DESKTOP_HEADER_HEIGHT + 32}px`,
            paddingBottom: "32px",
          }}
        >
          <Alert className="w-full max-w-md bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
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
      className="min-h-screen flex flex-col bg-slate-50 overflow-x-hidden"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Header variant="dashboard" />

      <main
        className="flex-1 w-full max-w-none overflow-x-hidden"
        style={{ paddingTop: `${DESKTOP_HEADER_HEIGHT}px` }}
      >
        <section className="w-full border-b bg-background overflow-x-hidden">
          <div className="w-full max-w-none px-4 sm:px-5 lg:px-6 py-8 md:py-10">
            <div
              ref={heroRef}
              className={`transform-gpu transition-all duration-700 ease-out ${
                heroVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <div className={isArabic ? "text-right" : "text-left"}>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                  {t("pastReportsPage.title")}
                </h1>
                <p className="text-muted-foreground max-w-2xl">
                  {t("pastReportsPage.subtitle")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="w-full max-w-none px-4 sm:px-5 lg:px-6 py-8 overflow-x-hidden">
          <div
            ref={contentRef}
            className={`w-full max-w-none transform-gpu transition-all duration-700 ease-out ${
              contentVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            {isLoading && <LoadingSkeleton />}

            {error && !isLoading && (
              <Alert className="bg-red-50 border-red-200 mb-6">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {!isLoading && !error && sortedPredictions.length === 0 && (
              <Card className="p-8 sm:p-12 text-center border-dashed shadow-sm rounded-[26px]">
                <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">
                  {t("pastReportsPage.emptyTitle")}
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {t("pastReportsPage.emptySubtitle")}
                </p>
              </Card>
            )}

            {!isLoading && !error && sortedPredictions.length > 0 && (
              <div className="w-full max-w-none space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-5 shadow-sm border-0 bg-background rounded-3xl">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {t("pastReportsPage.totalReports")}
                        </p>
                        <p className="text-3xl font-bold text-foreground">
                          {formatNumber(sortedPredictions.length)}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-5 shadow-sm border-0 bg-background rounded-3xl">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <CalendarDays className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {t("pastReportsPage.latestTest")}
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {latestDate}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-5 shadow-sm border-0 bg-background rounded-3xl">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {t("pastReportsPage.average")}
                        </p>
                        <p className="text-3xl font-bold text-foreground">
                          {formatNumber(averageProbability, {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })}
                          %
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="w-full max-w-none rounded-[26px] border bg-background p-4 sm:p-5 md:p-6 shadow-sm overflow-hidden">
                  <div className="mb-6 flex justify-center">
                    <div className="relative w-full max-w-4xl">
                      <Search
                        className={`absolute top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted-foreground ${
                          isArabic ? "right-5" : "left-5"
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
                            ? "ابحث بالنسبة أو منخفض / متوسط / عالي..."
                            : "Search by probability or low / medium / high..."
                        }
                        className={`h-14 w-full rounded-full border bg-background text-base shadow-sm ${
                          isArabic
                            ? "pr-14 pl-5 text-right"
                            : "pl-14 pr-5 text-left"
                        }`}
                      />
                    </div>
                  </div>

                  {searchTerm && filteredPredictions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-8 sm:p-10 text-center bg-muted/20">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h4 className="text-lg font-semibold mb-2">
                        {isArabic ? "لا توجد نتائج" : "No results found"}
                      </h4>
                      <p className="text-muted-foreground break-words">
                        {searchTerm}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="hidden xl:block w-full overflow-x-auto">
                        <div className="min-w-[980px] w-full overflow-hidden rounded-[22px] border">
                          <div className="grid grid-cols-[2fr_1.55fr_1.1fr_1.1fr] gap-4 bg-muted/30 px-5 py-4 text-sm font-semibold text-muted-foreground">
                            <span className="text-start">
                              {t("pastReportsPage.infectionProbability")}
                            </span>

                            <span className="text-start">
                              {t("dashboard.riskIndicators")}
                            </span>

                            <span className="text-start whitespace-nowrap">
                              {t("pastReportsPage.date")}
                            </span>

                            <span className="flex items-center justify-center whitespace-nowrap">
                              {actionsLabel}
                            </span>
                          </div>

                          {paginatedPredictions.map((pred) => {
                            const tone = getProbabilityTone();
                            const topIndicators = getTopRiskIndicators(pred);

                            return (
                              <div
                                key={pred.id}
                                className="grid grid-cols-[2fr_1.55fr_1.1fr_1.1fr] gap-4 items-center px-5 py-5 border-t hover:bg-muted/10 transition-all duration-300 ease-out"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${tone.wrap}`}
                                    >
                                      <Activity
                                        className={`h-5 w-5 ${tone.icon}`}
                                      />
                                    </div>

                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-semibold truncate text-lg">
                                          {formatNumber(pred.probability, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          })}
                                          %
                                        </p>

                                        <Badge
                                          className={`border text-xs transition-none ${getRiskBadgeColor(
                                            pred.risk_level
                                          )}`}
                                        >
                                          {getLocalizedRiskLabel(
                                            pred.risk_level
                                          )}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="min-w-0">
                                  <div className="flex flex-col gap-1 text-sm">
                                    {topIndicators.map((indicator) => (
                                      <div
                                        key={indicator.key}
                                        className="flex items-center gap-2 min-w-0"
                                      >
                                        <span className="font-medium text-foreground whitespace-nowrap">
                                          {indicator.label}:
                                        </span>
                                        <span className="text-muted-foreground whitespace-nowrap">
                                          {formatNumber(indicator.value)}
                                        </span>
                                      </div>
                                    ))}
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

                                  <p className="mt-1 text-xs text-muted-foreground whitespace-nowrap">
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

                                <div className="flex items-center justify-center gap-2">
                                  <Link
                                    to="/report"
                                    state={{
                                      formData: {
                                        pregnancies: pred.pregnancies,
                                        glucose: pred.glucose,
                                        bloodPressure: pred.blood_pressure,
                                        skinThickness: pred.skin_thickness,
                                        insulin: pred.insulin,
                                        bmi: pred.bmi,
                                        diabetesPedigreeFunction:
                                          pred.diabetes_pedigree_function,
                                        age: pred.age,
                                      },
                                      probability: pred.probability,
                                      riskLevel: getLocalizedRiskLabel(
                                        pred.risk_level
                                      ),
                                      message: pred.message,
                                      predictionId: pred.id,
                                    }}
                                  >
                                    <Button
                                      variant="ghost"
                                      className="rounded-xl whitespace-nowrap h-10"
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

                          return (
                            <article
                              key={pred.id}
                              className="rounded-[22px] border bg-background p-4 sm:p-5 shadow-sm transition-all duration-300 ease-out hover:border-primary/30 hover:shadow-md"
                            >
                              <div className="flex items-start gap-3 sm:gap-4">
                                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                  <Activity className="h-5 w-5 text-primary" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground mb-1">
                                      {t(
                                        "pastReportsPage.infectionProbability"
                                      )}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-xl font-bold leading-snug text-foreground">
                                        {formatNumber(pred.probability, {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}
                                        %
                                      </p>

                                      <Badge
                                        className={`border text-xs transition-none ${getRiskBadgeColor(
                                          pred.risk_level
                                        )}`}
                                      >
                                        {getLocalizedRiskLabel(
                                          pred.risk_level
                                        )}
                                      </Badge>
                                    </div>
                                  </div>

                                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl bg-muted/30 p-3">
                                      <p className="text-xs text-muted-foreground mb-2">
                                        {t("dashboard.riskIndicators")}
                                      </p>

                                      <div className="flex flex-col gap-1.5 text-sm">
                                        {topIndicators.map((indicator) => (
                                          <div
                                            key={indicator.key}
                                            className="flex items-center justify-between gap-3"
                                          >
                                            <span className="font-medium text-foreground truncate">
                                              {indicator.label}
                                            </span>
                                            <span className="text-muted-foreground whitespace-nowrap">
                                              {formatNumber(indicator.value)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="rounded-2xl bg-muted/30 p-3">
                                      <p className="text-xs text-muted-foreground mb-2">
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

                                  <div className="mt-4">
                                    <Link
                                      to="/report"
                                      state={{
                                        formData: {
                                          pregnancies: pred.pregnancies,
                                          glucose: pred.glucose,
                                          bloodPressure: pred.blood_pressure,
                                          skinThickness: pred.skin_thickness,
                                          insulin: pred.insulin,
                                          bmi: pred.bmi,
                                          diabetesPedigreeFunction:
                                            pred.diabetes_pedigree_function,
                                          age: pred.age,
                                        },
                                        probability: pred.probability,
                                        riskLevel: getLocalizedRiskLabel(
                                          pred.risk_level
                                        ),
                                        message: pred.message,
                                        predictionId: pred.id,
                                      }}
                                    >
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        className="rounded-xl w-full h-10 bg-primary/5 hover:bg-primary/10 hover:text-primary"
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