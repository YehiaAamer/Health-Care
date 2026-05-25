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
    if (normalized === "medium") return "text-yellow-600";
    if (normalized === "low") return "text-green-600";
    return "text-muted-foreground";
  };

  const getRiskBadgeColor = (riskLevel?: string) => {
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
      className="min-h-screen flex flex-col bg-background overflow-x-hidden"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Header variant="dashboard" />

   <main
  className="flex-1 w-full max-w-none overflow-x-hidden px-3 sm:px-4 lg:px-5 pb-4 pt-16 xl:pt-0"
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
            <div className={`flex flex-col gap-3 pt-1 xl:pt-5 ${smoothSectionClass}`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div className={isArabic ? "text-right" : "text-left"}>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      {t("dashboard.welcome")}{" "}
                      {user ? `${user.first_name || user.email}!` : ""}
                    </h1>

                    <p className="mt-1 max-w-full text-lg font-medium leading-snug text-slate-500 sm:max-w-none">
                      {t("dashboard.analysisOverview")}
                    </p>

                    <div className="mt-2 text-xs font-semibold text-slate-500">
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
                      className={`h-4 w-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 ${
                        isArabic ? "right-3" : "left-3"
                      }`}
                    />

                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t("dashboard.search")}
                      className={`rounded-full h-10 w-full ${
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
                    <Button className="gap-2 h-10 w-full sm:w-auto whitespace-nowrap">
                      <Plus className="h-5 w-5" />
                      {t("dashboard.newTest")}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <section
              className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 ${smoothSectionClass}`}
            >
              <Card className="group rounded-[18px] border bg-card p-4 shadow-sm transition-colors duration-200 hover:bg-primary/5 hover:border-primary/25">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-1.5">
                  {t("dashboard.averageRisk")}
                </p>
                <h3 className="text-2xl font-bold">
                  {predictions.length
                    ? `${formatNumber(averageRisk, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}%`
                    : "--"}
                </h3>
              </Card>

              <Card className="group rounded-[18px] border bg-card p-4 shadow-sm transition-colors duration-200 hover:bg-primary/5 hover:border-primary/25">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-1.5">
                  {t("dashboard.latestStatus")}
                </p>
                <h3 className={`text-2xl font-bold ${latestRiskTextColor}`}>
                  {latestPrediction
                    ? getLocalizedRiskLabel(latestPrediction.risk_level)
                    : "--"}
                </h3>
              </Card>

              <Card className="group rounded-[18px] border bg-card p-4 shadow-sm transition-colors duration-200 hover:bg-primary/5 hover:border-primary/25">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-1.5">
                  {t("dashboard.savedReports")}
                </p>
                <h3 className="text-2xl font-bold">
                  {formatNumber(predictions.length)}
                </h3>
              </Card>

              <Card className="group rounded-[18px] border bg-card p-4 shadow-sm transition-colors duration-200 hover:bg-primary/5 hover:border-primary/25">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <Clock3 className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-1.5">
                  {t("dashboard.lastCheckup")}
                </p>
                <h3 className="text-xl font-bold">
                  {latestPrediction
                    ? formatDate(latestPrediction.created_at)
                    : "--"}
                </h3>
              </Card>
            </section>

            <section
              className={`grid grid-cols-1 gap-4 items-start ${smoothSectionClass}`}
            >
              <Card className="rounded-[22px] border bg-card p-4 md:p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                  <div className={isArabic ? "text-right" : "text-left"}>
                    <h3 className="text-xl md:text-2xl font-bold">
                      {t("dashboard.recentAnalyses")}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {predictions.length > 3 && !selectedRange && (
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

                {selectedRange && (
                  <div className="rounded-[20px] border bg-gradient-to-b from-primary/5 via-background to-background p-3 md:p-4 mb-4">
                    <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_.75fr] gap-4 items-start">
                      <div className="rounded-[20px] border bg-card p-3 md:p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">
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
                          <div className="h-[210px] sm:h-[240px] md:h-[270px] w-full">
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
                                    boxShadow:
                                      "0 10px 30px rgba(0,0,0,0.08)",
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
                          <div className="h-[210px] sm:h-[240px] md:h-[270px] rounded-2xl border border-dashed bg-muted/20 flex items-center justify-center text-center px-6">
                            <div>
                              <BarChart3 className="h-9 w-9 text-muted-foreground mx-auto mb-3" />
                              <p className="font-medium mb-1">
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

                      <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-3">
                        <Card className="rounded-[18px] border bg-card p-3 shadow-none">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Activity className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {selectedRange === "weekly"
                                  ? t("dashboard.weeklyAverage")
                                  : t("dashboard.monthlyAverage")}
                              </p>
                              <h4 className="text-xl font-bold">
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

                        <Card className="rounded-[18px] border bg-card p-3 shadow-none">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {selectedRange === "weekly"
                                  ? t("dashboard.reportsThisWeek")
                                  : t("dashboard.reportsThisMonth")}
                              </p>
                              <h4 className="text-xl font-bold">
                                {formatNumber(rangePredictions.length)}
                              </h4>
                            </div>
                          </div>
                        </Card>

                        <Card className="rounded-[18px] border bg-card p-3 shadow-none">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                              <ShieldCheck className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {selectedRange === "weekly"
                                  ? t("dashboard.highestWeeklyRisk")
                                  : t("dashboard.highestMonthlyRisk")}
                              </p>
                              <h4 className="text-xl font-bold">
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
                              {getLocalizedRiskLabel(highestRangeRisk.risk_level)}
                            </Badge>
                          )}
                        </Card>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-[20px] border bg-gradient-to-b from-primary/5 via-background to-background p-3 md:p-4 mb-4">
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1.5">
                          {t("dashboard.latestAnalysisScore")}
                        </p>

                        <div className="flex items-center gap-3 flex-wrap">
                          <h2 className="text-3xl md:text-4xl font-bold">
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
                              {getLocalizedRiskLabel(latestPrediction.risk_level)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className={isArabic ? "md:text-left" : "md:text-right"}>
                        <p className="text-sm text-muted-foreground mb-1.5">
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
                      <div className="rounded-[20px] border bg-card p-3 sm:p-4 md:p-5">
                        <div className="h-[210px] sm:h-[240px] md:h-[280px] w-full">
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
                                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
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
                      <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                        {t("dashboard.noData")}
                      </div>
                    )}
                  </div>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="rounded-2xl border p-4">
                        <div className="h-4 w-48 bg-muted rounded mb-3" />
                        <div className="h-3 w-32 bg-muted rounded mb-2" />
                        <div className="h-3 w-24 bg-muted rounded" />
                      </div>
                    ))}
                  </div>
                ) : predictions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-8 text-center bg-muted/20">
                    <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Beaker className="h-7 w-7 text-primary" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">
                      {t("dashboard.noPreviousAnalyses")}
                    </h4>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {t("dashboard.healthTipText")}
                    </p>
                    <Link to="/diagnosis">
                      <Button>{t("dashboard.firstTestNow")}</Button>
                    </Link>
                  </div>
                ) : searchTerm && displayedPredictions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-8 text-center bg-muted/20">
                    <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Search className="h-7 w-7 text-primary" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">
                      {t("dashboard.noData")}
                    </h4>
                    <p className="text-muted-foreground">{searchTerm}</p>
                  </div>
                ) : error ? (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
                    <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <h4 className="font-semibold mb-2">
                      {t("dashboard.unableToLoadAnalyses")}
                    </h4>
                    <p className="text-sm text-red-500">{error}</p>
                  </div>
                ) : (
                  <>
                    <div className="hidden lg:block w-full overflow-hidden">
                      <div className="w-full overflow-hidden rounded-[20px] border">
                        <div className="grid grid-cols-[minmax(220px,2fr)_minmax(180px,1.45fr)_minmax(110px,1.05fr)_minmax(120px,1.1fr)] gap-4 bg-muted/30 px-5 py-4 text-sm font-semibold text-muted-foreground">
                          <span className="text-start">
                            {t("dashboard.recentAnalyses")}
                          </span>
                          <span className="text-start">
                            {t("dashboard.riskIndicators")}
                          </span>
                          <span className="text-start whitespace-nowrap">
                            {t("dashboard.date")}
                          </span>
                          <span className="text-center whitespace-nowrap">
                            {t("dashboard.action")}
                          </span>
                        </div>

                        {displayedPredictions.map((pred) => {
                          const topIndicators = getTopRiskIndicators(pred);

                          return (
                            <div
                              key={pred.id}
                              className="grid grid-cols-[minmax(220px,2fr)_minmax(180px,1.45fr)_minmax(110px,1.05fr)_minmax(120px,1.1fr)] gap-4 items-center px-5 py-4 border-t hover:bg-muted/10"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <Activity className="h-5 w-5 text-primary" />
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-semibold truncate">
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
                                  {formatDate(pred.created_at)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground whitespace-nowrap">
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
                                    className="whitespace-nowrap h-10"
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
                            className="rounded-[18px] border p-4 bg-background"
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Activity className="h-5 w-5 text-primary" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold leading-snug">
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
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {t("dashboard.riskIndicators")}
                                  </p>

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

                                <div className="mt-3 rounded-xl bg-muted/30 p-3">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    {t("dashboard.date")}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatDate(pred.created_at)}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
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
                                      className="w-full h-10"
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
              className={`grid grid-cols-1 gap-4 items-start ${smoothSectionClass}`}
            >
              <Card className="rounded-[22px] border bg-card p-4 md:p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="font-bold text-xl">
                    {t("dashboard.lastDoctorContact")}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("dashboard.lastDoctorContactDesc")}
                  </p>
                </div>

                <div className="rounded-[18px] border bg-primary/5 p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Stethoscope className="h-6 w-6 text-primary" />
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-lg font-semibold truncate">
                          {t("dashboard.doctorCardTitle")}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
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