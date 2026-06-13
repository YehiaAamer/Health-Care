// src/pages/LandingPage.tsx
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Activity,
  FileText,
  Zap,
  Shield,
  Clock,
  Stethoscope,
  HeartPulse,
  Droplet,
} from "lucide-react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { useIsVisible } from "@/hooks/useIsVisible";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";

const DESKTOP_HEADER_HEIGHT = 72;

const LandingPage = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  const isArabic = i18n.language === "ar";
  const isDoctor = user?.role === "doctor";

  const heroRef = useRef(null);
  const ctaRef = useRef(null);
  const howRef = useRef(null);
  const benefitsRef = useRef(null);

  const heroVisible = useIsVisible(heroRef);
  const ctaVisible = useIsVisible(ctaRef);
  const howVisible = useIsVisible(howRef);
  const benefitsVisible = useIsVisible(benefitsRef);

  const handleStartCheckup = () => {
    if (isLoading) return;

    if (isAuthenticated && isDoctor) {
      navigate("/doctor-dashboard");
      return;
    }

    if (isAuthenticated) {
      navigate("/diagnosis");
      return;
    }

    navigate("/auth?tab=login");
  };

  const sectionTitleClass =
    "text-3xl md:text-4xl font-bold pb-3 mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent leading-tight";

  const heroCardClass =
    "group rounded-2xl border border-primary/10 bg-background/80 backdrop-blur-md p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-primary/5 hover:shadow-xl";

  const heroIconClass =
    "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground";

  return (
    <div className="min-h-screen flex flex-col" dir={isArabic ? "rtl" : "ltr"}>
      <Header />

      {/* Hero Section */}
      <section
        className={`relative bg-accent px-4 bg-gradient-to-br from-background via-accent/20 to-background overflow-hidden ${
          isDoctor ? "min-h-screen flex items-center" : "py-24"
        }`}
        style={{
          paddingTop: isDoctor
            ? `${DESKTOP_HEADER_HEIGHT}px`
            : `${DESKTOP_HEADER_HEIGHT + 80}px`,
        }}
      >
        <div className="container mx-auto">
          <div
            ref={heroRef}
            className={`w-full transition-all duration-700 ease-out ${
              heroVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            } ${
              isDoctor
                ? "max-w-4xl mx-auto text-center py-10"
                : `max-w-5xl ${isArabic ? "text-right" : "text-left"}`
            }`}
          >
            <h1
              className={`font-bold pb-3 mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent leading-tight ${
                isDoctor
                  ? "text-5xl md:text-6xl"
                  : "text-3xl sm:text-4xl md:text-5xl max-w-4xl"
              }`}
            >
              {isDoctor
                ? t("landing.doctorHeroTitle")
                : t("landing.heroTitle")}
            </h1>

            <p
              className={`text-muted-foreground mb-8 ${
                isDoctor
                  ? "text-xl max-w-3xl mx-auto"
                  : "text-base sm:text-lg md:text-xl sm:mb-10 max-w-2xl"
              }`}
            >
              {isDoctor
                ? t("landing.doctorHeroSubtitle")
                : t("landing.heroSubtitle")}
            </p>

            {isDoctor && (
              <Button
                size="lg"
                className="text-lg px-8"
                onClick={handleStartCheckup}
                disabled={isLoading}
              >
                {t("landing.goToDoctorDashboard")}
              </Button>
            )}

            {!isDoctor && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl">
                <div className={heroCardClass}>
                  <div className={heroIconClass}>
                    <Droplet className="h-6 w-6 text-primary transition-colors duration-300 group-hover:text-primary-foreground" />
                  </div>

                  <h3 className="font-semibold mb-2 text-foreground">
                    {t("landing.heroCard1Title")}
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    {t("landing.heroCard1Desc")}
                  </p>
                </div>

                <div className={heroCardClass}>
                  <div className={heroIconClass}>
                    <HeartPulse className="h-6 w-6 text-primary transition-colors duration-300 group-hover:text-primary-foreground" />
                  </div>

                  <h3 className="font-semibold mb-2 text-foreground">
                    {t("landing.heroCard2Title")}
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    {t("landing.heroCard2Desc")}
                  </p>
                </div>

                <div className={`${heroCardClass} sm:col-span-2 lg:col-span-1`}>
                  <div className={heroIconClass}>
                    <Stethoscope className="h-6 w-6 text-primary transition-colors duration-300 group-hover:text-primary-foreground" />
                  </div>

                  <h3 className="font-semibold mb-2 text-foreground">
                    {t("landing.heroCard3Title")}
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    {t("landing.heroCard3Desc")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {!isDoctor && (
        <>
          {/* Main CTA Section */}
          <section className="relative min-h-[420px] py-20 px-4 overflow-hidden flex items-center">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat dark:hidden"
              style={{
                backgroundImage: "url('/hero-light.png')",
              }}
            />

            <div
              className="absolute inset-0 hidden bg-cover bg-center bg-no-repeat dark:block"
              style={{
                backgroundImage: "url('/hero-dark.png')",
              }}
            />

            <div className="absolute inset-0 bg-background/10" />

            <div
              ref={ctaRef}
              className={`relative z-10 container mx-auto text-center transition-all duration-700 ease-out delay-100 ${
                ctaVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <h2 className={sectionTitleClass}>
                {t("landing.ctaHealthTitle")}
              </h2>

              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                {t("landing.ctaHealthSubtitle")}
              </p>

              <Button
                size="lg"
                className="WOW text-lg px-8"
                onClick={handleStartCheckup}
                disabled={isLoading}
              >
                {t("landing.startDiagnosisNow")}
              </Button>
            </div>
          </section>

          {/* How It Works */}
          <section id="How" className="py-20 px-4 bg-background">
            <div
              ref={howRef}
              className={`container mx-auto transition-all duration-700 ease-out delay-100 ${
                howVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <h2 className={`${sectionTitleClass} text-center`}>
                {t("landing.howItWorksTitle")}
              </h2>

              <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                {t("landing.howItWorksSubtitle")}
              </p>

              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div className="WOW text-center rounded p-3 hover:shadow-lg transition-all duration-200">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>

                  <h3 className="text-xl font-semibold mb-2">
                    {t("landing.step1Title")}
                  </h3>

                  <p className="text-muted-foreground">
                    {t("landing.step1Desc")}
                  </p>
                </div>

                <div className="WOW text-center rounded p-3 hover:shadow-lg transition-all duration-200">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>

                  <h3 className="text-xl font-semibold mb-2">
                    {t("landing.step2Title")}
                  </h3>

                  <p className="text-muted-foreground">
                    {t("landing.step2Desc")}
                  </p>
                </div>

                <div className="WOW text-center rounded p-3 hover:shadow-lg transition-all duration-200">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>

                  <h3 className="text-xl font-semibold mb-2">
                    {t("landing.step3Title")}
                  </h3>

                  <p className="text-muted-foreground">
                    {t("landing.step3Desc")}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Key Benefits */}
          <section className="py-20 px-4 bg-accent/30">
            <div
              ref={benefitsRef}
              className={`container mx-auto transition-all duration-700 ease-out delay-200 ${
                benefitsVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <h2 className={`${sectionTitleClass} text-center`}>
                {t("landing.benefitsTitle")}
              </h2>

              <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                {t("landing.benefitsSubtitle")}
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <div className="WOW bg-card p-6 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>

                  <h3 className="text-xl font-semibold mb-2">
                    {t("landing.benefit1Title")}
                  </h3>

                  <p className="text-muted-foreground">
                    {t("landing.benefit1Desc")}
                  </p>
                </div>

                <div className="WOW bg-card p-6 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>

                  <h3 className="text-xl font-semibold mb-2">
                    {t("landing.benefit2Title")}
                  </h3>

                  <p className="text-muted-foreground">
                    {t("landing.benefit2Desc")}
                  </p>
                </div>

                <div className="WOW bg-card p-6 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mb-4">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>

                  <h3 className="text-xl font-semibold mb-2">
                    {t("landing.benefit3Title")}
                  </h3>

                  <p className="text-muted-foreground">
                    {t("landing.benefit3Desc")}
                  </p>
                </div>

                <div className="WOW bg-card p-6 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>

                  <h3 className="text-xl font-semibold mb-2">
                    {t("landing.benefit4Title")}
                  </h3>

                  <p className="text-muted-foreground">
                    {t("landing.benefit4Desc")}
                  </p>
                </div>

                <div className="WOW bg-card p-6 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>

                  <h3 className="text-xl font-semibold mb-2">
                    {t("landing.benefit5Title")}
                  </h3>

                  <p className="text-muted-foreground">
                    {t("landing.benefit5Desc")}
                  </p>
                </div>

                <div className="WOW bg-card p-6 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mb-4">
                    <Stethoscope className="h-6 w-6 text-primary" />
                  </div>

                  <h3 className="text-xl font-semibold mb-2">
                    {t("landing.benefit6Title")}
                  </h3>

                  <p className="text-muted-foreground">
                    {t("landing.benefit6Desc")}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <Footer />
    </div>
  );
};

export default LandingPage;