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

const MAX_DASHBOARD_APPOINTMENTS = 5;

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
      appt?.appointment_datetime ||
      (appt?.appointment_date && appt?.appointment_time
        ? `${appt.appointment_date}T${appt.appointment_time}`
        : null) ||
      appt?.datetime ||
      appt?.scheduled_at ||
      appt?.start_time ||
      appt?.date ||
      appt?.appointment_date ||
      appt?.time ||
      appt?.appointment_time ||
      appt?.created_at ||
      appt?.updated_at;

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
        if (aTime === 0) return 1;
        if (bTime === 0) return -1;

        return aTime - bTime;
      })
      .slice(0, MAX_DASHBOARD_APPOINTMENTS);
  }, [safeAppointments]);

  const emptyRowsCount = Math.max(
    MAX_DASHBOARD_APPOINTMENTS - visibleAppointments.length,
    0
  );

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
    const patient =
      appt?.patient ||
      appt?.patient_details ||
      appt?.patient_data ||
      appt?.user ||
      {};

    const fullName = [patient?.first_name, patient?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    return (
      appt?.patient?.name ||
      appt?.patient_name ||
      appt?.patient_full_name ||
      patient?.name ||
      patient?.full_name ||
      fullName ||
      appt?.doctor_name ||
      `Patient #${appt?.patient_user || appt?.patient_id || "Unknown"}`
    );
  };

  const getPatientImage = (appt: any) => {
    return (
      appt?.patient?.profile_picture ||
      appt?.patient_profile_picture ||
      appt?.profile_picture ||
      undefined
    );
  };

  const formatTime = (value?: string) => {
    if (!value) return "--:--";

    const cleanValue = String(value).trim();

    if (/am|pm/i.test(cleanValue)) {
      return cleanValue.toUpperCase();
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
      date.setSeconds(0);

      return date.toLocaleTimeString(isArabic ? "ar-EG" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return cleanValue;
  };

  const getTime = (appt: any) => {
    return formatTime(
      appt?.time ||
        appt?.appointment_time ||
        appt?.appointment_datetime ||
        appt?.datetime ||
        appt?.scheduled_at ||
        appt?.start_time ||
        appt?.appointment_date ||
        appt?.date ||
        appt?.created_at
    );
  };

  const getType = (appt: any) => {
    return appt?.type || appt?.appointment_type || "appointment";
  };

  const cardClassName =
    "flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md";

  const RowShell = ({ children }: { children?: React.ReactNode }) => {
    return (
      <div className="flex min-h-[42px] items-center gap-2 sm:min-h-[46px]">
        {children}
      </div>
    );
  };

  const PlaceholderRow = ({ index }: { index: number }) => {
    return (
      <RowShell key={`placeholder-appointment-row-${index}`}>
        <div className="h-2 w-2 shrink-0 rounded-full border-2 border-card bg-transparent sm:h-2.5 sm:w-2.5" />

        <div className="w-[56px] shrink-0 sm:w-[68px]" />

        <div className="min-h-[40px] min-w-0 flex-1 rounded-xl border border-transparent px-2 py-1.5 sm:min-h-[46px] sm:px-2.5 sm:py-2" />
      </RowShell>
    );
  };

  return (
    <Card className={cardClassName}>
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

      <CardContent className="flex flex-col px-4 pb-3 pt-1 sm:px-5 sm:pb-4">
        {isLoading ? (
          <div className="flex flex-col gap-1.5 sm:gap-2">
            {Array.from({ length: MAX_DASHBOARD_APPOINTMENTS }).map((_, i) => (
              <RowShell key={i}>
                <div className="h-2 w-2 shrink-0 rounded-full border-2 border-card bg-transparent sm:h-2.5 sm:w-2.5" />

                <div className="flex w-[56px] shrink-0 flex-col items-start sm:w-[68px]">
                  <Skeleton className="mb-1 h-3.5 w-10" />
                  <Skeleton className="h-2.5 w-8" />
                </div>

                <div className="flex min-h-[40px] min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-background px-2 py-1.5 sm:min-h-[46px] sm:gap-2.5 sm:px-2.5 sm:py-2">
                  <Skeleton className="h-7 w-7 shrink-0 rounded-full sm:h-8 sm:w-8" />

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-[110px]" />
                    <Skeleton className="h-2.5 w-[75px]" />
                  </div>
                </div>
              </RowShell>
            ))}
          </div>
        ) : visibleAppointments.length === 0 ? (
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <RowShell>
              <div
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full border-2 border-card sm:h-2.5 sm:w-2.5",
                  getStatusColor()
                )}
              />

              <div className="w-[56px] shrink-0 text-[11px] font-semibold leading-none text-muted-foreground sm:w-[68px] sm:text-sm">
                --:--
              </div>

              <div className="flex min-h-[40px] min-w-0 flex-1 items-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-2 py-1.5 sm:min-h-[46px] sm:gap-2.5 sm:px-2.5 sm:py-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:h-8 sm:w-8">
                  <Calendar
                    className="h-3.5 w-3.5 opacity-80 sm:h-4 sm:w-4"
                    strokeWidth={2.2}
                  />
                </div>

                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="truncate text-xs font-semibold leading-4 text-foreground sm:text-sm">
                    {t("doctorDashboard.appointments.empty")}
                  </p>

                  <p className="mt-0.5 truncate text-[10px] leading-3 text-muted-foreground sm:text-[11px]">
                    {isArabic
                      ? "ستظهر الحجوزات القادمة هنا"
                      : "Upcoming appointments will appear here"}
                  </p>
                </div>
              </div>
            </RowShell>

            {Array.from({ length: MAX_DASHBOARD_APPOINTMENTS - 1 }).map(
              (_, index) => (
                <PlaceholderRow
                  key={`empty-appointment-row-${index}`}
                  index={index}
                />
              )
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 sm:gap-2">
            {visibleAppointments.map((appt, index) => {
              const patientName = getPatientName(appt);
              const appointmentType = getType(appt);

              return (
                <RowShell key={appt?.id || `${patientName}-${index}`}>
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
                          {String(appointmentType).replaceAll("_", " ")}
                        </p>
                      </div>
                    </div>
                  </div>
                </RowShell>
              );
            })}

            {Array.from({ length: emptyRowsCount }).map((_, index) => (
              <PlaceholderRow
                key={`placeholder-appointment-row-${index}`}
                index={index}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}