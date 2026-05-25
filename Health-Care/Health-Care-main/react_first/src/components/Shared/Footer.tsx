import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";

const Footer = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const isDoctor = user?.role === "doctor";
  const isArabic = i18n.language === "ar" || i18n.language?.startsWith("ar");

  return (
    <footer className="mt-auto w-full border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center gap-4 text-sm text-muted-foreground md:flex-row md:gap-8">
          {isDoctor ? (
            <>
              <Link
                to="/doctor-dashboard/help"
                className="transition-colors hover:text-primary"
              >
                {t("doctorDashboard.sidebar.help")}
              </Link>

              <Link
                to="/doctor-dashboard/privacy"
                className="transition-colors hover:text-primary"
              >
                {isArabic ? "خصوصية البيانات" : "Data Privacy"}
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/privacy"
                className="transition-colors hover:text-primary"
              >
                {t("footer.privacy")}
              </Link>

              <Link
                to="/terms"
                className="transition-colors hover:text-primary"
              >
                {t("footer.terms")}
              </Link>

              <Link
                to="/contact"
                className="transition-colors hover:text-primary"
              >
                {t("footer.contact")}
              </Link>

              <Link
                to="/help"
                className="transition-colors hover:text-primary"
              >
                {t("helpNav")}
              </Link>
            </>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;