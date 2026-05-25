import { useMemo, useState, useRef } from "react";
import {
  MailOpen,
  PhoneCall,
  MapPinned,
  SendHorizonal,
  LoaderCircle,
  LifeBuoy,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { useTranslation } from "react-i18next";
import { useIsVisible } from "@/hooks/useIsVisible";

const DESKTOP_HEADER_HEIGHT = 72;

const ContactUs = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language.startsWith("ar");

  const heroRef = useRef(null);
  const infoRef = useRef(null);
  const formRef = useRef(null);
  const emergencyRef = useRef(null);

  const heroVisible = useIsVisible(heroRef);
  const infoVisible = useIsVisible(infoRef);
  const formVisible = useIsVisible(formRef);
  const emergencyVisible = useIsVisible(emergencyRef);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = useMemo(() => {
    return (
      formData.name.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.message.trim() !== "" &&
      formData.email.includes("@")
    );
  }, [formData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getFriendlyErrorMessage = (
    rawMessage: string | undefined,
    fallback: string,
  ) => {
    const normalized = (rawMessage || "").toLowerCase();

    if (
      normalized.includes("token") ||
      normalized.includes("not valid") ||
      normalized.includes("invalid token") ||
      normalized.includes("authentication")
    ) {
      return t("contactPage.failedMessage");
    }

    return rawMessage || fallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error(t("contactPage.requiredFields"));
      return;
    }

    if (!formData.email.includes("@")) {
      toast.error(t("contactPage.invalidEmail"));
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/contact/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const apiMessage =
          data?.message ||
          data?.detail ||
          data?.error ||
          (Array.isArray(data) ? data[0] : undefined);

        throw new Error(
          getFriendlyErrorMessage(apiMessage, t("contactPage.failedMessage")),
        );
      }

      toast.success(data?.message || t("contactPage.successMessage"));
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Contact form error:", error);
      toast.error(
        error instanceof Error
          ? getFriendlyErrorMessage(
              error.message,
              t("contactPage.failedMessage"),
            )
          : t("contactPage.failedMessage"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: PhoneCall,
      title: t("contactPage.phoneTitle"),
      value: "+20 123 456 7890",
      href: "tel:+201234567890",
    },
    {
      icon: MapPinned,
      title: t("contactPage.addressTitle"),
      value: t("contactPage.addressValue"),
      href: "#location",
    },
    {
      icon: MailOpen,
      title: t("contactPage.emailTitle"),
      value: "support@HealthCare.com",
      href: "mailto:support@healthCare.com",
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Header />

      <main
        className="flex-1 px-4"
        style={{
          paddingTop: `${DESKTOP_HEADER_HEIGHT + 48}px`,
          paddingBottom: "48px",
        }}
      >
        <div className="container mx-auto max-w-5xl">
          <div
            ref={heroRef}
            className={`mb-10 text-center transition-all duration-700 ease-out ${
              heroVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <p className="mb-2 text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
              {isArabic ? "تواصل" : "Contact"}
            </p>

            <h1 className="text-3xl md:text-4xl font-light text-foreground">
              {isArabic ? (
                <>
                  <span className="text-muted-foreground">هل تحتاج إلى مساعدة؟ </span>
                  <span className="text-primary font-medium">تواصل معنا</span>
                </>
              ) : (
                <>
                  <span className="text-muted-foreground">Need Help? </span>
                  <span className="text-primary font-medium">Contact Us</span>
                </>
              )}
            </h1>
          </div>

          <div className="space-y-5">
            <div
              ref={infoRef}
              className={`grid gap-4 sm:grid-cols-2 transition-all duration-700 ease-out delay-100 ${
                infoVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              {contactInfo.map((info) => (
                <Card
                  key={info.title}
                  className="rounded-none border border-border/70 bg-card shadow-sm"
                >
                  <CardContent className="p-5">
                    <a
                      href={info.href}
                      className={`flex items-center justify-between gap-4 ${
                        isArabic ? "flex-row" : "flex-row-reverse"
                      }`}
                    >
                      <div
                        className={`min-w-0 flex-1 ${
                          isArabic ? "text-right" : "text-left"
                        }`}
                      >
                        <h3 className="text-sm md:text-base font-semibold text-foreground">
                          {info.title}
                        </h3>
                        <p className="mt-1 text-xs md:text-sm text-muted-foreground break-words">
                          {info.value}
                        </p>
                      </div>

                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
                        <info.icon className="h-5 w-5" strokeWidth={2.2} />
                      </div>
                    </a>
                  </CardContent>
                </Card>
              ))}

              <Card className="rounded-none border border-border/70 bg-card shadow-sm">
                <CardContent className="p-5">
                  <div
                    className={`flex items-center justify-between gap-4 ${
                      isArabic ? "flex-row" : "flex-row-reverse"
                    }`}
                  >
                    <div
                      className={`min-w-0 flex-1 ${
                        isArabic ? "text-right" : "text-left"
                      }`}
                    >
                      <h3 className="text-sm md:text-base font-semibold text-foreground">
                        {t("contactPage.faqTitle")}
                      </h3>
                      <a
                        href="/help"
                        className="mt-1 inline-block text-primary hover:underline text-sm"
                      >
                        {t("contactPage.faqLink")}
                      </a>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
                      <LifeBuoy className="h-5 w-5" strokeWidth={2.2} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div
              ref={formRef}
              className={`transition-all duration-700 ease-out delay-200 ${
                formVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <Card className="rounded-none border border-border/70 bg-card shadow-sm">
                <CardContent className="p-5 md:p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={t("contactPage.namePlaceholder")}
                        disabled={isLoading}
                        className={`h-11 rounded-none border-border/80 bg-background shadow-none ${
                          isArabic ? "text-right" : "text-left"
                        }`}
                        dir={isArabic ? "rtl" : "ltr"}
                      />

                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={t("contactPage.emailPlaceholder")}
                        disabled={isLoading}
                        className="h-11 rounded-none border-border/80 bg-background shadow-none text-left"
                        dir="ltr"
                      />
                    </div>

                    <Input
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder={t("contactPage.subjectPlaceholder")}
                      disabled={isLoading}
                      className={`h-11 rounded-none border-border/80 bg-background shadow-none ${
                        isArabic ? "text-right" : "text-left"
                      }`}
                      dir={isArabic ? "rtl" : "ltr"}
                    />

                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder={t("contactPage.messagePlaceholder")}
                      className={`min-h-[160px] resize-none rounded-none border-border/80 bg-background shadow-none text-sm leading-6 ${
                        isArabic ? "text-right" : "text-left"
                      }`}
                      dir={isArabic ? "rtl" : "ltr"}
                      disabled={isLoading}
                    />

                    <div className="flex flex-col items-center gap-3 pt-1">
                      <Button
                        type="submit"
                        className="min-w-[170px] h-11 rounded-full px-8"
                        disabled={isLoading || !isFormValid}
                        size="lg"
                      >
                        {isLoading ? (
                          <>
                            <LoaderCircle
                              className={`h-4 w-4 animate-spin ${
                                isArabic ? "ml-2" : "mr-2"
                              }`}
                              strokeWidth={2.4}
                            />
                            {t("contactPage.sending")}
                          </>
                        ) : (
                          <>
                            <SendHorizonal
                              className={`h-4 w-4 ${isArabic ? "ml-2" : "mr-2"}`}
                              strokeWidth={2.4}
                            />
                            {t("contactPage.sendMessage")}
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        {t("contactPage.replyTime")}
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div
              ref={emergencyRef}
              className={`py-2 transition-all duration-700 ease-out delay-300 ${
                emergencyVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <div className="flex flex-col items-center justify-center text-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600 flex-shrink-0">
                  <TriangleAlert className="h-5 w-5" strokeWidth={2.2} />
                </div>

                <div className="text-center">
                  <h3 className="text-base font-semibold text-red-800 mb-2">
                    {t("contactPage.emergencyTitle")}
                  </h3>
                  <p className="text-sm text-red-700 leading-6 mb-2">
                    {t("contactPage.emergencyText")}
                  </p>
                  <a
                    href="tel:123"
                    className="text-red-600 font-bold hover:underline text-sm"
                  >
                    {t("contactPage.emergencyCall")}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactUs;
