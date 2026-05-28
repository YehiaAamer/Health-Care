import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, Mail, ShieldCheck, FileText, Phone } from "lucide-react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { useIsVisible } from "@/hooks/useIsVisible";

const DESKTOP_HEADER_HEIGHT = 72;

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { t, i18n } = useTranslation();

  const heroRef = useRef(null);
  const faqRef = useRef(null);
  const contactRef = useRef(null);

  const heroVisible = useIsVisible(heroRef);
  const faqVisible = useIsVisible(faqRef);
  const contactVisible = useIsVisible(contactRef);

  const isArabic = i18n.language === "ar";

  const faqs = [
    {
      question: t("help.faqs.aiDiagnosis.question"),
      answer: t("help.faqs.aiDiagnosis.answer"),
    },
    {
      question: t("help.faqs.dataSecurity.question"),
      answer: t("help.faqs.dataSecurity.answer"),
    },
    {
      question: t("help.faqs.resetPassword.question"),
      answer: t("help.faqs.resetPassword.answer"),
    },
    {
      question: t("help.faqs.downloadReports.question"),
      answer: t("help.faqs.downloadReports.answer"),
    },
  ];

  return (
    <div
      className="flex min-h-screen flex-col bg-background text-foreground"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Header />

      <main
        className="flex-1 bg-gradient-to-b from-background via-background to-accent/20 px-4"
        style={{
          paddingTop: `${DESKTOP_HEADER_HEIGHT + 48}px`,
          paddingBottom: "48px",
        }}
      >
        <div className="container mx-auto max-w-4xl">
          <div
            ref={heroRef}
            className={`mb-12 text-center transition-all duration-700 ease-out ${
              heroVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <h1 className="mb-4 text-4xl font-bold text-foreground">
              {t("help.title")}
            </h1>

            <p className="mb-8 text-lg text-muted-foreground">
              {t("help.subtitle")}
            </p>

            <div className="relative mx-auto max-w-2xl">
              <Search
                className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground ${
                  isArabic ? "right-4" : "left-4"
                }`}
              />

              <Input
                placeholder={t("help.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`h-14 rounded-full border-border bg-background text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:ring-primary/30 ${
                  isArabic ? "pr-12 pl-5 text-right" : "pl-12 pr-5 text-left"
                }`}
              />
            </div>
          </div>

          <div
            ref={faqRef}
            className={`mb-16 transition-all delay-100 duration-700 ease-out ${
              faqVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="rounded-2xl border border-border bg-card px-6 text-card-foreground shadow-sm"
                >
                  <AccordionTrigger className="font-semibold text-foreground hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>

                  <AccordionContent className="pt-2 text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div
            ref={contactRef}
            className={`transition-all delay-200 duration-700 ease-out ${
              contactVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <h2 className="mb-4 text-center text-3xl font-bold text-foreground">
              {t("help.contact.title")}
            </h2>

            <p className="mb-8 text-center text-muted-foreground">
              {t("help.contact.subtitle")}
            </p>

            <div className="grid gap-6 md:grid-cols-1">
              <div className="rounded-2xl border border-border bg-card p-8 text-center text-card-foreground shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/5">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-8 w-8 text-primary" />
                </div>

                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  {t("help.contact.emailTitle")}
                </h3>

                <p className="mb-4 text-muted-foreground">
                  {t("help.contact.emailDescription")}
                </p>

                <a
                  href="mailto:support@HealthCare.com"
                  className="font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
                >
                  support@HealthCare.com
                </a>
              </div>
            </div>

            <div className="mt-12 border-t border-border pt-8">
              <h3 className="mb-4 text-center text-lg font-semibold text-foreground">
                {t("help.importantPages")}
              </h3>

              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <a
                  href="/privacy"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{t("help.links.privacy")}</span>
                </a>

                <a
                  href="/terms"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
                >
                  <FileText className="h-4 w-4" />
                  <span>{t("help.links.terms")}</span>
                </a>

                <a
                  href="/contact"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Phone className="h-4 w-4" />
                  <span>{t("help.links.contact")}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Help;