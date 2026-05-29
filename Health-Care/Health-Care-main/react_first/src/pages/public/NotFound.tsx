import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import ChatBot from "@/components/ChatBot";
import { Button } from "@/components/ui/button";
import { Home, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div
      className="flex min-h-screen flex-col bg-background text-foreground"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Header variant="dashboard" />

      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="text-center">
          <div className="mb-8 inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <AlertCircle className="h-12 w-12" />
          </div>

          <h1 className="mb-4 text-4xl font-black tracking-tight md:text-5xl">
            {isArabic ? "٤٠٤" : "404"}
          </h1>

          <h2 className="mb-3 text-2xl font-bold">
            {isArabic ? "الصفحة غير موجودة" : "Page Not Found"}
          </h2>

          <p className="mb-10 max-w-md mx-auto text-muted-foreground">
            {isArabic
              ? "عذراً، الصفحة التي تحاول الوصول إليها غير موجودة أو تم نقلها."
              : "Sorry, the page you are looking for doesn't exist or has been moved."}
          </p>

          <Link to="/">
            <Button className="h-12 rounded-2xl px-8 font-bold gap-2">
              <Home className="h-5 w-5" />
              {isArabic ? "العودة للرئيسية" : "Return to Home"}
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
      <ChatBot />
    </div>
  );
};

export default NotFound;
