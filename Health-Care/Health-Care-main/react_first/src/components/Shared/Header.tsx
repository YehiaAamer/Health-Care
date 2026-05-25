import { NavLink, useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell, User, Settings, LogOut, Globe, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import BrandLogo from "@/components/shared/BrandLogo";

interface HeaderProps {
  variant?: "default" | "auth" | "dashboard";
}

const Header = ({ variant = "default" }: HeaderProps) => {
  const { user, logout, isLoading } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isArabic = i18n.language.startsWith("ar");
  const isDoctor = user?.role === "doctor";
  const isPatient = user?.role === "patient" || !user?.role;

  const shouldHideHeader = isPatient && location.pathname === "/dashboard";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (shouldHideHeader) {
    return null;
  }

  const handleLogout = async () => {
    setMenuOpen(false);
    setMobileNavOpen(false);

    try {
      await logout();
    } finally {
      navigate("/auth?tab=login");
    }
  };

  const handleToggleLanguage = async () => {
    const newLang = isArabic ? "en" : "ar";
    await i18n.changeLanguage(newLang);
    setMenuOpen(false);
  };

  const closeMobileNav = () => setMobileNavOpen(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "relative whitespace-nowrap transition-colors duration-200",
      "after:absolute after:start-0 after:-bottom-1.5 after:h-[2px] after:rounded-full after:bg-primary after:transition-all after:duration-200",
      isActive
        ? "text-primary font-medium after:w-full"
        : "text-foreground/80 hover:text-primary after:w-0 hover:after:w-full",
    ].join(" ");

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "block rounded-xl px-4 py-3 text-sm transition-colors duration-200",
      isActive
        ? "bg-primary/10 text-primary font-medium"
        : "text-foreground hover:bg-accent hover:text-primary",
      isArabic ? "text-right" : "text-left",
    ].join(" ");

  const renderMainLinks = (mobile = false) => {
    const cls = mobile ? mobileNavLinkClass : navLinkClass;

    if (variant === "auth") {
      return (
        <NavLink
          to="/home"
          className={cls}
          onClick={mobile ? closeMobileNav : undefined}
        >
          {t("home")}
        </NavLink>
      );
    }

    if (user && isDoctor) {
      return (
        <>
          <NavLink
            to="/home"
            className={cls}
            onClick={mobile ? closeMobileNav : undefined}
          >
            {t("home")}
          </NavLink>

          <NavLink
            to="/doctor-dashboard"
            className={cls}
            onClick={mobile ? closeMobileNav : undefined}
            end
          >
            {t("doctorDashboard.sidebar.dashboard")}
          </NavLink>
        </>
      );
    }

    if (user && isPatient) {
      return (
        <>
          <NavLink
            to="/home"
            className={cls}
            onClick={mobile ? closeMobileNav : undefined}
          >
            {t("home")}
          </NavLink>

          <NavLink
            to="/dashboard"
            className={cls}
            onClick={mobile ? closeMobileNav : undefined}
          >
            {t("dashboard.title")}
          </NavLink>

          <NavLink
            to="/diagnosis"
            className={cls}
            onClick={mobile ? closeMobileNav : undefined}
          >
            {t("dashboard.newCheckup")}
          </NavLink>

          <NavLink
            to="/past-reports"
            className={cls}
            onClick={mobile ? closeMobileNav : undefined}
          >
            {t("reports")}
          </NavLink>

          <NavLink
            to="/consultations"
            className={cls}
            onClick={mobile ? closeMobileNav : undefined}
          >
            {t("consultations")}
          </NavLink>
        </>
      );
    }

    return (
      <>
        <NavLink
          to="/home"
          className={cls}
          onClick={mobile ? closeMobileNav : undefined}
        >
          {t("home")}
        </NavLink>

        <NavLink
          to="/help"
          className={cls}
          onClick={mobile ? closeMobileNav : undefined}
        >
          {t("helpNav")}
        </NavLink>

        <NavLink
          to="/contact"
          className={cls}
          onClick={mobile ? closeMobileNav : undefined}
        >
          {t("contact")}
        </NavLink>
      </>
    );
  };

  const handleSettingsClick = () => {
    setMenuOpen(false);

    if (isDoctor) {
      navigate("/doctor-dashboard/profile");
      return;
    }

    navigate("/edit-profile");
  };

  const renderUserMenu = () => (
    <div className="relative" ref={menuRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setMenuOpen((prev) => !prev)}
        className="text-primary hover:bg-primary/10 hover:text-primary"
        aria-label="Open account menu"
      >
        {user?.profile_picture ? (
          <img
            src={user.profile_picture}
            alt="Profile"
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <User className="h-5 w-5 text-primary" />
        )}
      </Button>

      {menuOpen && (
        <div
          className={`absolute top-full z-[60] mt-2 w-56 min-w-[14rem] overflow-hidden rounded-xl border bg-background shadow-lg ${
            isArabic ? "left-0 origin-top-left" : "right-0 origin-top-right"
          }`}
          dir={isArabic ? "rtl" : "ltr"}
        >
          <div
            className={`border-b bg-muted/30 px-4 py-3 ${
              isArabic ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`flex items-center gap-3 ${
                isArabic ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt="Profile"
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {user?.first_name
                    ? `${user.first_name} ${user?.last_name || ""}`
                    : t("myAccount")}
                </p>

                <p className="truncate text-xs text-muted-foreground">
                  {user?.email || ""}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSettingsClick}
            className={`flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-accent hover:text-primary ${
              isArabic ? "flex-row-reverse text-right" : "text-left"
            }`}
          >
            <Settings className="h-4 w-4 text-primary" />
            {t("settings")}
          </button>

          <button
            onClick={handleToggleLanguage}
            className={`flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-accent hover:text-primary ${
              isArabic ? "flex-row-reverse text-right" : "text-left"
            }`}
          >
            <Globe className="h-4 w-4 text-primary" />
            {isArabic ? "English" : "العربية"}
          </button>

          <button
            onClick={handleLogout}
            className={`flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-accent hover:text-destructive ${
              isArabic ? "flex-row-reverse text-right" : "text-left"
            }`}
          >
            <LogOut className="h-4 w-4" />
            {t("logout")}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="h-[72px] w-full max-w-none px-4 sm:px-5 lg:px-6">
          <div className="flex h-full w-full min-w-0 items-center justify-between gap-4 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
            <div className="min-w-0 md:justify-self-start">
              <BrandLogo />
            </div>

            <nav
              className={`hidden min-w-0 items-center justify-center gap-6 md:flex md:justify-self-center ${
                isArabic ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {renderMainLinks(false)}
            </nav>

            <div className="flex min-w-0 shrink-0 items-center gap-2 md:justify-self-end">
              <Button
                variant="ghost"
                size="icon"
                className="text-primary hover:bg-primary/10 hover:text-primary md:hidden"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleLanguage}
                className="text-primary hover:bg-primary/10 hover:text-primary"
              >
                <Globe className="h-5 w-5" />
              </Button>

              {user ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary hover:bg-primary/10 hover:text-primary"
                  >
                    <Bell className="h-5 w-5" />
                  </Button>

                  {renderUserMenu()}
                </>
              ) : (
                !isLoading && (
                  <div className="hidden items-center gap-2 md:flex">
                    <Link to="/login">
                      <Button variant="ghost">{t("login")}</Button>
                    </Link>

                    <Link to="/signup">
                      <Button>{t("getStarted")}</Button>
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeMobileNav}
          />

          <div
            dir={isArabic ? "rtl" : "ltr"}
            className={`absolute top-0 h-full w-[280px] border-l border-r bg-background shadow-2xl transition-all duration-300 ${
              isArabic ? "left-0" : "right-0"
            }`}
          >
            <div className="flex items-center justify-between border-b px-4 py-4">
              <BrandLogo />

              <Button
                variant="ghost"
                size="icon"
                onClick={closeMobileNav}
                aria-label="Close navigation menu"
                className="text-primary hover:bg-primary/10 hover:text-primary"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-2 px-3 py-4">
              {renderMainLinks(true)}

              {!user && !isLoading && (
                <div className="space-y-2 pt-3">
                  <Link to="/login" onClick={closeMobileNav}>
                    <Button variant="ghost" className="w-full">
                      {t("login")}
                    </Button>
                  </Link>

                  <Link to="/signup" onClick={closeMobileNav}>
                    <Button className="w-full">{t("getStarted")}</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;