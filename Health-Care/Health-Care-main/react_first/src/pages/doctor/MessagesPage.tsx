import {
  useState,
  useEffect,
  useRef,
  useMemo,
  type ChangeEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { messagesApi } from "@/api/messages";
import { patientsApi } from "@/api/patients";
import type { ChatThread, ChatMessage, User, Prediction } from "@/types/api";

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
  MoreHorizontal,
  FileText,
  AlertTriangle,
  CheckCheck,
  Activity,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  MoreVertical,
  User as UserIcon,
  X,
  Paperclip,
  ChevronDown,
} from "lucide-react";

import LoadingDots from "@/components/shared/LoadingDots";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedConv, setSelectedConv] = useState<ChatThread | null>(null);
  const [patientProfile, setPatientProfile] = useState<
    (User & { predictions: Prediction[] }) | null
  >(null);

  const [newMessage, setNewMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeRiskFilter, setActiveRiskFilter] = useState("all");
  const [riskDropdownOpen, setRiskDropdownOpen] = useState(false);

  const [conversations, setConversations] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [openMenu, setOpenMenu] = useState<
    "threads" | "chat" | "summary" | null
  >(null);
  const [openConversationMenu, setOpenConversationMenu] = useState<
    number | null
  >(null);

  const getPatientNumericId = (patientId?: string) => {
    const numericId = parseInt(patientId?.replace(/^\D+/g, "") || "0");
    return Number.isNaN(numericId) ? 0 : numericId;
  };

  const normalizeRisk = (risk?: string) =>
    risk?.toLowerCase().replace(/\s|_/g, "") || "";

  const closeMenus = () => {
    setOpenMenu(null);
    setOpenConversationMenu(null);
    setRiskDropdownOpen(false);
  };

  const fetchConversations = async (showToast = false) => {
    try {
      const data = await messagesApi.getThreads();
      const safeThreads = Array.isArray(data) ? data : [];

      setConversations(safeThreads);

      if (safeThreads.length > 0 && !selectedConv) {
        setSelectedConv(safeThreads[0]);
      }

      if (showToast) {
        toast.success(
          isArabic ? "تم تحديث المحادثات" : "Conversations refreshed"
        );
      }
    } catch (error) {
      console.error("Failed to fetch conversations", error);
      toast.error(
        isArabic ? "فشل تحميل المحادثات" : "Failed to load conversations"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (threadId: number, showToast = false) => {
    try {
      setMessagesLoading(true);
      const data = await messagesApi.getMessages(threadId);
      setMessages(Array.isArray(data) ? data : []);

      if (showToast) {
        toast.success(isArabic ? "تم تحديث الرسائل" : "Messages refreshed");
      }
    } catch (error) {
      console.error("Failed to fetch messages", error);
      toast.error(isArabic ? "فشل تحميل الرسائل" : "Failed to load messages");
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchPatientProfile = async (patientId: string, showToast = false) => {
    try {
      const numericId = getPatientNumericId(patientId);

      if (!numericId) {
        setPatientProfile(null);
        return;
      }

      const data = await patientsApi.getPatientProfile(numericId);
      setPatientProfile(data);

      if (showToast) {
        toast.success(
          isArabic ? "تم تحديث بيانات المريض" : "Patient profile refreshed"
        );
      }
    } catch (error) {
      console.error("Failed to fetch patient profile", error);
      setPatientProfile(null);
    }
  };

  const refreshSelectedConversation = async () => {
    if (!selectedConv) {
      toast.info(isArabic ? "اختار مريض الأول" : "Select patient first");
      return;
    }

    closeMenus();

    await Promise.all([
      fetchMessages(selectedConv.id, true),
      fetchPatientProfile(selectedConv.patient_id, true),
    ]);
  };

  const refreshPatientContext = async () => {
    if (!selectedConv) {
      toast.info(isArabic ? "اختار مريض الأول" : "Select patient first");
      return;
    }

    closeMenus();
    await fetchPatientProfile(selectedConv.patient_id, true);
  };

  const handleSelectConversation = (conv: ChatThread) => {
    closeMenus();
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
        ? `تم اختيار الملف: ${file.name} — محتاج endpoint من الباك لإرساله`
        : `Selected file: ${file.name} — backend upload endpoint is needed to send it`
    );

    event.target.value = "";
  };

  useEffect(() => {
    fetchConversations();

    const interval = setInterval(() => fetchConversations(), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedConv) {
      setMessages([]);
      setPatientProfile(null);
      return;
    }

    fetchMessages(selectedConv.id);
    fetchPatientProfile(selectedConv.patient_id);

    const interval = setInterval(() => fetchMessages(selectedConv.id), 10000);
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

    try {
      setSending(true);

      const sentMsg = await messagesApi.sendMessage(
        selectedConv.id,
        messageText
      );

      setMessages((prev) => [...prev, sentMsg]);
      setNewMessage("");

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConv.id
            ? {
                ...conv,
                last_message: messageText,
                time: isArabic ? "الآن" : "Just now",
              }
            : conv
        )
      );
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
        conv.patient_id?.toLowerCase().includes(searchValue) ||
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
        return "border-red-200 bg-red-600 text-white";
      case "high":
        return "border-red-100 bg-red-50 text-red-600";
      case "medium":
        return "border-amber-100 bg-amber-50 text-amber-600";
      case "low":
        return "border-emerald-100 bg-emerald-50 text-emerald-600";
      default:
        return "border-primary/15 bg-primary/10 text-primary";
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

  const getIndicatorDotClass = (color: "red" | "green" | "primary") => {
    if (color === "red") return "bg-red-500 ring-red-100";
    if (color === "green") return "bg-emerald-500 ring-emerald-100";
    return "bg-primary ring-primary/10";
  };

  const latestPrediction = patientProfile?.predictions?.[0];
  const selectedPatientId = getPatientNumericId(selectedConv?.patient_id);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <LoadingDots />
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">
          {t("doctorDashboard.sidebar.messages.loading")}
        </p>
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="grid min-h-[calc(100vh-132px)] grid-cols-1 gap-4 overflow-visible pt-8 animate-in fade-in duration-700 md:min-h-[calc(100vh-100px)] md:pt-0 2xl:grid-cols-[minmax(0,1fr)_360px]"
      onClick={closeMenus}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelected}
      />

      <Card className="relative z-20 grid min-h-0 overflow-visible rounded-3xl border border-slate-100 bg-white shadow-sm xl:h-[calc(100vh-100px)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <div
          className={cn(
            "relative z-30 flex h-[360px] min-h-0 flex-col overflow-visible rounded-t-3xl bg-white sm:h-[420px] xl:h-full",
            "xl:rounded-none xl:rounded-s-3xl",
            isArabic
              ? "xl:border-l xl:border-slate-100"
              : "xl:border-r xl:border-slate-100"
          )}
        >
          <div className="shrink-0 rounded-t-3xl border-b border-slate-100 bg-white p-4 sm:p-5 xl:rounded-ss-3xl xl:rounded-tr-none">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                {t("doctorDashboard.sidebar.messages.title")}
              </h2>

              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenu(openMenu === "threads" ? null : "threads");
                    setOpenConversationMenu(null);
                    setRiskDropdownOpen(false);
                  }}
                  className="h-9 w-9 rounded-xl text-slate-400 hover:bg-primary/10 hover:text-primary"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>

                {openMenu === "threads" && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "absolute top-11 z-[100] w-48 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl",
                      isArabic ? "left-0" : "right-0"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        closeMenus();
                        fetchConversations(true);
                      }}
                      className="w-full rounded-xl px-3 py-2 text-start text-xs font-bold text-slate-600 hover:bg-primary/10 hover:text-primary"
                    >
                      {isArabic ? "تحديث المحادثات" : "Refresh conversations"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        closeMenus();
                      }}
                      className="w-full rounded-xl px-3 py-2 text-start text-xs font-bold text-slate-600 hover:bg-primary/10 hover:text-primary"
                    >
                      {isArabic ? "مسح البحث" : "Clear search"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="relative mb-4">
              <Search
                className={cn(
                  "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400",
                  isArabic ? "right-4" : "left-4"
                )}
              />

              <Input
                placeholder={isArabic ? "اختار مريض..." : "Select patient..."}
                className={cn(
                  "h-11 rounded-2xl border-slate-200 bg-white text-sm font-semibold shadow-sm focus-visible:ring-4 focus-visible:ring-primary/10",
                  isArabic ? "pr-11 pl-10 text-right" : "pl-11 pr-10"
                )}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary",
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
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn(
                    "whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-none",
                    activeFilter === filter.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary hover:bg-primary/10"
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
                    setOpenMenu(null);
                    setOpenConversationMenu(null);
                  }}
                  className={cn(
                    "flex items-center gap-1 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-none",
                    activeRiskFilter !== "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary hover:bg-primary/10"
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
                      "absolute top-11 z-[100] w-44 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl",
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
                          "w-full rounded-xl px-3 py-2 text-start text-xs font-bold hover:bg-primary/10 hover:text-primary",
                          activeRiskFilter === risk.id
                            ? "bg-primary/10 text-primary"
                            : "text-slate-600"
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

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-2 p-3">
              {filteredConversations.length === 0 ? (
                <div className="py-10 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
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
                      "relative flex w-full cursor-pointer items-center gap-3 rounded-3xl border p-4 text-start transition-none",
                      selectedConv?.id === conv.id
                        ? "border-primary/20 bg-primary/10"
                        : "border-transparent bg-white hover:bg-primary/[0.03]"
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-11 w-11 border border-primary/15 bg-primary/5">
                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                          {conv.patient_name
                            ?.split(" ")
                            .filter(Boolean)
                            .map((name) => name[0])
                            .join("")
                            .toUpperCase() || "P"}
                        </AvatarFallback>
                      </Avatar>

                      {conv.online && (
                        <span
                          className={cn(
                            "absolute bottom-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500",
                            isArabic ? "left-0" : "right-0"
                          )}
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 pe-8">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <h4 className="truncate text-sm font-bold text-slate-900">
                          {conv.patient_name}
                        </h4>

                        <span className="shrink-0 text-[10px] font-bold text-slate-400">
                          {conv.time}
                        </span>
                      </div>

                      <p className="mb-2 truncate text-xs font-medium text-slate-500">
                        {conv.last_message ||
                          (isArabic ? "لا توجد رسائل بعد" : "No messages yet")}
                      </p>

                      <Badge
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-bold shadow-none",
                          getRiskBadgeStyles(conv.risk_level)
                        )}
                      >
                        {getRiskLabel(conv.risk_level)}
                      </Badge>
                    </div>

                    <div
                      className={cn(
                        "absolute top-3",
                        isArabic ? "left-3" : "right-3"
                      )}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenConversationMenu(
                            openConversationMenu === conv.id ? null : conv.id
                          );
                          setOpenMenu(null);
                          setRiskDropdownOpen(false);
                        }}
                        className="h-7 w-7 rounded-xl text-slate-400 hover:bg-primary/10 hover:text-primary"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>

                      {openConversationMenu === conv.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "absolute top-9 z-[100] w-44 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl",
                            isArabic ? "left-0" : "right-0"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectConversation(conv)}
                            className="w-full rounded-xl px-3 py-2 text-start text-xs font-bold text-slate-600 hover:bg-primary/10 hover:text-primary"
                          >
                            {isArabic ? "اختيار المريض" : "Select patient"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              closeMenus();
                              fetchConversations(true);
                            }}
                            className="w-full rounded-xl px-3 py-2 text-start text-xs font-bold text-slate-600 hover:bg-primary/10 hover:text-primary"
                          >
                            {isArabic ? "تحديث القائمة" : "Refresh list"}
                          </button>

                          <div className="mt-1 border-t border-slate-100 px-3 py-2 text-[10px] font-bold text-slate-400">
                            #{conv.patient_id}
                          </div>
                        </div>
                      )}
                    </div>

                    {Number(conv.unread_count) > 0 &&
                      selectedConv?.id !== conv.id && (
                        <span
                          className={cn(
                            "absolute top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground",
                            isArabic ? "left-10" : "right-10"
                          )}
                        >
                          {conv.unread_count}
                        </span>
                      )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="relative z-20 flex h-[520px] min-h-0 flex-col overflow-visible bg-white md:h-[620px] xl:h-full xl:rounded-e-3xl">
          <div className="flex min-h-[80px] shrink-0 items-center justify-between gap-4 border-b border-slate-100 bg-white px-4 sm:px-5 xl:rounded-se-3xl">
            <div className="flex min-w-0 items-center gap-3">
              {selectedConv && (
                <Avatar className="h-12 w-12 border border-primary/15 bg-primary/5">
                  <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                    {selectedConv.patient_name
                      ?.split(" ")
                      .filter(Boolean)
                      .map((name) => name[0])
                      .join("")
                      .toUpperCase() || "P"}
                  </AvatarFallback>
                </Avatar>
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedConv && (
                    <h3 className="truncate text-base font-bold text-slate-900">
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

                {selectedConv && (
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {`${t("doctorDashboard.sidebar.messages.id")}: #${
                      selectedConv.patient_id
                    }`}
                  </p>
                )}
              </div>
            </div>

            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenu(openMenu === "chat" ? null : "chat");
                  setOpenConversationMenu(null);
                  setRiskDropdownOpen(false);
                }}
                className="h-10 w-10 rounded-2xl text-slate-400 hover:bg-primary/10 hover:text-primary"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>

              {openMenu === "chat" && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "absolute top-12 z-[100] w-52 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl",
                    isArabic ? "left-0" : "right-0"
                  )}
                >
                  {!selectedConv && (
                    <div className="px-3 py-2 text-xs font-bold text-slate-400">
                      {isArabic ? "اختار مريض الأول" : "Select patient first"}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={refreshSelectedConversation}
                    className="w-full rounded-xl px-3 py-2 text-start text-xs font-bold text-slate-600 hover:bg-primary/10 hover:text-primary"
                  >
                    {isArabic ? "تحديث الرسائل" : "Refresh messages"}
                  </button>

                  <button
                    type="button"
                    onClick={handleFileSelectClick}
                    className="w-full rounded-xl px-3 py-2 text-start text-xs font-bold text-slate-600 hover:bg-primary/10 hover:text-primary"
                  >
                    {isArabic ? "رفع ملف" : "Upload file"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewMessage("");
                      closeMenus();
                    }}
                    className="w-full rounded-xl px-3 py-2 text-start text-xs font-bold text-slate-600 hover:bg-primary/10 hover:text-primary"
                  >
                    {isArabic ? "مسح الرسالة" : "Clear message"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {(normalizeRisk(selectedConv?.risk_level) === "high" ||
            normalizeRisk(selectedConv?.risk_level) === "veryhigh") && (
            <div className="flex min-h-10 shrink-0 items-center justify-between gap-3 bg-red-500 px-4 sm:px-5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-white" />

                <p className="text-xs font-bold text-white">
                  {t("doctorDashboard.sidebar.messages.chat.emergencyAlert")}
                </p>
              </div>

              <button
                type="button"
                onClick={refreshPatientContext}
                className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold text-white hover:bg-white/25"
              >
                {t("doctorDashboard.sidebar.messages.viewIndicators")}
              </button>
            </div>
          )}

          <ScrollArea
            className="min-h-0 flex-1 bg-primary/[0.02] px-4 md:px-8"
            ref={scrollRef}
          >
            <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-end space-y-6 py-8">
              {!selectedConv ? (
                <div className="flex flex-1" />
              ) : messagesLoading && messages.length === 0 ? (
                <div className="flex justify-center py-10">
                  <LoadingDots />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-1 flex-col justify-end">
                  <div className="mx-auto mb-8 max-w-md rounded-3xl border border-primary/10 bg-white p-6 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <MessageSquare className="h-6 w-6" />
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {isArabic
                        ? "ابدأ المحادثة الآن"
                        : "Start the conversation"}
                    </h3>

                    <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                      {isArabic
                        ? `اكتب رسالة إلى ${selectedConv.patient_name} من صندوق الرسائل بالأسفل.`
                        : `Write a message to ${selectedConv.patient_name} using the message box below.`}
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isDoctorMessage = msg.sender_user !== selectedPatientId;

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
                              : "rounded-tl-md border border-slate-100 bg-white text-slate-700"
                          )}
                        >
                          {msg.content}
                        </div>

                        <div className="mt-2 flex items-center gap-2 px-2">
                          <span className="text-[10px] font-bold text-slate-400">
                            {msg.created_at
                              ? new Date(msg.created_at).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : "--:--"}
                          </span>

                          {isDoctorMessage && (
                            <CheckCheck className="h-3.5 w-3.5 text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          <div className="shrink-0 rounded-b-3xl border-t border-slate-100 bg-white p-4 md:p-6 xl:rounded-ee-3xl xl:rounded-es-none">
            <div
              className={cn(
                "flex items-center gap-2 rounded-3xl border border-slate-100 bg-white p-2 shadow-sm focus-within:ring-4 focus-within:ring-primary/10 sm:gap-3",
                !selectedConv && "opacity-90"
              )}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!selectedConv}
                onClick={handleFileSelectClick}
                className="h-10 w-10 shrink-0 rounded-2xl text-slate-400 hover:bg-primary/10 hover:text-primary disabled:opacity-40"
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
                  "min-w-0 flex-1 border-none bg-transparent px-2 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed",
                  isArabic && "text-right"
                )}
              />

              <Button
                type="button"
                onClick={handleSendMessage}
                disabled={!selectedConv || !newMessage.trim() || sending}
                className="h-11 shrink-0 rounded-2xl bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:px-4"
              >
                {sending ? (
                  <LoadingDots color="white" />
                ) : (
                  <>
                    <Send
                      className={cn(
                        "h-4 w-4",
                        isArabic ? "sm:ml-2 rotate-180" : "sm:mr-2"
                      )}
                    />
                    <span className="hidden sm:inline">
                      {t("doctorDashboard.sidebar.messages.send")}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="relative z-10 flex h-[520px] min-h-0 flex-col overflow-visible rounded-3xl border border-slate-100 bg-white shadow-sm md:h-[620px] 2xl:h-[calc(100vh-100px)]">
        <div className="flex h-[80px] shrink-0 items-center justify-between rounded-t-3xl border-b border-slate-100 px-4 sm:px-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900">
            {t("doctorDashboard.sidebar.messages.summary.title")}
          </h2>

          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu(openMenu === "summary" ? null : "summary");
                setOpenConversationMenu(null);
                setRiskDropdownOpen(false);
              }}
              className="h-9 w-9 rounded-xl text-slate-400 hover:bg-primary/10 hover:text-primary"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            {openMenu === "summary" && (
              <div
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "absolute top-11 z-[100] w-52 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl",
                  isArabic ? "left-0" : "right-0"
                )}
              >
                {!selectedConv && (
                  <div className="px-3 py-2 text-xs font-bold text-slate-400">
                    {isArabic ? "اختار مريض الأول" : "Select patient first"}
                  </div>
                )}

                <button
                  type="button"
                  onClick={refreshPatientContext}
                  className="w-full rounded-xl px-3 py-2 text-start text-xs font-bold text-slate-600 hover:bg-primary/10 hover:text-primary"
                >
                  {isArabic ? "تحديث بيانات المريض" : "Refresh patient data"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    closeMenus();
                    setActiveFilter("all");
                    setActiveRiskFilter("highRisk");
                  }}
                  className="w-full rounded-xl px-3 py-2 text-start text-xs font-bold text-slate-600 hover:bg-primary/10 hover:text-primary"
                >
                  {isArabic ? "عرض الحالات عالية الخطورة" : "Show high risk"}
                </button>
              </div>
            )}
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-8 p-4 pb-10 sm:p-6">
            {patientProfile ? (
              <>
                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    {t("doctorDashboard.sidebar.messages.summary.riskTrend")}
                  </p>

                  <div className="relative overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-sm">
                    <div className="relative z-10">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-4xl font-bold">
                          {latestPrediction
                            ? Math.round(latestPrediction.probability)
                            : 0}
                          %
                        </span>

                        <Badge
                          className={cn(
                            "rounded-full border-none px-2 py-0.5 text-[10px] font-bold shadow-none",
                            normalizeRisk(latestPrediction?.risk_level) ===
                              "high" ||
                              normalizeRisk(latestPrediction?.risk_level) ===
                                "veryhigh"
                              ? "bg-red-500 text-white"
                              : "bg-white/20 text-white"
                          )}
                        >
                          {getRiskLabel(latestPrediction?.risk_level)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-white/80">
                        <TrendingUp className="h-4 w-4" />

                        <span className="text-xs font-semibold">
                          {isArabic
                            ? `بناءً على ${
                                patientProfile.predictions?.length || 0
                              } تقييمات`
                            : `Based on ${
                                patientProfile.predictions?.length || 0
                              } assessments`}
                        </span>
                      </div>
                    </div>

                    <Sparkles className="absolute -bottom-5 -right-5 h-24 w-24 text-white/10" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      {t(
                        "doctorDashboard.sidebar.messages.summary.latestIndicators"
                      )}
                    </p>

                    <button
                      type="button"
                      onClick={refreshPatientContext}
                      className="text-[10px] font-bold uppercase tracking-widest text-primary"
                    >
                      {t("doctorDashboard.sidebar.messages.fullRecord")}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: t("dashboard.glucose"),
                        value: latestPrediction?.glucose || "--",
                        unit: "mg/dL",
                        color:
                          latestPrediction?.glucose &&
                          latestPrediction.glucose > 140
                            ? "red"
                            : "green",
                      },
                      {
                        label: t("dashboard.bmi"),
                        value: latestPrediction?.bmi || "--",
                        unit: "kg/m²",
                        color:
                          latestPrediction?.bmi && latestPrediction.bmi > 30
                            ? "red"
                            : "green",
                      },
                      {
                        label: t("dashboard.bloodPressure"),
                        value: latestPrediction?.blood_pressure || "--",
                        unit: "mmHg",
                        color: "primary",
                      },
                      {
                        label: t("dashboard.age"),
                        value: latestPrediction?.age || "--",
                        unit: isArabic ? "سنة" : "Years",
                        color: "primary",
                      },
                    ].map((indicator, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                      >
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          {indicator.label}
                        </p>

                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-slate-900">
                            {indicator.value}{" "}
                            <span className="text-[10px] font-semibold text-slate-400">
                              {indicator.unit}
                            </span>
                          </p>

                          <span
                            className={cn(
                              "h-2 w-2 rounded-full ring-4",
                              getIndicatorDotClass(
                                indicator.color as "red" | "green" | "primary"
                              )
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    {t("doctorDashboard.sidebar.messages.recentAssessments")}
                  </p>

                  <div className="space-y-3">
                    {patientProfile.predictions?.slice(0, 3).map((pred) => {
                      const predRisk = normalizeRisk(pred.risk_level);

                      return (
                        <div
                          key={pred.id}
                          className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-xl",
                                predRisk === "high" || predRisk === "veryhigh"
                                  ? "bg-red-50 text-red-600"
                                  : predRisk === "medium"
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-emerald-50 text-emerald-600"
                              )}
                            >
                              <Activity className="h-4 w-4" />
                            </div>

                            <div>
                              <p className="text-xs font-bold text-slate-900">
                                {new Date(pred.created_at).toLocaleDateString(
                                  isArabic ? "ar-EG" : "en-US"
                                )}
                              </p>

                              <p className="mt-1 text-[10px] font-bold text-slate-400">
                                {getRiskLabel(pred.risk_level)} •{" "}
                                {Math.round(pred.probability)}%
                              </p>
                            </div>
                          </div>

                          <ArrowUpRight
                            className={cn(
                              "h-4 w-4 text-slate-300",
                              isArabic && "rotate-[-90deg]"
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={refreshPatientContext}
                  className="h-12 w-full rounded-2xl bg-primary text-sm font-bold text-primary-foreground hover:bg-primary/90"
                >
                  <FileText
                    className={cn("h-4 w-4", isArabic ? "ml-2" : "mr-2")}
                  />
                  {t("doctorDashboard.sidebar.messages.openRecord")}
                </Button>
              </>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                {selectedConv && (
                  <UserIcon className="mb-4 h-12 w-12 text-primary/20" />
                )}

                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {selectedConv
                    ? t("doctorDashboard.sidebar.messages.loadingContext")
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