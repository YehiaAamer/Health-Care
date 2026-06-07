import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { patientsApi } from "@/api/patients";
import type { User, Prediction } from "@/types/api";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Search,
  ChevronRight,
  ChevronLeft,
  User as UserIcon,
  Mail,
  X,
  Plus,
  Calendar,
  Activity,
  Users,
  ShieldAlert,
  Gauge,
  ShieldCheck,
  Flame,
  SlidersHorizontal,
} from "lucide-react";

import LoadingDots from "@/components/shared/LoadingDots";
import { cn } from "@/lib/utils";

type PredictionWithExtras = Prediction & {
  review_status?: string;
  status?: string;
};

type PatientWithExtras = User & {
  risk_level?: string;
  latest_risk_level?: string;
  review_status?: string;
  latest_review_status?: string;
  status?: string;
  phone?: string;
  profile?: {
    phone?: string;
  };
  predictions?: PredictionWithExtras[];
  latest_prediction?: PredictionWithExtras;
};

type PatientDetails = User & {
  phone?: string;
  profile?: {
    phone?: string;
  };
  predictions?: PredictionWithExtras[];
  latest_prediction?: PredictionWithExtras;
};

type ApiListResponse<T> =
  | T[]
  | {
      data?: T[] | { results?: T[]; patients?: T[]; items?: T[] };
      results?: T[];
      patients?: T[];
      items?: T[];
      count?: number;
      next?: string | null;
      previous?: string | null;
    };

type ApiSingleResponse<T> =
  | T
  | {
      data?: T;
      patient?: T;
      user?: T;
      profile?: T;
    };

const emptyPatientForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
};

const PAGE_SIZE = 8;

export default function PatientsPage() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const [patients, setPatients] = useState<PatientWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [openCreate, setOpenCreate] = useState(false);
  const [newPatient, setNewPatient] = useState(emptyPatientForm);

  const [openDetails, setOpenDetails] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetails | null>(
    null
  );

  const normalizeText = (value?: string | null) => {
    return (
      value
        ?.toString()
        .toLowerCase()
        .trim()
        .replace(/[ًٌٍَُِّْ]/g, "")
        .replace(/[إأآا]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/ى/g, "ي")
        .replace(/\s|_/g, "") || ""
    );
  };

  const normalizeRisk = (risk?: string | null) => {
    const value = normalizeText(risk);

    const riskMap: Record<string, string> = {
      low: "low",
      medium: "medium",
      high: "high",
      veryhigh: "veryhigh",

      منخفض: "low",
      متوسط: "medium",
      مرتفع: "high",
      مرتفعجدا: "veryhigh",
      مرتفعجده: "veryhigh",
    };

    return riskMap[value] || "";
  };

  const normalizeStatus = (status?: string | null) => {
    const value = normalizeText(status);

    const statusMap: Record<string, string> = {
      pending: "pending",
      reviewed: "reviewed",
      approved: "approved",
      rejected: "rejected",
      needsfollowup: "needs_followup",
      needs_followup: "needs_followup",

      قيدالمراجعه: "pending",
      تمتالمراجعه: "reviewed",
      معتمد: "approved",
      مرفوض: "rejected",
      يحتاجمتابعه: "needs_followup",
    };

    return statusMap[value] || "";
  };

  const extractPatients = (response: ApiListResponse<PatientWithExtras>) => {
    if (Array.isArray(response)) return response;

    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.patients)) return response.patients;
    if (Array.isArray(response?.items)) return response.items;

    if (
      response?.data &&
      typeof response.data === "object" &&
      Array.isArray(response.data.results)
    ) {
      return response.data.results;
    }

    if (
      response?.data &&
      typeof response.data === "object" &&
      Array.isArray(response.data.patients)
    ) {
      return response.data.patients;
    }

    if (
      response?.data &&
      typeof response.data === "object" &&
      Array.isArray(response.data.items)
    ) {
      return response.data.items;
    }

    return [];
  };

  const extractPatientDetails = (
    response: ApiSingleResponse<PatientDetails>
  ): PatientDetails | null => {
    if (!response) return null;

    if ("data" in response && response.data) return response.data;
    if ("patient" in response && response.patient) return response.patient;
    if ("user" in response && response.user) return response.user;
    if ("profile" in response && response.profile) return response.profile;

    return response as PatientDetails;
  };

  const getFullName = (user?: Partial<User> | null) => {
    if (!user) return "";
    return `${user.first_name || ""} ${user.last_name || ""}`.trim();
  };

  const getDisplayName = (user?: Partial<User> | null) => {
    return getFullName(user) || user?.email || "";
  };

  const getSortedPredictions = (
    patient?: PatientWithExtras | PatientDetails
  ) => {
    const predictions = patient?.predictions || [];

    return [...predictions].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
  };

  const getLatestPrediction = (patient: PatientWithExtras | PatientDetails) => {
    return patient.latest_prediction || getSortedPredictions(patient)[0];
  };

  const needsPatientDetails = (patient: PatientWithExtras) => {
    const hasDirectRisk =
      patient.risk_level ||
      patient.latest_risk_level ||
      patient.latest_prediction?.risk_level;

    const hasPredictions = Array.isArray(patient.predictions);

    return !hasDirectRisk && !hasPredictions;
  };

  const enrichPatientWithDetails = async (
    patient: PatientWithExtras
  ): Promise<PatientWithExtras> => {
    if (!needsPatientDetails(patient)) return patient;

    try {
      const response = await patientsApi.getPatientProfile(patient.id);
      const details = extractPatientDetails(
        response as ApiSingleResponse<PatientDetails>
      );

      if (!details) return patient;

      const mergedPatient: PatientWithExtras = {
        ...patient,
        ...details,
        latest_prediction:
          details.latest_prediction ||
          patient.latest_prediction ||
          getSortedPredictions(details)[0],
      };

      return mergedPatient;
    } catch (error) {
      console.error(`Failed to enrich patient ${patient.id}`, error);
      return patient;
    }
  };

  const getPatientRisk = (patient: PatientWithExtras | PatientDetails) => {
    const latestPrediction = getLatestPrediction(patient);

    return normalizeRisk(
      patient.risk_level ||
        patient.latest_risk_level ||
        latestPrediction?.risk_level ||
        ""
    );
  };

  const getPatientStatus = (patient: PatientWithExtras | PatientDetails) => {
    const latestPrediction = getLatestPrediction(patient);

    return normalizeStatus(
      patient.review_status ||
        patient.latest_review_status ||
        patient.status ||
        latestPrediction?.review_status ||
        latestPrediction?.status ||
        ""
    );
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);

      const response = await patientsApi.getPatients();
      const patientsList = extractPatients(
        response as ApiListResponse<PatientWithExtras>
      );

      const enrichedPatients = await Promise.all(
        patientsList.map((patient) => enrichPatientWithDetails(patient))
      );

      setPatients(enrichedPatients);
    } catch (error) {
      console.error("Failed to fetch patients", error);
      toast.error(isArabic ? "فشل تحميل المرضى" : "Failed to load patients");
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const getRiskBadgeClass = (risk: string) => {
    const normalizedRisk = normalizeRisk(risk);

    if (normalizedRisk === "veryhigh") {
      return "border-red-200 bg-red-50 text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/10 dark:hover:text-red-300";
    }

    if (normalizedRisk === "high") {
      return "border-orange-200 bg-orange-50 text-orange-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300 dark:hover:bg-orange-500/10 dark:hover:text-orange-300";
    }

    if (normalizedRisk === "medium") {
      return "border-yellow-200 bg-yellow-50 text-yellow-600 hover:border-yellow-200 hover:bg-yellow-50 hover:text-yellow-600 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-300 dark:hover:bg-yellow-500/10 dark:hover:text-yellow-300";
    }

    if (normalizedRisk === "low") {
      return "border-green-200 bg-green-50 text-green-600 hover:border-green-200 hover:bg-green-50 hover:text-green-600 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300 dark:hover:bg-green-500/10 dark:hover:text-green-300";
    }

    return "border-border bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground";
  };

  const getRiskLabel = (risk: string) => {
    const normalizedRisk = normalizeRisk(risk);

    if (normalizedRisk === "veryhigh") {
      return isArabic ? "عالية جدًا" : "Very High";
    }

    if (normalizedRisk === "high") return t("dashboard.riskHigh");
    if (normalizedRisk === "medium") return t("dashboard.riskMedium");
    if (normalizedRisk === "low") return t("dashboard.riskLow");

    return isArabic ? "غير محدد" : "Unknown";
  };

  const getStatusLabel = (status: string) => {
    const normalizedStatus = normalizeStatus(status);

    switch (normalizedStatus) {
      case "pending":
        return isArabic ? "قيد المراجعة" : "Pending";
      case "reviewed":
        return isArabic ? "تمت المراجعة" : "Reviewed";
      case "approved":
        return isArabic ? "معتمد" : "Approved";
      case "rejected":
        return isArabic ? "مرفوض" : "Rejected";
      case "needs_followup":
        return isArabic ? "يحتاج متابعة" : "Needs Follow-up";
      default:
        return isArabic ? "لا توجد حالة" : "No Status";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const normalizedStatus = normalizeStatus(status);

    switch (normalizedStatus) {
      case "pending":
        return "border-border bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground";
      case "reviewed":
        return "border-primary/15 bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary";
      case "approved":
        return "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300";
      case "rejected":
        return "border-red-200 bg-red-50 text-red-600 hover:bg-red-50 hover:text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/10 dark:hover:text-red-300";
      case "needs_followup":
        return "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-50 hover:text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/10 dark:hover:text-amber-300";
      default:
        return "border-border bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground";
    }
  };

  const patientStats = useMemo(() => {
    const veryHigh = patients.filter(
      (patient) => getPatientRisk(patient) === "veryhigh"
    ).length;

    const high = patients.filter(
      (patient) => getPatientRisk(patient) === "high"
    ).length;

    const medium = patients.filter(
      (patient) => getPatientRisk(patient) === "medium"
    ).length;

    const low = patients.filter(
      (patient) => getPatientRisk(patient) === "low"
    ).length;

    return {
      total: patients.length,
      veryHigh,
      high,
      medium,
      low,
    };
  }, [patients]);

  const filteredPatients = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return patients.filter((patient) => {
      const fullName = getFullName(patient).toLowerCase();
      const email = patient.email?.toLowerCase() || "";
      const risk = getPatientRisk(patient);

      const matchesSearch =
        !searchValue ||
        fullName.includes(searchValue) ||
        email.includes(searchValue);

      const matchesRisk =
        statusFilter === "all" || risk === normalizeRisk(statusFilter);

      return matchesSearch && matchesRisk;
    });
  }, [patients, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));

  const paginatedPatients = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredPatients.slice(start, start + PAGE_SIZE);
  }, [filteredPatients, page, totalPages]);

  const handleCreatePatient = async () => {
    const firstName = newPatient.first_name.trim();
    const lastName = newPatient.last_name.trim();
    const email = newPatient.email.trim();
    const phone = newPatient.phone.trim();

    if (!firstName || !lastName || !email) {
      toast.error(
        isArabic
          ? "من فضلك املأ الاسم الأول واسم العائلة والبريد الإلكتروني"
          : "Please fill first name, last name, and email"
      );
      return;
    }

    try {
      setCreating(true);

      await patientsApi.createPatient({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
      });

      toast.success(
        isArabic ? "تم إضافة المريض بنجاح" : "Patient created successfully"
      );

      setOpenCreate(false);
      setNewPatient(emptyPatientForm);
      await fetchPatients();
    } catch (error) {
      console.error("Failed to create patient", error);
      toast.error(isArabic ? "فشل إضافة المريض" : "Failed to create patient");
    } finally {
      setCreating(false);
    }
  };

  const handleViewDetails = async (patient: PatientWithExtras) => {
    try {
      setOpenDetails(true);
      setDetailsLoading(true);
      setSelectedPatient(patient);

      const response = await patientsApi.getPatientProfile(patient.id);
      const details = extractPatientDetails(
        response as ApiSingleResponse<PatientDetails>
      );

      setSelectedPatient(details || patient);
    } catch (error) {
      console.error("Failed to load patient details", error);
      toast.error(
        isArabic
          ? "تم عرض البيانات الأساسية فقط"
          : "Showing basic patient details only"
      );
      setSelectedPatient(patient);
    } finally {
      setDetailsLoading(false);
    }
  };

  const goPrev = () => setPage((prev) => Math.max(1, prev - 1));
  const goNext = () => setPage((prev) => Math.min(totalPages, prev + 1));

  const statsCards = [
    {
      title: isArabic ? "إجمالي المرضى" : "Total Patients",
      value: patientStats.total,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: isArabic ? "حالات عالية جدًا" : "Very High Risk",
      value: patientStats.veryHigh,
      icon: Flame,
      color: "text-red-600 dark:text-red-300",
      bgColor: "bg-red-50 dark:bg-red-500/10",
    },
    {
      title: isArabic ? "حالات عالية الخطورة" : "High Risk",
      value: patientStats.high,
      icon: ShieldAlert,
      color: "text-orange-600 dark:text-orange-300",
      bgColor: "bg-orange-50 dark:bg-orange-500/10",
    },
    {
      title: isArabic ? "حالات متوسطة" : "Medium Risk",
      value: patientStats.medium,
      icon: Gauge,
      color: "text-amber-600 dark:text-amber-300",
      bgColor: "bg-amber-50 dark:bg-amber-500/10",
    },
    {
      title: isArabic ? "حالات منخفضة" : "Low Risk",
      value: patientStats.low,
      icon: ShieldCheck,
      color: "text-emerald-600 dark:text-emerald-300",
      bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
    },
  ];

  const riskFilterOptions = [
    {
      value: "all",
      label: isArabic ? "كل الخطورات" : "All Risks",
    },
    {
      value: "veryhigh",
      label: isArabic ? "عالية جدًا" : "Very High",
    },
    {
      value: "high",
      label: t("dashboard.riskHigh"),
    },
    {
      value: "medium",
      label: t("dashboard.riskMedium"),
    },
    {
      value: "low",
      label: t("dashboard.riskLow"),
    },
  ];

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-full w-full max-w-none animate-in fade-in px-0 pb-8 pt-8 text-foreground duration-700 md:pt-0"
    >
      <div className="flex w-full max-w-none flex-col gap-6 sm:gap-7">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("doctorDashboard.patients.title")}
          </h1>

          <p className="mt-1 text-sm font-medium leading-6 text-muted-foreground">
            {isArabic
              ? "إدارة ومتابعة سجلات المرضى الخاصة بك."
              : "Manage and monitor your patient records."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {statsCards.map((card, index) => (
            <Card
              key={index}
              className="group overflow-hidden rounded-[1.75rem] border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
            >
              <CardContent className="relative flex min-h-[160px] flex-col justify-between p-5 sm:min-h-[170px]">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="max-w-[150px] text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {card.title}
                  </h3>

                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-105",
                      card.bgColor,
                      card.color
                    )}
                  >
                    <card.icon className="h-5 w-5" strokeWidth={2.3} />
                  </div>
                </div>

                <div>
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    {card.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="border-b border-border bg-muted/30 p-4 sm:p-5">
            <div className="flex flex-col gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <SlidersHorizontal className="h-4 w-4" strokeWidth={2.3} />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold tracking-tight text-foreground">
                    {isArabic ? "قائمة المرضى" : "Patient Directory"}
                  </h2>

                  <p className="mt-1 text-xs font-semibold text-muted-foreground">
                    {isArabic
                      ? `${filteredPatients.length} نتيجة`
                      : `${filteredPatients.length} result${
                          filteredPatients.length === 1 ? "" : "s"
                        } found`}
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col items-center justify-center gap-3 lg:flex-row">
                <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-full border border-border bg-background shadow-sm transition-all focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/10 md:h-12 md:flex-row md:items-center">
                  <div className="group relative min-h-12 flex-1">
                    <Search
                      className={cn(
                        "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary",
                        isArabic ? "right-4" : "left-4"
                      )}
                    />

                    <Input
                      placeholder={
                        isArabic
                          ? "ابحث بالاسم أو الإيميل..."
                          : "Search by name or email..."
                      }
                      className={cn(
                        "h-12 rounded-none border-0 bg-transparent text-sm font-semibold text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0",
                        isArabic ? "pr-10 pl-10 text-right" : "pl-10 pr-10"
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
                          isArabic ? "left-4" : "right-4"
                        )}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="h-px w-full bg-border md:h-7 md:w-px" />

                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    dir={isArabic ? "rtl" : "ltr"}
                  >
                    <SelectTrigger className="h-12 w-full rounded-none border-0 bg-transparent px-4 text-sm font-bold text-primary shadow-none transition-none hover:bg-primary/5 hover:text-primary focus:ring-0 focus:ring-offset-0 md:w-[210px]">
                      <SelectValue
                        placeholder={isArabic ? "الخطورة" : "Risk"}
                      />
                    </SelectTrigger>

                    <SelectContent className="rounded-2xl border-border bg-popover p-1 text-popover-foreground shadow-xl">
                      {riskFilterOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="cursor-pointer rounded-xl text-sm font-semibold focus:bg-primary/10 focus:text-primary"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => setOpenCreate(true)}
                  className="h-12 w-full rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 sm:w-auto"
                >
                  <Plus
                    className={cn("h-4 w-4", isArabic ? "ml-2" : "mr-2")}
                  />
                  {isArabic ? "مريض جديد" : "New Patient"}
                </Button>
              </div>
            </div>
          </div>

          <div className="hidden grid-cols-[1.8fr_1fr_1fr_1fr] border-b border-border bg-muted/40 px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground lg:grid">
            <div>{isArabic ? "المريض" : "Patient"}</div>
            <div>{isArabic ? "مستوى الخطورة" : "Risk Level"}</div>
            <div>{isArabic ? "الحالة" : "Status"}</div>
            <div>{isArabic ? "الإجراء" : "Action"}</div>
          </div>

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <LoadingDots />
            </div>
          ) : paginatedPatients.length > 0 ? (
            <div className="space-y-4 p-3 lg:space-y-0 lg:p-0 lg:divide-y lg:divide-border">
              {paginatedPatients.map((patient) => {
                const risk = getPatientRisk(patient);
                const patientStatus = getPatientStatus(patient);
                const patientName = getDisplayName(patient);

                return (
                  <div
                    key={patient.id}
                    className="grid gap-4 rounded-3xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:bg-muted/30 sm:p-5 lg:grid-cols-[1.8fr_1fr_1fr_1fr] lg:items-center lg:rounded-none lg:border-0 lg:shadow-none"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-12 w-12 shrink-0 border border-primary/20 bg-primary/5">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <UserIcon className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <h3 className="truncate text-[15px] font-bold text-foreground">
                          {patientName}
                        </h3>

                        {patient.email && (
                          <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
                            {patient.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 lg:block">
                      <span className="text-xs font-bold text-muted-foreground lg:hidden">
                        {isArabic ? "مستوى الخطورة" : "Risk Level"}
                      </span>

                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-bold shadow-none transition-none",
                          getRiskBadgeClass(risk)
                        )}
                      >
                        {getRiskLabel(risk)}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between gap-3 lg:block">
                      <span className="text-xs font-bold text-muted-foreground lg:hidden">
                        {isArabic ? "الحالة" : "Status"}
                      </span>

                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-bold shadow-none transition-none",
                          getStatusBadgeClass(patientStatus)
                        )}
                      >
                        {getStatusLabel(patientStatus)}
                      </Badge>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => handleViewDetails(patient)}
                      className="h-10 w-full rounded-full border-primary/30 bg-transparent px-5 text-sm font-semibold text-primary hover:bg-primary/10 hover:text-primary lg:w-fit"
                    >
                      {t("doctorDashboard.patients.viewDetails")}

                      {isArabic ? (
                        <ChevronLeft className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
              <UserIcon className="mb-4 h-10 w-10 text-primary" />

              <h3 className="text-base font-bold text-foreground">
                {t("doctorDashboard.noPatientsFound")}
              </h3>

              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {t("doctorDashboard.patients.noPatientsFound")}
              </p>
            </div>
          )}
        </Card>

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="icon"
            disabled={page === 1}
            onClick={isArabic ? goNext : goPrev}
            className="h-10 w-10 rounded-full border-primary/30 bg-card text-primary hover:bg-primary/10 disabled:opacity-40"
          >
            {isArabic ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>

          <div className="rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-muted-foreground shadow-sm">
            {isArabic
              ? `صفحة ${page} من ${totalPages}`
              : `Page ${page} of ${totalPages}`}
          </div>

          <Button
            variant="outline"
            size="icon"
            disabled={page === totalPages}
            onClick={isArabic ? goPrev : goNext}
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

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent
          dir={isArabic ? "rtl" : "ltr"}
          className="max-h-[90vh] w-[92vw] overflow-y-auto rounded-3xl border border-border bg-card text-card-foreground sm:max-w-xl [&>button]:hidden"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              {isArabic ? "إضافة مريض جديد" : "Add New Patient"}
            </DialogTitle>

            <DialogDescription className="text-sm font-medium text-muted-foreground">
              {isArabic
                ? "أدخل بيانات المريض وسيتم ربطه بحساب الدكتور الحالي."
                : "Enter patient details and the patient will be assigned to the current doctor."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                placeholder={isArabic ? "الاسم الأول" : "First name"}
                value={newPatient.first_name}
                onChange={(e) =>
                  setNewPatient((prev) => ({
                    ...prev,
                    first_name: e.target.value,
                  }))
                }
                className={cn(
                  "h-12 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground",
                  isArabic ? "text-right" : "text-left"
                )}
              />

              <Input
                placeholder={isArabic ? "اسم العائلة" : "Last name"}
                value={newPatient.last_name}
                onChange={(e) =>
                  setNewPatient((prev) => ({
                    ...prev,
                    last_name: e.target.value,
                  }))
                }
                className={cn(
                  "h-12 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground",
                  isArabic ? "text-right" : "text-left"
                )}
              />
            </div>

            <Input
              type="email"
              placeholder={isArabic ? "البريد الإلكتروني" : "Email address"}
              value={newPatient.email}
              onChange={(e) =>
                setNewPatient((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              dir="ltr"
              className="h-12 rounded-xl border-border bg-background text-left text-foreground placeholder:text-muted-foreground"
            />

            <Input
              placeholder={
                isArabic ? "رقم الهاتف اختياري" : "Phone number optional"
              }
              value={newPatient.phone}
              onChange={(e) =>
                setNewPatient((prev) => ({
                  ...prev,
                  phone: e.target.value,
                }))
              }
              dir="ltr"
              className="h-12 rounded-xl border-border bg-background text-left text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <DialogFooter className="gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setOpenCreate(false);
                setNewPatient(emptyPatientForm);
              }}
              className="h-11 w-full rounded-full border-primary/30 bg-transparent px-5 text-primary hover:bg-primary/10 sm:w-auto"
              disabled={creating}
            >
              {isArabic ? "إلغاء" : "Cancel"}
            </Button>

            <Button
              onClick={handleCreatePatient}
              disabled={creating}
              className="h-11 w-full rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90 sm:w-auto"
            >
              {creating
                ? isArabic
                  ? "جاري الإضافة..."
                  : "Creating..."
                : isArabic
                ? "إضافة المريض"
                : "Create Patient"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openDetails} onOpenChange={setOpenDetails}>
        <DialogContent
          dir={isArabic ? "rtl" : "ltr"}
          className="max-h-[90vh] w-[92vw] overflow-y-auto rounded-3xl border border-border bg-card text-card-foreground sm:max-w-2xl [&>button]:hidden"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              {isArabic ? "تفاصيل المريض" : "Patient Details"}
            </DialogTitle>

            <DialogDescription className="text-sm font-medium text-muted-foreground">
              {isArabic
                ? "بيانات المريض وآخر نتائج التحاليل المتاحة."
                : "Patient information and latest available predictions."}
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <LoadingDots />
            </div>
          ) : selectedPatient ? (
            <div className="space-y-5 py-3">
              <div className="flex items-center gap-4 rounded-2xl bg-primary/[0.03] p-4 dark:bg-primary/10">
                <Avatar className="h-14 w-14 shrink-0 border border-primary/20 bg-primary/5">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <UserIcon className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-foreground">
                    {getDisplayName(selectedPatient)}
                  </h3>

                  {selectedPatient.email && (
                    <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
                      {selectedPatient.email}
                    </p>
                  )}
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
                    (isArabic ? "لا يوجد بريد إلكتروني" : "No email")}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background/40 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />

                    <h4 className="text-sm font-bold text-foreground">
                      {isArabic ? "آخر التحاليل" : "Latest Predictions"}
                    </h4>
                  </div>

                  <Badge className="rounded-full bg-primary/10 text-primary shadow-none hover:bg-primary/10 hover:text-primary">
                    {selectedPatient.predictions?.length || 0}
                  </Badge>
                </div>

                {selectedPatient.predictions?.length ? (
                  <div className="space-y-3">
                    {getSortedPredictions(selectedPatient)
                      .slice(0, 3)
                      .map((prediction) => {
                        const predictionRisk = normalizeRisk(
                          prediction.risk_level
                        );

                        const predictionStatus = normalizeStatus(
                          prediction.review_status || prediction.status
                        );

                        return (
                          <div
                            key={prediction.id}
                            className="flex flex-col gap-3 rounded-xl bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "rounded-full px-3 py-1 text-xs font-bold shadow-none transition-none",
                                  getRiskBadgeClass(predictionRisk)
                                )}
                              >
                                {getRiskLabel(predictionRisk)}
                              </Badge>

                              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                {prediction.created_at
                                  ? new Date(
                                      prediction.created_at
                                    ).toLocaleDateString(
                                      isArabic ? "ar-EG" : "en-US"
                                    )
                                  : isArabic
                                  ? "لا يوجد تاريخ"
                                  : "No date"}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "rounded-full px-3 py-1 text-xs font-bold shadow-none transition-none",
                                  getStatusBadgeClass(predictionStatus)
                                )}
                              >
                                {getStatusLabel(predictionStatus)}
                              </Badge>

                              <div className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                                {prediction.probability ?? 0}%
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-muted-foreground">
                    {isArabic
                      ? "لا توجد تحاليل متاحة"
                      : "No predictions available"}
                  </p>
                )}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDetails(false)}
              className="h-11 w-full rounded-full border-primary/30 bg-transparent px-5 text-primary hover:bg-primary/10 sm:w-auto"
            >
              {isArabic ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}