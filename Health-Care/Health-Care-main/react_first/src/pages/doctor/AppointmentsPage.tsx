import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useApiCall } from "@/hooks/useApiCall";
import { API_ENDPOINTS } from "@/lib/api";
import { patientsApi } from "@/api/patients";
import type { User, Prediction } from "@/types/api";

import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Calendar as CalendarIcon,
  Clock,
  User as UserIcon,
  Video,
  X,
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Activity,
  Mail,
} from "lucide-react";
import LoadingDots from "@/components/shared/LoadingDots";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Appointment {
  id: string | number;
  patient_name: string;
  patient_id: string | number;
  patient_user?: number;
  time: string;
  reason: string;
  status: "Upcoming" | "In Progress" | "Completed" | "Cancelled";
  profile_picture?: string;
  meeting_url?: string;
  call_url?: string;
  video_link?: string;
}

type PatientDetails = User & {
  predictions?: Prediction[];
};

type FilterType = "today" | "upcoming" | "next" | "all";

export default function AppointmentsPage() {
  const { t, i18n } = useTranslation();
  const { execute: apiCall } = useApiCall();
  const isArabic = i18n.language === "ar";

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [weekAnchorDate, setWeekAnchorDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewAppointment, setShowNewAppointment] = useState(false);

  const [profileLoading, setProfileLoading] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetails | null>(
    null
  );
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const [newAppointment, setNewAppointment] = useState({
    patient_name: "",
    patient_id: "",
    reason: "",
  });

  const pageSize = 6;

  const timeSlots = [
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
    "12:30 PM",
    "01:00 PM",
    "01:30 PM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "03:30 PM",
    "04:00 PM",
  ];

  const dummyAppointments: Appointment[] = [
    {
      id: 1,
      patient_name: isArabic ? "يوسف إبراهيم" : "Youssef Ibrahim",
      patient_id: "PID-2241",
      patient_user: 2241,
      time: "10:00 AM - 10:30 AM",
      reason: isArabic ? "متابعة السكري" : "Diabetes Follow-up",
      status: "In Progress",
    },
    {
      id: 2,
      patient_name: isArabic ? "مريم محمود" : "Mariam Mahmoud",
      patient_id: "PID-1152",
      patient_user: 1152,
      time: "11:00 AM - 11:30 AM",
      reason: isArabic ? "مراجعة ضغط الدم" : "Blood Pressure Review",
      status: "Upcoming",
    },
    {
      id: 3,
      patient_name: isArabic ? "عمر خالد" : "Omar Khaled",
      patient_id: "PID-3367",
      patient_user: 3367,
      time: "12:00 PM - 12:30 PM",
      reason: isArabic ? "استشارة غذائية" : "Nutritional Consultation",
      status: "Upcoming",
    },
    {
      id: 4,
      patient_name: isArabic ? "هناء سعيد" : "Hana Saeed",
      patient_id: "PID-4489",
      patient_user: 4489,
      time: "02:00 PM - 02:30 PM",
      reason: isArabic ? "فحص سنوي" : "Annual Checkup",
      status: "Completed",
    },
    {
      id: 5,
      patient_name: isArabic ? "كريم علي" : "Karim Ali",
      patient_id: "PID-5590",
      patient_user: 5590,
      time: "03:00 PM - 03:30 PM",
      reason: isArabic ? "مراجعة نتائج التحاليل" : "Lab Results Review",
      status: "Upcoming",
    },
  ];

  const formatAppointmentTime = (value?: string) => {
    if (!value) return "--:--";

    const cleanValue = String(value).trim();

    if (cleanValue.includes(" - ")) {
      return cleanValue
        .split(" - ")
        .map((item) => formatAppointmentTime(item))
        .join(" - ");
    }

    if (/am|pm/i.test(cleanValue)) {
      return cleanValue.toUpperCase();
    }

    const parsedDate = new Date(cleanValue);

    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }

    const timeMatch = cleanValue.match(/^(\d{1,2}):(\d{2})/);

    if (timeMatch) {
      const [, hour, minute] = timeMatch;
      const dateValue = new Date();

      dateValue.setHours(Number(hour));
      dateValue.setMinutes(Number(minute));
      dateValue.setSeconds(0);

      return dateValue.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }

    return cleanValue;
  };

  const getPatientNumericId = (appt: Appointment) => {
    if (appt.patient_user) return Number(appt.patient_user);

    const rawId = String(appt.patient_id || "");
    const numericId = parseInt(rawId.replace(/\D/g, ""), 10);

    return Number.isNaN(numericId) ? 0 : numericId;
  };

  const getMeetingUrl = (appt: Appointment) => {
    return appt.meeting_url || appt.call_url || appt.video_link || "";
  };

  const handleJoinCall = (appt: Appointment) => {
    const meetingUrl = getMeetingUrl(appt);

    if (!meetingUrl) {
      toast.info(
        isArabic
          ? "رابط المكالمة غير متاح من الباك حتى الآن"
          : "Meeting link is not available yet"
      );
      return;
    }

    window.open(meetingUrl, "_blank", "noopener,noreferrer");
  };

  const handleViewProfile = async (appt: Appointment) => {
    const patientId = getPatientNumericId(appt);

    if (!patientId) {
      toast.error(
        isArabic
          ? "رقم المريض غير صالح لعرض الملف"
          : "Invalid patient ID for profile view"
      );
      return;
    }

    try {
      setSelectedAppointment(appt);
      setOpenProfile(true);
      setProfileLoading(true);

      const data = await patientsApi.getPatientProfile(patientId);
      setSelectedPatient(data);
    } catch (error) {
      console.error("Failed to load patient profile", error);

      setSelectedPatient({
        id: patientId,
        username: "",
        first_name: appt.patient_name,
        last_name: "",
        email: "",
        profile: {
          role: "patient",
          phone: "",
          bio: "",
          profile_picture: appt.profile_picture || "",
        },
        predictions: [],
      } as PatientDetails);

      toast.error(
        isArabic
          ? "تم عرض البيانات الأساسية فقط"
          : "Showing basic profile only"
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const current = new Date(weekAnchorDate);
      current.setDate(weekAnchorDate.getDate() + index);

      return {
        fullDate: current,
        dayName: current.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
          weekday: "short",
        }),
        dayNumber: current.getDate(),
      };
    });
  }, [weekAnchorDate, isArabic]);

  const isSameDay = (a?: Date, b?: Date) => {
    if (!a || !b) return false;

    return (
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear()
    );
  };

  const formattedSelectedDate = date
    ? date.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const moveWeek = (direction: "prev" | "next") => {
    setWeekAnchorDate((prev) => {
      const nextDate = new Date(prev);
      nextDate.setDate(prev.getDate() + (direction === "next" ? 7 : -7));
      return nextDate;
    });
  };

  const handleSelectDate = (selectedDate?: Date) => {
    if (!selectedDate) return;
    setDate(selectedDate);
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(formatAppointmentTime(time));
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);

      const data: any = await apiCall(API_ENDPOINTS.DOCTOR_APPOINTMENTS_TODAY);

      if (data?.appointments?.length > 0) {
        const mapped = data.appointments.map((apt: any) => ({
          id: apt.id,
          patient_name:
            apt.patient_name || apt.patient?.name || "Unknown Patient",
          patient_id:
            apt.patient_id ||
            apt.patient_user ||
            `PID-${Math.floor(1000 + Math.random() * 9000)}`,
          patient_user: apt.patient_user || apt.patient?.id || apt.user_id,
          time: formatAppointmentTime(apt.time || apt.appointment_time),
          reason: apt.reason || apt.condition || "Medical Consultation",
          status:
            apt.status === "completed"
              ? "Completed"
              : apt.status === "cancelled"
              ? "Cancelled"
              : apt.status === "in_progress"
              ? "In Progress"
              : "Upcoming",
          profile_picture: apt.profile_picture || apt.patient?.profile_picture,
          meeting_url: apt.meeting_url,
          call_url: apt.call_url,
          video_link: apt.video_link,
        }));

        setAppointments(mapped);
      } else {
        setAppointments(dummyAppointments);
      }
    } catch (error) {
      console.error("Failed to fetch appointments", error);
      setAppointments(dummyAppointments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [apiCall, isArabic]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);

  const nextAppointment = appointments.find(
    (apt) => apt.status === "In Progress" || apt.status === "Upcoming"
  );

  const filteredAppointments = useMemo(() => {
    let list = [...appointments];

    if (filter === "today") {
      list = list.filter((apt) => apt.status !== "Cancelled");
    }

    if (filter === "upcoming") {
      list = list.filter((apt) => apt.status === "Upcoming");
    }

    if (filter === "next") {
      list = nextAppointment ? [nextAppointment] : [];
    }

    if (search.trim()) {
      const q = search.toLowerCase();

      list = list.filter(
        (apt) =>
          apt.patient_name.toLowerCase().includes(q) ||
          String(apt.patient_id).toLowerCase().includes(q) ||
          apt.reason.toLowerCase().includes(q) ||
          apt.status.toLowerCase().includes(q)
      );
    }

    return list;
  }, [appointments, filter, search, nextAppointment]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAppointments.length / pageSize)
  );

  const paginatedAppointments = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredAppointments.slice(start, start + pageSize);
  }, [filteredAppointments, currentPage, totalPages]);

  const getStatusStyles = (status: Appointment["status"]) => {
    switch (status) {
      case "In Progress":
        return "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300";
      case "Completed":
        return "border-green-200 bg-green-50 text-green-600 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300";
      case "Cancelled":
        return "border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300";
      default:
        return "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300";
    }
  };

  const getStatusText = (status: Appointment["status"]) => {
    if (status === "In Progress") return isArabic ? "الآن" : "Now";
    if (status === "Completed")
      return t("doctorDashboard.appointments.statusCompleted");
    if (status === "Cancelled") return isArabic ? "ملغي" : "Cancelled";
    return t("doctorDashboard.appointments.statusUpcoming");
  };

  const handleCreateAppointment = () => {
    if (
      !newAppointment.patient_name.trim() ||
      !selectedTime.trim() ||
      !newAppointment.reason.trim()
    ) {
      return;
    }

    const createdAppointment: Appointment = {
      id: Date.now(),
      patient_name: newAppointment.patient_name,
      patient_id:
        newAppointment.patient_id ||
        `PID-${Math.floor(1000 + Math.random() * 9000)}`,
      time: formatAppointmentTime(selectedTime),
      reason: newAppointment.reason,
      status: "Upcoming",
    };

    setAppointments((prev) => [createdAppointment, ...prev]);
    setNewAppointment({
      patient_name: "",
      patient_id: "",
      reason: "",
    });
    setSelectedTime("");
    setShowNewAppointment(false);
    setFilter("all");
    setCurrentPage(1);
  };

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-full w-full max-w-none animate-in fade-in px-0 pb-8 pt-8 text-foreground duration-700 md:pt-0"
    >
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("doctorDashboard.appointments.title")}
            </h1>

            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {isArabic
                ? "عرض وإدارة جدول مواعيدك اليومية"
                : "View and manage your daily appointment schedule"}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-96">
              <Search
                className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${
                  isArabic ? "right-4" : "left-4"
                }`}
              />

              <Input
                placeholder={t(
                  "doctorDashboard.appointments.searchPlaceholder"
                )}
                className={`h-12 rounded-2xl border border-border bg-card text-sm font-semibold text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:ring-4 focus-visible:ring-primary/10 ${
                  isArabic ? "pr-11 pl-9" : "pl-11 pr-9"
                }`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary ${
                    isArabic ? "left-3" : "right-3"
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Button
              onClick={() => setShowNewAppointment(true)}
              className="h-12 rounded-2xl bg-primary px-6 font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              {t("doctorDashboard.appointments.newAppointment")}
            </Button>
          </div>
        </div>

        <Card className="w-full rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CalendarIcon className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground">
                  {isArabic ? "اختيار التاريخ" : "Select Date"}
                </h3>

                <p className="text-sm font-medium text-muted-foreground">
                  {formattedSelectedDate}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCalendar((prev) => !prev)}
              className="h-9 w-fit rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-primary/10 hover:text-primary"
            >
              {isArabic ? "عرض التقويم كامل" : "Full calendar"}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showCalendar ? "rotate-180" : ""
                } ${isArabic ? "mr-1" : "ml-1"}`}
              />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => moveWeek("prev")}
              className="h-[76px] w-11 shrink-0 rounded-2xl text-muted-foreground hover:bg-primary/10 hover:text-primary"
            >
              {isArabic ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </Button>

            <div className="grid flex-1 grid-cols-7 gap-3">
              {weekDates.map((item) => {
                const selected = isSameDay(date, item.fullDate);

                return (
                  <button
                    key={item.fullDate.toISOString()}
                    type="button"
                    onClick={() => handleSelectDate(item.fullDate)}
                    className={`rounded-2xl border px-2 py-4 text-center transition-all ${
                      selected
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-background hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold ${
                        selected ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {item.dayName}
                    </p>

                    <p className="mt-2 text-xl font-bold">{item.dayNumber}</p>
                  </button>
                );
              })}
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => moveWeek("next")}
              className="h-[76px] w-11 shrink-0 rounded-2xl text-muted-foreground hover:bg-primary/10 hover:text-primary"
            >
              {isArabic ? (
                <ChevronLeft className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </Button>
          </div>

          {showCalendar && (
            <div className="mt-5 w-full rounded-3xl border border-border bg-background p-4 shadow-sm">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(selectedDate) => {
                  if (!selectedDate) return;
                  setDate(selectedDate);
                  setWeekAnchorDate(selectedDate);
                }}
                className="w-full"
                classNames={{
                  months: "w-full",
                  month: "w-full space-y-4",
                  table: "w-full border-collapse space-y-1",
                  head_row: "grid grid-cols-7",
                  row: "grid grid-cols-7 w-full mt-2",
                  cell: "relative flex h-12 items-center justify-center p-0 text-center text-sm",
                  day: "h-10 w-full rounded-xl p-0 font-semibold hover:bg-primary/10 hover:text-primary",
                  day_selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-primary/10 text-primary",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  nav: "flex items-center gap-2",
                  nav_button:
                    "h-9 w-9 rounded-xl border border-border bg-background text-muted-foreground hover:bg-primary/10 hover:text-primary",
                  caption:
                    "relative flex items-center justify-center pt-1 text-sm font-bold text-foreground",
                  caption_label: "text-sm font-bold",
                  head_cell:
                    "flex h-9 items-center justify-center text-xs font-bold text-muted-foreground",
                }}
              />

              <div className="mt-5 rounded-3xl bg-primary/[0.03] p-4 dark:bg-primary/10">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Clock className="h-5 w-5" />
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        {isArabic ? "اختيار الوقت" : "Select Time"}
                      </h4>

                      <p className="text-xs font-medium text-muted-foreground">
                        {selectedTime
                          ? isArabic
                            ? `الوقت المختار: ${formatAppointmentTime(
                                selectedTime
                              )}`
                            : `Selected time: ${formatAppointmentTime(
                                selectedTime
                              )}`
                          : isArabic
                          ? "اختار الوقت"
                          : "Select time"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleSelectTime(time)}
                      className={`rounded-2xl border px-3 py-3 text-xs font-bold transition-all ${
                        selectedTime === formatAppointmentTime(time)
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-background text-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      {formatAppointmentTime(time)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>

        <div className="flex justify-center">
          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as FilterType)}
          >
            <TabsList className="h-12 rounded-full border border-primary/20 bg-card p-1 shadow-sm">
              {[
                {
                  value: "today",
                  label: t("doctorDashboard.appointments.filterToday"),
                },
                {
                  value: "upcoming",
                  label: t("doctorDashboard.appointments.filterUpcoming"),
                },
                {
                  value: "next",
                  label: isArabic ? "التالي" : "Next",
                },
                {
                  value: "all",
                  label: t("doctorDashboard.appointments.filterAll"),
                },
              ].map((item) => (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="rounded-full px-8 text-sm font-medium text-primary transition-all hover:bg-primary/10 hover:text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                >
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div>
          {loading ? (
            <Card className="flex min-h-[360px] items-center justify-center rounded-3xl border border-border bg-card shadow-sm">
              <LoadingDots />
            </Card>
          ) : filteredAppointments.length > 0 ? (
            <>
              <div className="grid gap-4 md:hidden">
                {paginatedAppointments.map((apt) => (
                  <Card
                    key={apt.id}
                    className="rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-sm"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border border-primary/20 bg-primary/5">
                            <AvatarImage src={apt.profile_picture} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <UserIcon className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>

                          <div>
                            <h3 className="text-sm font-bold text-foreground">
                              {apt.patient_name}
                            </h3>
                          </div>
                        </div>

                        <span
                          className={`w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyles(
                            apt.status
                          )}`}
                        >
                          {getStatusText(apt.status)}
                        </span>
                      </div>

                      <div className="grid gap-3 rounded-2xl bg-muted/30 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-muted-foreground">
                            {isArabic ? "الوقت" : "Time"}
                          </span>

                          <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            {formatAppointmentTime(apt.time)}
                          </span>
                        </div>

                        <div>
                          <p className="mb-1 text-xs font-semibold text-muted-foreground">
                            {isArabic ? "سبب الزيارة" : "Visit Reason"}
                          </p>

                          <p className="text-sm font-medium text-foreground">
                            {apt.reason}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                        {apt.status === "In Progress" && (
                          <Button
                            onClick={() => handleJoinCall(apt)}
                            className="h-10 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                          >
                            <Video
                              className={cn(
                                "h-4 w-4",
                                isArabic ? "ml-2" : "mr-2"
                              )}
                            />
                            {t("doctorDashboard.appointments.joinCall")}
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          onClick={() => handleViewProfile(apt)}
                          className="h-10 rounded-full border-primary/30 bg-transparent px-4 text-sm font-semibold text-primary hover:bg-primary/10 hover:text-primary"
                        >
                          <Eye
                            className={cn(
                              "h-4 w-4",
                              isArabic ? "ml-2" : "mr-2"
                            )}
                          />
                          {t("doctorDashboard.appointments.viewProfile")}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="hidden overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm md:block">
                <div className="grid grid-cols-[1.4fr_1fr_1.4fr_0.9fr_1.2fr] border-b border-border bg-muted/40 px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <div>{isArabic ? "المريض" : "Patient"}</div>
                  <div>{isArabic ? "الوقت" : "Time"}</div>
                  <div>{isArabic ? "سبب الزيارة" : "Visit Reason"}</div>
                  <div>{isArabic ? "الحالة" : "Status"}</div>
                  <div>{isArabic ? "الإجراء" : "Action"}</div>
                </div>

                <div className="divide-y divide-border">
                  {paginatedAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="grid grid-cols-[1.4fr_1fr_1.4fr_0.9fr_1.2fr] items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-11 w-11 border border-primary/20 bg-primary/5">
                          <AvatarImage src={apt.profile_picture} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <UserIcon className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">
                            {apt.patient_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {formatAppointmentTime(apt.time)}
                      </div>

                      <p className="truncate text-sm font-medium text-foreground">
                        {apt.reason}
                      </p>

                      <span
                        className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyles(
                          apt.status
                        )}`}
                      >
                        {getStatusText(apt.status)}
                      </span>

                      <div className="flex flex-wrap items-center gap-2">
                        {apt.status === "In Progress" && (
                          <Button
                            onClick={() => handleJoinCall(apt)}
                            className="h-9 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                          >
                            <Video
                              className={cn(
                                "h-4 w-4",
                                isArabic ? "ml-1" : "mr-1"
                              )}
                            />
                            {t("doctorDashboard.appointments.joinCall")}
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          onClick={() => handleViewProfile(apt)}
                          className="h-9 rounded-full border-primary/30 bg-transparent px-3 text-xs font-semibold text-primary hover:bg-primary/10 hover:text-primary"
                        >
                          <Eye
                            className={cn(
                              "h-4 w-4",
                              isArabic ? "ml-1" : "mr-1"
                            )}
                          />
                          {t("doctorDashboard.appointments.viewProfile")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <Card className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card p-8 text-center shadow-sm">
              <CalendarIcon className="mb-4 h-10 w-10 text-muted-foreground" />

              <h3 className="text-base font-bold text-foreground">
                {t("doctorDashboard.appointments.empty")}
              </h3>

              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {isArabic
                  ? "لا توجد مواعيد مطابقة للبحث الحالي"
                  : "No appointments match your current search"}
              </p>
            </Card>
          )}
        </div>

        {filter !== "next" && (
          <Card className="rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-foreground">
                  {isArabic ? "الموعد القادم" : "Next Appointment"}
                </h4>

                <p className="text-sm font-medium text-muted-foreground">
                  {isArabic
                    ? "أقرب موعد نشط أو قادم"
                    : "Nearest active or upcoming appointment"}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            {nextAppointment ? (
              <div className="grid gap-4 rounded-2xl bg-muted/30 p-4 md:grid-cols-[1.2fr_0.7fr_1.2fr_0.8fr_1.2fr] md:items-center">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 border border-primary/20 bg-primary/5">
                    <AvatarImage src={nextAppointment.profile_picture} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <UserIcon className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {nextAppointment.patient_name}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {isArabic ? "الوقت" : "Time"}
                  </p>

                  <p className="text-sm font-bold text-foreground">
                    {formatAppointmentTime(nextAppointment.time)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {isArabic ? "سبب الزيارة" : "Visit Reason"}
                  </p>

                  <p className="text-sm font-medium text-foreground">
                    {nextAppointment.reason}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyles(
                    nextAppointment.status
                  )}`}
                >
                  {getStatusText(nextAppointment.status)}
                </span>

                <Button
                  type="button"
                  onClick={() => setFilter("next")}
                  className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  {isArabic ? "عرض الموعد التالي" : "View Next Appointment"}
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-5 text-center">
                <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

                <p className="text-sm font-medium text-muted-foreground">
                  {isArabic ? "لا يوجد موعد قادم" : "No upcoming appointment"}
                </p>
              </div>
            )}
          </Card>
        )}

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className="h-10 w-10 rounded-full border-primary/30 bg-card text-primary hover:bg-primary/10 disabled:opacity-40"
          >
            {isArabic ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>

          <div className="flex h-10 min-w-[110px] items-center justify-center rounded-full border border-border bg-card px-4 text-xs font-bold text-muted-foreground shadow-sm">
            {isArabic ? (
              <>
                صفحة <span className="mx-1 text-primary">{currentPage}</span>{" "}
                من <span className="mx-1 text-foreground">{totalPages}</span>
              </>
            ) : (
              <>
                Page <span className="mx-1 text-primary">{currentPage}</span>{" "}
                of <span className="mx-1 text-foreground">{totalPages}</span>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            className="h-10 w-10 rounded-full border-primary/30 bg-card text-primary hover:bg-primary/10 disabled:opacity-40"
          >
            {isArabic ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {showNewAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <Card className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {isArabic ? "إضافة حجز جديد" : "Add New Appointment"}
                </h3>

                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  {isArabic
                    ? "أدخل بيانات الحجز وسيظهر مباشرة في القائمة."
                    : "Enter appointment details and it will appear in the schedule."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowNewAppointment(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 rounded-2xl bg-primary/10 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-primary/70">
                {isArabic ? "التاريخ والوقت المختار" : "Selected Date & Time"}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-bold text-foreground">
                <span>{formattedSelectedDate || "--"}</span>
                <span className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">
                  {selectedTime
                    ? formatAppointmentTime(selectedTime)
                    : isArabic
                    ? "لم يتم اختيار وقت"
                    : "No time selected"}
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                placeholder={isArabic ? "اسم المريض" : "Patient name"}
                className="h-12 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground"
                value={newAppointment.patient_name}
                onChange={(e) =>
                  setNewAppointment((prev) => ({
                    ...prev,
                    patient_name: e.target.value,
                  }))
                }
              />

              <Input
                placeholder={isArabic ? "رقم المريض" : "Patient ID"}
                className="h-12 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground"
                value={newAppointment.patient_id}
                onChange={(e) =>
                  setNewAppointment((prev) => ({
                    ...prev,
                    patient_id: e.target.value,
                  }))
                }
              />

              <Input
                placeholder={isArabic ? "سبب الزيارة" : "Visit reason"}
                className="h-12 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground md:col-span-2"
                value={newAppointment.reason}
                onChange={(e) =>
                  setNewAppointment((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowNewAppointment(false)}
                className="h-11 rounded-full border-primary/30 bg-transparent px-5 text-primary hover:bg-primary/10"
              >
                {isArabic ? "إلغاء" : "Cancel"}
              </Button>

              <Button
                onClick={handleCreateAppointment}
                disabled={!selectedTime}
                className="h-11 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isArabic ? "إنشاء الحجز" : "Create Appointment"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Dialog open={openProfile} onOpenChange={setOpenProfile}>
        <DialogContent
          dir={isArabic ? "rtl" : "ltr"}
          className="max-h-[90vh] w-[92vw] overflow-y-auto rounded-3xl border border-border bg-card text-card-foreground sm:max-w-2xl"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              {isArabic ? "ملف المريض" : "Patient Profile"}
            </DialogTitle>

            <DialogDescription className="text-sm font-medium text-muted-foreground">
              {isArabic
                ? "بيانات المريض وآخر التقييمات المتاحة."
                : "Patient information and latest available assessments."}
            </DialogDescription>
          </DialogHeader>

          {profileLoading ? (
            <div className="flex min-h-[260px] items-center justify-center">
              <LoadingDots />
            </div>
          ) : selectedPatient ? (
            <div className="space-y-5 py-3">
              <div className="flex items-center gap-4 rounded-2xl bg-primary/[0.03] p-4 dark:bg-primary/10">
                <Avatar className="h-14 w-14 shrink-0 border border-primary/20 bg-primary/5">
                  <AvatarImage
                    src={
                      selectedPatient.profile?.profile_picture ||
                      selectedAppointment?.profile_picture
                    }
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <UserIcon className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-foreground">
                    {`${selectedPatient.first_name || ""} ${
                      selectedPatient.last_name || ""
                    }`.trim() ||
                      selectedAppointment?.patient_name ||
                      (isArabic ? "مريض بدون اسم" : "Unnamed Patient")}
                  </h3>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-background/40 p-4">
                <div className="mb-2 flex items-center gap-2 text-primary">
                  <Mail className="h-4 w-4" />

                  <span className="text-xs font-bold">
                    {isArabic ? "البريد الإلكتروني" : "Email"}
                  </span>
                </div>

                <p className="truncate text-sm font-semibold text-foreground">
                  {selectedPatient.email ||
                    (isArabic ? "لا يوجد بريد" : "No email")}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background/40 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />

                    <h4 className="text-sm font-bold text-foreground">
                      {isArabic ? "آخر التقييمات" : "Latest Assessments"}
                    </h4>
                  </div>

                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    {selectedPatient.predictions?.length || 0}
                  </span>
                </div>

                {selectedPatient.predictions?.length ? (
                  <div className="space-y-3">
                    {selectedPatient.predictions
                      .slice(0, 3)
                      .map((prediction) => (
                        <div
                          key={prediction.id}
                          className="flex flex-col gap-3 rounded-xl bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm font-bold text-foreground">
                              {prediction.risk_level || "Risk"}
                            </p>

                            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                              <CalendarIcon className="h-3.5 w-3.5" />
                              {prediction.created_at
                                ? new Date(
                                    prediction.created_at
                                  ).toLocaleDateString(
                                    isArabic ? "ar-EG" : "en-US"
                                  )
                                : "--"}
                            </p>
                          </div>

                          <div className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                            {prediction.probability}%
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-muted-foreground">
                    {isArabic
                      ? "لا توجد تقييمات متاحة"
                      : "No assessments available"}
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}