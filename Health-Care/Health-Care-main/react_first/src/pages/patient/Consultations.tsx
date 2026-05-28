import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
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
} from "lucide-react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useIsVisible } from "@/hooks/useIsVisible";
import { cn } from "@/lib/utils";

type AppointmentStatus = "upcoming" | "joinable" | "cancelled";

type Appointment = {
  id: number;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  image: string;
  status?: AppointmentStatus;
};

const DESKTOP_HEADER_HEIGHT = 72;

const formatDateLocal = (selectedDate: Date) => {
  const year = selectedDate.getFullYear();
  const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
  const day = String(selectedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

  const doctorBySpecialty: Record<
    string,
    { doctor: string; specialty: string }
  > = {
    general: {
      doctor: t("consultationsPage.doctors.general.name"),
      specialty: t("consultationsPage.doctors.general.specialty"),
    },
    cardio: {
      doctor: t("consultationsPage.doctors.cardio.name"),
      specialty: t("consultationsPage.doctors.cardio.specialty"),
    },
    derma: {
      doctor: t("consultationsPage.doctors.derma.name"),
      specialty: t("consultationsPage.doctors.derma.specialty"),
    },
    neuro: {
      doctor: t("consultationsPage.doctors.neuro.name"),
      specialty: t("consultationsPage.doctors.neuro.specialty"),
    },
  };

  const [date, setDate] = useState<Date | undefined>(new Date(2026, 4, 8));
  const [specialty, setSpecialty] = useState("");
  const [timeSlot, setTimeSlot] = useState("");

  const [reschedulingId, setReschedulingId] = useState<number | null>(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState("");
  const [newRescheduleTime, setNewRescheduleTime] = useState("");

  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: 1,
      doctor: t("consultationsPage.doctors.general.name"),
      specialty: t("consultationsPage.doctors.general.specialty"),
      date: "2026-05-15",
      time: "14:00",
      image: "/placeholder.svg",
    },
    {
      id: 2,
      doctor: t("consultationsPage.doctors.cardio.name"),
      specialty: t("consultationsPage.doctors.cardio.specialty"),
      date: "2026-05-12",
      time: "10:00",
      image: "/placeholder.svg",
    },
    {
      id: 3,
      doctor: t("consultationsPage.doctors.derma.name"),
      specialty: t("consultationsPage.doctors.derma.specialty"),
      date: "2026-05-20",
      time: "16:30",
      image: "/placeholder.svg",
    },
  ]);

  const handleBooking = () => {
    if (!date || !specialty || !timeSlot) {
      toast.error(t("consultationsPage.selectRequired"));
      return;
    }

    const selectedDoctor = doctorBySpecialty[specialty];

    if (!selectedDoctor) {
      toast.error(t("consultationsPage.selectValidSpecialization"));
      return;
    }

    const formattedDate = formatDateLocal(date);

    const isAlreadyBooked = appointments.some(
      (appointment) =>
        appointment.status !== "cancelled" &&
        appointment.date === formattedDate &&
        appointment.time === timeSlot &&
        appointment.specialty === selectedDoctor.specialty
    );

    if (isAlreadyBooked) {
      toast.error(t("consultationsPage.slotBooked"));
      return;
    }

    const newAppointment: Appointment = {
      id: Date.now(),
      doctor: selectedDoctor.doctor,
      specialty: selectedDoctor.specialty,
      date: formattedDate,
      time: timeSlot,
      image: "/placeholder.svg",
    };

    setAppointments((prevAppointments) => [
      newAppointment,
      ...prevAppointments,
    ]);

    toast.success(t("consultationsPage.confirmed"));

    setSpecialty("");
    setTimeSlot("");
    setDate(new Date(2026, 4, 8));
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
        item.specialty === currentAppointment.specialty
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

  return (
    <div
      className="flex min-h-screen flex-col bg-background text-foreground"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Header variant="dashboard" />

      <main
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8"
        style={{
          paddingTop: `${DESKTOP_HEADER_HEIGHT + 48}px`,
        }}
      >
        <div
          ref={heroRef}
          className={`mb-16 text-center transition-all duration-1000 ease-out ${
            heroVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {t("consultationsPage.title")}
          </h1>

          <p className="mx-auto max-w-2xl text-xl font-medium leading-relaxed text-muted-foreground">
            {t("consultationsPage.subtitle")}
          </p>
        </div>

        <Card
          ref={bookingRef as any}
          className={`mb-20 overflow-hidden rounded-[2.5rem] border border-border bg-card text-card-foreground shadow-2xl shadow-primary/5 transition-all duration-1000 ease-out delay-200 ${
            bookingVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <div className="grid lg:grid-cols-12">
            <div
              className={cn(
                "flex flex-col justify-center border-b border-border bg-muted/30 p-8 md:p-12 lg:col-span-5 lg:border-b-0",
                isArabic ? "lg:border-l" : "lg:border-r"
              )}
            >
              <div className="mb-8">
                <h3 className="mb-2 flex items-center gap-3 text-2xl font-bold text-foreground">
                  <CalendarDays className="h-6 w-6 text-primary" />
                  {isArabic ? "اختر التاريخ" : "Select Date"}
                </h3>

                <p className="text-sm font-medium text-muted-foreground">
                  {isArabic
                    ? "المواعيد المتاحة تظهر بلون مميز"
                    : "Available slots are highlighted"}
                </p>
              </div>

              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="mx-auto w-fit rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-xl shadow-primary/5 lg:mx-0"
                disabled={(selectedDate) =>
                  selectedDate < new Date() ||
                  selectedDate.getDay() === 0 ||
                  selectedDate.getDay() === 6
                }
                initialFocus
              />
            </div>

            <div className="p-8 md:p-12 lg:col-span-7">
              <div className="mb-10">
                <h3 className="mb-2 flex items-center gap-3 text-2xl font-bold text-foreground">
                  <Stethoscope className="h-6 w-6 text-primary" />
                  {t("consultationsPage.bookingSection")}
                </h3>

                <p className="text-sm font-medium text-muted-foreground">
                  {isArabic
                    ? "يرجى ملء التفاصيل لتأكيد استشارتك"
                    : "Please fill in the details to confirm your consultation"}
                </p>
              </div>

              <div className="space-y-8">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-3">
                    <label className="ml-1 block text-sm font-bold text-foreground">
                      {t("consultationsPage.specialization")}
                    </label>

                    <Select value={specialty} onValueChange={setSpecialty}>
                      <SelectTrigger className="h-14 rounded-2xl border-border bg-background text-sm font-medium text-foreground shadow-none transition-all focus:ring-4 focus:ring-primary/10">
                        <SelectValue
                          placeholder={t(
                            "consultationsPage.generalPractitioner"
                          )}
                        />
                      </SelectTrigger>

                      <SelectContent className="rounded-2xl border-border bg-popover p-1 text-popover-foreground shadow-xl">
                        <SelectItem
                          value="general"
                          className="cursor-pointer rounded-xl font-semibold focus:bg-primary/10 focus:text-primary"
                        >
                          {t("consultationsPage.generalPractitioner")}
                        </SelectItem>

                        <SelectItem
                          value="cardio"
                          className="cursor-pointer rounded-xl font-semibold focus:bg-primary/10 focus:text-primary"
                        >
                          {t("consultationsPage.cardiologist")}
                        </SelectItem>

                        <SelectItem
                          value="derma"
                          className="cursor-pointer rounded-xl font-semibold focus:bg-primary/10 focus:text-primary"
                        >
                          {t("consultationsPage.dermatologist")}
                        </SelectItem>

                        <SelectItem
                          value="neuro"
                          className="cursor-pointer rounded-xl font-semibold focus:bg-primary/10 focus:text-primary"
                        >
                          {t("consultationsPage.neurologist")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label className="ml-1 block text-sm font-bold text-foreground">
                      {t("consultationsPage.timeSlots")}
                    </label>

                    <Select value={timeSlot} onValueChange={setTimeSlot}>
                      <SelectTrigger className="h-14 rounded-2xl border-border bg-background text-sm font-medium text-foreground shadow-none transition-all focus:ring-4 focus:ring-primary/10">
                        <SelectValue
                          placeholder={t("consultationsPage.time1000")}
                        />
                      </SelectTrigger>

                      <SelectContent className="rounded-2xl border-border bg-popover p-1 text-popover-foreground shadow-xl">
                        <SelectItem
                          value="10:00"
                          className="cursor-pointer rounded-xl font-semibold focus:bg-primary/10 focus:text-primary"
                        >
                          {t("consultationsPage.time1000")}
                        </SelectItem>

                        <SelectItem
                          value="11:00"
                          className="cursor-pointer rounded-xl font-semibold focus:bg-primary/10 focus:text-primary"
                        >
                          {t("consultationsPage.time1100")}
                        </SelectItem>

                        <SelectItem
                          value="14:00"
                          className="cursor-pointer rounded-xl font-semibold focus:bg-primary/10 focus:text-primary"
                        >
                          {t("consultationsPage.time1400")}
                        </SelectItem>

                        <SelectItem
                          value="15:00"
                          className="cursor-pointer rounded-xl font-semibold focus:bg-primary/10 focus:text-primary"
                        >
                          {t("consultationsPage.time1500")}
                        </SelectItem>

                        <SelectItem
                          value="16:00"
                          className="cursor-pointer rounded-xl font-semibold focus:bg-primary/10 focus:text-primary"
                        >
                          {t("consultationsPage.time1600")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleBooking}
                    className="h-16 w-full rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] hover:bg-primary/90 active:scale-[0.99]"
                  >
                    {t("consultationsPage.confirm")}
                  </Button>

                  <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Info className="h-4 w-4" />
                    {isArabic
                      ? "سيتم إرسال رابط المكالمة إلى بريدك الإلكتروني"
                      : "Call link will be sent to your email"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div
          ref={appointmentsRef}
          className={`transition-all duration-1000 ease-out delay-400 ${
            appointmentsVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-foreground">
              {t("consultationsPage.upcoming")}
            </h2>

            <div className="mx-8 hidden h-px flex-1 bg-border md:block" />
          </div>

          <div className="grid gap-6">
            {[...appointments]
              .sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);

                return dateA.getTime() - dateB.getTime();
              })
              .map((appointment) => {
                const status = getAppointmentStatus(appointment);

                return (
                  <Card
                    key={appointment.id}
                    className={cn(
                      "group overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-lg shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl",
                      status === "cancelled" && "opacity-60 grayscale"
                    )}
                  >
                    <div className="p-6 md:p-8">
                      <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
                        <div className="flex w-full flex-col items-center gap-6 md:flex-row">
                          <div className="relative">
                            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-border bg-primary/10 shadow-sm">
                              <User className="h-10 w-10 text-primary" />
                            </div>

                            {status === "joinable" && (
                              <span
                                className={cn(
                                  "absolute -top-1 flex h-4 w-4",
                                  isArabic ? "-left-1" : "-right-1"
                                )}
                              >
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex h-4 w-4 rounded-full bg-green-500" />
                              </span>
                            )}
                          </div>

                          <div
                            className={cn(
                              "flex-1 text-center",
                              isArabic ? "md:text-right" : "md:text-left"
                            )}
                          >
                            <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center">
                              <h3 className="text-xl font-bold text-foreground">
                                {appointment.doctor}
                              </h3>

                              <span className="hidden text-muted-foreground md:block">
                                |
                              </span>

                              <p className="text-sm font-bold uppercase tracking-wider text-primary">
                                {appointment.specialty}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-medium text-muted-foreground md:justify-start">
                              <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                {formatAppointmentDateTime(
                                  appointment.date,
                                  appointment.time
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex w-full items-center gap-3 md:w-auto">
                          {status === "joinable" && (
                            <Button
                              className="h-12 flex-1 gap-2 rounded-2xl bg-green-600 px-8 font-bold text-white shadow-lg shadow-green-600/20 transition-all hover:bg-green-700 md:flex-none"
                              onClick={() => handleJoinCall(appointment.id)}
                            >
                              <Video className="h-5 w-5" />
                              {t("consultationsPage.joinCall")}
                            </Button>
                          )}

                          {status === "upcoming" && (
                            <div className="hidden items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-5 py-3 text-sm font-bold text-primary md:flex">
                              <Clock3 className="h-4 w-4" />
                              {t("consultationsPage.upcomingStatus")}
                            </div>
                          )}

                          {status === "cancelled" && (
                            <div className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 md:flex-none">
                              {t("consultationsPage.cancelledStatus")}
                            </div>
                          )}

                          {status !== "cancelled" && (
                            <div className="flex flex-1 items-center gap-2 md:flex-none">
                              <Button
                                variant="ghost"
                                className="h-12 flex-1 rounded-2xl px-6 font-bold text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary md:flex-none"
                                onClick={() =>
                                  handleReschedule(appointment.id)
                                }
                              >
                                {t("consultationsPage.reschedule")}
                              </Button>

                              <Button
                                variant="ghost"
                                className="h-12 flex-1 rounded-2xl px-6 font-bold text-red-500 transition-all hover:bg-red-50 hover:text-red-600 dark:text-red-300 dark:hover:bg-red-500/10 dark:hover:text-red-300 md:flex-none"
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
                          <div className="mt-8 animate-in slide-in-from-top-4 border-t border-border pt-8 duration-500">
                            <h4 className="mb-6 flex items-center gap-2 text-lg font-bold text-foreground">
                              <Clock3 className="h-5 w-5 text-primary" />
                              {t("consultationsPage.rescheduleTitle")}
                            </h4>

                            <div className="mb-6 grid gap-6 md:grid-cols-2">
                              <div className="space-y-2">
                                <label className="ml-1 text-sm font-bold text-foreground">
                                  {t("consultationsPage.newDate")}
                                </label>

                                <input
                                  type="date"
                                  value={newRescheduleDate}
                                  onChange={(e) =>
                                    setNewRescheduleDate(e.target.value)
                                  }
                                  className="h-14 w-full rounded-2xl border border-border bg-background px-4 font-medium text-foreground outline-none transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="ml-1 text-sm font-bold text-foreground">
                                  {t("consultationsPage.newTime")}
                                </label>

                                <Select
                                  value={newRescheduleTime}
                                  onValueChange={setNewRescheduleTime}
                                >
                                  <SelectTrigger className="h-14 rounded-2xl border-border bg-background font-medium text-foreground shadow-none transition-all focus:ring-4 focus:ring-primary/10">
                                    <SelectValue
                                      placeholder={t(
                                        "consultationsPage.selectNewTime"
                                      )}
                                    />
                                  </SelectTrigger>

                                  <SelectContent className="rounded-2xl border-border bg-popover p-1 text-popover-foreground shadow-xl">
                                    <SelectItem
                                      value="10:00"
                                      className="cursor-pointer rounded-xl font-semibold focus:bg-primary/10 focus:text-primary"
                                    >
                                      {t("consultationsPage.time1000")}
                                    </SelectItem>

                                    <SelectItem
                                      value="11:00"
                                      className="cursor-pointer rounded-xl font-semibold focus:bg-primary/10 focus:text-primary"
                                    >
                                      {t("consultationsPage.time1100")}
                                    </SelectItem>

                                    <SelectItem
                                      value="14:00"
                                      className="cursor-pointer rounded-xl font-semibold focus:bg-primary/10 focus:text-primary"
                                    >
                                      {t("consultationsPage.time1400")}
                                    </SelectItem>

                                    <SelectItem
                                      value="15:00"
                                      className="cursor-pointer rounded-xl font-semibold focus:bg-primary/10 focus:text-primary"
                                    >
                                      {t("consultationsPage.time1500")}
                                    </SelectItem>

                                    <SelectItem
                                      value="16:00"
                                      className="cursor-pointer rounded-xl font-semibold focus:bg-primary/10 focus:text-primary"
                                    >
                                      {t("consultationsPage.time1600")}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="flex gap-4">
                              <Button
                                onClick={handleSaveReschedule}
                                className="h-12 rounded-2xl bg-primary px-8 font-bold text-primary-foreground shadow-lg shadow-primary/10 transition-all hover:bg-primary/90"
                              >
                                {t("consultationsPage.save")}
                              </Button>

                              <Button
                                variant="outline"
                                onClick={handleCloseReschedule}
                                className="h-12 rounded-2xl border-border bg-transparent px-8 font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                              >
                                {t("consultationsPage.cancel")}
                              </Button>
                            </div>
                          </div>
                        )}
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Consultations;