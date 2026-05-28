import { useTranslation } from "react-i18next";
import { Users, FileText, CheckCircle, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/types/api";

interface StatsCardsProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const { t } = useTranslation();

  const cards = [
    {
      title: t("doctorDashboard.stats.totalPatients"),
      value: stats?.total_patients ?? 0,
      icon: Users,
      color: "text-sky-600 dark:text-sky-300",
      bgColor: "bg-sky-50 dark:bg-sky-500/10",
      borderColor: "hover:border-sky-200 dark:hover:border-sky-500/30",
      trend: "+2",
      trendLabel: t("doctorDashboard.stats.thisMonth"),
    },
    {
      title: t("doctorDashboard.stats.pendingReviews"),
      value: stats?.pending_reviews ?? 0,
      icon: FileText,
      color: "text-amber-600 dark:text-amber-300",
      bgColor: "bg-amber-50 dark:bg-amber-500/10",
      borderColor: "hover:border-amber-200 dark:hover:border-amber-500/30",
      trend: "-1",
      trendLabel: t("doctorDashboard.stats.fromYesterday"),
    },
    {
      title: t("doctorDashboard.stats.todayAppointments"),
      value: stats?.today_appointments ?? 0,
      icon: CheckCircle,
      color: "text-emerald-600 dark:text-emerald-300",
      bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
      borderColor: "hover:border-emerald-200 dark:hover:border-emerald-500/30",
    },
    {
      title: t("doctorDashboard.stats.totalPredictions"),
      value: stats?.total_predictions ?? 0,
      icon: Activity,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "hover:border-primary/20",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 font-sans sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card
            key={i}
            className="min-h-[180px] rounded-3xl border border-border bg-card text-card-foreground shadow-sm"
          >
            <CardContent className="flex h-full min-h-[180px] flex-col justify-between p-6">
              <div className="flex items-start justify-between gap-4">
                <Skeleton className="h-4 w-[110px] rounded-md" />
                <Skeleton className="h-11 w-11 rounded-2xl" />
              </div>

              <div>
                <Skeleton className="mt-3 h-9 w-[70px] rounded-md" />
                <Skeleton className="mt-4 h-3 w-[130px] rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 font-sans sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card
          key={index}
          className={cn(
            "group min-h-[180px] overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm",
            "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
            card.borderColor
          )}
        >
          <CardContent className="flex h-full min-h-[180px] flex-col justify-between p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="min-h-[32px] text-[11px] font-semibold uppercase leading-4 tracking-[0.16em] text-muted-foreground">
                  {card.title}
                </h3>

                <div className="mt-4 text-3xl font-bold leading-none tracking-tight text-foreground">
                  {card.value}
                </div>
              </div>

              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                  "transition-all duration-300 group-hover:scale-105",
                  card.bgColor,
                  card.color
                )}
              >
                <card.icon className="h-5 w-5" strokeWidth={2.2} />
              </div>
            </div>

            <div className="min-h-[30px]">
              {card.trend && (
                <div className="mt-5 flex items-center text-[10px] font-bold uppercase tracking-widest">
                  <span
                    className={cn(
                      "rounded-lg px-2 py-1",
                      card.trend.startsWith("+")
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
                    )}
                  >
                    {card.trend}
                  </span>

                  <span className="ml-2 text-muted-foreground">
                    {card.trendLabel}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}