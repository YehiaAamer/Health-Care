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
      name: isRTL
        ? matchedItem?.level || fallbackLabels[riskKey].ar
        : matchedItem?.level_en || fallbackLabels[riskKey].en,
      value: matchedItem?.count || 0,
      color: colorMap[riskKey] || matchedItem?.color || "#94a3b8",
    };
  });

  const chartData = normalizedDistribution.filter((item) => item.value > 0);

  const getRiskTextColor = (riskKey: string) => {
    switch (riskKey) {
      case "low":
        return "text-emerald-600 dark:text-emerald-300";
      case "medium":
        return "text-amber-600 dark:text-amber-300";
      case "high":
        return "text-orange-600 dark:text-orange-300";
      case "very high":
        return "text-red-600 dark:text-red-300";
      default:
        return "text-muted-foreground";
    }
  };

  const cardClassName =
    "flex h-full min-h-[345px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md sm:min-h-[360px] sm:rounded-3xl";

  if (isLoading) {
    return (
      <Card className={cardClassName}>
        <CardHeader className="flex shrink-0 flex-row items-center gap-3 px-5 pb-2 pt-4 sm:px-6 sm:pb-2 sm:pt-5">
          <Skeleton className="h-9 w-9 rounded-2xl" />
          <Skeleton className="h-5 w-[150px] rounded-md" />
        </CardHeader>

        <CardContent className="flex flex-1 flex-col px-5 pb-4 pt-1 sm:px-6 sm:pb-5">
          <Skeleton className="mx-auto h-[145px] w-[145px] rounded-full sm:h-[155px] sm:w-[155px]" />

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-[58px] rounded-2xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardClassName}>
      <CardHeader className="flex shrink-0 flex-row items-center gap-3 px-5 pb-2 pt-4 sm:px-6 sm:pb-2 sm:pt-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <PieIcon className="h-4 w-4" strokeWidth={2.3} />
        </div>

        <CardTitle className="min-w-0 truncate text-base font-bold leading-6 tracking-tight text-foreground">
          {t("doctorDashboard.riskChart.title")}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col px-5 pb-4 pt-1 sm:px-6 sm:pb-5">
        {data?.total === 0 || !data ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <PieIcon className="h-6 w-6 opacity-80" strokeWidth={2.2} />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {t("doctorDashboard.riskChart.empty")}
            </p>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5",
                isRTL ? "justify-end" : "justify-start"
              )}
            >
              {normalizedDistribution.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />

                  <span className="whitespace-nowrap">
                    {item.name} ({item.value})
                  </span>
                </div>
              ))}
            </div>

            <div className="h-[145px] w-full sm:h-[155px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1200}
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
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                      color: "hsl(var(--card-foreground))",
                      boxShadow: "0 12px 24px rgba(0, 0, 0, 0.14)",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                    itemStyle={{
                      color: "hsl(var(--foreground))",
                    }}
                    labelStyle={{
                      color: "hsl(var(--muted-foreground))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {normalizedDistribution.map((item) => (
                <div
                  key={item.key}
                  className="rounded-2xl border border-border bg-muted/30 px-2 py-2 text-center transition-colors hover:bg-primary/5"
                >
                  <p
                    className={cn(
                      "text-xl font-bold leading-none tracking-tight",
                      getRiskTextColor(item.key)
                    )}
                  >
                    {item.value}
                  </p>

                  <p className="mt-1 truncate text-[10px] font-semibold text-muted-foreground">
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