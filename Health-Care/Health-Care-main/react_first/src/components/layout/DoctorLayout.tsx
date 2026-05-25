import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu } from "lucide-react";
import DoctorSidebar from "../doctor/DoctorSidebar";

export default function DoctorLayout() {
  const { i18n } = useTranslation();

  const isRTL = i18n.language === "ar";

  const openSidebar = () => {
    window.dispatchEvent(new Event("openDoctorSidebar"));
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="h-screen overflow-hidden bg-primary/0.01"
    >
      <div className="flex h-full min-w-0">
        <DoctorSidebar className="shrink-0" />

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-primary/[0.050]">
            <button
              type="button"
              onClick={openSidebar}
              className={`absolute top-4 z-30 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-none hover:bg-white hover:text-slate-500 md:hidden ${
                isRTL ? "right-4" : "left-4"
              }`}
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="w-full px-4 pb-6 pt-8 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}