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
      className="min-h-screen flex flex-col"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Header />

      <main
        className="flex-1 px-4 bg-background"
        style={{ paddingTop: `${DESKTOP_HEADER_HEIGHT + 48}px`, paddingBottom: "48px" }}
      >
        <div className="container mx-auto max-w-4xl">
          <div
            ref={heroRef}
            className={`text-center mb-12 transition-all duration-700 ease-out ${
              heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <h1 className="text-4xl font-bold mb-4">{t("help.title")}</h1>

            <p className="text-lg text-muted-foreground mb-8">
              {t("help.subtitle")}
            </p>

            <div className="relative max-w-2xl mx-auto">
              <Search
                className={`absolute top-3 h-5 w-5 text-muted-foreground ${
                  isArabic ? "right-3" : "left-3"
                }`}
              />
              <Input
                placeholder={t("help.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${isArabic ? "pr-10" : "pl-10"} py-6`}
              />
            </div>
          </div>

          <div
            ref={faqRef}
            className={`mb-16 transition-all duration-700 ease-out delay-100 ${
              faqVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-card border rounded-lg px-6"
                >
                  <AccordionTrigger className="font-semibold hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pt-2">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div
            ref={contactRef}
            className={`transition-all duration-700 ease-out delay-200 ${
              contactVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-3xl font-bold text-center mb-4">
              {t("help.contact.title")}
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              {t("help.contact.subtitle")}
            </p>

            <div className="grid md:grid-cols-1 gap-6">
              <div className="bg-accent/30 p-8 rounded-lg text-center hover:bg-cyan-50 transition-all duration-200">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {t("help.contact.emailTitle")}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t("help.contact.emailDescription")}
                </p>
                <a
                  href="mailto:support@HealthCare.com"
                  className="text-primary hover:underline"
                >
                  support@HealthCare.com
                </a>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t">
              <h3 className="text-lg font-semibold text-center mb-4">
                {t("help.importantPages")}
              </h3>

              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <a
                  href="/privacy"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{t("help.links.privacy")}</span>
                </a>

                <a
                  href="/terms"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>{t("help.links.terms")}</span>
                </a>

                <a
                  href="/contact"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
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
