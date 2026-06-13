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
  ChevronLeft,
  ChevronRight,
  Activity,
  Mail,
  UserCheck,
  CalendarCheck,
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
  status: "Pending" | "Upcoming" | "In Progress" | "Completed" | "Cancelled";
  profile_picture?: string;
  meeting_url?: string;
  call_url?: string;
  video_link?: string;
  appointment_date?: string;
  source?: "doctor" | "patient";
}

type PatientDetails = User & {
  predictions?: Prediction[];
};

export default function AppointmentsPage() {
  const { t, i18n } = useTranslation();
  const { execute: apiCall } = useApiCall();
  const isArabic = i18n.language === "ar";

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [requestsPage, setRequestsPage] = useState(1);
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const [nextPage, setNextPage] = useState(1);

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

  const requestsPageSize = 3;
  const appointmentsPageSize = 3;
  const nextPageSize = 3;

  const requestGridClass =
    "grid grid-cols-[1.3fr_1fr_1.4fr_0.9fr_1.8fr]";
  const appointmentGridClass =
    "grid grid-cols-[1.3fr_1fr_1.4fr_0.9fr_1.3fr]";

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

  const tableColumns = [
    {
      key: "patient",
      label: isArabic ? "اسم المريض" : "Patient Name",
    },
    {
      key: "time",
      label: isArabic ? "وقت الموعد" : "Appointment Time",
    },
    {
      key: "reason",
      label: isArabic ? "سبب الزيارة" : "Visit Reason",
    },
    {
      key: "status",
      label: isArabic ? "حالة الموعد" : "Appointment Status",
    },
    {
      key: "actions",
      label: isArabic ? "الإجراءات" : "Actions",
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

  const formatSelectedDate = (selectedDate?: Date) => {
    if (!selectedDate) return "--";

    return selectedDate.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formattedSelectedDate = formatSelectedDate(date);

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

  const handleApproveAppointment = (appt: Appointment) => {
    setAppointments((prev) =>
      prev.map((item) =>
        item.id === appt.id
          ? {
              ...item,
              status: "Upcoming",
              source: "doctor",
            }
          : item
      )
    );

    toast.success(
      isArabic
        ? `تم قبول طلب ${appt.patient_name}`
        : `${appt.patient_name}'s request approved`
    );
  };

  const handleRejectAppointment = (appt: Appointment) => {
    setAppointments((prev) =>
      prev.map((item) =>
        item.id === appt.id
          ? {
              ...item,
              status: "Cancelled",
            }
          : item
      )
    );

    toast.success(
      isArabic
        ? `تم رفض طلب ${appt.patient_name}`
        : `${appt.patient_name}'s request rejected`
    );
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

  const fetchAppointments = async () => {
    try {
      setLoading(true);

      const data: any = await apiCall(API_ENDPOINTS.DOCTOR_APPOINTMENTS_TODAY);

      const appointmentsList = Array.isArray(data)
        ? data
        : data?.appointments ||
          data?.today_appointments ||
          data?.doctor_appointments ||
          data?.results ||
          data?.data ||
          [];

      if (!Array.isArray(appointmentsList) || appointmentsList.length === 0) {
        setAppointments([]);
        return;
      }

      const mapped = appointmentsList.map((apt: any) => {
        const rawStatus = String(apt.status || "").toLowerCase();

        return {
          id: apt.id,
          patient_name:
            apt.patient_name ||
            apt.patient?.name ||
            apt.patient?.full_name ||
            [apt.patient?.first_name, apt.patient?.last_name]
              .filter(Boolean)
              .join(" ")
              .trim() ||
            "Unknown Patient",
          patient_id:
            apt.patient_id ||
            apt.patient_user ||
            apt.patient?.id ||
            `PID-${apt.id || "Unknown"}`,
          patient_user: apt.patient_user || apt.patient?.id || apt.user_id,
          time: formatAppointmentTime(
            apt.time ||
              apt.appointment_time ||
              apt.appointment_datetime ||
              apt.datetime ||
              apt.scheduled_at ||
              apt.start_time
          ),
          reason: apt.reason || apt.condition || "Medical Consultation",
          status:
            rawStatus === "pending" || rawStatus === "requested"
              ? "Pending"
              : rawStatus === "completed"
              ? "Completed"
              : rawStatus === "cancelled" || rawStatus === "rejected"
              ? "Cancelled"
              : rawStatus === "in_progress"
              ? "In Progress"
              : "Upcoming",
          profile_picture:
            apt.profile_picture || apt.patient?.profile_picture || "",
          meeting_url: apt.meeting_url,
          call_url: apt.call_url,
          video_link: apt.video_link,
          appointment_date:
            apt.appointment_date ||
            apt.date ||
            apt.appointment_datetime ||
            apt.datetime ||
            apt.created_at,
          source:
            rawStatus === "pending" || rawStatus === "requested"
              ? "patient"
              : "doctor",
        } as Appointment;
      });

      setAppointments(mapped);
    } catch (error) {
      console.error("Failed to fetch appointments", error);
      setAppointments([]);

      toast.error(
        isArabic
          ? "فشل تحميل المواعيد من الخادم"
          : "Failed to load appointments from server"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [apiCall, isArabic]);

  useEffect(() => {
    setRequestsPage(1);
    setAppointmentsPage(1);
    setNextPage(1);
  }, [search]);

  const filteredAppointments = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return appointments;

    return appointments.filter(
      (apt) =>
        apt.patient_name.toLowerCase().includes(q) ||
        String(apt.patient_id).toLowerCase().includes(q) ||
        apt.reason.toLowerCase().includes(q) ||
        apt.status.toLowerCase().includes(q)
    );
  }, [appointments, search]);

  const patientRequests = useMemo(() => {
    return filteredAppointments.filter((apt) => apt.status === "Pending");
  }, [filteredAppointments]);

  const doctorAppointments = useMemo(() => {
    return filteredAppointments.filter((apt) => apt.status !== "Pending");
  }, [filteredAppointments]);

  const confirmedAppointments = useMemo(() => {
    return appointments.filter(
      (apt) => apt.status === "In Progress" || apt.status === "Upcoming"
    );
  }, [appointments]);

  const requestsTotalPages = Math.max(
    1,
    Math.ceil(patientRequests.length / requestsPageSize)
  );

  const appointmentsTotalPages = Math.max(
    1,
    Math.ceil(doctorAppointments.length / appointmentsPageSize)
  );

  const nextTotalPages = Math.max(
    1,
    Math.ceil(confirmedAppointments.length / nextPageSize)
  );

  const paginatedPatientRequests = useMemo(() => {
    const safePage = Math.min(requestsPage, requestsTotalPages);
    const start = (safePage - 1) * requestsPageSize;

    return patientRequests.slice(start, start + requestsPageSize);
  }, [patientRequests, requestsPage, requestsTotalPages]);

  const paginatedDoctorAppointments = useMemo(() => {
    const safePage = Math.min(appointmentsPage, appointmentsTotalPages);
    const start = (safePage - 1) * appointmentsPageSize;

    return doctorAppointments.slice(start, start + appointmentsPageSize);
  }, [doctorAppointments, appointmentsPage, appointmentsTotalPages]);

  const paginatedNextAppointments = useMemo(() => {
    const safePage = Math.min(nextPage, nextTotalPages);
    const start = (safePage - 1) * nextPageSize;

    return confirmedAppointments.slice(start, start + nextPageSize);
  }, [confirmedAppointments, nextPage, nextTotalPages]);

  const firstNextAppointment = confirmedAppointments[0] || null;

  const getStatusStyles = (status: Appointment["status"]) => {
    switch (status) {
      case "Pending":
        return "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300";
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
    if (status === "Pending") return isArabic ? "في انتظار التأكيد" : "Pending";
    if (status === "In Progress") return isArabic ? "الآن" : "Now";
    if (status === "Completed")
      return t("doctorDashboard.appointments.statusCompleted");
    if (status === "Cancelled") return isArabic ? "مرفوض / ملغي" : "Rejected";
    return t("doctorDashboard.appointments.statusUpcoming");
  };

  const closeNewAppointmentModal = () => {
    setShowNewAppointment(false);
  };

  const handleOpenNewAppointment = () => {
    setShowNewAppointment(true);
  };

  const handleCreateAppointment = () => {
    if (
      !newAppointment.patient_name.trim() ||
      !selectedTime.trim() ||
      !newAppointment.reason.trim() ||
      !date
    ) {
      toast.info(
        isArabic
          ? "كمّل اسم المريض، سبب الزيارة، التاريخ والوقت"
          : "Complete patient name, visit reason, date and time"
      );
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
      appointment_date: date.toISOString(),
      source: "doctor",
    };

    setAppointments((prev) => [createdAppointment, ...prev]);

    setNewAppointment({
      patient_name: "",
      patient_id: "",
      reason: "",
    });

    setSelectedTime("");
    setDate(new Date());
    setShowNewAppointment(false);
    setAppointmentsPage(1);
    setNextPage(1);

    toast.success(
      isArabic ? "تم إنشاء الحجز بنجاح" : "Appointment created successfully"
    );
  };

  const renderPager = ({
    page,
    totalPages,
    onPrevious,
    onNext,
  }: {
    page: number;
    totalPages: number;
    onPrevious: () => void;
    onNext: () => void;
  }) => {
    return (
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          disabled={page === 1}
          onClick={onPrevious}
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
              صفحة <span className="mx-1 text-primary">{page}</span> من{" "}
              <span className="mx-1 text-foreground">{totalPages}</span>
            </>
          ) : (
            <>
              Page <span className="mx-1 text-primary">{page}</span> of{" "}
              <span className="mx-1 text-foreground">{totalPages}</span>
            </>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          disabled={page === totalPages}
          onClick={onNext}
          className="h-10 w-10 rounded-full border-primary/30 bg-card text-primary hover:bg-primary/10 disabled:opacity-40"
        >
          {isArabic ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  };

  const renderTableHeader = (gridClass: string) => {
    return (
      <div
        className={cn(
          gridClass,
          "items-center gap-4 border-b border-border bg-muted/40 px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
        )}
      >
        {tableColumns.map((column) => (
          <div key={column.key} className="truncate text-start">
            {column.label}
          </div>
        ))}
      </div>
    );
  };

  const renderPatientRequestActions = (apt: Appointment) => {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => handleApproveAppointment(apt)}
          className="h-9 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
        >
          {isArabic ? "قبول" : "Approve"}
        </Button>

        <Button
          onClick={() => handleRejectAppointment(apt)}
          className="h-9 rounded-full border border-red-200 bg-red-50 px-4 text-xs font-semibold text-red-700 hover:bg-red-100 hover:text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
        >
          {isArabic ? "رفض" : "Reject"}
        </Button>

        <Button
          variant="outline"
          onClick={() => handleViewProfile(apt)}
          className="h-9 rounded-full border-primary/30 bg-transparent px-3 text-xs font-semibold text-primary hover:bg-primary/10 hover:text-primary"
        >
          <Eye className={cn("h-4 w-4", isArabic ? "ml-1" : "mr-1")} />
          {t("doctorDashboard.appointments.viewProfile")}
        </Button>
      </div>
    );
  };

  const renderDoctorAppointmentActions = (apt: Appointment) => {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {apt.status === "In Progress" && (
          <Button
            onClick={() => handleJoinCall(apt)}
            className="h-9 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Video className={cn("h-4 w-4", isArabic ? "ml-1" : "mr-1")} />
            {t("doctorDashboard.appointments.joinCall")}
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => handleViewProfile(apt)}
          className="h-9 rounded-full border-primary/30 bg-transparent px-3 text-xs font-semibold text-primary hover:bg-primary/10 hover:text-primary"
        >
          <Eye className={cn("h-4 w-4", isArabic ? "ml-1" : "mr-1")} />
          {t("doctorDashboard.appointments.viewProfile")}
        </Button>
      </div>
    );
  };

  const renderMobileAppointmentCard = (
    apt: Appointment,
    type: "request" | "appointment"
  ) => {
    return (
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

                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                  {apt.patient_id}
                </p>
              </div>
            </div>

            <span
              className={cn(
                "w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-bold",
                getStatusStyles(apt.status)
              )}
            >
              {getStatusText(apt.status)}
            </span>
          </div>

          <div className="grid gap-3 rounded-2xl bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-muted-foreground">
                {isArabic ? "وقت الموعد" : "Appointment Time"}
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

          <div className="border-t border-border pt-4">
            {type === "request"
              ? renderPatientRequestActions(apt)
              : renderDoctorAppointmentActions(apt)}
          </div>
        </div>
      </Card>
    );
  };

  const statCards = [
    {
      title: isArabic ? "طلبات المرضى" : "Patient Requests",
      value: patientRequests.length,
      description: isArabic
        ? "طلبات تحتاج قبول أو رفض"
        : "Requests waiting for approval",
      icon: UserCheck,
    },
    {
      title: isArabic ? "مواعيد الدكتور" : "Doctor Appointments",
      value: doctorAppointments.length,
      description: isArabic
        ? "مواعيد مؤكدة أو منشأة من الدكتور"
        : "Confirmed or doctor-created appointments",
      icon: CalendarCheck,
    },
    {
      title: isArabic ? "الموعد القادم" : "Next Appointment",
      value: firstNextAppointment
        ? firstNextAppointment.patient_name
        : isArabic
        ? "لا يوجد"
        : "None",
      description: firstNextAppointment
        ? `${formatAppointmentTime(firstNextAppointment.time)} • ${
            firstNextAppointment.reason
          }`
        : isArabic
        ? "لا يوجد موعد قادم"
        : "No upcoming appointment",
      icon: Clock,
    },
  ];

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
                ? "إدارة طلبات المرضى والمواعيد المؤكدة والموعد القادم"
                : "Manage patient requests, confirmed appointments, and the next appointment"}
            </p>
          </div>

          <div className="flex w-full flex-row items-center gap-3 lg:w-auto">
            <div className="relative min-w-0 flex-1 lg:w-[420px] lg:flex-none">
              <Search
                className={cn(
                  "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
                  isArabic ? "right-4" : "left-4"
                )}
              />

              <Input
                placeholder={t(
                  "doctorDashboard.appointments.searchPlaceholder"
                )}
                className={cn(
                  "h-12 w-full rounded-2xl border border-border bg-card text-sm font-semibold text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:ring-4 focus-visible:ring-primary/10",
                  isArabic ? "pr-11 pl-9" : "pl-11 pr-9"
                )}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary",
                    isArabic ? "left-3" : "right-3"
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Button
              onClick={handleOpenNewAppointment}
              className="h-12 shrink-0 rounded-2xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 sm:px-6 sm:text-sm"
            >
              {t("doctorDashboard.appointments.newAppointment")}
            </Button>
          </div>
        </div>

        {loading ? (
          <Card className="flex min-h-[360px] items-center justify-center rounded-3xl border border-border bg-card shadow-sm">
            <LoadingDots />
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {statCards.map((item) => {
                const Icon = item.icon;

                return (
                  <Card
                    key={item.title}
                    className="rounded-3xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          {item.title}
                        </p>

                        <p
                          className={cn(
                            "mt-3 font-bold text-foreground",
                            typeof item.value === "number"
                              ? "text-3xl"
                              : "truncate text-lg"
                          )}
                        >
                          {item.value}
                        </p>

                        <p className="mt-1 line-clamp-2 text-sm font-medium text-muted-foreground">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card className="rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-sm">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {isArabic ? "طلبات الحجز من المرضى" : "Patient Requests"}
                  </h2>

                  <p className="text-sm font-medium text-muted-foreground">
                    {isArabic
                      ? "الطلبات التي أرسلها المرضى وتحتاج تأكيد من الدكتور"
                      : "Requests sent by patients and waiting for doctor approval"}
                  </p>
                </div>

                <span className="w-fit rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300">
                  {patientRequests.length}{" "}
                  {isArabic ? "طلب معلق" : "Pending"}
                </span>
              </div>

              {patientRequests.length > 0 ? (
                <>
                  <div className="grid gap-4 md:hidden">
                    {paginatedPatientRequests.map((apt) =>
                      renderMobileAppointmentCard(apt, "request")
                    )}
                  </div>

                  <div className="hidden overflow-hidden rounded-2xl border border-border md:block">
                    {renderTableHeader(requestGridClass)}

                    <div className="divide-y divide-border">
                      {paginatedPatientRequests.map((apt) => (
                        <div
                          key={apt.id}
                          className={cn(
                            requestGridClass,
                            "items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/30"
                          )}
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

                              <p className="truncate text-xs font-semibold text-muted-foreground">
                                {apt.patient_id}
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
                            className={cn(
                              "w-fit rounded-full border px-3 py-1 text-xs font-bold",
                              getStatusStyles(apt.status)
                            )}
                          >
                            {getStatusText(apt.status)}
                          </span>

                          {renderPatientRequestActions(apt)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5">
                    {renderPager({
                      page: Math.min(requestsPage, requestsTotalPages),
                      totalPages: requestsTotalPages,
                      onPrevious: () =>
                        setRequestsPage((prev) => Math.max(1, prev - 1)),
                      onNext: () =>
                        setRequestsPage((prev) =>
                          Math.min(requestsTotalPages, prev + 1)
                        ),
                    })}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  <CalendarIcon className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />

                  <p className="text-sm font-bold text-foreground">
                    {isArabic
                      ? "لا توجد طلبات حجز معلقة"
                      : "No pending appointment requests"}
                  </p>

                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    {isArabic
                      ? "أي طلب جديد من المريض سيظهر هنا للموافقة أو الرفض"
                      : "New patient requests will appear here for approval or rejection"}
                  </p>
                </div>
              )}
            </Card>

            <Card className="rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-sm">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {isArabic ? "مواعيد الدكتور" : "Doctor Appointments"}
                  </h2>

                  <p className="text-sm font-medium text-muted-foreground">
                    {isArabic
                      ? "المواعيد المؤكدة أو التي تم إنشاؤها من الدكتور"
                      : "Confirmed appointments or appointments created by the doctor"}
                  </p>
                </div>

                <span className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {doctorAppointments.length}{" "}
                  {isArabic ? "موعد" : "Appointments"}
                </span>
              </div>

              {doctorAppointments.length > 0 ? (
                <>
                  <div className="grid gap-4 md:hidden">
                    {paginatedDoctorAppointments.map((apt) =>
                      renderMobileAppointmentCard(apt, "appointment")
                    )}
                  </div>

                  <div className="hidden overflow-hidden rounded-2xl border border-border md:block">
                    {renderTableHeader(appointmentGridClass)}

                    <div className="divide-y divide-border">
                      {paginatedDoctorAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className={cn(
                            appointmentGridClass,
                            "items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/30"
                          )}
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

                              <p className="truncate text-xs font-semibold text-muted-foreground">
                                {apt.patient_id}
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
                            className={cn(
                              "w-fit rounded-full border px-3 py-1 text-xs font-bold",
                              getStatusStyles(apt.status)
                            )}
                          >
                            {getStatusText(apt.status)}
                          </span>

                          {renderDoctorAppointmentActions(apt)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5">
                    {renderPager({
                      page: Math.min(appointmentsPage, appointmentsTotalPages),
                      totalPages: appointmentsTotalPages,
                      onPrevious: () =>
                        setAppointmentsPage((prev) => Math.max(1, prev - 1)),
                      onNext: () =>
                        setAppointmentsPage((prev) =>
                          Math.min(appointmentsTotalPages, prev + 1)
                        ),
                    })}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  <Clock className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />

                  <p className="text-sm font-bold text-foreground">
                    {isArabic
                      ? "لا توجد مواعيد مؤكدة"
                      : "No confirmed appointments"}
                  </p>

                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    {isArabic
                      ? "أنشئ موعد جديد أو اقبل طلب من المريض ليظهر هنا"
                      : "Create a new appointment or approve a patient request to show it here"}
                  </p>
                </div>
              )}
            </Card>

            <Card className="rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {isArabic ? "المواعيد القادمة" : "Next Appointments"}
                  </h2>

                  <p className="text-sm font-medium text-muted-foreground">
                    {isArabic
                      ? "أقرب المواعيد المؤكدة أو النشطة"
                      : "Nearest confirmed or active appointments"}
                  </p>
                </div>

                <span className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {confirmedAppointments.length}{" "}
                  {isArabic ? "موعد قادم" : "Upcoming"}
                </span>
              </div>

              {confirmedAppointments.length > 0 ? (
                <>
                  <div className="grid gap-4 md:hidden">
                    {paginatedNextAppointments.map((apt) =>
                      renderMobileAppointmentCard(apt, "appointment")
                    )}
                  </div>

                  <div className="hidden overflow-hidden rounded-2xl border border-border md:block">
                    {renderTableHeader(appointmentGridClass)}

                    <div className="divide-y divide-border">
                      {paginatedNextAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className={cn(
                            appointmentGridClass,
                            "items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/30"
                          )}
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

                              <p className="truncate text-xs font-semibold text-muted-foreground">
                                {apt.patient_id}
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
                            className={cn(
                              "w-fit rounded-full border px-3 py-1 text-xs font-bold",
                              getStatusStyles(apt.status)
                            )}
                          >
                            {getStatusText(apt.status)}
                          </span>

                          {renderDoctorAppointmentActions(apt)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5">
                    {renderPager({
                      page: Math.min(nextPage, nextTotalPages),
                      totalPages: nextTotalPages,
                      onPrevious: () =>
                        setNextPage((prev) => Math.max(1, prev - 1)),
                      onNext: () =>
                        setNextPage((prev) =>
                          Math.min(nextTotalPages, prev + 1)
                        ),
                    })}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  <Clock className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />

                  <p className="text-sm font-bold text-foreground">
                    {isArabic ? "لا توجد مواعيد قادمة" : "No next appointments"}
                  </p>

                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    {isArabic
                      ? "أي موعد مؤكد أو نشط سيظهر هنا"
                      : "Any confirmed or active appointment will appear here"}
                  </p>
                </div>
              )}
            </Card>
          </>
        )}
      </div>

      {showNewAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <Card className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl">
            <div className="flex max-h-[92vh] flex-col">
              <div className="shrink-0 border-b border-border px-5 py-4 md:px-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {isArabic ? "إضافة حجز جديد" : "Add New Appointment"}
                  </h3>

                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    {isArabic
                      ? "أدخل بيانات المريض ثم اختر التاريخ والوقت."
                      : "Enter patient details, then choose date and time."}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 md:p-6">
                <div className="mb-5 rounded-3xl border border-border bg-muted/25 p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <UserIcon className="h-5 w-5" />
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        {isArabic ? "بيانات المريض" : "Patient Details"}
                      </h4>

                      <p className="text-xs font-medium text-muted-foreground">
                        {isArabic
                          ? "املأ البيانات الأساسية للحجز"
                          : "Fill in the basic appointment details"}
                      </p>
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
                </div>

                <div className="mb-5 rounded-2xl bg-primary/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary/70">
                    {isArabic ? "ملخص الحجز" : "Appointment Summary"}
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

                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-3xl border border-border bg-background/50 p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <CalendarIcon className="h-5 w-5" />
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-foreground">
                          {isArabic ? "اختيار التاريخ" : "Select Date"}
                        </h4>

                        <p className="text-xs font-medium text-muted-foreground">
                          {formattedSelectedDate}
                        </p>
                      </div>
                    </div>

                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(selectedDate) => {
                        if (!selectedDate) return;
                        setDate(selectedDate);
                      }}
                      className="w-full"
                      classNames={{
                        months: "w-full",
                        month: "w-full space-y-4",
                        table: "w-full border-collapse space-y-1",
                        head_row: "grid grid-cols-7",
                        row: "grid grid-cols-7 w-full mt-2",
                        cell: "relative flex h-11 items-center justify-center p-0 text-center text-sm",
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
                  </div>

                  <div className="rounded-3xl border border-border bg-primary/[0.03] p-4 dark:bg-primary/10">
                    <div className="mb-4 flex items-center gap-3">
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
                            ? "اختار الوقت المناسب للحجز"
                            : "Choose the appointment time"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                      {timeSlots.map((time) => {
                        const formattedTime = formatAppointmentTime(time);

                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedTime(formattedTime)}
                            className={cn(
                              "rounded-2xl border px-3 py-3 text-xs font-bold transition-all",
                              selectedTime === formattedTime
                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                : "border-border bg-background text-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                            )}
                          >
                            {formattedTime}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 justify-end gap-3 border-t border-border px-5 py-4 md:px-6">
                <Button
                  variant="outline"
                  onClick={closeNewAppointmentModal}
                  className="h-11 rounded-full border-primary/30 bg-transparent px-5 text-primary hover:bg-primary/10"
                >
                  {isArabic ? "إلغاء" : "Cancel"}
                </Button>

                <Button
                  onClick={handleCreateAppointment}
                  disabled={
                    !newAppointment.patient_name.trim() ||
                    !newAppointment.reason.trim() ||
                    !selectedTime ||
                    !date
                  }
                  className="h-11 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isArabic ? "إنشاء الحجز" : "Create Appointment"}
                </Button>
              </div>
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