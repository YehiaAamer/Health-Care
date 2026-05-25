import { useRef } from "react";
import {
  Mail,
  ShieldCheck,
  Database,
  Lock,
  Share2,
  Stethoscope,
  RefreshCcw,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { useIsVisible } from "@/hooks/useIsVisible";

const DESKTOP_HEADER_HEIGHT = 72;

const PrivacyPolicy = () => {
  const { t, i18n } = useTranslation();

  const headerRef = useRef(null);
  const sectionsRef = useRef(null);

  const headerVisible = useIsVisible(headerRef);
  const sectionsVisible = useIsVisible(sectionsRef);

  const isArabic = i18n.language.startsWith("ar");
  const currentLocale = isArabic ? "ar-EG" : "en-US";

  const lastUpdated = new Date().toLocaleDateString(currentLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const sections = [
    {
      id: "collected-information",
      title: t("privacy.sections.collectedInformation.title"),
      icon: <Database className="h-5 w-5" />,
      intro: t("privacy.sections.collectedInformation.intro"),
      items: [
        t("privacy.sections.collectedInformation.items.0"),
        t("privacy.sections.collectedInformation.items.1"),
        t("privacy.sections.collectedInformation.items.2"),
        t("privacy.sections.collectedInformation.items.3"),
      ],
    },
    {
      id: "how-we-use-information",
      title: t("privacy.sections.howWeUseInformation.title"),
      icon: <ShieldCheck className="h-5 w-5" />,
      intro: t("privacy.sections.howWeUseInformation.intro"),
      items: [
        t("privacy.sections.howWeUseInformation.items.0"),
        t("privacy.sections.howWeUseInformation.items.1"),
        t("privacy.sections.howWeUseInformation.items.2"),
        t("privacy.sections.howWeUseInformation.items.3"),
        t("privacy.sections.howWeUseInformation.items.4"),
      ],
    },
    {
      id: "data-protection",
      title: t("privacy.sections.dataProtection.title"),
      icon: <Lock className="h-5 w-5" />,
      intro: t("privacy.sections.dataProtection.intro"),
      items: [
        t("privacy.sections.dataProtection.items.0"),
        t("privacy.sections.dataProtection.items.1"),
        t("privacy.sections.dataProtection.items.2"),
        t("privacy.sections.dataProtection.items.3"),
        t("privacy.sections.dataProtection.items.4"),
      ],
    },
    {
      id: "information-sharing",
      title: t("privacy.sections.informationSharing.title"),
      icon: <Share2 className="h-5 w-5" />,
      strong: t("privacy.sections.informationSharing.strong"),
      intro: t("privacy.sections.informationSharing.intro"),
      items: [
        t("privacy.sections.informationSharing.items.0"),
        t("privacy.sections.informationSharing.items.1"),
        t("privacy.sections.informationSharing.items.2"),
        t("privacy.sections.informationSharing.items.3"),
      ],
    },
    {
      id: "your-rights",
      title: t("privacy.sections.yourRights.title"),
      icon: <ShieldCheck className="h-5 w-5" />,
      intro: t("privacy.sections.yourRights.intro"),
      items: [
        t("privacy.sections.yourRights.items.0"),
        t("privacy.sections.yourRights.items.1"),
        t("privacy.sections.yourRights.items.2"),
        t("privacy.sections.yourRights.items.3"),
        t("privacy.sections.yourRights.items.4"),
      ],
    },
    {
      id: "medical-disclaimer",
      title: t("privacy.sections.medicalDisclaimer.title"),
      icon: <Stethoscope className="h-5 w-5" />,
      strong: t("privacy.sections.medicalDisclaimer.strong"),
      items: [
        t("privacy.sections.medicalDisclaimer.items.0"),
        t("privacy.sections.medicalDisclaimer.items.1"),
        t("privacy.sections.medicalDisclaimer.items.2"),
        t("privacy.sections.medicalDisclaimer.items.3"),
      ],
    },
    {
      id: "policy-changes",
      title: t("privacy.sections.policyChanges.title"),
      icon: <RefreshCcw className="h-5 w-5" />,
      intro: t("privacy.sections.policyChanges.intro"),
      items: [
        t("privacy.sections.policyChanges.items.0"),
        t("privacy.sections.policyChanges.items.1"),
        t("privacy.sections.policyChanges.items.2"),
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
              {t("privacy.title")}
            </h1>

            <p className="text-sm text-muted-foreground max-w-3xl leading-7">
              {t("privacy.subtitle")}
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              {t("privacy.lastUpdatedLabel")} {lastUpdated}
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
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {section.icon}
                  </div>

                  <h2 className="text-lg font-semibold text-foreground leading-snug">
                    {section.title}
                  </h2>
                </div>

                <div className="space-y-3 text-muted-foreground">
                  {section.strong && (
                    <p className="text-sm font-semibold leading-6 text-foreground">
                      {section.strong}
                    </p>
                  )}

                  {section.intro && (
                    <p className="text-sm leading-6">{section.intro}</p>
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
                </div>
              </section>
            ))}

            <section className="rounded-xl border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
              <div className="flex h-full flex-col justify-between gap-5">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    {t("privacy.contact.title")}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-6">
                    {t("privacy.contact.description")}
                  </p>
                </div>

                <a
                  href="mailto:privacy@healthcare.com"
                  className="inline-flex w-fit items-center gap-2 rounded-lg border px-4 py-2.5 text-primary font-medium transition hover:bg-primary/5"
                >
                  <Mail className="h-4 w-4" />
                  privacy@HealthCare.com
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
