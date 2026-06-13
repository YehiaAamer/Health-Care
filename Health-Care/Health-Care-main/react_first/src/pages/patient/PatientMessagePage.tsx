import {
  useState,
  useEffect,
  useRef,
  useMemo,
  type ChangeEvent,
} from "react";
import { useTranslation } from "react-i18next";

import Header from "../../components/shared/Header";

import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { ScrollArea } from "../../components/ui/scroll-area";

import {
  Search,
  Send,
  Check,
  CheckCheck,
  X,
  Paperclip,
  Stethoscope,
  User as UserIcon,
  CalendarDays,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

import { toast } from "sonner";
import { cn } from "../../lib/utils";

type DoctorSpecialty = "diabetes" | "cardiovascular";

type DoctorThread = {
  id: number;
  doctor_id: number | string;
  doctor_name: string;
  specialty: DoctorSpecialty;
  last_message?: string;
  time?: string;
  unread_count?: number;
};

type PatientChatMessage = {
  id: number;
  thread_id: number;
  sender_type: "patient" | "doctor";
  sender_user?: number | string;
  content: string;
  created_at: string;
  is_read?: boolean;
  read?: boolean;
  seen?: boolean;
  is_seen?: boolean;
  read_at?: string | null;
  seen_at?: string | null;
  status?: string;
  delivery_status?: string;
};

type DoctorSummary = {
  doctor_id: number | string;
  doctor_name: string;
  specialty: DoctorSpecialty;
  experience?: string;
  next_available?: string;
  clinic?: string;
};

export default function PatientMessagesPage() {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedThreadRef = useRef<number | null>(null);

  const [sending, setSending] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedConv, setSelectedConv] = useState<DoctorThread | null>(null);
  const [selectedDoctorSummary, setSelectedDoctorSummary] =
    useState<DoctorSummary | null>(null);

  const [newMessage, setNewMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [specialtyDropdownOpen, setSpecialtyDropdownOpen] = useState(false);

  const [conversations, setConversations] = useState<DoctorThread[]>([]);
  const [messages, setMessages] = useState<PatientChatMessage[]>([]);

  const [messagesByThread, setMessagesByThread] = useState<
    Record<number, PatientChatMessage[]>
  >({
    1: [],
    2: [],
  });

  const mockDoctors = useMemo<DoctorThread[]>(
    () => [
      {
        id: 1,
        doctor_id: 101,
        doctor_name: isArabic ? "د. أحمد سامي" : "Dr. Ahmed Samy",
        specialty: "diabetes",
        last_message: "",
        time: new Date().toISOString(),
        unread_count: 0,
      },
      {
        id: 2,
        doctor_id: 102,
        doctor_name: isArabic ? "د. مريم خالد" : "Dr. Mariam Khaled",
        specialty: "cardiovascular",
        last_message: "",
        time: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        unread_count: 0,
      },
    ],
    [isArabic]
  );

  const mockDoctorSummaries = useMemo<Record<number, DoctorSummary>>(
    () => ({
      1: {
        doctor_id: 101,
        doctor_name: isArabic ? "د. أحمد سامي" : "Dr. Ahmed Samy",
        specialty: "diabetes",
        experience: isArabic ? "٨ سنوات خبرة" : "8 years experience",
        next_available: isArabic ? "اليوم 06:00 مساءً" : "Today 06:00 PM",
        clinic: isArabic
          ? "عيادة السكري والمتابعة"
          : "Diabetes Follow-up Clinic",
      },
      2: {
        doctor_id: 102,
        doctor_name: isArabic ? "د. مريم خالد" : "Dr. Mariam Khaled",
        specialty: "cardiovascular",
        experience: isArabic ? "١٠ سنوات خبرة" : "10 years experience",
        next_available: isArabic ? "غدًا 01:30 مساءً" : "Tomorrow 01:30 PM",
        clinic: isArabic ? "عيادة القلب" : "Cardiology Clinic",
      },
    }),
    [isArabic]
  );

  const isMessageReadByDoctor = (message: PatientChatMessage) => {
    const normalizedStatus = String(
      message.status || message.delivery_status || ""
    )
      .trim()
      .toLowerCase();

    return (
      message.is_read === true ||
      message.read === true ||
      message.seen === true ||
      message.is_seen === true ||
      Boolean(message.read_at) ||
      Boolean(message.seen_at) ||
      normalizedStatus === "read" ||
      normalizedStatus === "seen"
    );
  };

  const getDoctorInitials = (name?: string, fallbackId?: string | number) => {
    const cleanName = String(name || "").trim();

    if (cleanName) {
      const withoutTitle = cleanName
        .replace(/^د\.\s*/i, "")
        .replace(/^dr\.?\s*/i, "");

      const initials = withoutTitle
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

      return initials || "D";
    }

    return fallbackId ? `D${fallbackId}` : "D";
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

  const getSpecialtyLabel = (specialty?: DoctorSpecialty | string) => {
    if (specialty === "diabetes") return isArabic ? "السكري" : "Diabetes";

    if (specialty === "cardiovascular") {
      return isArabic ? "القلب والأوعية" : "Cardiovascular";
    }

    return isArabic ? "غير محدد" : "Unknown";
  };

  const getSpecialtyBadgeStyles = () => {
    return "border-primary/15 bg-primary/10 text-primary hover:!bg-primary/10 hover:!text-primary";
  };

  const closeMenus = () => {
    setSpecialtyDropdownOpen(false);
  };

  const syncThreadsWithSavedMessages = (threads: DoctorThread[]) => {
    return threads.map((thread) => {
      const threadMessages = messagesByThread[thread.id] || [];
      const lastMessage = threadMessages[threadMessages.length - 1];

      if (!lastMessage) return thread;

      return {
        ...thread,
        last_message: lastMessage.content,
        time: lastMessage.created_at,
      };
    });
  };

  const fetchDoctorsAndThreads = (showToast = false) => {
    try {
      const safeThreads = syncThreadsWithSavedMessages(mockDoctors);

      setConversations((current) => {
        if (current.length === 0) return safeThreads;

        return safeThreads.map((thread) => {
          const oldThread = current.find((item) => item.id === thread.id);
          return {
            ...thread,
            unread_count: oldThread?.unread_count ?? thread.unread_count ?? 0,
          };
        });
      });

      setSelectedConv((current) => {
        if (current) {
          const refreshed = safeThreads.find((thread) => thread.id === current.id);
          return refreshed || current;
        }

        return safeThreads.length > 0 ? safeThreads[0] : null;
      });

      if (showToast) {
        toast.success(
          isArabic ? "تم تحديث المحادثات" : "Conversations refreshed"
        );
      }
    } catch (error) {
      console.error("Failed to fetch patient conversations", error);
      toast.error(
        isArabic ? "فشل تحميل المحادثات" : "Failed to load conversations"
      );
    }
  };

  const fetchMessages = (threadId: number, showToast = false) => {
    try {
      const savedMessages = messagesByThread[threadId] || [];

      if (selectedThreadRef.current === threadId) {
        setMessages(savedMessages);
      }

      if (showToast) {
        toast.success(isArabic ? "تم تحديث الرسائل" : "Messages refreshed");
      }
    } catch (error) {
      console.error("Failed to fetch patient messages", error);

      if (showToast) {
        toast.error(isArabic ? "فشل تحميل الرسائل" : "Failed to load messages");
      }
    }
  };

  const fetchDoctorSummary = (threadId: number) => {
    try {
      setSelectedDoctorSummary(mockDoctorSummaries[threadId] || null);
    } catch (error) {
      console.error("Failed to fetch doctor summary", error);
      setSelectedDoctorSummary(null);
    }
  };

  const handleSelectConversation = (conv: DoctorThread) => {
    closeMenus();
    selectedThreadRef.current = conv.id;
    setSelectedConv(conv);
    setMessages(messagesByThread[conv.id] || []);
    fetchDoctorSummary(conv.id);

    setConversations((prev) =>
      prev.map((item) =>
        item.id === conv.id ? { ...item, unread_count: 0 } : item
      )
    );
  };

  const handleFileSelectClick = () => {
    if (!selectedConv) {
      toast.info(isArabic ? "اختار دكتور الأول" : "Select doctor first");
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
    fetchDoctorsAndThreads();
  }, [isArabic, mockDoctors, messagesByThread]);

  useEffect(() => {
    if (!selectedConv && conversations.length > 0) {
      const firstConversation = conversations[0];
      selectedThreadRef.current = firstConversation.id;
      setSelectedConv(firstConversation);
      setMessages(messagesByThread[firstConversation.id] || []);
      fetchDoctorSummary(firstConversation.id);
    }
  }, [conversations, selectedConv, messagesByThread]);

  useEffect(() => {
    if (!selectedConv) {
      selectedThreadRef.current = null;
      setMessages([]);
      setSelectedDoctorSummary(null);
      return;
    }

    selectedThreadRef.current = selectedConv.id;
    fetchMessages(selectedConv.id);
    fetchDoctorSummary(selectedConv.id);
  }, [selectedConv?.id, messagesByThread, mockDoctorSummaries]);

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

      const sentMsg: PatientChatMessage = {
        id: Date.now(),
        thread_id: activeThreadId,
        sender_type: "patient",
        content: messageText,
        created_at: new Date().toISOString(),
        is_read: false,
        read: false,
        seen: false,
        is_seen: false,
        read_at: null,
        seen_at: null,
        status: "sent",
        delivery_status: "sent",
      };

      setMessagesByThread((prev) => {
        const currentThreadMessages = prev[activeThreadId] || [];

        return {
          ...prev,
          [activeThreadId]: [...currentThreadMessages, sentMsg],
        };
      });

      if (selectedThreadRef.current === activeThreadId) {
        setMessages((prev) => [...prev, sentMsg]);
      }

      setNewMessage("");

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeThreadId
            ? {
                ...conv,
                last_message: messageText,
                time: sentMsg.created_at,
                unread_count: 0,
              }
            : conv
        )
      );

      setSelectedConv((current) =>
        current?.id === activeThreadId
          ? {
              ...current,
              last_message: messageText,
              time: sentMsg.created_at,
              unread_count: 0,
            }
          : current
      );

      toast.success(isArabic ? "تم إرسال الرسالة" : "Message sent");
    } catch (error) {
      console.error("Failed to send patient message", error);
      toast.error(isArabic ? "فشل إرسال الرسالة" : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return conversations.filter((conv) => {
      const matchesSearch =
        !searchValue ||
        conv.doctor_name?.toLowerCase().includes(searchValue) ||
        String(conv.doctor_id ?? "").toLowerCase().includes(searchValue) ||
        conv.last_message?.toLowerCase().includes(searchValue) ||
        getSpecialtyLabel(conv.specialty).toLowerCase().includes(searchValue);

      const matchesMainFilter =
        activeFilter === "all" ||
        (activeFilter === "unread" && Number(conv.unread_count) > 0);

      const matchesSpecialtyFilter =
        specialtyFilter === "all" || conv.specialty === specialtyFilter;

      return matchesSearch && matchesMainFilter && matchesSpecialtyFilter;
    });
  }, [conversations, search, activeFilter, specialtyFilter, isArabic]);

  return (
    <>
      <Header />

      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-screen bg-background px-4 pb-6 pt-24 text-foreground animate-in fade-in duration-700 sm:px-6 lg:px-8"
        onClick={closeMenus}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isArabic ? "رسائل الأطباء" : "Doctor Messages"}
          </h1>

          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {isArabic
              ? "تواصل مع أطبائك وتابع الرسائل الطبية الخاصة بك."
              : "Communicate with your doctors and follow your medical messages."}
          </p>
        </div>

        <div className="w-full">
          <div className="grid min-h-[calc(100vh-194px)] w-full grid-cols-1 gap-5 overflow-visible xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)_320px]">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelected}
            />

            <Card className="relative z-50 flex h-[520px] min-h-0 flex-col overflow-visible rounded-3xl border border-border bg-card text-card-foreground shadow-sm sm:h-[620px] xl:h-[calc(100vh-194px)]">
              <div className="relative z-[80] shrink-0 rounded-t-3xl border-b border-border bg-card p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                    {isArabic ? "قائمة الأطباء" : "Doctors List"}
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
                    placeholder={
                      isArabic ? "اختار دكتور..." : "Select doctor..."
                    }
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
                      label: isArabic ? "الكل" : "All",
                    },
                    {
                      id: "unread",
                      label: isArabic ? "غير مقروء" : "Unread",
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
                        setSpecialtyDropdownOpen((prev) => !prev);
                      }}
                      className={cn(
                        "flex items-center gap-1 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-none",
                        specialtyFilter !== "all"
                          ? "bg-primary text-primary-foreground hover:!bg-primary hover:!text-primary-foreground"
                          : "bg-primary/10 text-primary hover:!bg-primary/10 hover:!text-primary"
                      )}
                    >
                      {specialtyFilter === "diabetes"
                        ? getSpecialtyLabel("diabetes")
                        : specialtyFilter === "cardiovascular"
                        ? getSpecialtyLabel("cardiovascular")
                        : isArabic
                        ? "التخصص"
                        : "Specialty"}

                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>

                    {specialtyDropdownOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          "absolute top-11 z-[9999] w-48 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-2xl",
                          isArabic ? "right-0" : "left-0"
                        )}
                      >
                        {[
                          {
                            id: "all",
                            label: isArabic ? "كل التخصصات" : "All",
                          },
                          {
                            id: "diabetes",
                            label: getSpecialtyLabel("diabetes"),
                          },
                          {
                            id: "cardiovascular",
                            label: getSpecialtyLabel("cardiovascular"),
                          },
                        ].map((specialty) => (
                          <button
                            key={specialty.id}
                            type="button"
                            onClick={() => {
                              setSpecialtyFilter(specialty.id);
                              setSpecialtyDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full rounded-xl px-3 py-2 text-start text-xs font-bold hover:!bg-primary/10 hover:!text-primary",
                              specialtyFilter === specialty.id
                                ? "bg-primary text-primary-foreground hover:!bg-primary hover:!text-primary-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            {specialty.label}
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
                        : isArabic
                        ? "لا توجد محادثات"
                        : "No conversations"}
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
                            {getDoctorInitials(
                              conv.doctor_name,
                              conv.doctor_id
                            )}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex min-w-0 items-start justify-between gap-2">
                            <h4 className="min-w-0 flex-1 truncate text-sm font-bold leading-5 text-foreground">
                              {conv.doctor_name ||
                                (isArabic ? "دكتور" : "Doctor")}
                            </h4>

                            <span className="shrink-0 text-[10px] font-bold leading-5 text-muted-foreground">
                              {getConversationTime(conv.time)}
                            </span>
                          </div>

                          <p className="mb-2 line-clamp-1 min-h-[18px] text-xs font-medium leading-5 text-muted-foreground">
                            {conv.last_message ||
                              (isArabic
                                ? "لا توجد رسائل بعد"
                                : "No messages yet")}
                          </p>

                          <div className="flex items-center justify-between gap-2">
                            <Badge
                              className={cn(
                                "max-w-full rounded-full border px-2 py-0.5 text-[10px] font-bold shadow-none",
                                getSpecialtyBadgeStyles()
                              )}
                            >
                              <span className="truncate">
                                {getSpecialtyLabel(conv.specialty)}
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

            <Card className="relative z-20 flex h-[520px] min-h-0 flex-col overflow-visible rounded-3xl border border-border bg-card text-card-foreground shadow-sm md:h-[620px] xl:h-[calc(100vh-194px)]">
              <div className="flex min-h-[80px] shrink-0 items-center gap-4 rounded-t-3xl border-b border-border bg-card px-4 sm:px-5">
                {selectedConv && (
                  <Avatar className="h-12 w-12 border border-primary/15 bg-primary/5">
                    <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                      {getDoctorInitials(
                        selectedConv.doctor_name,
                        selectedConv.doctor_id
                      )}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedConv ? (
                      <>
                        <h3 className="truncate text-base font-bold text-foreground">
                          {selectedConv.doctor_name}
                        </h3>

                        <Badge
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-bold shadow-none",
                            getSpecialtyBadgeStyles()
                          )}
                        >
                          {getSpecialtyLabel(selectedConv.specialty)}
                        </Badge>
                      </>
                    ) : (
                      <h3 className="truncate text-base font-bold text-foreground">
                        {isArabic ? "اختار دكتور" : "Select a doctor"}
                      </h3>
                    )}
                  </div>
                </div>
              </div>

              <ScrollArea
                className="min-h-0 flex-1 bg-primary/[0.03] px-4 md:px-8"
                ref={scrollRef}
              >
                <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-end space-y-5 py-7">
                  {!selectedConv ? (
                    <div className="flex flex-1" />
                  ) : messages.length === 0 ? (
                    <div className="flex flex-1 flex-col justify-end">
                      <div className="mx-auto mb-8 max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Stethoscope className="h-6 w-6" />
                        </div>

                        <h3 className="text-base font-bold text-foreground">
                          {isArabic ? "لا توجد رسائل" : "No messages"}
                        </h3>

                        <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                          {isArabic
                            ? "ابدأ المحادثة بإرسال رسالة للطبيب."
                            : "Start the conversation by sending a message to the doctor."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isPatientMessage = msg.sender_type === "patient";
                      const isReadByDoctor = isMessageReadByDoctor(msg);

                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex gap-4",
                            isPatientMessage ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "flex max-w-[86%] flex-col sm:max-w-[78%]",
                              isPatientMessage ? "items-end" : "items-start"
                            )}
                          >
                            <div
                              className={cn(
                                "rounded-3xl px-5 py-3 text-sm font-semibold leading-6 shadow-sm",
                                isPatientMessage
                                  ? "rounded-tr-md bg-primary text-primary-foreground"
                                  : "rounded-tl-md border border-border bg-card text-foreground"
                              )}
                            >
                              {msg.content}
                            </div>

                            <div className="mt-2 flex items-center gap-2 px-2">
                              <span className="text-[10px] font-bold text-muted-foreground">
                                {msg.created_at
                                  ? new Date(
                                      msg.created_at
                                    ).toLocaleTimeString(
                                      isArabic ? "ar-EG" : "en-US",
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )
                                  : "--:--"}
                              </span>

                              {isPatientMessage &&
                                (isReadByDoctor ? (
                                  <CheckCheck
                                    className="h-3.5 w-3.5 text-primary"
                                    aria-label={
                                      isArabic ? "تمت القراءة" : "Read by doctor"
                                    }
                                  />
                                ) : (
                                  <Check
                                    className="h-3.5 w-3.5 text-muted-foreground"
                                    aria-label={
                                      isArabic ? "تم الإرسال" : "Sent"
                                    }
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
                        ? isArabic
                          ? "اكتب رسالتك..."
                          : "Type your message..."
                        : isArabic
                        ? "اختار دكتور الأول..."
                        : "Select doctor first..."
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
                        : isArabic
                        ? "إرسال"
                        : "Send"}
                    </span>
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="relative z-10 flex h-[520px] min-h-0 flex-col overflow-visible rounded-3xl border border-border bg-card text-card-foreground shadow-sm md:h-[620px] 2xl:h-[calc(100vh-194px)]">
              <div className="flex h-[80px] shrink-0 items-center justify-between rounded-t-3xl border-b border-border px-4 sm:px-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">
                  {isArabic ? "بيانات الطبيب" : "Doctor Summary"}
                </h2>

                {selectedConv && (
                  <Badge
                    className={cn(
                      "rounded-full border px-3 py-1 text-[10px] font-bold shadow-none",
                      getSpecialtyBadgeStyles()
                    )}
                  >
                    {getSpecialtyLabel(selectedConv.specialty)}
                  </Badge>
                )}
              </div>

              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-6 p-4 pb-10 sm:p-6">
                  {selectedDoctorSummary ? (
                    <>
                      <div className="rounded-3xl border border-border bg-background/60 p-5 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                          <Stethoscope className="h-7 w-7" />
                        </div>

                        <h3 className="text-base font-bold text-foreground">
                          {selectedDoctorSummary.doctor_name}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-muted-foreground">
                          {getSpecialtyLabel(selectedDoctorSummary.specialty)}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <div className="rounded-2xl border border-border bg-background/60 p-4 shadow-sm">
                          <div className="mb-2 flex items-center gap-2 text-primary">
                            <ShieldCheck className="h-4 w-4" />

                            <p className="text-xs font-bold">
                              {isArabic ? "الخبرة" : "Experience"}
                            </p>
                          </div>

                          <p className="text-sm font-bold text-foreground">
                            {selectedDoctorSummary.experience || "--"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-border bg-background/60 p-4 shadow-sm">
                          <div className="mb-2 flex items-center gap-2 text-primary">
                            <CalendarDays className="h-4 w-4" />

                            <p className="text-xs font-bold">
                              {isArabic ? "أقرب موعد" : "Next Available"}
                            </p>
                          </div>

                          <p className="text-sm font-bold text-foreground">
                            {selectedDoctorSummary.next_available || "--"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-border bg-background/60 p-4 shadow-sm">
                          <div className="mb-2 flex items-center gap-2 text-primary">
                            <UserIcon className="h-4 w-4" />

                            <p className="text-xs font-bold">
                              {isArabic ? "العيادة" : "Clinic"}
                            </p>
                          </div>

                          <p className="text-sm font-bold text-foreground">
                            {selectedDoctorSummary.clinic || "--"}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                      <UserIcon className="mb-4 h-12 w-12 text-primary/20" />

                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {selectedConv
                          ? isArabic
                            ? "لا توجد بيانات متاحة للطبيب"
                            : "No doctor data available"
                          : isArabic
                          ? "اختار دكتور لعرض البيانات"
                          : "Select a doctor to view summary"}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}