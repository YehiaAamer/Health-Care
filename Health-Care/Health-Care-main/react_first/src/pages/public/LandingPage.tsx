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
  Star,
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
  const howRef = useRef(null);
  const benefitsRef = useRef(null);
  const testimonialsRef = useRef(null);
  const ctaRef = useRef(null);

  const heroVisible = useIsVisible(heroRef);
  const howVisible = useIsVisible(howRef);
  const benefitsVisible = useIsVisible(benefitsRef);
  const testimonialsVisible = useIsVisible(testimonialsRef);
  const ctaVisible = useIsVisible(ctaRef);

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

  return (
    <div
      className="min-h-screen flex flex-col"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Header />

      {/* Hero Section */}
      <section
        className="relative bg-accent px-4 bg-gradient-to-br from-background via-accent/20 to-background overflow-hidden"
        style={{
          paddingTop: `${DESKTOP_HEADER_HEIGHT}px`,
        }}
      >
        <div
          className="container mx-auto items-center justify-center flex"
          style={{
            minHeight: `calc(100vh - ${DESKTOP_HEADER_HEIGHT}px)`,
          }}
        >
          <div
            ref={heroRef}
            className={`max-w-4xl mx-auto text-center py-10 transition-all duration-700 ease-out ${
              heroVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <h1 className="text-5xl md:text-6xl font-bold pb-3 mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              {isDoctor
                ? t("landing.doctorHeroTitle")
                : t("landing.heroTitle")}
            </h1>

            <p className="text-xl text-muted-foreground mb-8">
              {isDoctor
                ? t("landing.doctorHeroSubtitle")
                : t("landing.heroSubtitle")}
            </p>

            <Button
              size="lg"
              className="text-lg px-8"
              onClick={handleStartCheckup}
              disabled={isLoading}
            >
              {isDoctor
                ? t("landing.goToDoctorDashboard")
                : t("landing.startCheckup")}
            </Button>

            {!isDoctor && (
              <div className="flex justify-center items-center p-10">
                <a
                  href="#How"
                  className="animate-bounce"
                  title={t("landing.scrollNext")}
                >
                  <svg
                    className="w-10 h-10 text-gray-500 border rounded-full p-1"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {!isDoctor && (
        <>
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
              <h2 className="text-4xl font-bold text-center mb-4">
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
              <h2 className="text-4xl font-bold text-center mb-4">
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

          {/* Testimonials */}
          <section className="py-20 px-4 bg-background">
            <div
              ref={testimonialsRef}
              className={`container mx-auto transition-all duration-700 ease-out delay-300 ${
                testimonialsVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <h2 className="text-4xl font-bold text-center mb-4">
                {t("landing.testimonialsTitle")}
              </h2>

              <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                {t("landing.testimonialsSubtitle")}
              </p>

              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <div className="WOW bg-card p-6 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200">
                  <div
                    className={`flex gap-1 mb-4 ${
                      isArabic ? "justify-end" : "justify-start"
                    }`}
                  >
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-primary text-primary"
                      />
                    ))}
                  </div>

                  <p
                    className={`text-muted-foreground mb-4 ${
                      isArabic ? "text-right" : "text-left"
                    }`}
                  >
                    {t("landing.testimonial1Text")}
                  </p>

                  <div
                    className={`flex items-center gap-3 ${
                      isArabic ? "flex-row-reverse text-right" : "text-left"
                    }`}
                  >
                    <img
                      src="../../public/person.png"
                      className="w-10 h-10 bg-accent rounded-full"
                      alt="Doctor"
                    />

                    <div>
                      <p className="font-semibold">
                        {t("landing.testimonial1Name")}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {t("landing.testimonial1Role")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="WOW bg-card p-6 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200">
                  <div
                    className={`flex gap-1 mb-4 ${
                      isArabic ? "justify-end" : "justify-start"
                    }`}
                  >
                    {[...Array(4)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-primary text-primary"
                      />
                    ))}
                    <Star className="h-5 w-5 text-primary" />
                  </div>

                  <p
                    className={`text-muted-foreground mb-4 ${
                      isArabic ? "text-right" : "text-left"
                    }`}
                  >
                    {t("landing.testimonial2Text")}
                  </p>

                  <div
                    className={`flex items-center gap-3 ${
                      isArabic ? "flex-row-reverse text-right" : "text-left"
                    }`}
                  >
                    <img
                      src="../../public/person2.png"
                      className="w-10 h-10 bg-accent rounded-full"
                      alt="Patient"
                    />

                    <div>
                      <p className="font-semibold">
                        {t("landing.testimonial2Name")}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {t("landing.testimonial2Role")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 px-4 bg-gradient-to-br from-accent/30 to-primary/10">
            <div
              ref={ctaRef}
              className={`container mx-auto text-center transition-all duration-700 ease-out delay-300 ${
                ctaVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <h2 className="text-4xl font-bold mb-4">
                {t("landing.ctaTitle")}
              </h2>

              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                {t("landing.ctaSubtitle")}
              </p>

              <Button
                size="lg"
                className="WOW text-lg px-8"
                onClick={handleStartCheckup}
                disabled={isLoading}
              >
                {t("landing.ctaButton")}
              </Button>
            </div>
          </section>
        </>
      )}

      <Footer />
    </div>
  );
};

export default LandingPage;