import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskData {
  level: string;
  level_en: string;
  count: number;
  color: string;
}

interface RiskDistributionChartProps {
  data: {
    distribution: RiskData[];
    total: number;
  } | null;
  isLoading: boolean;
}

export default function RiskDistributionChart({
  data,
  isLoading,
}: RiskDistributionChartProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const colorMap: Record<string, string> = {
    low: "#22c55e",
    medium: "#eab308",
    high: "#f97316",
    "very high": "#ef4444",
  };

  const riskOrder = ["low", "medium", "high", "very high"];

  const fallbackLabels: Record<string, { ar: string; en: string }> = {
    low: {
      ar: "منخفض",
      en: "Low",
    },
    medium: {
      ar: "متوسط",
      en: "Medium",
    },
    high: {
      ar: "عالي",
      en: "High",
    },
    "very high": {
      ar: "عالي جدًا",
      en: "Very High",
    },
  };

  const normalizedDistribution = riskOrder.map((riskKey) => {
    const matchedItem = data?.distribution?.find(
      (item) => item.level_en?.toLowerCase() === riskKey
    );

    return {
      key: riskKey,
      name:
        isRTL
          ? matchedItem?.level || fallbackLabels[riskKey].ar
          : matchedItem?.level_en || fallbackLabels[riskKey].en,
      value: matchedItem?.count || 0,
      color:
        colorMap[riskKey] ||
        matchedItem?.color ||
        "#94a3b8",
    };
  });

  const chartData = normalizedDistribution.filter((item) => item.value > 0);

  const getRiskTextColor = (riskKey: string) => {
    switch (riskKey) {
      case "low":
        return "text-emerald-600";
      case "medium":
        return "text-amber-600";
      case "high":
        return "text-orange-600";
      case "very high":
        return "text-red-600";
      default:
        return "text-slate-600";
    }
  };

  if (isLoading) {
    return (
      <Card className="flex h-full min-h-[390px] w-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-slate-200/60 sm:min-h-[420px] sm:rounded-3xl">
        <CardHeader className="flex flex-row items-center gap-3 px-5 pb-3 pt-5 sm:px-6">
          <Skeleton className="h-9 w-9 rounded-2xl" />
          <Skeleton className="h-5 w-[150px] rounded-md" />
        </CardHeader>

        <CardContent className="flex flex-1 flex-col px-5 pb-5 pt-2 sm:px-6 sm:pb-6">
          <Skeleton className="mx-auto h-[190px] w-[190px] rounded-full sm:h-[220px] sm:w-[220px]" />

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-[72px] rounded-2xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full min-h-[390px] w-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-slate-200/60 sm:min-h-[420px] sm:rounded-3xl">
      <CardHeader className="flex flex-row items-center gap-3 px-5 pb-3 pt-5 sm:px-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <PieIcon className="h-4 w-4" strokeWidth={2.3} />
        </div>

        <CardTitle className="min-w-0 truncate text-base font-bold leading-6 tracking-tight text-slate-900">
          {t("doctorDashboard.riskChart.title")}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col px-5 pb-5 pt-1 sm:px-6 sm:pb-6">
        {data?.total === 0 || !data ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-400">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <PieIcon className="h-7 w-7 opacity-80" strokeWidth={2.2} />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              {t("doctorDashboard.riskChart.empty")}
            </p>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "mb-2 flex flex-wrap items-center gap-x-4 gap-y-2",
                isRTL ? "justify-end" : "justify-start"
              )}
            >
              {normalizedDistribution.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />

                  <span className="whitespace-nowrap">
                    {item.name} ({item.value})
                  </span>
                </div>
              ))}
            </div>

            <div className="h-[190px] w-full sm:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        strokeWidth={0}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value: number) => [
                      value,
                      t("doctorDashboard.riskChart.patients"),
                    ]}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {normalizedDistribution.map((item) => (
                <div
                  key={item.key}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 px-3 py-3 text-center"
                >
                  <p
                    className={cn(
                      "text-2xl font-bold leading-none tracking-tight",
                      getRiskTextColor(item.key)
                    )}
                  >
                    {item.value}
                  </p>

                  <p className="mt-1.5 truncate text-xs font-semibold text-slate-500">
                    {item.name}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}