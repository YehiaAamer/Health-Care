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
  TrendingUp,
  BarChart3,
  Bell,
  Globe,
} from "lucide-react";
import Header from "@/components/shared/Header";
import PatientSidebar from "@/components/patient/PatientSidebar";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiCall, API_ENDPOINTS } from "@/lib/api";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

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

        const data = await apiCall<{
          count: number;
          predictions: Prediction[];
        }>(API_ENDPOINTS.GET_PREDICTIONS, {
          method: "GET",
        });

        setPredictions(
          (data.predictions || []).sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
        );
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

  const normalizeRiskLevel = (riskLevel?: string) => {
    const risk = (riskLevel || "").trim().toLowerCase();

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
        return "--";
    }
  };

  const getRiskTextClass = (riskLevel?: string) => {
    const normalized = normalizeRiskLevel(riskLevel);

    if (normalized === "high") return "text-red-500";
    if (normalized === "medium") return "text-yellow-500";
    if (normalized === "low") return "text-green-500";
    return "text-muted-foreground";
  };

  const getRiskBadgeColor = (riskLevel?: string) => {
    switch (normalizeRiskLevel(riskLevel)) {
      case "low":
        return "border-green-200 bg-green-100 text-green-700 hover:border-green-200 hover:bg-green-100 hover:text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300 dark:hover:bg-green-500/10 dark:hover:text-green-300";
      case "medium":
        return "border-yellow-200 bg-yellow-100 text-yellow-700 hover:border-yellow-200 hover:bg-yellow-100 hover:text-yellow-700 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-300 dark:hover:bg-yellow-500/10 dark:hover:text-yellow-300";
      case "high":
        return "border-red-200 bg-red-100 text-red-700 hover:border-red-200 hover:bg-red-100 hover:text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/10 dark:hover:text-red-300";
      default:
        return "border-border bg-muted text-muted-foreground hover:border-border hover:bg-muted hover:text-muted-foreground";
    }
  };

  const formatNumber = (
    value: number,
    options?: Intl.NumberFormatOptions
  ) => {
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

  const latestPrediction = predictions[0];

  const latestRiskTextColor = useMemo(() => {
    if (!latestPrediction) return "text-foreground";
    return getRiskTextClass(latestPrediction.risk_level);
  }, [latestPrediction]);

  const averageRisk = useMemo(() => {
    if (!predictions.length) return 0;
    const total = predictions.reduce((sum, pred) => sum + pred.probability, 0);
    return total / predictions.length;
  }, [predictions]);

  const rangePredictions = useMemo(() => {
    if (!selectedRange) return [];

    const now = new Date();
    const days = selectedRange === "weekly" ? 7 : 30;

    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(now.getDate() - days);

    return [...predictions]
      .filter(
        (pred) => new Date(pred.created_at).getTime() >= startDate.getTime()
      )
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );
  }, [predictions, selectedRange]);

  const searchedPredictions = useMemo(() => {
    const query = normalizeSearchText(searchTerm);

    const sortedPredictions = [...predictions].sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    );

    if (!query) return sortedPredictions.slice(0, 3);

    return sortedPredictions
      .filter((pred) => {
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
            pred.bmi,
            pred.diabetes_pedigree_function,
            pred.age,
            pred.probability,
            pred.probability?.toFixed?.(2),
            pred.risk_level,
            getLocalizedRiskLabel(pred.risk_level),
            pred.message,
            localizedDate,
          ].join(" ")
        );

        return searchableContent.includes(query);
      })
      .slice(0, 3);
  }, [predictions, searchTerm, isArabic, t]);

  const rangeAverageRisk = useMemo(() => {
    if (!rangePredictions.length) return 0;

    const total = rangePredictions.reduce(
      (sum, pred) => sum + pred.probability,
      0
    );

    return total / rangePredictions.length;
  }, [rangePredictions]);

  const highestRangeRisk = useMemo(() => {
    if (!rangePredictions.length) return null;
    return [...rangePredictions].sort((a, b) => b.probability - a.probability)[0];
  }, [rangePredictions]);

  const trendChartData = useMemo(() => {
    if (!rangePredictions.length) return [];

    return rangePredictions.map((item, index) => ({
      index: index + 1,
      dateLabel: new Date(item.created_at).toLocaleDateString(
        isArabic ? "ar-SA" : "en-US",
        selectedRange === "weekly"
          ? { month: "numeric", day: "numeric" }
          : { month: "short", day: "numeric" }
      ),
      probability: Number(item.probability.toFixed(2)),
      fullDate: new Date(item.created_at).toLocaleString(
        isArabic ? "ar-SA" : "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      ),
      riskLevel: getLocalizedRiskLabel(item.risk_level),
    }));
  }, [rangePredictions, isArabic, selectedRange, t]);

  const vitalsChartData = useMemo(() => {
    if (!latestPrediction) return [];

    return [
      {
        label: t("dashboard.chartShortPregnancies"),
        fullLabel: t("dashboard.pregnancies"),
        value: latestPrediction.pregnancies,
      },
      {
        label: t("dashboard.chartShortGlucose"),
        fullLabel: t("dashboard.glucose"),
        value: latestPrediction.glucose,
      },
      {
        label: t("dashboard.chartShortBloodPressure"),
        fullLabel: t("dashboard.bloodPressure"),
        value: latestPrediction.blood_pressure,
      },
      {
        label: t("dashboard.chartShortSkinThickness"),
        fullLabel: t("dashboard.skinThickness"),
        value: latestPrediction.skin_thickness,
      },
      {
        label: t("dashboard.chartShortInsulin"),
        fullLabel: t("dashboard.insulin"),
        value: latestPrediction.insulin,
      },
      {
        label: t("dashboard.chartShortBmi"),
        fullLabel: t("dashboard.bmi"),
        value: Number(latestPrediction.bmi),
      },
      {
        label: t("dashboard.chartShortDiabetesPedigree"),
        fullLabel: t("dashboard.diabetesPedigree"),
        value: Number(latestPrediction.diabetes_pedigree_function),
      },
      {
        label: t("dashboard.chartShortAge"),
        fullLabel: t("dashboard.age"),
        value: latestPrediction.age,
      },
    ];
  }, [latestPrediction, t]);

  const chartStrokeColor = useMemo(() => {
    if (!latestPrediction) return "#10b981";

    const normalized = normalizeRiskLevel(latestPrediction.risk_level);

    if (normalized === "high") return "#ef4444";
    if (normalized === "medium") return "#eab308";
    return "#10b981";
  }, [latestPrediction]);

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

  return (
    <div
      className="flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Header variant="dashboard" />

      <main
        className="w-full max-w-none flex-1 overflow-x-hidden px-3 pb-4 pt-16 sm:px-4 lg:px-5 xl:pt-0"
        style={{ paddingTop: undefined }}
      >
        <div className="relative w-full max-w-none">
          <PatientSidebar
            user={user}
            isArabic={isArabic}
            predictionsLength={predictions.length}
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
                      aria-label="Toggle language"
                    >
                      <Globe className="h-5 w-5" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full text-primary hover:bg-primary/10 hover:text-primary"
                      aria-label="Notifications"
                    >
                      <Bell className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:max-w-[650px] lg:grid-cols-[auto_auto_minmax(0,1fr)_auto]">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleLanguage}
                    className="hidden h-10 w-10 rounded-full text-primary hover:bg-primary/10 hover:text-primary lg:inline-flex"
                    aria-label="Toggle language"
                  >
                    <Globe className="h-5 w-5" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="hidden h-10 w-10 rounded-full text-primary hover:bg-primary/10 hover:text-primary lg:inline-flex"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                  </Button>

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
              <Card className="group rounded-[18px] border border-border bg-card p-4 text-card-foreground shadow-sm transition-colors duration-200 hover:border-primary/25 hover:bg-primary/5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <p className="mb-1.5 text-sm text-muted-foreground">
                  {t("dashboard.averageRisk")}
                </p>
                <h3 className="text-2xl font-bold text-foreground">
                  {predictions.length
                    ? `${formatNumber(averageRisk, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}%`
                    : "--"}
                </h3>
              </Card>

              <Card className="group rounded-[18px] border border-border bg-card p-4 text-card-foreground shadow-sm transition-colors duration-200 hover:border-primary/25 hover:bg-primary/5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <p className="mb-1.5 text-sm text-muted-foreground">
                  {t("dashboard.latestStatus")}
                </p>
                <h3 className={`text-2xl font-bold ${latestRiskTextColor}`}>
                  {latestPrediction
                    ? getLocalizedRiskLabel(latestPrediction.risk_level)
                    : "--"}
                </h3>
              </Card>

              <Card className="group rounded-[18px] border border-border bg-card p-4 text-card-foreground shadow-sm transition-colors duration-200 hover:border-primary/25 hover:bg-primary/5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <p className="mb-1.5 text-sm text-muted-foreground">
                  {t("dashboard.savedReports")}
                </p>
                <h3 className="text-2xl font-bold text-foreground">
                  {formatNumber(predictions.length)}
                </h3>
              </Card>

              <Card className="group rounded-[18px] border border-border bg-card p-4 text-card-foreground shadow-sm transition-colors duration-200 hover:border-primary/25 hover:bg-primary/5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Clock3 className="h-5 w-5 text-primary" />
                </div>
                <p className="mb-1.5 text-sm text-muted-foreground">
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
                    {predictions.length > 3 && !selectedRange && (
                      <Link to="/past-reports">
                        <Button variant="outline" size="sm">
                          {t("dashboard.allReports")}
                        </Button>
                      </Link>
                    )}

                    <Button
                      variant={
                        selectedRange === "weekly" ? "default" : "outline"
                      }
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
                      variant={
                        selectedRange === "monthly" ? "default" : "outline"
                      }
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

                {selectedRange && (
                  <div className="mb-4 rounded-[20px] border border-border bg-gradient-to-b from-primary/5 via-background to-background p-3 md:p-4">
                    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1.25fr_.75fr]">
                      <div className="rounded-[20px] border border-border bg-card p-3 text-card-foreground md:p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                            <TrendingUp className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {selectedRange === "weekly"
                                ? t("dashboard.weekly")
                                : t("dashboard.monthly")}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {selectedRange === "weekly"
                                ? t("dashboard.last7Days")
                                : t("dashboard.last30Days")}
                            </p>
                          </div>
                        </div>

                        {trendChartData.length > 0 ? (
                          <div className="h-[210px] w-full sm:h-[240px] md:h-[270px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={trendChartData}
                                margin={{
                                  top: 14,
                                  right: 18,
                                  left: 6,
                                  bottom: 4,
                                }}
                              >
                                <defs>
                                  <linearGradient
                                    id="riskShadow"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="5%"
                                      stopColor="hsl(var(--primary))"
                                      stopOpacity={0.35}
                                    />
                                    <stop
                                      offset="95%"
                                      stopColor="hsl(var(--primary))"
                                      stopOpacity={0.03}
                                    />
                                  </linearGradient>
                                </defs>

                                <CartesianGrid
                                  strokeDasharray="4 4"
                                  vertical={false}
                                  stroke="hsl(var(--border))"
                                />

                                <XAxis
                                  dataKey="dateLabel"
                                  tickLine={false}
                                  axisLine={false}
                                  interval="preserveStartEnd"
                                  minTickGap={8}
                                  tickMargin={8}
                                  tick={{
                                    fontSize: 10,
                                    fill: "hsl(var(--muted-foreground))",
                                  }}
                                />

                                <YAxis
                                  tickLine={false}
                                  axisLine={false}
                                  domain={[0, 100]}
                                  width={42}
                                  tickMargin={8}
                                  tick={{
                                    fontSize: 11,
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
                                      "0 10px 30px rgba(0,0,0,0.18)",
                                  }}
                                  labelStyle={{
                                    color: "hsl(var(--foreground))",
                                  }}
                                  itemStyle={{
                                    color: "hsl(var(--foreground))",
                                  }}
                                  formatter={(value: number) => [
                                    `${value}%`,
                                    t("dashboard.riskTooltip"),
                                  ]}
                                  labelFormatter={(_, payload) =>
                                    payload?.[0]?.payload?.fullDate || ""
                                  }
                                />

                                <Area
                                  type="monotone"
                                  dataKey="probability"
                                  stroke="hsl(var(--primary))"
                                  fill="url(#riskShadow)"
                                  strokeWidth={3}
                                  isAnimationActive={true}
                                  animationBegin={120}
                                  animationDuration={650}
                                  animationEasing="ease-out"
                                  dot={{
                                    r: 3,
                                    strokeWidth: 2,
                                    fill: "hsl(var(--background))",
                                    stroke: "hsl(var(--primary))",
                                  }}
                                  activeDot={{
                                    r: 5,
                                    strokeWidth: 2,
                                    fill: "hsl(var(--background))",
                                    stroke: "hsl(var(--primary))",
                                  }}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="flex h-[210px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 text-center sm:h-[240px] md:h-[270px]">
                            <div>
                              <BarChart3 className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
                              <p className="mb-1 font-medium text-foreground">
                                {selectedRange === "weekly"
                                  ? t("dashboard.noWeeklyReportsTitle")
                                  : t("dashboard.noMonthlyReportsTitle")}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {selectedRange === "weekly"
                                  ? t("dashboard.noWeeklyReportsDesc")
                                  : t("dashboard.noMonthlyReportsDesc")}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
                        <Card className="rounded-[18px] border border-border bg-card p-3 text-card-foreground shadow-none">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                              <Activity className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {selectedRange === "weekly"
                                  ? t("dashboard.weeklyAverage")
                                  : t("dashboard.monthlyAverage")}
                              </p>
                              <h4 className="text-xl font-bold text-foreground">
                                {rangePredictions.length
                                  ? `${formatNumber(rangeAverageRisk, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}%`
                                  : "--"}
                              </h4>
                            </div>
                          </div>
                        </Card>

                        <Card className="rounded-[18px] border border-border bg-card p-3 text-card-foreground shadow-none">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {selectedRange === "weekly"
                                  ? t("dashboard.reportsThisWeek")
                                  : t("dashboard.reportsThisMonth")}
                              </p>
                              <h4 className="text-xl font-bold text-foreground">
                                {formatNumber(rangePredictions.length)}
                              </h4>
                            </div>
                          </div>
                        </Card>

                        <Card className="rounded-[18px] border border-border bg-card p-3 text-card-foreground shadow-none">
                          <div className="mb-2 flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                              <ShieldCheck className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {selectedRange === "weekly"
                                  ? t("dashboard.highestWeeklyRisk")
                                  : t("dashboard.highestMonthlyRisk")}
                              </p>
                              <h4 className="text-xl font-bold text-foreground">
                                {highestRangeRisk
                                  ? `${formatNumber(
                                      highestRangeRisk.probability,
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )}%`
                                  : "--"}
                              </h4>
                            </div>
                          </div>

                          {highestRangeRisk && (
                            <Badge
                              className={`border text-xs transition-none ${getRiskBadgeColor(
                                highestRangeRisk.risk_level
                              )}`}
                            >
                              {getLocalizedRiskLabel(
                                highestRangeRisk.risk_level
                              )}
                            </Badge>
                          )}
                        </Card>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-4 rounded-[20px] border border-border bg-gradient-to-b from-primary/5 via-background to-background p-3 md:p-4">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="mb-1.5 text-sm text-muted-foreground">
                          {t("dashboard.latestAnalysisScore")}
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                            {latestPrediction
                              ? `${formatNumber(latestPrediction.probability, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}%`
                              : "--"}
                          </h2>

                          {latestPrediction && (
                            <Badge
                              className={`border text-xs transition-none ${getRiskBadgeColor(
                                latestPrediction.risk_level
                              )}`}
                            >
                              {getLocalizedRiskLabel(
                                latestPrediction.risk_level
                              )}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className={isArabic ? "md:text-left" : "md:text-right"}>
                        <p className="mb-1.5 text-sm text-muted-foreground">
                          {t("dashboard.recentAnalyses")}
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {searchTerm
                            ? formatNumber(displayedPredictions.length)
                            : selectedRange
                            ? formatNumber(rangePredictions.length)
                            : latestPrediction
                            ? "1"
                            : "0"}
                        </p>
                      </div>
                    </div>

                    {vitalsChartData.length > 0 ? (
                      <div className="rounded-[20px] border border-border bg-card p-3 text-card-foreground sm:p-4 md:p-5">
                        <div className="h-[210px] w-full sm:h-[240px] md:h-[280px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={vitalsChartData}
                              margin={{
                                top: 14,
                                right: 18,
                                left: 6,
                                bottom: 4,
                              }}
                            >
                              <defs>
                                <linearGradient
                                  id="vitalsShadow"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor={chartStrokeColor}
                                    stopOpacity={0.35}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor={chartStrokeColor}
                                    stopOpacity={0.03}
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
                                minTickGap={0}
                                height={34}
                                tickMargin={8}
                                tick={{
                                  fontSize: 9,
                                  fill: "hsl(var(--muted-foreground))",
                                }}
                              />

                              <YAxis
                                tickLine={false}
                                axisLine={false}
                                width={42}
                                tickMargin={8}
                                tick={{
                                  fontSize: 11,
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
                                  boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
                                }}
                                labelStyle={{
                                  color: "hsl(var(--foreground))",
                                }}
                                itemStyle={{
                                  color: "hsl(var(--foreground))",
                                }}
                                formatter={(value: number) => [
                                  value,
                                  t("dashboard.valueLabel"),
                                ]}
                                labelFormatter={(_, payload) =>
                                  payload?.[0]?.payload?.fullLabel || ""
                                }
                              />

                              <Area
                                type="monotone"
                                dataKey="value"
                                stroke={chartStrokeColor}
                                fill="url(#vitalsShadow)"
                                strokeWidth={3}
                                isAnimationActive={true}
                                animationBegin={120}
                                animationDuration={650}
                                animationEasing="ease-out"
                                dot={{
                                  r: 3,
                                  strokeWidth: 2,
                                  fill: "hsl(var(--background))",
                                  stroke: chartStrokeColor,
                                }}
                                activeDot={{
                                  r: 5,
                                  strokeWidth: 2,
                                  fill: "hsl(var(--background))",
                                  stroke: chartStrokeColor,
                                }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
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
                ) : predictions.length === 0 ? (
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
                ) : (
                  <>
                    <div className="hidden w-full overflow-hidden lg:block">
                      <div className="w-full overflow-hidden rounded-[20px] border border-border bg-card">
                        <div className="grid grid-cols-[minmax(220px,2fr)_minmax(180px,1.45fr)_minmax(110px,1.05fr)_minmax(120px,1.1fr)] gap-4 border-b border-border bg-muted/30 px-5 py-4 text-sm font-semibold text-muted-foreground">
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
                          const topIndicators = getTopRiskIndicators(pred);

                          return (
                            <div
                              key={pred.id}
                              className="grid grid-cols-[minmax(220px,2fr)_minmax(180px,1.45fr)_minmax(110px,1.05fr)_minmax(120px,1.1fr)] items-center gap-4 border-t border-border px-5 py-4 hover:bg-muted/20"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                    <Activity className="h-5 w-5 text-primary" />
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="truncate font-semibold text-foreground">
                                        {t("dashboard.infectionProbability")}:{" "}
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
                                        {getLocalizedRiskLabel(pred.risk_level)}
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
                                      className="flex min-w-0 items-center gap-2"
                                    >
                                      <span className="whitespace-nowrap font-medium text-foreground">
                                        {indicator.label}:
                                      </span>
                                      <span className="whitespace-nowrap text-muted-foreground">
                                        {formatNumber(indicator.value)}
                                      </span>
                                    </div>
                                  ))}
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
                                    className="h-10 whitespace-nowrap hover:bg-primary/10 hover:text-primary"
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
                        const topIndicators = getTopRiskIndicators(pred);

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
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold leading-snug text-foreground">
                                    {t("dashboard.infectionProbability")}:{" "}
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
                                    {getLocalizedRiskLabel(pred.risk_level)}
                                  </Badge>
                                </div>

                                <div className="mt-3 rounded-xl bg-muted/30 p-3">
                                  <p className="mb-2 text-xs text-muted-foreground">
                                    {t("dashboard.riskIndicators")}
                                  </p>

                                  <div className="flex flex-col gap-1 text-sm">
                                    {topIndicators.map((indicator) => (
                                      <div
                                        key={indicator.key}
                                        className="flex min-w-0 items-center gap-2"
                                      >
                                        <span className="whitespace-nowrap font-medium text-foreground">
                                          {indicator.label}:
                                        </span>
                                        <span className="whitespace-nowrap text-muted-foreground">
                                          {formatNumber(indicator.value)}
                                        </span>
                                      </div>
                                    ))}
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

                                <div className="mt-3">
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
                                      className="h-10 w-full hover:bg-primary/10 hover:text-primary"
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