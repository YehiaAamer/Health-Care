import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Beaker,
  Calendar,
  FileText,
  Settings,
  HelpCircle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Home,
  ShieldCheck,
  ScrollText,
  PhoneCall,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/shared/BrandLogo";

export const DESKTOP_HEADER_HEIGHT = 0;
export const DESKTOP_SIDEBAR_WIDTH = 260;
export const DESKTOP_SIDEBAR_COLLAPSED_WIDTH = 80;

interface PatientSidebarProps {
  className?: string;
  user?: any;
  isArabic?: boolean;
  predictionsLength?: number;
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  isDesktopSidebarCollapsed?: boolean;
  setIsDesktopSidebarCollapsed?: React.Dispatch<React.SetStateAction<boolean>>;
  handleLogout?: () => Promise<void>;
}

type Theme = "light" | "dark";

export default function PatientSidebar({
  className,
  user: passedUser,
  isArabic,
  isSidebarOpen,
  setIsSidebarOpen,
  isDesktopSidebarCollapsed,
  setIsDesktopSidebarCollapsed,
  handleLogout,
}: PatientSidebarProps) {
  const { t, i18n } = useTranslation();
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();

  const user = passedUser || authUser;
  const isRTL = typeof isArabic === "boolean" ? isArabic : i18n.language === "ar";

  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  const isDark = theme === "dark";

  const mobileOpen =
    typeof isSidebarOpen === "boolean" ? isSidebarOpen : internalMobileOpen;

  const setMobileOpen = setIsSidebarOpen || setInternalMobileOpen;

  const collapsed =
    typeof isDesktopSidebarCollapsed === "boolean"
      ? isDesktopSidebarCollapsed
      : internalCollapsed;

  const setCollapsed = setIsDesktopSidebarCollapsed || setInternalCollapsed;

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setTheme("dark");
      return;
    }

    document.documentElement.classList.remove("dark");
    setTheme("light");
  }, []);

  useEffect(() => {
    const openSidebar = () => {
      setMobileOpen(true);
    };

    window.addEventListener("openPatientSidebar", openSidebar);

    return () => {
      window.removeEventListener("openPatientSidebar", openSidebar);
    };
  }, [setMobileOpen]);

  const closeMobileSidebar = () => {
    setMobileOpen(false);
    setAccountMenuOpen(false);
  };

  const toggleCollapse = () => {
    setCollapsed((prev) => !prev);
    setAccountMenuOpen(false);
  };

  const handleToggleTheme = () => {
    const nextTheme: Theme = isDark ? "light" : "dark";

    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleGoHome = () => {
    closeMobileSidebar();
    navigate("/home");
  };

  const handleGoToProfile = () => {
    closeMobileSidebar();
    navigate("/edit-profile");
  };

  const handlePatientLogout = async () => {
    if (handleLogout) {
      await handleLogout();
    } else {
      await logout();
    }

    closeMobileSidebar();
    navigate("/auth?tab=login");
  };

  const patientName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.username ||
    user?.email ||
    t("dashboard.patient", "Patient");

  const navItems = [
    {
      icon: LayoutDashboard,
      label: t("dashboard.title"),
      path: "/dashboard",
    },
    {
      icon: Beaker,
      label: t("dashboard.newCheckup"),
      path: "/diagnosis",
    },
    {
      icon: FileText,
      label: t("dashboard.previousReports"),
      path: "/past-reports",
    },
    {
      icon: Calendar,
      label: t("dashboard.bookConsultation"),
      path: "/consultations",
    },
    {
      icon: Settings,
      label: t("dashboard.settings"),
      path: "/edit-profile",
    },
    {
      icon: HelpCircle,
      label: t("dashboard.help"),
      path: "/help",
    },
    {
      icon: ShieldCheck,
      label: t("footer.privacy"),
      path: "/privacy",
    },
    {
      icon: ScrollText,
      label: t("footer.terms"),
      path: "/terms",
    },
    {
      icon: PhoneCall,
      label: t("footer.contact"),
      path: "/contact",
    },
  ];

  const isCompact = collapsed;

  const sidebarContent = (forceOpen = false) => (
    <>
      <div
        className={cn(
          "flex min-h-[80px] items-center px-4",
          isCompact && !forceOpen ? "justify-center" : "justify-between"
        )}
      >
        {(!isCompact || forceOpen) && (
          <div className="min-w-0 overflow-hidden">
            <BrandLogo className="max-w-full overflow-hidden" />
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={forceOpen ? closeMobileSidebar : toggleCollapse}
          className="shrink-0 text-primary hover:bg-primary/10 hover:text-primary"
          aria-label={
            forceOpen
              ? "Close sidebar"
              : isCompact
              ? "Open sidebar"
              : "Collapse sidebar"
          }
        >
          {forceOpen ? (
            <X className="h-5 w-5" />
          ) : isCompact ? (
            <Menu className="h-5 w-5" />
          ) : isRTL ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={handleToggleTheme}
          title={isDark ? "Light mode" : "Dark mode"}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-primary/10 hover:text-primary",
            isCompact && !forceOpen && "justify-center px-0"
          )}
        >
          {isDark ? (
            <Sun className="h-5 w-5 shrink-0 text-primary" />
          ) : (
            <Moon className="h-5 w-5 shrink-0 text-primary" />
          )}

          {(!isCompact || forceOpen) && (
            <span className="truncate">
              {isDark
                ? t("theme.light", "Light Mode")
                : t("theme.dark", "Dark Mode")}
            </span>
          )}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4 pt-1">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              onClick={forceOpen ? closeMobileSidebar : undefined}
              title={isCompact && !forceOpen ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isCompact && !forceOpen && "justify-center px-0"
                )
              }
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isCompact && !forceOpen && "mx-auto"
                )}
              />

              {(!isCompact || forceOpen) && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="relative mt-auto border-t border-border p-4">
        {accountMenuOpen && (
          <div
            className={cn(
              "absolute bottom-[78px] z-20 rounded-2xl border border-border bg-card p-1 text-card-foreground shadow-xl",
              isCompact && !forceOpen ? "left-3 right-3" : "left-4 right-4"
            )}
          >
            <button
              type="button"
              onClick={handleGoHome}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Home className="h-4 w-4 shrink-0" />
              {(!isCompact || forceOpen) && (
                <span>{t("dashboard.home", "Home")}</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleGoToProfile}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <User className="h-4 w-4 shrink-0" />
              {(!isCompact || forceOpen) && (
                <span>{t("dashboard.profile", "Profile")}</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleToggleTheme}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-primary"
            >
              {isDark ? (
                <Sun className="h-4 w-4 shrink-0" />
              ) : (
                <Moon className="h-4 w-4 shrink-0" />
              )}

              {(!isCompact || forceOpen) && (
                <span>
                  {isDark
                    ? t("theme.light", "Light Mode")
                    : t("theme.dark", "Dark Mode")}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handlePatientLogout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-destructive"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {(!isCompact || forceOpen) && (
                <span>{t("dashboard.logout")}</span>
              )}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setAccountMenuOpen((prev) => !prev)}
          className={cn(
            "group flex w-full items-center gap-3 rounded-xl transition-colors hover:bg-primary/10",
            isCompact && !forceOpen ? "justify-center px-0 py-2" : "p-2"
          )}
        >
          <User
            className={cn(
              "h-5 w-5 shrink-0 text-primary",
              isCompact && !forceOpen && "mx-auto"
            )}
          />

          {(!isCompact || forceOpen) && (
            <div className="min-w-0 flex-1 text-start">
              <p className="truncate text-sm font-medium text-foreground">
                {patientName}
              </p>

              {user?.email && (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setMobileOpen(true)}
        className={cn(
          "fixed top-5 z-40 h-10 w-10 rounded-xl border-0 bg-transparent text-primary shadow-none hover:bg-primary/10 hover:text-primary xl:hidden",
          isRTL ? "right-4" : "left-4"
        )}
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-black/40 xl:hidden"
          onClick={closeMobileSidebar}
          aria-label="Close sidebar overlay"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 z-30 hidden h-screen shrink-0 flex-col overflow-hidden border-x border-border bg-background text-foreground transition-all duration-300 xl:flex",
          isRTL ? "right-0" : "left-0",
          collapsed ? "w-20" : "w-64",
          className
        )}
        style={{
          top: `${DESKTOP_HEADER_HEIGHT}px`,
          height: `calc(100vh - ${DESKTOP_HEADER_HEIGHT}px)`,
        }}
      >
        {sidebarContent(false)}
      </aside>

      <aside
        className={cn(
          "fixed inset-y-0 z-[60] flex h-screen w-72 flex-col overflow-hidden border-x border-border bg-background text-foreground shadow-2xl transition-transform duration-300 xl:hidden",
          isRTL ? "right-0" : "left-0",
          mobileOpen
            ? "translate-x-0"
            : isRTL
            ? "translate-x-full"
            : "-translate-x-full"
        )}
      >
        {sidebarContent(true)}
      </aside>
    </>
  );
}