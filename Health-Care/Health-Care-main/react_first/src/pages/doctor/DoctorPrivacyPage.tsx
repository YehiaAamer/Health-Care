import { useTranslation } from "react-i18next";
import { ShieldCheck, Lock, FileText } from "lucide-react";

export default function DoctorPrivacyPage() {
  const { i18n } = useTranslation();

  const isArabic = i18n.language === "ar" || i18n.language?.startsWith("ar");

  const content = {
    ar: {
      title: "خصوصية بيانات الطبيب",
      subtitle: "إرشادات مختصرة للتعامل مع بيانات المرضى داخل بوابة الطبيب.",
      sections: [
        {
          icon: Lock,
          title: "سرية البيانات",
          text: "بيانات المرضى سرية، ولا يجوز استخدامها إلا لأغراض المتابعة الطبية داخل النظام.",
        },
        {
          icon: FileText,
          title: "الوصول إلى التقارير الطبية",
          text: "يمكن للطبيب الوصول فقط إلى التقارير الطبية الخاصة بالمرضى المرتبطين بحسابه.",
        },
        {
          icon: ShieldCheck,
          title: "دعم القرار الطبي",
          text: "نتائج النظام مخصصة لدعم المراجعة الطبية، ولا تُغني عن الحكم المهني للطبيب.",
        },
      ],
      notes: [
        "يجب عدم مشاركة أي بيانات طبية خارج النظام أو مع أي طرف غير مصرح له.",
        "تهدف هذه الصفحة إلى توضيح مسؤولية الطبيب في حماية خصوصية المريض داخل المنصة.",
        "يلتزم الطبيب باستخدام المعلومات المتاحة بطريقة مهنية تدعم جودة الرعاية الصحية.",
        "أي مراجعة أو متابعة طبية يجب أن تتم وفق صلاحيات الطبيب وسياسات حماية البيانات المعتمدة.",
      ],
    },
    en: {
      title: "Doctor Data Privacy",
      subtitle: "Brief guidelines for handling patient data in the doctor portal.",
      sections: [
        {
          icon: Lock,
          title: "Data Confidentiality",
          text: "Patient data is confidential and may only be used for medical follow-up within the system.",
        },
        {
          icon: FileText,
          title: "Medical Reports Access",
          text: "Doctors can access only the medical reports of patients assigned to their account.",
        },
        {
          icon: ShieldCheck,
          title: "Clinical Decision Support",
          text: "System results are provided to support clinical review and do not replace professional medical judgment.",
        },
      ],
      notes: [
        "Medical data should not be shared outside the system or with any unauthorized party.",
        "This page clarifies the doctor's responsibility to protect patient privacy within the platform.",
        "Doctors are expected to use available information professionally to support the quality of care.",
        "Any medical review or follow-up should follow the doctor's permissions and approved data protection policies.",
      ],
    },
  };

  const pageContent = isArabic ? content.ar : content.en;

 return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-full w-full max-w-none animate-in fade-in px-0 pb-8 pt-8 text-foreground duration-700 md:pt-0"
    >
      <div className="space-y-8">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />

            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {pageContent.title}
            </h1>
          </div>

          <p className="text-sm font-medium leading-8 text-muted-foreground">
            {pageContent.subtitle}
          </p>
        </div>

        <div className="space-y-7">
          {pageContent.sections.map((section, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <section.icon className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <h2 className="mb-3 text-base font-bold tracking-tight text-foreground">
                  {section.title}
                </h2>

                <p className="text-sm font-medium leading-8 text-muted-foreground">
                  {section.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 border-t border-border pt-5">
          {pageContent.notes.map((note, index) => (
            <p
              key={index}
              className="text-sm font-medium leading-7 text-muted-foreground"
            >
              {note}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}