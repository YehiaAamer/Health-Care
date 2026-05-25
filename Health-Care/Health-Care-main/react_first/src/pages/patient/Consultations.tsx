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
  ChevronRight,
  MoreVertical,
  User,
  Info
} from "lucide-react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useIsVisible } from "@/hooks/useIsVisible";

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

  const [date, setDate] = useState<Date | undefined>(new Date(2026, 4, 8)); // May 8, 2026
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
        appointment.specialty === selectedDoctor.specialty,
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

    setAppointments((prevAppointments) => [newAppointment, ...prevAppointments]);

    toast.success(t("consultationsPage.confirmed"));

    setSpecialty("");
    setTimeSlot("");
    setDate(new Date(2026, 4, 8));
  };

  const handleJoinCall = (appointmentId: number) => {
    const appointment = appointments.find((item) => item.id === appointmentId);
    if (!appointment) return;

    toast.success(
      t("consultationsPage.joinToast", { doctor: appointment.doctor }),
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
      (item) => item.id === reschedulingId,
    );

    if (!currentAppointment) return;

    const isAlreadyBooked = appointments.some(
      (item) =>
        item.id !== reschedulingId &&
        item.status !== "cancelled" &&
        item.date === newRescheduleDate &&
        item.time === newRescheduleTime &&
        item.specialty === currentAppointment.specialty,
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
          : item,
      ),
    );

    toast.success(
      t("consultationsPage.rescheduleSuccess", {
        doctor: currentAppointment.doctor,
      }),
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
        item.id === appointmentId ? { ...item, status: "cancelled" } : item,
      ),
    );

    if (reschedulingId === appointmentId) {
      handleCloseReschedule();
    }

    toast.error(
      t("consultationsPage.cancelToast", { doctor: appointment.doctor }),
    );
  };

  const formatAppointmentDateTime = (
    appointmentDate: string,
    appointmentTime: string,
  ) => {
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);

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
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);

    if (now >= appointmentDateTime) {
      return "joinable";
    }

    return "upcoming";
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-slate-50/50"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Header variant="dashboard" />

      <main
        className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        style={{ paddingTop: `${DESKTOP_HEADER_HEIGHT + 48}px` }}
      >
        {/* Hero Section */}
        <div
          ref={heroRef}
          className={`text-center mb-16 transition-all duration-1000 ease-out ${
            heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
            {t("consultationsPage.title")}
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
            {t("consultationsPage.subtitle")}
          </p>
        </div>

        {/* Booking Form Card */}
        <Card
          ref={bookingRef as any}
          className={`overflow-hidden border-none shadow-2xl shadow-blue-900/5 bg-white rounded-[2.5rem] mb-20 transition-all duration-1000 ease-out delay-200 ${
            bookingVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="grid lg:grid-cols-12">
            {/* Left: Calendar */}
            <div className="lg:col-span-5 bg-blue-50/30 p-8 md:p-12 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-100">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                  <CalendarDays className="w-6 h-6 text-blue-600" />
                  {isArabic ? "اختر التاريخ" : "Select Date"}
                </h3>
                <p className="text-slate-500 text-sm font-medium">
                  {isArabic ? "المواعيد المتاحة تظهر باللون الأزرق" : "Available slots are highlighted in blue"}
                </p>
              </div>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-900/5 border-none mx-auto lg:mx-0 w-fit"
                disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                initialFocus
              />
            </div>

            {/* Right: Form */}
            <div className="lg:col-span-7 p-8 md:p-12">
              <div className="mb-10">
                <h3 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                  <Stethoscope className="w-6 h-6 text-blue-600" />
                  {t("consultationsPage.bookingSection")}
                </h3>
                <p className="text-slate-500 text-sm font-medium">
                  {isArabic ? "يرجى ملء التفاصيل لتأكيد استشارتك" : "Please fill in the details to confirm your consultation"}
                </p>
              </div>

              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700 ml-1 block">
                      {t("consultationsPage.specialization")}
                    </label>
                    <Select value={specialty} onValueChange={setSpecialty}>
                      <SelectTrigger className="h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium">
                        <SelectValue placeholder={t("consultationsPage.generalPractitioner")} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-100">
                        <SelectItem value="general" className="rounded-xl">{t("consultationsPage.generalPractitioner")}</SelectItem>
                        <SelectItem value="cardio" className="rounded-xl">{t("consultationsPage.cardiologist")}</SelectItem>
                        <SelectItem value="derma" className="rounded-xl">{t("consultationsPage.dermatologist")}</SelectItem>
                        <SelectItem value="neuro" className="rounded-xl">{t("consultationsPage.neurologist")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700 ml-1 block">
                      {t("consultationsPage.timeSlots")}
                    </label>
                    <Select value={timeSlot} onValueChange={setTimeSlot}>
                      <SelectTrigger className="h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium">
                        <SelectValue placeholder={t("consultationsPage.time1000")} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-100">
                        <SelectItem value="10:00" className="rounded-xl">{t("consultationsPage.time1000")}</SelectItem>
                        <SelectItem value="11:00" className="rounded-xl">{t("consultationsPage.time1100")}</SelectItem>
                        <SelectItem value="14:00" className="rounded-xl">{t("consultationsPage.time1400")}</SelectItem>
                        <SelectItem value="15:00" className="rounded-xl">{t("consultationsPage.time1500")}</SelectItem>
                        <SelectItem value="16:00" className="rounded-xl">{t("consultationsPage.time1600")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={handleBooking} 
                    className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-lg font-bold shadow-xl shadow-blue-600/20 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {t("consultationsPage.confirm")}
                  </Button>
                  <div className="mt-4 flex items-center justify-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <Info className="w-4 h-4" />
                    {isArabic ? "سيتم إرسال رابط المكالمة إلى بريدك الإلكتروني" : "Call link will be sent to your email"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Upcoming Appointments */}
        <div
          ref={appointmentsRef}
          className={`transition-all duration-1000 ease-out delay-400 ${
            appointmentsVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-slate-900">
              {t("consultationsPage.upcoming")}
            </h2>
            <div className="h-px bg-slate-200 flex-1 mx-8 hidden md:block" />
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
                    className={`group overflow-hidden border-none shadow-lg shadow-slate-200/50 bg-white rounded-3xl transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px] ${
                      status === 'cancelled' ? 'opacity-60 grayscale' : ''
                    }`}
                  >
                    <div className="p-6 md:p-8">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                          <div className="relative">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                              <User className="w-10 h-10 text-blue-400" />
                            </div>
                            {status === 'joinable' && (
                              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                              </span>
                            )}
                          </div>
                          
                          <div className="text-center md:text-left flex-1">
                            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                              <h3 className="text-xl font-bold text-slate-900">{appointment.doctor}</h3>
                              <span className="hidden md:block text-slate-300">|</span>
                              <p className="text-blue-600 font-bold text-sm uppercase tracking-wider">
                                {appointment.specialty}
                              </p>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-y-2 gap-x-6 text-slate-500 font-medium">
                              <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-slate-400" />
                                {formatAppointmentDateTime(appointment.date, appointment.time)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                          {status === "joinable" && (
                            <Button
                              className="flex-1 md:flex-none gap-2 h-12 px-8 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold shadow-lg shadow-green-600/20 transition-all"
                              onClick={() => handleJoinCall(appointment.id)}
                            >
                              <Video className="h-5 w-5" />
                              {t("consultationsPage.joinCall")}
                            </Button>
                          )}

                          {status === "upcoming" && (
                            <div className="hidden md:flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/50 px-5 py-3 text-sm font-bold text-blue-600">
                              <Clock3 className="h-4 w-4" />
                              {t("consultationsPage.upcomingStatus")}
                            </div>
                          )}

                          {status === "cancelled" && (
                            <div className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-600">
                              {t("consultationsPage.cancelledStatus")}
                            </div>
                          )}

                          {status !== "cancelled" && (
                            <div className="flex items-center gap-2 flex-1 md:flex-none">
                              <Button
                                variant="ghost"
                                className="flex-1 md:flex-none h-12 px-6 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all"
                                onClick={() => handleReschedule(appointment.id)}
                              >
                                {t("consultationsPage.reschedule")}
                              </Button>

                              <Button
                                variant="ghost"
                                className="flex-1 md:flex-none h-12 px-6 rounded-2xl font-bold text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
                                onClick={() => handleCancel(appointment.id)}
                              >
                                {t("consultationsPage.cancel")}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reschedule Subsection */}
                      {reschedulingId === appointment.id && status !== "cancelled" && (
                        <div className="mt-8 pt-8 border-t border-slate-100 animate-in slide-in-from-top-4 duration-500">
                          <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Clock3 className="w-5 h-5 text-blue-600" />
                            {t("consultationsPage.rescheduleTitle")}
                          </h4>

                          <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700 ml-1">
                                {t("consultationsPage.newDate")}
                              </label>
                              <input
                                type="date"
                                value={newRescheduleDate}
                                onChange={(e) => setNewRescheduleDate(e.target.value)}
                                className="w-full h-14 bg-slate-50 border-slate-100 rounded-2xl px-4 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700 ml-1">
                                {t("consultationsPage.newTime")}
                              </label>
                              <Select value={newRescheduleTime} onValueChange={setNewRescheduleTime}>
                                <SelectTrigger className="h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium">
                                  <SelectValue placeholder={t("consultationsPage.selectNewTime")} />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100">
                                  <SelectItem value="10:00" className="rounded-xl">{t("consultationsPage.time1000")}</SelectItem>
                                  <SelectItem value="11:00" className="rounded-xl">{t("consultationsPage.time1100")}</SelectItem>
                                  <SelectItem value="14:00" className="rounded-xl">{t("consultationsPage.time1400")}</SelectItem>
                                  <SelectItem value="15:00" className="rounded-xl">{t("consultationsPage.time1500")}</SelectItem>
                                  <SelectItem value="16:00" className="rounded-xl">{t("consultationsPage.time1600")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="flex gap-4">
                            <Button
                              onClick={handleSaveReschedule}
                              className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/10 transition-all"
                            >
                              {t("consultationsPage.save")}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleCloseReschedule}
                              className="h-12 px-8 border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
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
