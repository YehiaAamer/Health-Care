import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  BookOpen,
  ShieldCheck,
  Cpu,
  LifeBuoy,
  ChevronRight,
  ExternalLink,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function HelpPage() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const faqs = [
    {
      question: isArabic
        ? "كيف يتم حساب درجة خطورة السكري؟"
        : "How is the diabetes risk score calculated?",
      answer: isArabic
        ? "يعتمد النظام على نموذج ذكاء اصطناعي يحلل مجموعة من المؤشرات السريرية مثل الجلوكوز، مؤشر كتلة الجسم، ضغط الدم، العمر، والتاريخ الوراثي لإنتاج نسبة احتمالية تساعد الطبيب في مراجعة الحالة."
        : "The system uses an AI model that analyzes clinical indicators such as glucose, BMI, blood pressure, age, and pedigree history to generate a probability score that supports the doctor’s review.",
    },
    {
      question: isArabic
        ? "هل توقعات الذكاء الاصطناعي تغني عن التشخيص الطبي؟"
        : "Do AI predictions replace medical diagnosis?",
      answer: isArabic
        ? "لا. النتائج مخصصة لدعم القرار السريري فقط، ويجب مراجعتها بواسطة الطبيب قبل اتخاذ أي قرار علاجي أو تشخيصي."
        : "No. The results are intended for clinical decision support only and should be reviewed by a doctor before any diagnostic or treatment decision.",
    },
    {
      question: isArabic
        ? "كيف يمكنني إضافة مريض جديد للمتابعة؟"
        : "How do I add a new patient for monitoring?",
      answer: isArabic
        ? "يمكن إدارة المرضى من صفحة المرضى داخل بوابة الطبيب. عند تفعيل إضافة المرضى من الباك إند، سيتم ربط المريض بحساب الطبيب مباشرة."
        : "Patients can be managed from the Patients page inside the doctor portal. Once backend patient creation is enabled, the patient will be linked directly to the doctor account.",
    },
  ];

  const guides = [
    {
      title: isArabic ? "بدء المراجعة السريرية" : "Starting a Clinical Review",
      icon: ShieldCheck,
    },
    {
      title: isArabic ? "قراءة تقارير التوقعات" : "Reading Prediction Reports",
      icon: BookOpen,
    },
    {
      title: isArabic ? "إدارة تنبيهات الحالات" : "Managing Case Alerts",
      icon: Bell,
    },
  ];

  return (
  <div
  dir={isArabic ? "rtl" : "ltr"}
  className="min-h-full w-full max-w-none pb-8 pt-8 font-sans animate-in fade-in duration-700 md:pt-0"
>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {t("doctorDashboard.sidebar.help")}
          </h1>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            {isArabic
              ? "مركز الدعم والإرشادات الخاصة ببوابة الطبيب"
              : "Doctor portal support center and guidance resources"}
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid grid-cols-1 gap-6">
          <Card className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <HelpCircle className="h-5 w-5" />
                </div>

                <div>
                  <CardTitle className="text-lg font-bold tracking-tight text-slate-900">
                    {t("doctorDashboard.help.faqs")}
                  </CardTitle>

                  <CardDescription className="mt-1 text-xs font-semibold text-slate-500">
                    {t("doctorDashboard.help.faqsDesc")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5">
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="rounded-2xl border border-slate-100 bg-white px-4 shadow-sm"
                  >
                    <AccordionTrigger className="py-4 text-start text-sm font-bold text-slate-900 hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>

                    <AccordionContent className="pb-4 text-sm font-medium leading-7 text-slate-600">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-primary/5 via-white to-primary/10 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Cpu className="h-5 w-5" />
                </div>

                <div>
                  <CardTitle className="text-lg font-bold tracking-tight text-slate-900">
                    {t("doctorDashboard.help.aiExplanation")}
                  </CardTitle>

                  <CardDescription className="mt-1 text-xs font-semibold text-slate-500">
                    {t("doctorDashboard.help.aiExplanationDesc")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="min-h-[150px] rounded-2xl border border-primary/15 bg-primary/5 p-4">
                  <h4 className="text-sm font-bold text-slate-900">
                    {isArabic ? "وضوح النتائج" : "Clear Results"}
                  </h4>

                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                    {isArabic
                      ? "كل تقرير يعرض نسبة الخطورة والمؤشرات السريرية الأساسية لمساعدة الطبيب على فهم الحالة بسرعة."
                      : "Each report shows the risk probability and core clinical indicators to help the doctor understand the case quickly."}
                  </p>
                </div>

                <div className="min-h-[150px] rounded-2xl border border-primary/15 bg-primary/5 p-4">
                  <h4 className="text-sm font-bold text-slate-900">
                    {isArabic ? "دعم القرار الطبي" : "Clinical Decision Support"}
                  </h4>

                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                    {isArabic
                      ? "النظام يساعد في ترتيب الأولويات ومراجعة الحالات، لكنه لا يستبدل تقييم الطبيب."
                      : "The system helps prioritize and review cases, but it does not replace the doctor’s assessment."}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="h-11 rounded-2xl border-primary/20 bg-white px-5 text-xs font-bold text-primary shadow-sm transition-none hover:bg-white hover:text-primary"
              >
                {isArabic ? "قراءة التوثيق التقني" : "Read Technical Documentation"}
                <ExternalLink
                  className={cn("h-4 w-4", isArabic ? "mr-2" : "ml-2")}
                />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 content-start">
          <Card className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <CardHeader className="p-5 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <LifeBuoy className="h-7 w-7" />
              </div>

              <CardTitle className="text-lg font-bold tracking-tight text-slate-900">
                {t("doctorDashboard.help.contact")}
              </CardTitle>

              <CardDescription className="mt-1 text-xs font-semibold text-slate-500">
                {isArabic
                  ? "اختر قناة التواصل المناسبة لك"
                  : "Choose the support channel that suits you"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 p-5 pt-0">
              <Button className="h-11 w-full rounded-2xl bg-primary px-5 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-none hover:bg-primary">
                <MessageCircle
                  className={cn("h-4 w-4", isArabic ? "ml-2" : "mr-2")}
                />
                {isArabic ? "محادثة فورية" : "Live Chat"}
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-11 rounded-2xl border-primary/15 bg-primary/5 text-primary transition-none hover:bg-primary/5 hover:text-primary"
                >
                  <Mail className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  className="h-11 rounded-2xl border-primary/15 bg-primary/5 text-primary transition-none hover:bg-primary/5 hover:text-primary"
                >
                  <Phone className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5">
              <CardTitle className="text-lg font-bold tracking-tight text-slate-900">
                {t("doctorDashboard.help.guides")}
              </CardTitle>

              <CardDescription className="mt-1 text-xs font-semibold text-slate-500">
                {isArabic ? "إرشادات سريعة للاستخدام" : "Quick usage guides"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 p-5">
              {guides.map((guide, index) => (
                <button
                  key={index}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 text-start shadow-sm transition-none hover:bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <guide.icon className="h-4 w-4" />
                    </div>

                    <span className="text-sm font-bold text-slate-700">
                      {guide.title}
                    </span>
                  </div>

                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 text-slate-300",
                      isArabic && "rotate-180"
                    )}
                  />
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-primary/15 bg-primary/5 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  {t("doctorDashboard.help.systemStatus")}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {isArabic
                    ? "كل خدمات بوابة الطبيب متاحة حالياً"
                    : "All doctor portal services are currently available"}
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}