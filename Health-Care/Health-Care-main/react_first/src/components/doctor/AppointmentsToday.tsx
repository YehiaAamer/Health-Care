import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppointmentsTodayProps {
  appointments: any[];
  isLoading: boolean;
}

export default function AppointmentsToday({
  appointments = [],
  isLoading,
}: AppointmentsTodayProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isArabic = i18n.language === "ar";

  const safeAppointments = Array.isArray(appointments) ? appointments : [];

  const getAppointmentTimestamp = (appt: any) => {
    const possibleDate =
      appt?.created_at ||
      appt?.updated_at ||
      appt?.appointment_datetime ||
      appt?.datetime ||
      appt?.date ||
      appt?.appointment_date ||
      appt?.time ||
      appt?.appointment_time;

    if (!possibleDate) return 0;

    const parsedDate = new Date(possibleDate);

    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.getTime();
    }

    return 0;
  };

  const visibleAppointments = useMemo(() => {
    return [...safeAppointments]
      .sort((a, b) => {
        const aTime = getAppointmentTimestamp(a);
        const bTime = getAppointmentTimestamp(b);

        if (aTime === 0 && bTime === 0) return 0;

        return bTime - aTime;
      })
      .slice(0, 5);
  }, [safeAppointments]);

  const getStatusColor = () => {
    return "bg-primary";
  };

  const getTypeIcon = (type?: string) => {
    if (type === "online" || type === "video" || type === "review") {
      return <Video className="h-2.5 w-2.5 text-primary sm:h-3 sm:w-3" />;
    }

    return <Clock className="h-2.5 w-2.5 text-primary sm:h-3 sm:w-3" />;
  };

  const getPatientName = (appt: any) => {
    return (
      appt?.patient?.name ||
      appt?.patient_name ||
      appt?.doctor_name ||
      `Patient #${appt?.patient_user || "Unknown"}`
    );
  };

  const getPatientImage = (appt: any) => {
    return appt?.patient?.profile_picture || appt?.profile_picture || undefined;
  };

  const formatTime = (value?: string) => {
    if (!value) return "--:--";

    const cleanValue = String(value).trim();

    if (cleanValue.includes("AM") || cleanValue.includes("PM")) {
      return cleanValue;
    }

    const dateValue = new Date(cleanValue);

    if (!Number.isNaN(dateValue.getTime())) {
      return dateValue.toLocaleTimeString(isArabic ? "ar-EG" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    const timeMatch = cleanValue.match(/^(\d{1,2}):(\d{2})/);

    if (timeMatch) {
      const [, hour, minute] = timeMatch;
      const date = new Date();

      date.setHours(Number(hour));
      date.setMinutes(Number(minute));

      return date.toLocaleTimeString(isArabic ? "ar-EG" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return cleanValue;
  };

  const getTime = (appt: any) => {
    return formatTime(appt?.time || appt?.appointment_time);
  };

  const getType = (appt: any) => {
    return appt?.type || appt?.appointment_type || "appointment";
  };

  return (
    <Card className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md">
      <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-3 px-4 pb-2 pt-4 sm:px-5 sm:pb-3 sm:pt-5">
        <CardTitle className="flex min-w-0 flex-1 items-center gap-2 text-sm font-bold tracking-tight text-foreground sm:text-base">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-8 sm:w-8">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.3} />
          </span>

          <span className="min-w-0 truncate">
            {t("doctorDashboard.appointments.title")}
          </span>
        </CardTitle>

        {!isLoading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/doctor-dashboard/appointments")}
            className="h-7 shrink-0 rounded-xl px-2 text-[9px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10 hover:text-primary sm:h-8 sm:px-2.5 sm:text-[10px]"
          >
            {t("doctorDashboard.appointments.viewAll")}
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col px-4 pb-3 pt-1 sm:px-5 sm:pb-4">
        {isLoading ? (
          <div className="flex flex-1 flex-col justify-between gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex w-[58px] shrink-0 flex-col items-start">
                  <Skeleton className="mb-1 h-3.5 w-10" />
                  <Skeleton className="h-2.5 w-8" />
                </div>

                <div className="flex min-h-[40px] flex-1 items-center gap-2 rounded-xl border border-border bg-background px-2 py-1.5">
                  <Skeleton className="h-7 w-7 rounded-full" />

                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-[110px]" />
                    <Skeleton className="h-2.5 w-[75px]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : safeAppointments.length === 0 ? (
          <div className="flex min-h-[110px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center text-muted-foreground">
            <Calendar className="mb-2 h-7 w-7 opacity-40" />

            <p className="max-w-[240px] text-sm">
              {t("doctorDashboard.appointments.empty")}
            </p>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col justify-between gap-1.5 sm:gap-2">
            {visibleAppointments.map((appt, index) => {
              const patientName = getPatientName(appt);
              const appointmentType = getType(appt);

              return (
                <div
                  key={appt?.id || `${patientName}-${index}`}
                  className="flex min-h-0 items-center gap-2"
                >
                  <div
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full border-2 border-card sm:h-2.5 sm:w-2.5",
                      getStatusColor()
                    )}
                  />

                  <div className="w-[56px] shrink-0 text-[11px] font-semibold leading-none text-muted-foreground sm:w-[68px] sm:text-sm">
                    {getTime(appt)}
                  </div>

                  <div className="flex min-h-[40px] min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-muted/30 px-2 py-1.5 transition-colors hover:bg-primary/5 sm:min-h-[46px] sm:gap-2.5 sm:px-2.5 sm:py-2">
                    <Avatar className="h-7 w-7 shrink-0 border border-border sm:h-8 sm:w-8">
                      <AvatarImage src={getPatientImage(appt)} />

                      <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary sm:text-xs">
                        {patientName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="truncate text-xs font-semibold leading-4 text-foreground sm:text-sm">
                        {patientName}
                      </p>

                      <div className="mt-0.5 flex items-center gap-1">
                        {getTypeIcon(appointmentType)}

                        <p className="truncate text-[10px] capitalize leading-3 text-muted-foreground sm:text-[11px]">
                          {appointmentType.replaceAll("_", " ")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}