import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Video,
  CalendarDays,
  Clock3,
  Stethoscope,
  User,
  Info,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Bell,
  Star,
  X,
  Award,
  UsersRound,
  Eye,
  Search,
} from "lucide-react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useIsVisible } from "@/hooks/useIsVisible";
import { cn } from "@/lib/utils";

type AppointmentStatus = "upcoming" | "joinable" | "cancelled";

type SpecialtyValue = "diabetologist" | "cardiologist";

type AppointmentSpecialtyFilter = "all" | SpecialtyValue;

type DoctorOption = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  experience: string;
  patients: string;
  bio: string;
};

type Appointment = {
  id: number;
  doctorId: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  image: string;
  status?: AppointmentStatus;
};

const DESKTOP_HEADER_HEIGHT = 72;
const APPOINTMENTS_PER_PAGE = 5;

const formatDateLocal = (selectedDate: Date) => {
  const year = selectedDate.getFullYear();
  const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
  const day = String(selectedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDateFromOffset = (offset: number) => {
  const nextDate = new Date();
  nextDate.setHours(12, 0, 0, 0);
  nextDate.setDate(nextDate.getDate() + offset);

  return nextDate;
};

const Consultations = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const heroRef = useRef(null);
  const bookingRef = useRef(null);
  const appointmentsRef = useRef(null);

  const heroVisible = useIsVisible(heroRef);
  const bookingVisible = useIsVisible(bookingRef);
  const appointmentsVisible = useIsVisible(appointmentsRef);

  const specialtyOptions: Record<SpecialtyValue, string> = {
    diabetologist: isArabic ? "طبيب سكري" : "Diabetologist",
    cardiologist: isArabic ? "طبيب قلب" : "Cardiologist",
  };

  const doctorsBySpecialty: Record<SpecialtyValue, DoctorOption[]> = {
    diabetologist: [
      {
        id: "diabetes-1",
        name: isArabic ? "د. سارة محمود" : "Dr. Sara Mahmoud",
        specialty: specialtyOptions.diabetologist,
        rating: 4.9,
        reviews: 128,
        experience: isArabic ? "8 سنوات" : "8 Years",
        patients: "1.8k+",
        bio: isArabic
          ? "طبيبة متخصصة في متابعة مرض السكري، ضبط نسب السكر، وخطط التغذية العلاجية والمتابعة الدورية."
          : "Specialized in diabetes follow-up, glucose control, medical nutrition plans, and long-term patient monitoring.",
      },
      {
        id: "diabetes-2",
        name: isArabic ? "د. أحمد حسن" : "Dr. Ahmed Hassan",
        specialty: specialtyOptions.diabetologist,
        rating: 4.8,
        reviews: 96,
        experience: isArabic ? "10 سنوات" : "10 Years",
        patients: "2.4k+",
        bio: isArabic
          ? "طبيب متخصص في تشخيص ومتابعة حالات السكري من النوع الأول والثاني وتقليل عوامل الخطورة."
          : "Focused on diagnosing and monitoring type 1 and type 2 diabetes while reducing risk factors.",
      },
    ],
    cardiologist: [
      {
        id: "cardio-1",
        name: isArabic ? "د. ليلى ناصر" : "Dr. Laila Nasser",
        specialty: specialtyOptions.cardiologist,
        rating: 4.9,
        reviews: 142,
        experience: isArabic ? "9 سنوات" : "9 Years",
        patients: "2.1k+",
        bio: isArabic
          ? "طبيبة قلب متخصصة في تقييم مخاطر القلب والأوعية الدموية، ضغط الدم، والمتابعة الوقائية."
          : "Cardiologist specialized in cardiovascular risk assessment, blood pressure control, and preventive follow-up.",
      },
      {
        id: "cardio-2",
        name: isArabic ? "د. عمر خالد" : "Dr. Omar Khaled",
        specialty: specialtyOptions.cardiologist,
        rating: 4.7,
        reviews: 88,
        experience: isArabic ? "7 سنوات" : "7 Years",
        patients: "1.5k+",
        bio: isArabic
          ? "طبيب قلب يهتم بمتابعة ضغط الدم، الكوليسترول، وتقييم الحالة العامة لصحة القلب."
          : "Cardiologist focused on blood pressure, cholesterol follow-up, and overall heart health evaluation.",
      },
    ],
  };

  const allDoctors = useMemo(
    () => [
      ...doctorsBySpecialty.diabetologist,
      ...doctorsBySpecialty.cardiologist,
    ],
    [isArabic]
  );

  const timeSlots = ["10:00", "11:00", "12:00", "13:30", "14:00", "15:00"];

  const [date, setDate] = useState<Date | undefined>(getDateFromOffset(2));
  const [specialty, setSpecialty] = useState<SpecialtyValue | "">("");
  const [doctorId, setDoctorId] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimeSlots, setShowTimeSlots] = useState(false);

  const [reschedulingId, setReschedulingId] = useState<number | null>(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState("");
  const [newRescheduleTime, setNewRescheduleTime] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDoctorProfile, setSelectedDoctorProfile] =
    useState<DoctorOption | null>(null);

  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [appointmentSpecialtyFilter, setAppointmentSpecialtyFilter] =
    useState<AppointmentSpecialtyFilter>("all");

  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: 1,
      doctorId: "diabetes-1",
      doctor: isArabic ? "د. سارة محمود" : "Dr. Sara Mahmoud",
      specialty: specialtyOptions.diabetologist,
      date: formatDateLocal(getDateFromOffset(5)),
      time: "14:00",
      image: "/placeholder.svg",
    },
    {
      id: 2,
      doctorId: "cardio-1",
      doctor: isArabic ? "د. ليلى ناصر" : "Dr. Laila Nasser",
      specialty: specialtyOptions.cardiologist,
      date: formatDateLocal(getDateFromOffset(3)),
      time: "10:00",
      image: "/placeholder.svg",
    },
    {
      id: 3,
      doctorId: "cardio-2",
      doctor: isArabic ? "د. عمر خالد" : "Dr. Omar Khaled",
      specialty: specialtyOptions.cardiologist,
      date: formatDateLocal(getDateFromOffset(8)),
      time: "16:30",
      image: "/placeholder.svg",
      status: "cancelled",
    },
  ]);

  const availableDoctors = specialty
    ? doctorsBySpecialty[specialty as SpecialtyValue]
    : [];

  const selectedDoctor = availableDoctors.find(
    (doctor) => doctor.id === doctorId
  );

  const getDoctorProfile = (appointment: Appointment) => {
    return (
      allDoctors.find((doctor) => doctor.id === appointment.doctorId) ||
      allDoctors.find((doctor) => doctor.name === appointment.doctor)
    );
  };

  const filteredAppointments = useMemo(() => {
    const normalizedSearch = appointmentSearch.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const doctorProfile = getDoctorProfile(appointment);

      const matchesSpecialty =
        appointmentSpecialtyFilter === "all" ||
        appointment.doctorId.startsWith(
          appointmentSpecialtyFilter === "diabetologist" ? "diabetes" : "cardio"
        );

      const matchesSearch =
        !normalizedSearch ||
        appointment.doctor.toLowerCase().includes(normalizedSearch) ||
        appointment.specialty.toLowerCase().includes(normalizedSearch) ||
        doctorProfile?.name.toLowerCase().includes(normalizedSearch) ||
        doctorProfile?.specialty.toLowerCase().includes(normalizedSearch);

      return matchesSpecialty && matchesSearch;
    });
  }, [appointments, appointmentSearch, appointmentSpecialtyFilter, allDoctors]);

  const sortedAppointments = useMemo(() => {
    return [...filteredAppointments].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);

      return dateA.getTime() - dateB.getTime();
    });
  }, [filteredAppointments]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedAppointments.length / APPOINTMENTS_PER_PAGE)
  );

  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * APPOINTMENTS_PER_PAGE;
    const endIndex = startIndex + APPOINTMENTS_PER_PAGE;

    return sortedAppointments.slice(startIndex, endIndex);
  }, [sortedAppointments, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appointmentSearch, appointmentSpecialtyFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const hasActiveAppointmentFilters =
    appointmentSearch.trim() || appointmentSpecialtyFilter !== "all";

  const renderStars = (rating: number, size: "sm" | "md" = "sm") => {
    const roundedRating = Math.round(rating);

    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, index) => {
          const active = index < roundedRating;

          return (
            <Star
              key={index}
              className={cn(
                size === "md" ? "h-4 w-4" : "h-3.5 w-3.5",
                active
                  ? "fill-amber-400 text-amber-400"
                  : "fill-muted text-muted-foreground/40"
              )}
            />
          );
        })}
      </div>
    );
  };

  const nextDays = Array.from({ length: 6 }, (_, index) => {
    const itemDate = getDateFromOffset(index + 1);

    return {
      date: itemDate,
      dayName: itemDate.toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
        weekday: "short",
      }),
      dayNumber: itemDate.getDate(),
      value: formatDateLocal(itemDate),
    };
  });

  const selectedDateLabel = date
    ? date.toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : isArabic
    ? "اختاري التاريخ"
    : "Select date";

  const selectedFullDateLabel = date
    ? date.toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : isArabic
    ? "لم يتم اختيار التاريخ"
    : "No date selected";

  const handleSpecialtyChange = (value: SpecialtyValue) => {
    setSpecialty(value);
    setDoctorId("");
  };

  const handleBooking = () => {
    if (!date || !specialty || !doctorId || !timeSlot) {
      toast.error(t("consultationsPage.selectRequired"));
      return;
    }

    if (!selectedDoctor) {
      toast.error(
        isArabic ? "من فضلك اختاري دكتور صحيح" : "Please select a valid doctor"
      );
      return;
    }

    const formattedDate = formatDateLocal(date);

    const isAlreadyBooked = appointments.some(
      (appointment) =>
        appointment.status !== "cancelled" &&
        appointment.date === formattedDate &&
        appointment.time === timeSlot &&
        appointment.doctorId === selectedDoctor.id
    );

    if (isAlreadyBooked) {
      toast.error(t("consultationsPage.slotBooked"));
      return;
    }

    const newAppointment: Appointment = {
      id: Date.now(),
      doctorId: selectedDoctor.id,
      doctor: selectedDoctor.name,
      specialty: selectedDoctor.specialty,
      date: formattedDate,
      time: timeSlot,
      image: "/placeholder.svg",
    };

    setAppointments((prevAppointments) => [
      newAppointment,
      ...prevAppointments,
    ]);

    setCurrentPage(1);

    toast.success(t("consultationsPage.confirmed"));

    setSpecialty("");
    setDoctorId("");
    setTimeSlot("");
    setDate(getDateFromOffset(2));
    setShowCalendar(false);
    setShowTimeSlots(false);
  };

  const handleJoinCall = (appointmentId: number) => {
    const appointment = appointments.find((item) => item.id === appointmentId);

    if (!appointment) return;

    toast.success(
      t("consultationsPage.joinToast", {
        doctor: appointment.doctor,
      })
    );
  };

  const handleReschedule = (appointmentId: number) => {
    const appointment = appointments.find((item) => item.id === appointmentId);

    if (!appointment) return;

    setReschedulingId(appointmentId);
    setNewRescheduleDate(appointment.date);
    setNewRescheduleTime(appointment.time);
  };

  const handleSaveReschedule = () => {
    if (!reschedulingId || !newRescheduleDate || !newRescheduleTime) {
      toast.error(t("consultationsPage.selectNewDateTime"));
      return;
    }

    const currentAppointment = appointments.find(
      (item) => item.id === reschedulingId
    );

    if (!currentAppointment) return;

    const isAlreadyBooked = appointments.some(
      (item) =>
        item.id !== reschedulingId &&
        item.status !== "cancelled" &&
        item.date === newRescheduleDate &&
        item.time === newRescheduleTime &&
        item.doctorId === currentAppointment.doctorId
    );

    if (isAlreadyBooked) {
      toast.error(t("consultationsPage.newSlotBooked"));
      return;
    }

    setAppointments((prevAppointments) =>
      prevAppointments.map((item) =>
        item.id === reschedulingId
          ? {
              ...item,
              date: newRescheduleDate,
              time: newRescheduleTime,
              status: undefined,
            }
          : item
      )
    );

    toast.success(
      t("consultationsPage.rescheduleSuccess", {
        doctor: currentAppointment.doctor,
      })
    );

    setReschedulingId(null);
    setNewRescheduleDate("");
    setNewRescheduleTime("");
  };

  const handleCloseReschedule = () => {
    setReschedulingId(null);
    setNewRescheduleDate("");
    setNewRescheduleTime("");
  };

  const handleCancel = (appointmentId: number) => {
    const appointment = appointments.find((item) => item.id === appointmentId);

    if (!appointment) return;

    setAppointments((prevAppointments) =>
      prevAppointments.map((item) =>
        item.id === appointmentId
          ? {
              ...item,
              status: "cancelled",
            }
          : item
      )
    );

    if (reschedulingId === appointmentId) {
      handleCloseReschedule();
    }

    toast.error(
      t("consultationsPage.cancelToast", {
        doctor: appointment.doctor,
      })
    );
  };

  const formatAppointmentDateTime = (
    appointmentDate: string,
    appointmentTime: string
  ) => {
    const appointmentDateTime = new Date(
      `${appointmentDate}T${appointmentTime}`
    );

    return appointmentDateTime.toLocaleString(isArabic ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getAppointmentStatus = (appointment: Appointment): AppointmentStatus => {
    if (appointment.status === "cancelled") {
      return "cancelled";
    }

    const now = new Date();
    const appointmentDateTime = new Date(
      `${appointment.date}T${appointment.time}`
    );

    if (now >= appointmentDateTime) {
      return "joinable";
    }

    return "upcoming";
  };

  const getStatusLabel = (status: AppointmentStatus) => {
    if (status === "cancelled") {
      return t("consultationsPage.cancelledStatus");
    }

    if (status === "joinable") {
      return t("consultationsPage.joinCall");
    }

    return t("consultationsPage.upcomingStatus");
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-background text-foreground"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Header variant="dashboard" />

      <main
        className="mx-auto w-full max-w-7xl flex-1 px-4 pb-12 sm:px-6 lg:px-8"
        style={{
          paddingTop: `${DESKTOP_HEADER_HEIGHT + 28}px`,
        }}
      >
        <div
          ref={heroRef}
          className={`mb-7 transition-all duration-1000 ease-out ${
            heroVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <div className="relative overflow-hidden rounded-[1.5rem] bg-primary px-5 py-7 text-primary-foreground shadow-xl shadow-primary/20 sm:rounded-[2rem] sm:px-6 md:px-8 md:py-9">
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-primary-foreground/15 blur-2xl" />
            <div className="absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-primary-foreground/10 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-2 text-xs font-bold backdrop-blur">
                  <Stethoscope className="h-4 w-4" />
                  {isArabic ? "رعاية طبية أونلاين" : "Online Medical Care"}
                </div>

                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
                  {t("consultationsPage.title")}
                </h1>

                <p className="mt-3 max-w-xl text-sm font-medium leading-7 text-primary-foreground/85 md:text-base">
                  {t("consultationsPage.subtitle")}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/15 backdrop-blur sm:h-14 sm:w-14">
                  <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>

                <div className="rounded-2xl bg-primary-foreground/15 px-4 py-3 backdrop-blur">
                  <p className="text-xs font-semibold text-primary-foreground/75">
                    {isArabic ? "الحجوزات النشطة" : "Active Bookings"}
                  </p>
                  <p className="text-xl font-extrabold">
                    {
                      appointments.filter(
                        (appointment) => appointment.status !== "cancelled"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Card
          ref={bookingRef as any}
          className={`mx-auto mb-12 max-w-6xl overflow-hidden rounded-[1.5rem] border border-border bg-card text-card-foreground shadow-xl shadow-primary/10 transition-all duration-1000 ease-out delay-200 sm:rounded-[2rem] ${
            bookingVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <div className="grid lg:grid-cols-12">
            <div
              className={cn(
                "relative overflow-hidden bg-muted/30 p-5 sm:p-6 md:p-7 lg:col-span-5",
                isArabic ? "lg:border-l" : "lg:border-r",
                "border-border"
              )}
            >
              <div className="absolute -top-16 h-36 w-36 rounded-full bg-primary/10 blur-3xl ltr:-right-12 rtl:-left-12" />

              <button
                type="button"
                className="relative mb-5 inline-flex items-center gap-2 text-sm font-extrabold text-foreground transition-colors hover:text-primary"
              >
                <ChevronLeft
                  className={cn("h-4 w-4", isArabic && "rotate-180")}
                />
                {isArabic ? "تفاصيل الحجز" : "Booking Details"}
              </button>

              <div className="relative mb-6 rounded-[1.25rem] border border-border bg-card p-4 shadow-sm shadow-primary/5 sm:rounded-[1.5rem] sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-12 sm:w-12">
                    <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-foreground sm:text-lg">
                      {isArabic
                        ? "اختاري بيانات الاستشارة"
                        : "Choose Consultation"}
                    </h3>

                    <p className="mt-1 text-xs font-semibold text-muted-foreground sm:text-sm">
                      {isArabic
                        ? "حددي التخصص والدكتور المناسب"
                        : "Select specialist and doctor"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wide text-foreground">
                    {isArabic ? "التخصص" : "Specialist"}
                  </label>

                  <Select
                    value={specialty}
                    onValueChange={(value) =>
                      handleSpecialtyChange(value as SpecialtyValue)
                    }
                  >
                    <SelectTrigger className="h-11 rounded-2xl border-border bg-background text-sm font-bold shadow-sm transition-all focus:ring-4 focus:ring-primary/10">
                      <SelectValue
                        placeholder={
                          isArabic ? "اختاري التخصص" : "Select specialist"
                        }
                      />
                    </SelectTrigger>

                    <SelectContent className="rounded-2xl border-border bg-popover p-1 text-popover-foreground shadow-xl">
                      <SelectItem
                        value="diabetologist"
                        className="cursor-pointer rounded-xl font-semibold focus:bg-primary/10 focus:text-primary"
                      >
                        {isArabic ? "طبيب سكري" : "Diabetologist"}
                      </SelectItem>

                      <SelectItem
                        value="cardiologist"
                        className="cursor-pointer rounded-xl font-semibold focus:bg-primary/10 focus:text-primary"
                      >
                        {isArabic ? "طبيب قلب" : "Cardiologist"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wide text-foreground">
                    {isArabic ? "الدكتور" : "Doctor"}
                  </label>

                  <Select
                    value={doctorId}
                    onValueChange={setDoctorId}
                    disabled={!specialty}
                  >
                    <SelectTrigger className="h-11 rounded-2xl border-border bg-background text-sm font-bold shadow-sm transition-all focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60">
                      <SelectValue
                        placeholder={
                          specialty
                            ? isArabic
                              ? "اختاري الدكتور"
                              : "Select doctor"
                            : isArabic
                            ? "اختاري التخصص أولًا"
                            : "Select specialist first"
                        }
                      />
                    </SelectTrigger>

                    <SelectContent className="rounded-2xl border-border bg-popover p-1 text-popover-foreground shadow-xl">
                      {availableDoctors.map((doctor) => (
                        <SelectItem
                          key={doctor.id}
                          value={doctor.id}
                          className="cursor-pointer rounded-xl font-semibold focus:bg-primary/10 focus:text-primary"
                        >
                          {doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedDoctor && (
                  <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                        <User className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-extrabold text-foreground">
                          {selectedDoctor.name}
                        </h4>

                        <p className="mt-1 text-xs font-bold text-primary">
                          {selectedDoctor.specialty}
                        </p>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setSelectedDoctorProfile(selectedDoctor)
                          }
                          className="mt-3 h-9 gap-2 rounded-xl border-primary/20 bg-background px-4 text-xs font-extrabold text-primary hover:bg-primary/10"
                        >
                          <Eye className="h-4 w-4" />
                          {isArabic ? "البروفايل" : "Profile"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <p className="text-xs font-semibold leading-6 text-muted-foreground">
                      {isArabic
                        ? "اختاري التخصص والدكتور، وبعدها حددي اليوم والساعة من الجزء الموجود على اليمين."
                        : "Choose a specialist and doctor, then select the date and time from the right panel."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 md:p-7 lg:col-span-7">
              <div className="mb-5">
                <h3 className="flex items-center gap-2 text-lg font-extrabold text-foreground sm:text-xl">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  {isArabic ? "اختاري الميعاد" : "Select Appointment"}
                </h3>

                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  {isArabic
                    ? "حددي اليوم والساعة المناسبة للاستشارة"
                    : "Pick your preferred consultation day and time"}
                </p>
              </div>

              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                  <p className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                    {isArabic ? "التاريخ المختار" : "Selected Date"}
                  </p>

                  <div className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                    <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                    <span className="line-clamp-2">
                      {selectedFullDateLabel}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                  <p className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                    {isArabic ? "الساعة المختارة" : "Selected Time"}
                  </p>

                  <div className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                    <Clock3 className="h-4 w-4 shrink-0 text-primary" />
                    {timeSlot ||
                      (isArabic ? "لم يتم اختيار الساعة" : "No time selected")}
                  </div>
                </div>
              </div>

              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCalendar((prev) => !prev);
                    setShowTimeSlots(false);
                  }}
                  className="h-10 w-full justify-center gap-2 rounded-full border-border bg-background px-4 text-xs font-extrabold shadow-sm hover:bg-primary/5 hover:text-primary"
                >
                  <CalendarDays className="h-4 w-4" />
                  {selectedDateLabel}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      showCalendar && "rotate-180"
                    )}
                  />
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTimeSlots((prev) => !prev);
                    setShowCalendar(false);
                  }}
                  className="h-10 w-full justify-center gap-2 rounded-full border-border bg-background px-4 text-xs font-extrabold shadow-sm hover:bg-primary/5 hover:text-primary"
                >
                  <Clock3 className="h-4 w-4" />
                  {timeSlot || (isArabic ? "اختاري الساعة" : "Select time")}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      showTimeSlots && "rotate-180"
                    )}
                  />
                </Button>
              </div>

              {showCalendar && (
                <div className="mb-5 overflow-x-auto rounded-[1.5rem] border border-border bg-card p-3 shadow-lg shadow-primary/10">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                      if (!selectedDate) return;

                      setDate(selectedDate);
                      setShowCalendar(false);
                    }}
                    className="mx-auto w-fit min-w-[280px] rounded-xl bg-card text-card-foreground"
                    disabled={(selectedDate) =>
                      selectedDate < new Date() ||
                      selectedDate.getDay() === 0 ||
                      selectedDate.getDay() === 6
                    }
                    initialFocus
                  />
                </div>
              )}

              <div className="mb-5 rounded-[1.5rem] border border-border bg-muted/30 p-3 sm:rounded-[1.75rem] sm:p-4">
                <div className="mb-4 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-background shadow-sm hover:bg-primary/10 hover:text-primary"
                    onClick={() => {
                      if (!date) return;

                      const prevDate = new Date(date);
                      prevDate.setDate(prevDate.getDate() - 1);
                      setDate(prevDate);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="text-center text-sm font-extrabold text-foreground">
                    {date?.toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-background shadow-sm hover:bg-primary/10 hover:text-primary"
                    onClick={() => {
                      if (!date) return;

                      const nextDate = new Date(date);
                      nextDate.setDate(nextDate.getDate() + 1);
                      setDate(nextDate);
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {nextDays.map((day) => {
                    const isSelected =
                      date && formatDateLocal(date) === day.value;

                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => setDate(day.date)}
                        className="flex flex-col items-center justify-center gap-2 rounded-2xl py-2 text-center transition-all hover:bg-primary/5"
                      >
                        <span
                          className={cn(
                            "text-[11px] font-bold",
                            isSelected
                              ? "text-primary"
                              : "text-muted-foreground"
                          )}
                        >
                          {day.dayName}
                        </span>

                        <span
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold transition-all",
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                              : "bg-background text-foreground hover:bg-primary/10 hover:text-primary"
                          )}
                        >
                          {day.dayNumber}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {showTimeSlots && (
                <div className="mb-6 rounded-[1.5rem] border border-border bg-card p-4 shadow-lg shadow-primary/10">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                      <Clock3 className="h-4 w-4 text-primary" />
                      {t("consultationsPage.timeSlots")}
                    </h4>

                    <button
                      type="button"
                      onClick={() => setShowTimeSlots(false)}
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-primary"
                    >
                      {isArabic ? "إغلاق" : "Close"}
                      <ChevronDown className="h-4 w-4 rotate-180" />
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {timeSlots.map((slot, index) => {
                      const isSelected = timeSlot === slot;
                      const isDisabled = index === 1 || index === 4;

                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            setTimeSlot(slot);
                            setShowTimeSlots(false);
                          }}
                          className={cn(
                            "h-11 w-full rounded-full border text-sm font-extrabold transition-all",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                              : "border-border bg-background text-primary shadow-sm hover:border-primary/40 hover:bg-primary/5",
                            isDisabled &&
                              "cursor-not-allowed border-transparent bg-muted text-muted-foreground opacity-60 shadow-none hover:bg-muted hover:text-muted-foreground"
                          )}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <Button
                onClick={handleBooking}
                className="h-12 w-full rounded-full bg-primary text-sm font-extrabold text-primary-foreground shadow-xl shadow-primary/25 transition-all hover:scale-[1.01] hover:bg-primary/90 active:scale-[0.99]"
              >
                {t("consultationsPage.confirm")}
              </Button>

              <div className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                <Info className="h-4 w-4 shrink-0" />
                {isArabic
                  ? "سيتم إرسال رابط المكالمة إلى بريدك الإلكتروني"
                  : "Call link will be sent to your email"}
              </div>
            </div>
          </div>
        </Card>

        <div
          ref={appointmentsRef}
          className={`mx-auto max-w-7xl transition-all duration-1000 ease-out delay-400 ${
            appointmentsVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-foreground">
              {t("consultationsPage.upcoming")}
            </h2>

            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {isArabic
                ? "تابع مواعيدك القادمة وإعادة الجدولة بسهولة"
                : "Manage your upcoming consultations easily"}
            </p>
          </div>

          <Card className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-xl shadow-primary/5">
            <div className="border-b border-border bg-muted/20 p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-foreground">
                    {isArabic ? "بحث المواعيد" : "Search Appointments"}
                  </h3>

                  <p className="mt-1 text-xs font-semibold text-muted-foreground">
                    {isArabic
                      ? `تم العثور على ${sortedAppointments.length} موعد`
                      : `${sortedAppointments.length} appointments found`}
                  </p>
                </div>

                <div className="w-full lg:max-w-3xl">
                  <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-all focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/10 sm:flex-row">
                    <div className="relative min-w-0 flex-1">
                      <Search
                        className={cn(
                          "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
                          isArabic ? "right-4" : "left-4"
                        )}
                      />

                      <Input
                        value={appointmentSearch}
                        onChange={(e) => setAppointmentSearch(e.target.value)}
                        placeholder={
                          isArabic
                            ? "ابحث باسم الدكتور أو التخصص..."
                            : "Search doctor or specialty..."
                        }
                        className={cn(
                          "h-12 rounded-none border-0 bg-transparent text-sm font-bold shadow-none focus-visible:ring-0",
                          isArabic ? "pr-11" : "pl-11"
                        )}
                      />
                    </div>

                    <Select
                      value={appointmentSpecialtyFilter}
                      onValueChange={(value) =>
                        setAppointmentSpecialtyFilter(
                          value as AppointmentSpecialtyFilter
                        )
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          "h-12 rounded-none border-0 border-border bg-muted/30 px-4 text-sm font-extrabold shadow-none focus:ring-0 sm:w-[220px]",
                          isArabic
                            ? "border-t sm:border-r sm:border-t-0"
                            : "border-t sm:border-l sm:border-t-0"
                        )}
                      >
                        <SelectValue
                          placeholder={
                            isArabic ? "كل التخصصات" : "All Specialties"
                          }
                        />
                      </SelectTrigger>

                      <SelectContent className="rounded-2xl border-border bg-popover p-1 text-popover-foreground shadow-xl">
                        <SelectItem
                          value="all"
                          className="cursor-pointer rounded-xl font-semibold focus:bg-primary/10 focus:text-primary"
                        >
                          {isArabic ? "كل التخصصات" : "All Specialties"}
                        </SelectItem>

                        <SelectItem
                          value="diabetologist"
                          className="cursor-pointer rounded-xl font-semibold focus:bg-primary/10 focus:text-primary"
                        >
                          {specialtyOptions.diabetologist}
                        </SelectItem>

                        <SelectItem
                          value="cardiologist"
                          className="cursor-pointer rounded-xl font-semibold focus:bg-primary/10 focus:text-primary"
                        >
                          {specialtyOptions.cardiologist}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden w-full overflow-x-auto md:block">
              <table className="w-full min-w-[1120px] border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th
                      className={cn(
                        "px-5 py-4 text-xs font-extrabold uppercase tracking-wide text-muted-foreground",
                        isArabic ? "text-right" : "text-left"
                      )}
                    >
                      {isArabic ? "الدكتور" : "Doctor"}
                    </th>

                    <th
                      className={cn(
                        "px-5 py-4 text-xs font-extrabold uppercase tracking-wide text-muted-foreground",
                        isArabic ? "text-right" : "text-left"
                      )}
                    >
                      {isArabic ? "التخصص" : "Specialty"}
                    </th>

                    <th
                      className={cn(
                        "px-5 py-4 text-xs font-extrabold uppercase tracking-wide text-muted-foreground",
                        isArabic ? "text-right" : "text-left"
                      )}
                    >
                      {isArabic ? "الموعد" : "Date & Time"}
                    </th>

                    <th
                      className={cn(
                        "px-5 py-4 text-xs font-extrabold uppercase tracking-wide text-muted-foreground",
                        isArabic ? "text-right" : "text-left"
                      )}
                    >
                      {isArabic ? "الحالة" : "Status"}
                    </th>

                    <th className="w-[360px] px-5 py-4 text-center text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                      {isArabic ? "الإجراءات" : "Actions"}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedAppointments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-10 text-center text-sm font-semibold text-muted-foreground"
                      >
                        {hasActiveAppointmentFilters
                          ? isArabic
                            ? "لا توجد نتائج مطابقة للبحث"
                            : "No matching appointments found"
                          : isArabic
                          ? "لا توجد مواعيد حتى الآن"
                          : "No appointments yet"}
                      </td>
                    </tr>
                  ) : (
                    paginatedAppointments.map((appointment) => {
                      const status = getAppointmentStatus(appointment);
                      const doctorProfile = getDoctorProfile(appointment);

                      return (
                        <Fragment key={appointment.id}>
                          <tr className="border-b border-border transition-colors hover:bg-muted/30">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                                  <User className="h-5 w-5" />
                                </div>

                                <div>
                                  <p className="text-sm font-extrabold text-foreground">
                                    {appointment.doctor}
                                  </p>

                                  <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                                    {isArabic
                                      ? "استشارة أونلاين"
                                      : "Online Consultation"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span className="inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-extrabold text-primary">
                                {appointment.specialty}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                <CalendarDays className="h-4 w-4 text-primary" />
                                {formatAppointmentDateTime(
                                  appointment.date,
                                  appointment.time
                                )}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold",
                                  status === "upcoming" &&
                                    "border-primary/20 bg-primary/10 text-primary",
                                  status === "joinable" &&
                                    "border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300",
                                  status === "cancelled" &&
                                    "border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                                )}
                              >
                                <Clock3 className="h-3.5 w-3.5" />
                                {getStatusLabel(status)}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex flex-wrap items-center justify-center gap-2">
                                {doctorProfile && (
                                  <Button
                                    variant="outline"
                                    className="h-9 gap-2 rounded-xl border-primary/20 px-3 text-xs font-extrabold text-primary hover:bg-primary/10"
                                    onClick={() =>
                                      setSelectedDoctorProfile(doctorProfile)
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                    {isArabic ? "البروفايل" : "Profile"}
                                  </Button>
                                )}

                                {status === "joinable" && (
                                  <Button
                                    className="h-9 gap-2 rounded-xl bg-green-600 px-3 text-xs font-extrabold text-white hover:bg-green-700"
                                    onClick={() =>
                                      handleJoinCall(appointment.id)
                                    }
                                  >
                                    <Video className="h-4 w-4" />
                                    {t("consultationsPage.joinCall")}
                                  </Button>
                                )}

                                {status !== "cancelled" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      className="h-9 rounded-xl px-3 text-xs font-extrabold text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                      onClick={() =>
                                        handleReschedule(appointment.id)
                                      }
                                    >
                                      {t("consultationsPage.reschedule")}
                                    </Button>

                                    <Button
                                      variant="ghost"
                                      className="h-9 rounded-xl px-3 text-xs font-extrabold text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-300 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                                      onClick={() =>
                                        handleCancel(appointment.id)
                                      }
                                    >
                                      {t("consultationsPage.cancel")}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>

                          {reschedulingId === appointment.id &&
                            status !== "cancelled" && (
                              <tr className="border-b border-border bg-muted/20">
                                <td colSpan={5} className="px-5 py-5">
                                  <div className="rounded-2xl border border-border bg-card p-5">
                                    <h4 className="mb-5 flex items-center gap-2 text-base font-extrabold text-foreground">
                                      <Clock3 className="h-5 w-5 text-primary" />
                                      {t("consultationsPage.rescheduleTitle")}
                                    </h4>

                                    <div className="mb-5 grid gap-4 md:grid-cols-2">
                                      <div className="space-y-2">
                                        <label className="text-xs font-extrabold uppercase tracking-wide text-foreground">
                                          {t("consultationsPage.newDate")}
                                        </label>

                                        <input
                                          type="date"
                                          value={newRescheduleDate}
                                          onChange={(e) =>
                                            setNewRescheduleDate(
                                              e.target.value
                                            )
                                          }
                                          className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <label className="text-xs font-extrabold uppercase tracking-wide text-foreground">
                                          {t("consultationsPage.newTime")}
                                        </label>

                                        <Select
                                          value={newRescheduleTime}
                                          onValueChange={setNewRescheduleTime}
                                        >
                                          <SelectTrigger className="h-11 rounded-xl border-border bg-background text-sm font-semibold text-foreground shadow-none transition-all focus:ring-4 focus:ring-primary/10">
                                            <SelectValue
                                              placeholder={t(
                                                "consultationsPage.selectNewTime"
                                              )}
                                            />
                                          </SelectTrigger>

                                          <SelectContent className="rounded-2xl border-border bg-popover p-1 text-popover-foreground shadow-xl">
                                            {timeSlots.map((slot) => (
                                              <SelectItem
                                                key={slot}
                                                value={slot}
                                                className="cursor-pointer rounded-xl font-semibold focus:bg-primary/10 focus:text-primary"
                                              >
                                                {slot}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    <div className="flex gap-3">
                                      <Button
                                        onClick={handleSaveReschedule}
                                        className="h-10 rounded-xl bg-primary px-6 text-xs font-extrabold text-primary-foreground shadow-lg shadow-primary/10 transition-all hover:bg-primary/90"
                                      >
                                        {t("consultationsPage.save")}
                                      </Button>

                                      <Button
                                        variant="outline"
                                        onClick={handleCloseReschedule}
                                        className="h-10 rounded-xl border-border bg-transparent px-6 text-xs font-extrabold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                                      >
                                        {t("consultationsPage.cancel")}
                                      </Button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {paginatedAppointments.length === 0 ? (
                <div className="rounded-2xl border border-border bg-muted/20 p-6 text-center text-sm font-semibold text-muted-foreground">
                  {hasActiveAppointmentFilters
                    ? isArabic
                      ? "لا توجد نتائج مطابقة للبحث"
                      : "No matching appointments found"
                    : isArabic
                    ? "لا توجد مواعيد حتى الآن"
                    : "No appointments yet"}
                </div>
              ) : (
                paginatedAppointments.map((appointment) => {
                  const status = getAppointmentStatus(appointment);
                  const doctorProfile = getDoctorProfile(appointment);

                  return (
                    <div
                      key={appointment.id}
                      className={cn(
                        "rounded-2xl border border-border bg-background p-4 shadow-sm",
                        status === "cancelled" && "opacity-70"
                      )}
                    >
                      <div className="mb-4 flex w-full items-start gap-3 text-start">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                          <User className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-extrabold text-foreground">
                            {appointment.doctor}
                          </h3>

                          <p className="mt-1 text-xs font-bold text-primary">
                            {appointment.specialty}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-muted-foreground">
                            {isArabic
                              ? "استشارة أونلاين"
                              : "Online Consultation"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-2 rounded-xl bg-muted/40 px-3 py-2 text-xs font-bold text-foreground">
                          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>
                            {formatAppointmentDateTime(
                              appointment.date,
                              appointment.time
                            )}
                          </span>
                        </div>

                        <div
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold",
                            status === "upcoming" &&
                              "border-primary/20 bg-primary/10 text-primary",
                            status === "joinable" &&
                              "border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300",
                            status === "cancelled" &&
                              "border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                          )}
                        >
                          <Clock3 className="h-3.5 w-3.5" />
                          {getStatusLabel(status)}
                        </div>

                        <div className="grid gap-2 pt-2">
                          {doctorProfile && (
                            <Button
                              variant="outline"
                              className="h-10 w-full gap-2 rounded-xl border-primary/20 text-xs font-extrabold text-primary hover:bg-primary/10"
                              onClick={() =>
                                setSelectedDoctorProfile(doctorProfile)
                              }
                            >
                              <Eye className="h-4 w-4" />
                              {isArabic ? "البروفايل" : "Profile"}
                            </Button>
                          )}

                          {status === "joinable" && (
                            <Button
                              className="h-10 w-full gap-2 rounded-xl bg-green-600 text-xs font-extrabold text-white hover:bg-green-700"
                              onClick={() => handleJoinCall(appointment.id)}
                            >
                              <Video className="h-4 w-4" />
                              {t("consultationsPage.joinCall")}
                            </Button>
                          )}

                          {status !== "cancelled" && (
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                className="h-10 rounded-xl border-border text-xs font-extrabold text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                onClick={() =>
                                  handleReschedule(appointment.id)
                                }
                              >
                                {t("consultationsPage.reschedule")}
                              </Button>

                              <Button
                                variant="outline"
                                className="h-10 rounded-xl border-red-200 text-xs font-extrabold text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                                onClick={() => handleCancel(appointment.id)}
                              >
                                {t("consultationsPage.cancel")}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {reschedulingId === appointment.id &&
                        status !== "cancelled" && (
                          <div className="mt-4 rounded-2xl border border-border bg-card p-4">
                            <h4 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-foreground">
                              <Clock3 className="h-4 w-4 text-primary" />
                              {t("consultationsPage.rescheduleTitle")}
                            </h4>

                            <div className="mb-4 grid gap-3">
                              <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wide text-foreground">
                                  {t("consultationsPage.newDate")}
                                </label>

                                <input
                                  type="date"
                                  value={newRescheduleDate}
                                  onChange={(e) =>
                                    setNewRescheduleDate(e.target.value)
                                  }
                                  className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wide text-foreground">
                                  {t("consultationsPage.newTime")}
                                </label>

                                <Select
                                  value={newRescheduleTime}
                                  onValueChange={setNewRescheduleTime}
                                >
                                  <SelectTrigger className="h-11 rounded-xl border-border bg-background text-sm font-semibold text-foreground shadow-none transition-all focus:ring-4 focus:ring-primary/10">
                                    <SelectValue
                                      placeholder={t(
                                        "consultationsPage.selectNewTime"
                                      )}
                                    />
                                  </SelectTrigger>

                                  <SelectContent className="rounded-2xl border-border bg-popover p-1 text-popover-foreground shadow-xl">
                                    {timeSlots.map((slot) => (
                                      <SelectItem
                                        key={slot}
                                        value={slot}
                                        className="cursor-pointer rounded-xl font-semibold focus:bg-primary/10 focus:text-primary"
                                      >
                                        {slot}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                onClick={handleSaveReschedule}
                                className="h-10 rounded-xl bg-primary text-xs font-extrabold text-primary-foreground shadow-lg shadow-primary/10 transition-all hover:bg-primary/90"
                              >
                                {t("consultationsPage.save")}
                              </Button>

                              <Button
                                variant="outline"
                                onClick={handleCloseReschedule}
                                className="h-10 rounded-xl border-border bg-transparent text-xs font-extrabold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                              >
                                {t("consultationsPage.cancel")}
                              </Button>
                            </div>
                          </div>
                        )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-center text-sm font-semibold text-muted-foreground sm:text-start">
                {isArabic
                  ? `صفحة ${currentPage} من ${totalPages}`
                  : `Page ${currentPage} of ${totalPages}`}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1))
                  }
                  className="h-9 rounded-xl border-border px-3 text-xs font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft
                    className={cn("h-4 w-4", isArabic && "rotate-180")}
                  />
                  <span className="hidden sm:inline">
                    {isArabic ? "السابق" : "Previous"}
                  </span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, index) => {
                    const pageNumber = index + 1;

                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setCurrentPage(pageNumber)}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl text-xs font-extrabold transition-all",
                          currentPage === pageNumber
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                            : "border border-border bg-background text-muted-foreground hover:bg-primary/5 hover:text-primary"
                        )}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prevPage) =>
                      Math.min(prevPage + 1, totalPages)
                    )
                  }
                  className="h-9 rounded-xl border-border px-3 text-xs font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="hidden sm:inline">
                    {isArabic ? "التالي" : "Next"}
                  </span>
                  <ChevronRight
                    className={cn("h-4 w-4", isArabic && "rotate-180")}
                  />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {selectedDoctorProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label="Close doctor profile"
            onClick={() => setSelectedDoctorProfile(null)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <Card className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[2rem] border border-border bg-card text-card-foreground shadow-2xl">
            <div className="grid md:grid-cols-12">
              <div className="relative overflow-hidden bg-primary p-6 text-primary-foreground md:col-span-5">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-foreground/15 blur-2xl" />
                <div className="absolute -bottom-14 left-8 h-32 w-32 rounded-full bg-primary-foreground/10 blur-2xl" />

                <div className="relative z-10 mb-6 flex items-center justify-between">
                  <p className="text-sm font-extrabold">
                    {isArabic ? "بروفايل الدكتور" : "Doctor Profile"}
                  </p>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedDoctorProfile(null)}
                    className="h-9 w-9 rounded-full bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25 hover:text-primary-foreground"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-primary-foreground/20 bg-primary-foreground/15 shadow-xl">
                    <User className="h-12 w-12" />
                  </div>

                  <h3 className="text-2xl font-extrabold">
                    {selectedDoctorProfile.name}
                  </h3>

                  <p className="mt-3 rounded-full bg-primary-foreground/15 px-4 py-1.5 text-sm font-bold text-primary-foreground/90">
                    {selectedDoctorProfile.specialty}
                  </p>

                  <div className="mt-4 flex items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-2">
                    {renderStars(selectedDoctorProfile.rating, "md")}
                    <span className="text-sm font-extrabold">
                      {selectedDoctorProfile.rating}
                    </span>
                  </div>

                  <p className="mt-2 text-xs font-bold text-primary-foreground/75">
                    {selectedDoctorProfile.reviews}{" "}
                    {isArabic ? "ريفيو" : "reviews"}
                  </p>
                </div>
              </div>

              <div className="space-y-4 p-6 md:col-span-7">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Award className="h-4 w-4" />
                    </div>

                    <p className="text-xs font-bold text-muted-foreground">
                      {isArabic ? "الخبرة" : "Experience"}
                    </p>

                    <p className="mt-1 text-base font-extrabold text-foreground">
                      {selectedDoctorProfile.experience}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <UsersRound className="h-4 w-4" />
                    </div>

                    <p className="text-xs font-bold text-muted-foreground">
                      {isArabic ? "المرضى" : "Patients"}
                    </p>

                    <p className="mt-1 text-base font-extrabold text-foreground">
                      {selectedDoctorProfile.patients}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <h4 className="mb-3 text-base font-extrabold text-foreground">
                    {isArabic ? "نبذة" : "About"}
                  </h4>

                  <p className="text-sm font-medium leading-7 text-muted-foreground">
                    {selectedDoctorProfile.bio}
                  </p>
                </div>

                <Button
                  onClick={() => setSelectedDoctorProfile(null)}
                  className="h-12 w-full rounded-2xl bg-primary text-sm font-extrabold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
                >
                  {isArabic ? "تم" : "Done"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Consultations;