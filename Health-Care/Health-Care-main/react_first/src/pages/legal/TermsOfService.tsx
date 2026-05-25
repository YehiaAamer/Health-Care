import { useRef } from "react";
import {
  AlertTriangle,
  Mail,
  ShieldCheck,
  FileText,
  Scale,
  UserCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { useIsVisible } from "@/hooks/useIsVisible";

const DESKTOP_HEADER_HEIGHT = 72;

const TermsOfService = () => {
  const { t, i18n } = useTranslation();

  const headerRef = useRef(null);
  const noticeRef = useRef(null);
  const sectionsRef = useRef(null);
  const contactRef = useRef(null);

  const headerVisible = useIsVisible(headerRef);
  const noticeVisible = useIsVisible(noticeRef);
  const sectionsVisible = useIsVisible(sectionsRef);
  const contactVisible = useIsVisible(contactRef);

  const isArabic = i18n.language.startsWith("ar");
  const currentLocale = isArabic ? "ar-EG" : "en-US";

  const lastUpdated = new Date().toLocaleDateString(currentLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const sections = [
    {
      id: "acceptance",
      title: t("terms.sections.acceptance.title"),
      icon: <UserCheck className="h-5 w-5" />,
      intro: t("terms.sections.acceptance.intro"),
      items: [
        t("terms.sections.acceptance.items.0"),
        t("terms.sections.acceptance.items.1"),
        t("terms.sections.acceptance.items.2"),
        t("terms.sections.acceptance.items.3"),
      ],
    },
    {
      id: "service-description",
      title: t("terms.sections.serviceDescription.title"),
      icon: <FileText className="h-5 w-5" />,
      intro: t("terms.sections.serviceDescription.intro"),
      items: [
        t("terms.sections.serviceDescription.items.0"),
        t("terms.sections.serviceDescription.items.1"),
        t("terms.sections.serviceDescription.items.2"),
        t("terms.sections.serviceDescription.items.3"),
      ],
      note: t("terms.sections.serviceDescription.note"),
    },
    {
      id: "medical-disclaimer",
      title: t("terms.sections.medicalDisclaimer.title"),
      icon: <AlertTriangle className="h-5 w-5" />,
      warning: t("terms.sections.medicalDisclaimer.warning"),
      items: [
        t("terms.sections.medicalDisclaimer.items.0"),
        t("terms.sections.medicalDisclaimer.items.1"),
        t("terms.sections.medicalDisclaimer.items.2"),
        t("terms.sections.medicalDisclaimer.items.3"),
        t("terms.sections.medicalDisclaimer.items.4"),
      ],
    },
    {
      id: "user-obligations",
      title: t("terms.sections.userObligations.title"),
      icon: <ShieldCheck className="h-5 w-5" />,
      intro: t("terms.sections.userObligations.intro"),
      items: [
        t("terms.sections.userObligations.items.0"),
        t("terms.sections.userObligations.items.1"),
        t("terms.sections.userObligations.items.2"),
        t("terms.sections.userObligations.items.3"),
        t("terms.sections.userObligations.items.4"),
        t("terms.sections.userObligations.items.5"),
      ],
    },
    {
      id: "intellectual-property",
      title: t("terms.sections.intellectualProperty.title"),
      icon: <FileText className="h-5 w-5" />,
      intro: t("terms.sections.intellectualProperty.intro"),
      items: [
        t("terms.sections.intellectualProperty.items.0"),
        t("terms.sections.intellectualProperty.items.1"),
        t("terms.sections.intellectualProperty.items.2"),
        t("terms.sections.intellectualProperty.items.3"),
      ],
    },
    {
      id: "service-modification",
      title: t("terms.sections.serviceModification.title"),
      icon: <Scale className="h-5 w-5" />,
      intro: t("terms.sections.serviceModification.intro"),
      items: [
        t("terms.sections.serviceModification.items.0"),
        t("terms.sections.serviceModification.items.1"),
        t("terms.sections.serviceModification.items.2"),
        t("terms.sections.serviceModification.items.3"),
      ],
      footnote: t("terms.sections.serviceModification.footnote"),
    },
    {
      id: "account-termination",
      title: t("terms.sections.accountTermination.title"),
      icon: <UserCheck className="h-5 w-5" />,
      intro: t("terms.sections.accountTermination.intro"),
      items: [
        t("terms.sections.accountTermination.items.0"),
        t("terms.sections.accountTermination.items.1"),
        t("terms.sections.accountTermination.items.2"),
        t("terms.sections.accountTermination.items.3"),
      ],
    },
    {
      id: "governing-law",
      title: t("terms.sections.governingLaw.title"),
      icon: <Scale className="h-5 w-5" />,
      intro: t("terms.sections.governingLaw.intro"),
      items: [
        t("terms.sections.governingLaw.items.0"),
        t("terms.sections.governingLaw.items.1"),
        t("terms.sections.governingLaw.items.2"),
      ],
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col bg-background overflow-x-hidden"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Header />

      <main
        className="flex-1 w-full px-4 sm:px-6 lg:px-8"
        style={{
          paddingTop: `${DESKTOP_HEADER_HEIGHT + 40}px`,
          paddingBottom: "56px",
        }}
      >
        <div className="w-full max-w-7xl mx-auto">
          <div
            ref={headerRef}
            className={`mb-8 pb-4 border-b transition-all duration-700 ease-out ${
              headerVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              {t("terms.title")}
            </h1>

            <p className="text-sm text-muted-foreground max-w-3xl leading-7">
              {t("terms.subtitle")}
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              {t("terms.lastUpdatedLabel")} {lastUpdated}
            </p>
          </div>

          <div
            ref={noticeRef}
            className={`mb-6 flex items-start gap-2 text-sm text-yellow-700 transition-all duration-700 ease-out delay-100 ${
              noticeVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-yellow-600" />
            <p>
              <span className="font-semibold">
                {t("terms.notice.title")}:
              </span>{" "}
              {t("terms.notice.description")}
            </p>
          </div>

          <div
            ref={sectionsRef}
            className={`grid grid-cols-1 gap-5 lg:grid-cols-2 transition-all duration-700 ease-out delay-100 ${
              sectionsVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="rounded-xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    {section.icon}
                  </div>

                  <h2 className="text-lg font-semibold text-foreground leading-snug">
                    {section.title}
                  </h2>
                </div>

                <div className="space-y-3 text-muted-foreground">
                  {section.intro && (
                    <p className="text-sm leading-6">{section.intro}</p>
                  )}

                  {section.warning && (
                    <p className="text-sm font-semibold leading-6 text-red-600">
                      {section.warning}
                    </p>
                  )}

                  <ul
                    className={`list-disc text-sm leading-6 space-y-1 ${
                      isArabic ? "pr-5" : "pl-5"
                    }`}
                  >
                    {section.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>

                  {section.note && (
                    <p className="text-sm font-medium text-primary">
                      {section.note}
                    </p>
                  )}

                  {section.footnote && (
                    <p className="text-sm text-muted-foreground">
                      {section.footnote}
                    </p>
                  )}
                </div>
              </section>
            ))}
          </div>

          <section
            ref={contactRef}
            className={`mt-6 rounded-xl border bg-card p-6 shadow-sm transition-all duration-700 ease-out delay-200 hover:-translate-y-1 hover:shadow-md ${
              contactVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {t("terms.contact.title")}
                </h2>
                <p className="text-sm text-muted-foreground leading-6">
                  {t("terms.contact.description")}
                </p>
              </div>

              <a
                href="mailto:legal@healthcare.com"
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-primary font-medium transition hover:bg-primary/5"
              >
                <Mail className="h-4 w-4" />
                legal@HealthCare.com
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
