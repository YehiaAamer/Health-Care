import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MessageCircle,
  Mail,
  Phone,
  BookOpen,
  ShieldCheck,
  LifeBuoy,
  ChevronRight,
  Bell,
  ClipboardCheck,
  FileSearch,
  Stethoscope,
  Lock,
  FileText,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function HelpPage() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar" || i18n.language?.startsWith("ar");

  const guides = [
    {
      title: isArabic ? "مراجعة التقارير" : "Review Reports",
      description: isArabic
        ? "راجع بيانات التقرير وسجّل القرار المناسب."
        : "Review report data and record the proper decision.",
      icon: FileSearch,
    },
    {
      title: isArabic ? "إدارة المرضى" : "Manage Patients",
      description: isArabic
        ? "تابع بيانات المرضى والحالات المسجلة."
        : "Track patient records and registered cases.",
      icon: Stethoscope,
    },
    {
      title: isArabic ? "متابعة الحالات" : "Follow Cases",
      description: isArabic
        ? "تابع الحالات التي تحتاج مراجعة أو إجراء."
        : "Follow cases that require review or action.",
      icon: ShieldCheck,
    },
    {
      title: isArabic ? "التنبيهات" : "Alerts",
      description: isArabic
        ? "راجع التنبيهات والمهام الجديدة."
        : "Check alerts and new tasks.",
      icon: Bell,
    },
  ];

  const supportChannels = [
    {
      label: isArabic ? "محادثة الدعم" : "Support Chat",
      description: isArabic ? "مساعدة مباشرة داخل النظام" : "Quick in-system support",
      icon: MessageCircle,
    },
    {
      label: isArabic ? "البريد الإلكتروني" : "Email Support",
      description: isArabic ? "للمشاكل الفنية والحسابات" : "For technical and account issues",
      icon: Mail,
    },
    {
      label: isArabic ? "الدعم الهاتفي" : "Phone Support",
      description: isArabic ? "للمشاكل العاجلة" : "For urgent issues",
      icon: Phone,
    },
  ];

  const privacySections = [
    {
      icon: Lock,
      title: isArabic ? "سرية البيانات" : "Data Confidentiality",
      text: isArabic
        ? "حافظ على سرية بيانات المرضى داخل النظام."
        : "Keep patient data confidential inside the system.",
    },
    {
      icon: FileText,
      title: isArabic ? "صلاحيات الوصول" : "Access Permissions",
      text: isArabic
        ? "استخدم البيانات المتاحة حسب صلاحيات حسابك."
        : "Use available data according to your account permissions.",
    },
    {
      icon: ShieldCheck,
      title: isArabic ? "الاستخدام المهني" : "Professional Use",
      text: isArabic
        ? "استخدم المعلومات لدعم جودة الخدمة الطبية."
        : "Use information to support quality medical service.",
    },
  ];

  const privacyNotes = isArabic
    ? [
        "لا تشارك بيانات المرضى خارج النظام.",
        "التزم بصلاحيات الحساب وسياسات الحماية.",
        "راجع البيانات قبل اتخاذ أي إجراء.",
      ]
    : [
        "Do not share patient data outside the system.",
        "Follow account permissions and protection policies.",
        "Review data before taking any action.",
      ];

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-full w-full max-w-none pb-8 pt-8 font-sans text-foreground animate-in fade-in duration-700 md:pt-0"
    >
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t("doctorDashboard.sidebar.help")}
          </h1>

          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            {isArabic
              ? "دليل مختصر لاستخدام النظام الطبي وإدارة الحالات."
              : "A concise guide for using the medical system and managing cases."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
          <CardHeader className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-primary/10 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                  {isArabic ? "استخدام النظام" : "System Usage"}
                </CardTitle>

                <CardDescription className="mt-1 text-xs font-semibold text-muted-foreground">
                  {isArabic
                    ? "إرشادات أساسية للتعامل مع الحالات والتقارير."
                    : "Basic guidance for handling cases and reports."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="min-h-[135px] rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileSearch className="h-4 w-4" />
                </div>

                <h4 className="text-sm font-bold text-foreground">
                  {isArabic ? "مراجعة البيانات" : "Review Data"}
                </h4>

                <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                  {isArabic
                    ? "راجع بيانات الحالة قبل اتخاذ أي إجراء."
                    : "Review case data before taking action."}
                </p>
              </div>

              <div className="min-h-[135px] rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ClipboardCheck className="h-4 w-4" />
                </div>

                <h4 className="text-sm font-bold text-foreground">
                  {isArabic ? "تسجيل الإجراء" : "Record Action"}
                </h4>

                <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                  {isArabic
                    ? "سجّل القرار أو الملاحظات بشكل واضح."
                    : "Record decisions or notes clearly."}
                </p>
              </div>

              <div className="min-h-[135px] rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </div>

                <h4 className="text-sm font-bold text-foreground">
                  {isArabic ? "متابعة الحالة" : "Case Follow-up"}
                </h4>

                <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                  {isArabic
                    ? "تابع الحالات حسب الأولوية والاحتياج."
                    : "Follow cases based on priority and need."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <LifeBuoy className="h-5 w-5" />
                </div>

                <div>
                  <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                    {isArabic ? "قنوات الدعم" : "Support Channels"}
                  </CardTitle>

                  <CardDescription className="mt-1 text-xs font-semibold text-muted-foreground">
                    {isArabic ? "اختر طريقة التواصل المناسبة." : "Choose the suitable contact channel."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 p-5">
              {supportChannels.map((channel, index) => (
                <button
                  key={index}
                  type="button"
                  className="flex w-full items-center justify-between rounded-2xl border border-border bg-background p-4 text-start shadow-sm transition-none hover:bg-primary/5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <channel.icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        {channel.label}
                      </p>

                      <p className="mt-1 line-clamp-1 text-xs font-semibold text-muted-foreground">
                        {channel.description}
                      </p>
                    </div>
                  </div>

                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground",
                      isArabic && "rotate-180"
                    )}
                  />
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>

                <div>
                  <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                    {isArabic ? "إرشادات النظام" : "System Guides"}
                  </CardTitle>

                  <CardDescription className="mt-1 text-xs font-semibold text-muted-foreground">
                    {isArabic ? "خطوات مختصرة للوظائف الأساسية." : "Short steps for core functions."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 p-5">
              {guides.map((guide, index) => (
                <button
                  key={index}
                  type="button"
                  className="flex w-full items-center justify-between rounded-2xl border border-border bg-background p-4 text-start shadow-sm transition-none hover:bg-primary/5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <guide.icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        {guide.title}
                      </p>

                      <p className="mt-1 line-clamp-1 text-xs font-semibold text-muted-foreground">
                        {guide.description}
                      </p>
                    </div>
                  </div>

                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground",
                      isArabic && "rotate-180"
                    )}
                  />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
          <CardHeader className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-primary/10 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Lock className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                  {isArabic ? "خصوصية البيانات" : "Data Privacy"}
                </CardTitle>

                <CardDescription className="mt-1 text-xs font-semibold text-muted-foreground">
                  {isArabic
                    ? "قواعد مختصرة للتعامل مع بيانات المرضى."
                    : "Brief rules for handling patient data."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {privacySections.map((section, index) => (
                <div
                  key={index}
                  className="min-h-[135px] rounded-2xl border border-primary/15 bg-primary/5 p-4"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <section.icon className="h-4 w-4" />
                  </div>

                  <h4 className="text-sm font-bold text-foreground">
                    {section.title}
                  </h4>

                  <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                    {section.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-2xl border border-border bg-background p-4">
              {privacyNotes.map((note, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />

                  <p className="text-sm font-medium leading-7 text-muted-foreground">
                    {note}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}