import { useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { messagesApi } from "@/api/messages";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  MessageSquare,
  Settings,
  HelpCircle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  LogOut,
  User,
  Home,
  Clock3,
  Globe,
  ShieldCheck,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/shared/BrandLogo";

interface DoctorSidebarProps {
  className?: string;
}

type Theme = "light" | "dark";

export default function DoctorSidebar({ className }: DoctorSidebarProps) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isRTL = i18n.language === "ar";

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [messagesBadge, setMessagesBadge] = useState(0);

  const isDark = theme === "dark";
  const isCompact = collapsed;

  const fetchMessagesBadge = useCallback(async () => {
    try {
      const threads = await messagesApi.getThreads();

      const unreadTotal = Array.isArray(threads)
        ? threads.reduce(
            (total, thread) => total + Number(thread.unread_count || 0),
            0
          )
        : 0;

      setMessagesBadge(unreadTotal);
    } catch (error) {
      console.error("Failed to fetch messages badge", error);
      setMessagesBadge(0);
    }
  }, []);

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
    fetchMessagesBadge();

    const interval = window.setInterval(fetchMessagesBadge, 15000);

    const refreshBadge = () => {
      fetchMessagesBadge();
    };

    window.addEventListener("refreshDoctorMessagesBadge", refreshBadge);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("refreshDoctorMessagesBadge", refreshBadge);
    };
  }, [fetchMessagesBadge]);

  useEffect(() => {
    const openSidebar = () => {
      setMobileOpen(true);
    };

    window.addEventListener("openDoctorSidebar", openSidebar);

    return () => {
      window.removeEventListener("openDoctorSidebar", openSidebar);
    };
  }, []);

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

  const handleLogout = () => {
    logout();
    closeMobileSidebar();
    navigate("/auth?tab=login");
  };

  const handleGoToProfile = () => {
    closeMobileSidebar();
    navigate("/doctor-dashboard/profile");
  };

  const handleToggleLanguage = async () => {
    const newLang = isRTL ? "en" : "ar";
    await i18n.changeLanguage(newLang);
    setAccountMenuOpen(false);
    closeMobileSidebar();
  };

  const doctorName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.username ||
    t("doctorDashboard.sidebar.doctor", "Doctor");

  const navItems = [
    {
      icon: LayoutDashboard,
      label: t("doctorDashboard.sidebar.dashboard", "Dashboard"),
      path: "/doctor-dashboard",
    },
    {
      icon: Users,
      label: t("doctorDashboard.sidebar.patients", "Patients"),
      path: "/doctor-dashboard/patients",
    },
    {
      icon: Calendar,
      label: t("doctorDashboard.sidebar.appointments", "Appointments"),
      path: "/doctor-dashboard/appointments",
    },
    {
      icon: FileText,
      label: t("doctorDashboard.sidebar.reports", "Reports"),
      path: "/doctor-dashboard/reports",
    },
    {
      icon: MessageSquare,
      label: t("doctorDashboard.sidebar.messages.title", "Messaging"),
      path: "/doctor-dashboard/messages",
      badge: messagesBadge,
    },
    {
      icon: Clock3,
      label: t("doctorDashboard.sidebar.recentActivity", "Recent Activity"),
      path: "/doctor-dashboard/activity",
    },
    {
      icon: Settings,
      label: t("doctorDashboard.sidebar.settings", "Settings"),
      path: "/doctor-dashboard/settings",
    },
    {
      icon: HelpCircle,
      label: t("doctorDashboard.sidebar.help", "Help"),
      path: "/doctor-dashboard/help",
    },
    {
      icon: ShieldCheck,
      label: t("doctorDashboard.sidebar.dataPrivacy", "Data Privacy"),
      path: "/doctor-dashboard/privacy",
    },
  ];

  const menuButtonClass =
    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary";

  const sidebarContent = (forceOpen = false) => (
    <>
      <div
        className={cn(
          "flex min-h-[96px] items-center border-b border-border px-4",
          isCompact && !forceOpen ? "justify-center" : "justify-between"
        )}
      >
        {(!isCompact || forceOpen) && (
          <div className="min-w-0 overflow-hidden">
            <BrandLogo className="max-w-full overflow-hidden" />

            <p className="mt-1.5 w-full translate-x-4 text-center text-sm font-semibold tracking-wide text-primary">
              {t("doctorDashboard.sidebar.doctorPortal", "Doctor Portal")}
            </p>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={forceOpen ? closeMobileSidebar : toggleCollapse}
          className="shrink-0 text-primary hover:bg-primary/10 hover:text-primary"
          aria-label={
            forceOpen
              ? t("doctorDashboard.sidebar.collapseSidebar", "Close sidebar")
              : isCompact
              ? t("doctorDashboard.sidebar.openSidebar", "Open sidebar")
              : t("doctorDashboard.sidebar.collapseSidebar", "Collapse sidebar")
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

      <div className="px-4 pb-3 pt-3">
        <button
          type="button"
          onClick={handleToggleTheme}
          title={isDark ? "Light Mode" : "Dark Mode"}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary",
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
              {isDark ? "Light Mode" : "Dark Mode"}
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
              end={item.path === "/doctor-dashboard"}
              onClick={forceOpen ? closeMobileSidebar : undefined}
              title={isCompact && !forceOpen ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                  isCompact && !forceOpen && "justify-center px-0"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-colors",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-primary",
                      isCompact && !forceOpen && "mx-auto"
                    )}
                  />

                  {(!isCompact || forceOpen) && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}

                  {Number(item.badge) > 0 && (!isCompact || forceOpen) && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        isActive
                          ? "bg-primary-foreground text-primary"
                          : "bg-primary text-primary-foreground"
                      )}
                    >
                      {Number(item.badge) > 99 ? "99+" : item.badge}
                    </span>
                  )}

                  {Number(item.badge) > 0 && isCompact && !forceOpen && (
                    <span
                      className={cn(
                        "absolute top-2 h-2.5 w-2.5 rounded-full",
                        isActive ? "bg-primary-foreground" : "bg-primary",
                        isRTL ? "left-2" : "right-2"
                      )}
                    />
                  )}
                </>
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
              className={menuButtonClass}
            >
              <Home className="h-4 w-4 shrink-0" />
              {(!isCompact || forceOpen) && (
                <span>{t("doctorDashboard.sidebar.home", "Home")}</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleGoToProfile}
              className={menuButtonClass}
            >
              <User className="h-4 w-4 shrink-0" />
              {(!isCompact || forceOpen) && (
                <span>{t("doctorDashboard.sidebar.profile", "Profile")}</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleToggleLanguage}
              className={menuButtonClass}
            >
              <Globe className="h-4 w-4 shrink-0" />
              {(!isCompact || forceOpen) && (
                <span>{isRTL ? "English" : "العربية"}</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleToggleTheme}
              className={menuButtonClass}
            >
              {isDark ? (
                <Sun className="h-4 w-4 shrink-0" />
              ) : (
                <Moon className="h-4 w-4 shrink-0" />
              )}

              {(!isCompact || forceOpen) && (
                <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className={menuButtonClass}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {(!isCompact || forceOpen) && (
                <span>{t("doctorDashboard.sidebar.logout", "Logout")}</span>
              )}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setAccountMenuOpen((prev) => !prev)}
          className={cn(
            "group flex w-full items-center gap-3 rounded-xl transition-colors hover:bg-primary/10 hover:text-primary",
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
              <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                {doctorName}
              </p>

              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-primary">
                <Stethoscope className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate">
                  {t(
                    "doctorDashboard.sidebar.specialistDoctor",
                    "Specialist Doctor"
                  )}
                </span>
              </div>
            </div>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={closeMobileSidebar}
          aria-label="Close sidebar overlay"
        />
      )}

      <aside
        className={cn(
          "hidden h-screen shrink-0 flex-col overflow-hidden border-x border-border bg-background text-foreground transition-all duration-300 md:flex",
          collapsed ? "w-20" : "w-64",
          className
        )}
      >
        {sidebarContent(false)}
      </aside>

      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex h-screen w-72 flex-col overflow-hidden border-x border-border bg-background text-foreground shadow-2xl transition-transform duration-300 md:hidden",
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