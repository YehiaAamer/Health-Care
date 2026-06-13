import {
  useState,
  useEffect,
  useRef,
  useMemo,
  type ChangeEvent,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { messagesApi } from "@/api/messages";
import { patientsApi } from "@/api/patients";
import { apiCall, API_ENDPOINTS } from "@/lib/api";
import type {
  ChatThread,
  ChatMessage,
  User,
  Prediction,
  DiseaseType,
  DoctorProfileResponse,
} from "@/types/api";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  MessageSquare,
  Search,
  Send,
  FileText,
  Check,
  CheckCheck,
  TrendingUp,
  User as UserIcon,
  X,
  Paperclip,
  ChevronDown,
} from "lucide-react";

import { toast } from "sonner";
import { cn } from "@/lib/utils";

type IndicatorColor = "red" | "green" | "primary";

type SummaryIndicator = {
  label: string;
  value: string | number;
  unit: string;
  color: IndicatorColor;
};

type MessagesLocationState = {
  patientId?: number | string;
  patientName?: string;
  openPatientId?: number | string;
  openPatientName?: string;
  fromReports?: boolean;
};

type ChatMessageWithReadStatus = ChatMessage & {
  is_read?: boolean;
  read?: boolean;
  seen?: boolean;
  is_seen?: boolean;
  read_at?: string | null;
  seen_at?: string | null;
  status?: string;
  delivery_status?: string;
};

export default function MessagesPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isArabic = i18n.language === "ar";

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedThreadRef = useRef<number | null>(null);
  const routeSelectionAppliedRef = useRef(false);

  const [sending, setSending] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedConv, setSelectedConv] = useState<ChatThread | null>(null);
  const [patientProfile, setPatientProfile] = useState<
    (User & { predictions: Prediction[] }) | null
  >(null);

  const [doctorSpecialties, setDoctorSpecialties] = useState<DiseaseType[]>([
    "diabetes",
  ]);

  const [newMessage, setNewMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeRiskFilter, setActiveRiskFilter] = useState("all");
  const [riskDropdownOpen, setRiskDropdownOpen] = useState(false);

  const [conversations, setConversations] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);

  const doctorDiseaseType: DiseaseType = doctorSpecialties[0] || "diabetes";

  const getPatientNumericId = (patientId?: string | number) => {
    const numericId = parseInt(String(patientId ?? "").replace(/\D/g, ""), 10);
    return Number.isNaN(numericId) ? 0 : numericId;
  };

  const routeState = (location.state || {}) as MessagesLocationState;

  const routePatientId = getPatientNumericId(
    routeState.openPatientId || routeState.patientId
  );

  const routePatientName = String(
    routeState.openPatientName || routeState.patientName || ""
  )
    .trim()
    .toLowerCase();

  const normalizeRisk = (risk?: string) =>
    risk?.toLowerCase().replace(/\s|_/g, "") || "";

  const isMessageReadByPatient = (message: ChatMessage) => {
    const msg = message as ChatMessageWithReadStatus;

    const normalizedStatus = String(msg.status || msg.delivery_status || "")
      .trim()
      .toLowerCase();

    return (
      msg.is_read === true ||
      msg.read === true ||
      msg.seen === true ||
      msg.is_seen === true ||
      Boolean(msg.read_at) ||
      Boolean(msg.seen_at) ||
      normalizedStatus === "read" ||
      normalizedStatus === "seen"
    );
  };

  const isFemaleGender = (gender?: string | number | null) => {
    const normalizedGender = String(gender || "").trim().toLowerCase();

    return (
      normalizedGender === "female" ||
      normalizedGender === "f" ||
      normalizedGender === "woman" ||
      normalizedGender === "girl" ||
      normalizedGender === "أنثى" ||
      normalizedGender === "انثى" ||
      normalizedGender === "بنت"
    );
  };

  const getPatientInitials = (name?: string, fallbackId?: string | number) => {
    const cleanName = String(name || "").trim();

    if (cleanName) {
      const initials = cleanName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

      return initials || "P";
    }

    const id = getPatientNumericId(fallbackId);
    return id ? `P${id}` : "P";
  };

  const getConversationTime = (time?: string) => {
    if (!time) return "";

    const date = new Date(time);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString(isArabic ? "ar-EG" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDateLabel = (date?: string) => {
    if (!date) return "--";

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "--";

    return parsedDate.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatNumber = (value?: number | string | null, digits = 0) => {
    if (value === null || value === undefined || value === "") return "--";

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) return String(value);

    return digits > 0 ? numericValue.toFixed(digits) : Math.round(numericValue);
  };

  const getDiseaseLabel = (diseaseType?: DiseaseType | string) => {
    if (diseaseType === "cardiovascular") {
      return isArabic ? "القلب و الأوعية الدموية" : "Cardiovascular";
    }

    if (diseaseType === "diabetes") {
      return isArabic ? "السكري" : "Diabetes";
    }

    return diseaseType || "--";
  };

  const closeMenus = () => {
    setRiskDropdownOpen(false);
  };

  const openPatientReportsArchive = () => {
    const patientId = getPatientNumericId(selectedConv?.patient_id);

    if (!patientId) {
      toast.info(
        isArabic
          ? "اختار مريض الأول لفتح الأرشيف"
          : "Select a patient first to open the archive"
      );
      return;
    }

    navigate(
      `/doctor-dashboard/reports?patientId=${patientId}&diseaseType=${doctorDiseaseType}`,
      {
        state: {
          patientId,
          patientName: selectedConv?.patient_name,
          diseaseType: doctorDiseaseType,
          fromPatientArchive: true,
        },
      }
    );
  };

  const fetchDoctorProfile = async () => {
    try {
      const profile = await apiCall<DoctorProfileResponse>(
        API_ENDPOINTS.DOCTOR_PROFILE
      );

      const specialties = Array.isArray(profile?.specialties)
        ? profile.specialties.filter(
            (specialty): specialty is DiseaseType =>
              specialty === "diabetes" || specialty === "cardiovascular"
          )
        : [];

      setDoctorSpecialties(specialties.length > 0 ? specialties : ["diabetes"]);
    } catch (error) {
      console.error("Failed to fetch doctor profile", error);
      setDoctorSpecialties(["diabetes"]);
    }
  };

  const findRouteConversation = (threads: ChatThread[]) => {
    if (!routePatientId && !routePatientName) return null;

    return (
      threads.find((thread) => {
        const threadPatientId = getPatientNumericId(thread.patient_id);
        const threadPatientName = String(thread.patient_name || "")
          .trim()
          .toLowerCase();

        return (
          (!!routePatientId && threadPatientId === routePatientId) ||
          (!!routePatientName && threadPatientName === routePatientName)
        );
      }) || null
    );
  };

  const fetchConversations = async (showToast = false) => {
    try {
      const data = await messagesApi.getThreads();
      const safeThreads = Array.isArray(data) ? data : [];

      setConversations(safeThreads);

      const routeConversation = findRouteConversation(safeThreads);

      if (routeConversation && !routeSelectionAppliedRef.current) {
        routeSelectionAppliedRef.current = true;
        setSelectedConv(routeConversation);
        selectedThreadRef.current = routeConversation.id;
        setSearch("");
      } else if (selectedConv) {
        const refreshedSelected = safeThreads.find(
          (thread) => thread.id === selectedConv.id
        );

        if (refreshedSelected) {
          setSelectedConv(refreshedSelected);
        }
      } else if (safeThreads.length > 0) {
        setSelectedConv(safeThreads[0]);
        selectedThreadRef.current = safeThreads[0].id;
      }

      if (showToast) {
        toast.success(
          isArabic ? "تم تحديث المحادثات" : "Conversations refreshed"
        );
      }
    } catch (error) {
      console.error("Failed to fetch conversations", error);

      if (showToast) {
        toast.error(
          isArabic ? "فشل تحميل المحادثات" : "Failed to load conversations"
        );
      }
    }
  };

  const fetchMessages = async (threadId: number, showToast = false) => {
    try {
      const data = await messagesApi.getMessages(threadId);

      if (selectedThreadRef.current === threadId) {
        setMessages(Array.isArray(data) ? data : []);
        setMessagesLoaded(true);
      }

      if (showToast) {
        toast.success(isArabic ? "تم تحديث الرسائل" : "Messages refreshed");
      }
    } catch (error) {
      console.error("Failed to fetch messages", error);

      if (selectedThreadRef.current === threadId) {
        setMessagesLoaded(true);
      }

      if (showToast) {
        toast.error(isArabic ? "فشل تحميل الرسائل" : "Failed to load messages");
      }
    }
  };

  const fetchPatientProfile = async (patientId: string | number) => {
    try {
      const numericId = getPatientNumericId(patientId);

      if (!numericId) {
        setPatientProfile(null);
        return;
      }

      const data = await patientsApi.getPatientProfile(numericId);
      setPatientProfile(data);
    } catch (error) {
      console.error("Failed to fetch patient profile", error);
      setPatientProfile(null);
    }
  };

  const handleSelectConversation = (conv: ChatThread) => {
    closeMenus();
    selectedThreadRef.current = conv.id;
    setMessagesLoaded(false);
    setSelectedConv(conv);
  };

  const handleFileSelectClick = () => {
    if (!selectedConv) {
      toast.info(isArabic ? "اختار مريض الأول" : "Select patient first");
      return;
    }

    closeMenus();
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    toast.info(
      isArabic
        ? `تم اختيار الملف: ${file.name} — رفع الملفات يحتاج endpoint من الباك`
        : `Selected file: ${file.name} — backend upload endpoint is needed`
    );

    event.target.value = "";
  };

  useEffect(() => {
    routeSelectionAppliedRef.current = false;
  }, [routePatientId, routePatientName]);

  useEffect(() => {
    fetchDoctorProfile();
    fetchConversations();

    const interval = setInterval(() => fetchConversations(), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedConv) {
      selectedThreadRef.current = null;
      setMessages([]);
      setMessagesLoaded(false);
      setPatientProfile(null);
      return;
    }

    selectedThreadRef.current = selectedConv.id;
    setMessagesLoaded(false);

    fetchMessages(selectedConv.id);
    fetchPatientProfile(selectedConv.patient_id);

    const interval = setInterval(() => {
      if (selectedThreadRef.current === selectedConv.id) {
        fetchMessages(selectedConv.id);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [selectedConv?.id]);

  useEffect(() => {
    if (!scrollRef.current) return;

    const scrollContainer = scrollRef.current.querySelector(
      "[data-radix-scroll-area-viewport]"
    );

    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || sending) return;

    const messageText = newMessage.trim();
    const activeThreadId = selectedConv.id;

    try {
      setSending(true);

      const sentMsg = await messagesApi.sendMessage(activeThreadId, messageText);

      const safeSentMessage = {
        ...sentMsg,
        is_read: (sentMsg as ChatMessageWithReadStatus).is_read ?? false,
        read: (sentMsg as ChatMessageWithReadStatus).read ?? false,
        seen: (sentMsg as ChatMessageWithReadStatus).seen ?? false,
      } as ChatMessage;

      if (selectedThreadRef.current === activeThreadId) {
        setMessagesLoaded(true);
        setMessages((prev) => [...prev, safeSentMessage]);
      }

      setNewMessage("");

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeThreadId
            ? {
                ...conv,
                last_message: messageText,
                time: new Date().toISOString(),
                unread_count: 0,
              }
            : conv
        )
      );

      window.dispatchEvent(new Event("refreshDoctorMessagesBadge"));

      setTimeout(() => {
        if (selectedThreadRef.current === activeThreadId) {
          fetchMessages(activeThreadId);
        }
      }, 400);

      toast.success(isArabic ? "تم إرسال الرسالة" : "Message sent");
    } catch (error) {
      console.error("Failed to send message", error);
      toast.error(isArabic ? "فشل إرسال الرسالة" : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return conversations.filter((conv) => {
      const risk = normalizeRisk(conv.risk_level);

      const matchesSearch =
        !searchValue ||
        conv.patient_name?.toLowerCase().includes(searchValue) ||
        String(conv.patient_id ?? "").toLowerCase().includes(searchValue) ||
        conv.last_message?.toLowerCase().includes(searchValue);

      const matchesMainFilter =
        activeFilter === "all" ||
        (activeFilter === "unread" && Number(conv.unread_count) > 0);

      const matchesRiskFilter =
        activeRiskFilter === "all" ||
        (activeRiskFilter === "veryHighRisk" && risk === "veryhigh") ||
        (activeRiskFilter === "highRisk" && risk === "high") ||
        (activeRiskFilter === "mediumRisk" && risk === "medium") ||
        (activeRiskFilter === "lowRisk" && risk === "low");

      return matchesSearch && matchesMainFilter && matchesRiskFilter;
    });
  }, [conversations, search, activeFilter, activeRiskFilter]);

  const getRiskBadgeStyles = (level?: string) => {
    switch (normalizeRisk(level)) {
      case "veryhigh":
        return "border-red-200 bg-red-50 text-red-700 hover:!bg-red-50 hover:!text-red-700 dark:border-red-400/40 dark:bg-red-900/35 dark:text-red-100 dark:hover:!bg-red-900/35 dark:hover:!text-red-100";
      case "high":
        return "border-orange-200 bg-orange-50 text-orange-700 hover:!bg-orange-50 hover:!text-orange-700 dark:border-orange-400/40 dark:bg-orange-900/35 dark:text-orange-100 dark:hover:!bg-orange-900/35 dark:hover:!text-orange-100";
      case "medium":
        return "border-amber-200 bg-amber-50 text-amber-700 hover:!bg-amber-50 hover:!text-amber-700 dark:border-amber-400/40 dark:bg-amber-900/35 dark:text-amber-100 dark:hover:!bg-amber-900/35 dark:hover:!text-amber-100";
      case "low":
        return "border-emerald-200 bg-emerald-50 text-emerald-700 hover:!bg-emerald-50 hover:!text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-900/35 dark:text-emerald-100 dark:hover:!bg-emerald-900/35 dark:hover:!text-emerald-100";
      default:
        return "border-primary/15 bg-primary/10 text-primary hover:!bg-primary/10 hover:!text-primary dark:border-primary/30 dark:bg-primary/20 dark:text-primary dark:hover:!bg-primary/20 dark:hover:!text-primary";
    }
  };

  const getRiskTrendCardStyles = (level?: string) => {
    switch (normalizeRisk(level)) {
      case "veryhigh":
        return "border-red-200 bg-red-50 text-red-900 dark:border-red-400/40 dark:bg-red-950/45 dark:text-red-50";
      case "high":
        return "border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-400/40 dark:bg-orange-950/45 dark:text-orange-50";
      case "medium":
        return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/40 dark:bg-amber-950/45 dark:text-amber-50";
      case "low":
        return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-950/45 dark:text-emerald-50";
      default:
        return "border-primary/20 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/20 dark:text-primary";
    }
  };

  const getRiskLabel = (level?: string) => {
    const risk = normalizeRisk(level);

    if (isArabic) {
      if (risk === "veryhigh") return "خطورة عالية جدًا";
      if (risk === "high") return "خطورة عالية";
      if (risk === "medium") return "خطورة متوسطة";
      if (risk === "low") return "خطورة منخفضة";
      return "غير محدد";
    }

    if (risk === "veryhigh") return "Very High Risk";
    if (risk === "high") return "High Risk";
    if (risk === "medium") return "Medium Risk";
    if (risk === "low") return "Low Risk";
    return "Unknown Risk";
  };

  const getIndicatorDotClass = (color: IndicatorColor) => {
    if (color === "red") return "bg-red-500 ring-red-100 dark:ring-red-500/20";

    if (color === "green") {
      return "bg-emerald-500 ring-emerald-100 dark:ring-emerald-500/20";
    }

    return "bg-primary ring-primary/10";
  };

  const specialtyPredictions = useMemo(() => {
    const predictions = patientProfile?.predictions || [];

    return predictions.filter(
      (prediction) => prediction.disease_type === doctorDiseaseType
    );
  }, [patientProfile?.predictions, doctorDiseaseType]);

  const latestPrediction = specialtyPredictions[0];
  const latestExtraFields = latestPrediction?.extra_fields || {};
  const selectedPatientId = getPatientNumericId(selectedConv?.patient_id);

  const summaryIndicators: SummaryIndicator[] = useMemo(() => {
    const extra = latestExtraFields as Record<
      string,
      string | number | boolean | undefined
    >;

    const gender = extra.gender || "--";
    const weight = extra.weight || "--";
    const height = extra.height || "--";

    const systolic = extra.systolic_bp || extra.systolicBloodPressure || "--";

    const diastolic =
      extra.diastolic_bp ||
      extra.diastolicBloodPressure ||
      latestPrediction?.blood_pressure ||
      "--";

    const glucose = latestPrediction?.glucose || "--";
    const cholesterol = extra.cholesterol || "--";

    const femaleOnlyIndicators: SummaryIndicator[] = isFemaleGender(gender)
      ? [
          {
            label: isArabic ? "عدد مرات الحمل" : "Pregnancies",
            value: formatNumber(latestPrediction?.pregnancies),
            unit: "",
            color: "primary",
          },
        ]
      : [];

    if (doctorDiseaseType === "cardiovascular") {
      return [
        {
          label: isArabic ? "النوع" : "Gender",
          value: String(gender),
          unit: "",
          color: "primary",
        },
        {
          label: isArabic ? "الطول" : "Height",
          value: formatNumber(height, 1),
          unit: "cm",
          color: "primary",
        },
        {
          label: isArabic ? "الوزن" : "Weight",
          value: formatNumber(weight, 1),
          unit: "kg",
          color: "primary",
        },
        {
          label: isArabic ? "الضغط الانقباضي" : "Systolic BP",
          value: formatNumber(systolic),
          unit: "mmHg",
          color: Number(systolic || 0) >= 140 ? "red" : "primary",
        },
        {
          label: isArabic ? "الضغط الانبساطي" : "Diastolic BP",
          value: formatNumber(diastolic),
          unit: "mmHg",
          color: Number(diastolic || 0) >= 90 ? "red" : "primary",
        },
        {
          label: t("dashboard.glucose", "Glucose"),
          value: formatNumber(glucose),
          unit: "mg/dL",
          color: Number(glucose || 0) > 140 ? "red" : "green",
        },
        {
          label: isArabic ? "الكوليسترول" : "Cholesterol",
          value: formatNumber(cholesterol),
          unit: "mg/dL",
          color: Number(cholesterol || 0) >= 240 ? "red" : "green",
        },
        ...femaleOnlyIndicators,
        {
          label: t("dashboard.age", "Age"),
          value: formatNumber(latestPrediction?.age),
          unit: isArabic ? "سنة" : "Years",
          color: "primary",
        },
      ];
    }

    return [
      {
        label: isArabic ? "النوع" : "Gender",
        value: String(gender),
        unit: "",
        color: "primary",
      },
      {
        label: isArabic ? "الطول" : "Height",
        value: formatNumber(height, 1),
        unit: "cm",
        color: "primary",
      },
      {
        label: isArabic ? "الوزن" : "Weight",
        value: formatNumber(weight, 1),
        unit: "kg",
        color: "primary",
      },
      {
        label: isArabic ? "الضغط الانبساطي" : "Diastolic BP",
        value: formatNumber(diastolic),
        unit: "mmHg",
        color: Number(diastolic || 0) >= 90 ? "red" : "primary",
      },
      {
        label: t("dashboard.glucose", "Glucose"),
        value: formatNumber(glucose),
        unit: "mg/dL",
        color: Number(glucose || 0) > 140 ? "red" : "green",
      },
      {
        label: isArabic ? "سُمك الجلد" : "Skin Thickness",
        value: formatNumber(latestPrediction?.skin_thickness),
        unit: "mm",
        color: "primary",
      },
      {
        label: isArabic ? "مستوى الإنسولين" : "Insulin Level",
        value: formatNumber(latestPrediction?.insulin),
        unit: "mu U/ml",
        color: Number(latestPrediction?.insulin || 0) > 25 ? "red" : "green",
      },
      {
        label: isArabic
          ? "العامل الوراثي للسكري"
          : "Diabetes Pedigree Function",
        value: formatNumber(latestPrediction?.diabetes_pedigree_function, 2),
        unit: "",
        color:
          Number(latestPrediction?.diabetes_pedigree_function || 0) >= 0.5
            ? "red"
            : "green",
      },
      ...femaleOnlyIndicators,
      {
        label: t("dashboard.age", "Age"),
        value: formatNumber(latestPrediction?.age),
        unit: isArabic ? "سنة" : "Years",
        color: "primary",
      },
    ];
  }, [doctorDiseaseType, latestExtraFields, latestPrediction, isArabic, t]);

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="grid min-h-[calc(100vh-132px)] grid-cols-1 gap-5 overflow-visible pt-8 text-foreground animate-in fade-in duration-700 md:min-h-[calc(100vh-100px)] md:pt-0 xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)_360px]"
      onClick={closeMenus}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelected}
      />

      <Card className="relative z-50 flex h-[520px] min-h-0 flex-col overflow-visible rounded-3xl border border-border bg-card text-card-foreground shadow-sm sm:h-[620px] xl:h-[calc(100vh-100px)]">
        <div className="relative z-[80] shrink-0 rounded-t-3xl border-b border-border bg-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {t("doctorDashboard.sidebar.messages.title")}
            </h2>
          </div>

          <div className="relative mb-4">
            <Search
              className={cn(
                "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
                isArabic ? "right-4" : "left-4"
              )}
            />

            <Input
              placeholder={isArabic ? "اختار مريض..." : "Select patient..."}
              className={cn(
                "h-11 rounded-2xl border-border bg-background text-sm font-semibold text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:ring-4 focus-visible:ring-primary/10",
                isArabic ? "pr-11 pl-10 text-right" : "pl-11 pr-10"
              )}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearch("");
                }}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:!bg-transparent hover:!text-primary",
                  isArabic ? "left-3" : "right-3"
                )}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-visible pb-1">
            {[
              {
                id: "all",
                label: t("doctorDashboard.sidebar.messages.filters.all"),
              },
              {
                id: "unread",
                label: t("doctorDashboard.sidebar.messages.filters.unread"),
              },
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveFilter(filter.id);
                }}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-none",
                  activeFilter === filter.id
                    ? "bg-primary text-primary-foreground hover:!bg-primary hover:!text-primary-foreground"
                    : "bg-primary/10 text-primary hover:!bg-primary/10 hover:!text-primary"
                )}
              >
                {filter.label}
              </button>
            ))}

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setRiskDropdownOpen((prev) => !prev);
                }}
                className={cn(
                  "flex items-center gap-1 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-none",
                  activeRiskFilter !== "all"
                    ? "bg-primary text-primary-foreground hover:!bg-primary hover:!text-primary-foreground"
                    : "bg-primary/10 text-primary hover:!bg-primary/10 hover:!text-primary"
                )}
              >
                {activeRiskFilter === "veryHighRisk"
                  ? isArabic
                    ? "عالية جدًا"
                    : "Very High"
                  : activeRiskFilter === "highRisk"
                  ? isArabic
                    ? "عالية"
                    : "High"
                  : activeRiskFilter === "mediumRisk"
                  ? isArabic
                    ? "متوسطة"
                    : "Medium"
                  : activeRiskFilter === "lowRisk"
                  ? isArabic
                    ? "منخفضة"
                    : "Low"
                  : isArabic
                  ? "الخطورة"
                  : "Risk"}

                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {riskDropdownOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "absolute top-11 z-[9999] w-44 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-2xl",
                    isArabic ? "right-0" : "left-0"
                  )}
                >
                  {[
                    { id: "all", label: isArabic ? "كل الحالات" : "All Risks" },
                    {
                      id: "veryHighRisk",
                      label: isArabic ? "عالية جدًا" : "Very High",
                    },
                    { id: "highRisk", label: isArabic ? "عالية" : "High" },
                    {
                      id: "mediumRisk",
                      label: isArabic ? "متوسطة" : "Medium",
                    },
                    { id: "lowRisk", label: isArabic ? "منخفضة" : "Low" },
                  ].map((risk) => (
                    <button
                      key={risk.id}
                      type="button"
                      onClick={() => {
                        setActiveRiskFilter(risk.id);
                        setRiskDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full rounded-xl px-3 py-2 text-start text-xs font-bold hover:!bg-primary/10 hover:!text-primary",
                        activeRiskFilter === risk.id
                          ? "bg-primary text-primary-foreground hover:!bg-primary hover:!text-primary-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {risk.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="relative z-10 min-h-0 flex-1 overflow-hidden">
          <div className="space-y-3 p-3">
            {filteredConversations.length === 0 ? (
              <div className="py-10 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {search
                  ? isArabic
                    ? "لا توجد نتائج مطابقة"
                    : "No matching conversations"
                  : t("doctorDashboard.sidebar.messages.noConversations")}
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectConversation(conv)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSelectConversation(conv);
                  }}
                  className={cn(
                    "relative flex min-h-[106px] w-full cursor-pointer items-center gap-3 overflow-hidden rounded-3xl border p-4 text-start transition-none",
                    selectedConv?.id === conv.id
                      ? "border-primary/30 bg-primary/10"
                      : "border-transparent bg-card hover:border-primary/20 hover:!bg-primary/[0.04]"
                  )}
                >
                  <Avatar className="h-12 w-12 shrink-0 border border-primary/15 bg-primary/5">
                    <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                      {getPatientInitials(conv.patient_name, conv.patient_id)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex min-w-0 items-start justify-between gap-2">
                      <h4 className="min-w-0 flex-1 truncate text-sm font-bold leading-5 text-foreground">
                        {conv.patient_name || (isArabic ? "مريض" : "Patient")}
                      </h4>

                      <span className="shrink-0 text-[10px] font-bold leading-5 text-muted-foreground">
                        {getConversationTime(conv.time)}
                      </span>
                    </div>

                    <p className="mb-2 line-clamp-1 min-h-[18px] text-xs font-medium leading-5 text-muted-foreground">
                      {conv.last_message ||
                        (isArabic ? "لا توجد رسائل بعد" : "No messages yet")}
                    </p>

                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        className={cn(
                          "max-w-full rounded-full border px-2 py-0.5 text-[10px] font-bold shadow-none",
                          getRiskBadgeStyles(conv.risk_level)
                        )}
                      >
                        <span className="truncate">
                          {getRiskLabel(conv.risk_level)}
                        </span>
                      </Badge>

                      {Number(conv.unread_count) > 0 &&
                        selectedConv?.id !== conv.id && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                            {Number(conv.unread_count) > 99
                              ? "99+"
                              : conv.unread_count}
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      <Card className="relative z-20 flex h-[520px] min-h-0 flex-col overflow-visible rounded-3xl border border-border bg-card text-card-foreground shadow-sm md:h-[620px] xl:h-[calc(100vh-100px)]">
        <div className="flex min-h-[80px] shrink-0 items-center gap-4 rounded-t-3xl border-b border-border bg-card px-4 sm:px-5">
          {selectedConv && (
            <Avatar className="h-12 w-12 border border-primary/15 bg-primary/5">
              <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                {getPatientInitials(
                  selectedConv.patient_name,
                  selectedConv.patient_id
                )}
              </AvatarFallback>
            </Avatar>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {selectedConv && (
                <h3 className="truncate text-base font-bold text-foreground">
                  {selectedConv.patient_name}
                </h3>
              )}

              {selectedConv && (
                <Badge
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-bold shadow-none",
                    getRiskBadgeStyles(selectedConv.risk_level)
                  )}
                >
                  {getRiskLabel(selectedConv.risk_level)}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <ScrollArea
          className="min-h-0 flex-1 bg-primary/[0.03] px-4 md:px-8"
          ref={scrollRef}
        >
          <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-end space-y-6 py-8">
            {!selectedConv ? (
              <div className="flex flex-1" />
            ) : !messagesLoaded ? (
              <div className="flex flex-1" />
            ) : messages.length === 0 ? (
              <div className="flex flex-1 flex-col justify-end">
                <div className="mx-auto mb-8 max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <MessageSquare className="h-6 w-6" />
                  </div>

                  <h3 className="text-base font-bold text-foreground">
                    {isArabic ? "لا توجد رسائل" : "No messages"}
                  </h3>

                  <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                    {isArabic
                      ? "ابدأ المحادثة بإرسال رسالة للمريض."
                      : "Start the conversation by sending a message to the patient."}
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isDoctorMessage =
                  getPatientNumericId(msg.sender_user) !== selectedPatientId;

                const isReadByPatient = isMessageReadByPatient(msg);

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-4",
                      isDoctorMessage ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "flex max-w-[86%] flex-col sm:max-w-[78%]",
                        isDoctorMessage ? "items-end" : "items-start"
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-3xl px-5 py-3 text-sm font-semibold leading-6 shadow-sm",
                          isDoctorMessage
                            ? "rounded-tr-md bg-primary text-primary-foreground"
                            : "rounded-tl-md border border-border bg-card text-foreground"
                        )}
                      >
                        {msg.content}
                      </div>

                      <div className="mt-2 flex items-center gap-2 px-2">
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {msg.created_at
                            ? new Date(msg.created_at).toLocaleTimeString(
                                isArabic ? "ar-EG" : "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "--:--"}
                        </span>

                        {isDoctorMessage &&
                          (isReadByPatient ? (
                            <CheckCheck
                              className="h-3.5 w-3.5 text-primary"
                              aria-label={
                                isArabic ? "تمت القراءة" : "Read by patient"
                              }
                            />
                          ) : (
                            <Check
                              className="h-3.5 w-3.5 text-muted-foreground"
                              aria-label={isArabic ? "تم الإرسال" : "Sent"}
                            />
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="shrink-0 rounded-b-3xl border-t border-border bg-card p-4 md:p-6">
          <div
            className={cn(
              "flex items-center gap-2 rounded-3xl border border-border bg-background p-2 shadow-sm focus-within:ring-4 focus-within:ring-primary/10 sm:gap-3",
              !selectedConv && "opacity-90"
            )}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!selectedConv}
              onClick={handleFileSelectClick}
              className="h-10 w-10 shrink-0 rounded-2xl text-muted-foreground hover:!bg-primary/10 hover:!text-primary disabled:opacity-40"
            >
              <Paperclip className="h-5 w-5" />
            </Button>

            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!selectedConv}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                selectedConv
                  ? t("doctorDashboard.sidebar.messages.typeMessage")
                  : isArabic
                  ? "اختار مريض الأول..."
                  : "Select patient first..."
              }
              className={cn(
                "min-w-0 flex-1 border-none bg-transparent px-2 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed",
                isArabic && "text-right"
              )}
            />

            <Button
              type="button"
              onClick={handleSendMessage}
              disabled={!selectedConv || !newMessage.trim() || sending}
              className="h-11 shrink-0 rounded-2xl bg-primary px-3 text-sm font-bold text-primary-foreground hover:!bg-primary/90 hover:!text-primary-foreground disabled:opacity-50 sm:px-4"
            >
              <Send
                className={cn(
                  "h-4 w-4",
                  isArabic ? "rotate-180 sm:ml-2" : "sm:mr-2"
                )}
              />

              <span className="hidden sm:inline">
                {sending
                  ? isArabic
                    ? "جاري الإرسال"
                    : "Sending"
                  : t("doctorDashboard.sidebar.messages.send")}
              </span>
            </Button>
          </div>
        </div>
      </Card>

      <Card className="relative z-10 flex h-[520px] min-h-0 flex-col overflow-visible rounded-3xl border border-border bg-card text-card-foreground shadow-sm md:h-[620px] 2xl:h-[calc(100vh-100px)]">
        <div className="flex h-[80px] shrink-0 items-center justify-between rounded-t-3xl border-b border-border px-4 sm:px-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">
            {t("doctorDashboard.sidebar.messages.summary.title")}
          </h2>

          <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary shadow-none hover:!bg-primary/10 hover:!text-primary dark:hover:!bg-primary/10 dark:hover:!text-primary">
            {getDiseaseLabel(doctorDiseaseType)}
          </Badge>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-8 p-4 pb-10 sm:p-6">
            {patientProfile ? (
              <>
                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {t("doctorDashboard.sidebar.messages.summary.riskTrend")}
                  </p>

                  <div
                    className={cn(
                      "relative overflow-hidden rounded-3xl border p-5 shadow-sm",
                      getRiskTrendCardStyles(latestPrediction?.risk_level)
                    )}
                  >
                    <div className="relative z-10">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-4xl font-bold text-current">
                          {latestPrediction
                            ? Math.round(Number(latestPrediction.probability))
                            : 0}
                          %
                        </span>

                        <Badge
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-bold shadow-none",
                            getRiskBadgeStyles(latestPrediction?.risk_level)
                          )}
                        >
                          {getRiskLabel(latestPrediction?.risk_level)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-current/75">
                        <TrendingUp className="h-4 w-4" />

                        <span className="text-xs font-semibold">
                          {latestPrediction
                            ? `${getDiseaseLabel(
                                doctorDiseaseType
                              )} • ${getDateLabel(latestPrediction.created_at)}`
                            : isArabic
                            ? "لا يوجد تحليل لهذا التخصص"
                            : "No assessment for this specialty"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {t(
                      "doctorDashboard.sidebar.messages.summary.latestIndicators"
                    )}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {summaryIndicators.map((indicator, index) => (
                      <div
                        key={`${indicator.label}-${index}`}
                        className="rounded-2xl border border-border bg-background/60 p-4 shadow-sm"
                      >
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {indicator.label}
                        </p>

                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-bold text-foreground">
                            {indicator.value}{" "}
                            {indicator.unit && (
                              <span className="text-[10px] font-semibold text-muted-foreground">
                                {indicator.unit}
                              </span>
                            )}
                          </p>

                          <span
                            className={cn(
                              "h-2 w-2 shrink-0 rounded-full ring-4",
                              getIndicatorDotClass(indicator.color)
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-border bg-background/60 px-4 py-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {isArabic ? "عدد التحاليل" : "Assessments Count"}
                    </span>

                    <span className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      {specialtyPredictions.length}
                    </span>
                  </div>

                  <Button
                    type="button"
                    disabled={!selectedConv}
                    className="h-12 w-full rounded-2xl bg-primary text-sm font-bold text-primary-foreground hover:!bg-primary/90 hover:!text-primary-foreground disabled:opacity-50"
                    onClick={openPatientReportsArchive}
                  >
                    <FileText
                      className={cn("h-4 w-4", isArabic ? "ml-2" : "mr-2")}
                    />
                    {isArabic
                      ? "عرض أرشيف التحاليل"
                      : "View Assessment Archive"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                {selectedConv && (
                  <UserIcon className="mb-4 h-12 w-12 text-primary/20" />
                )}

                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {selectedConv
                    ? isArabic
                      ? "لا توجد بيانات متاحة لهذا المريض"
                      : "No patient data available"
                    : isArabic
                    ? "اختار مريض لعرض الملخص"
                    : "Select a patient to view summary"}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}