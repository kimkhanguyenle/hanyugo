import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import ChineseSeal from "./ChineseSeal";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { t } = useTranslation();
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-silk-paper text-ink-charcoal flex flex-col font-sans">
      <Sidebar />
      <MobileNav />

      {/* Top Header Bar */}
      <header className="fixed top-0 z-30 w-full border-b border-outline-variant/40 bg-silk-paper/85 backdrop-blur-md md:pl-64">
        <div className="flex items-center justify-between px-5 py-3.5 md:px-8">
          {/* Mobile Logo */}
          <NavLink to="/" className="flex items-center gap-2 md:hidden">
            <ChineseSeal text="汉" size="sm" variant="solid" />
            <span className="font-display text-lg font-black text-cinnabar">HanyuGo</span>
          </NavLink>

          {/* Desktop Scholar Status Motto */}
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-ink-gray">
            <span className="inline-block h-2 w-2 rounded-full bg-jade animate-pulse" />
            <span>Today's Cultivation: <strong className="text-cinnabar font-hanzi">循序渐进</strong> (Step by step)</span>
          </div>

          {/* Controls & Account */}
          <div className="flex items-center gap-3.5">
            {!loading && (
              <div className="flex items-center gap-3">
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-jade text-silk-pure font-hanzi font-bold text-xs shadow-xs">
                        {(user.display_name ?? user.email)[0].toUpperCase()}
                      </div>
                      <span className="hidden text-xs font-bold text-ink-charcoal sm:inline">
                        {user.display_name ?? user.email.split("@")[0]}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="rounded-lg border border-outline-variant/60 bg-silk-pure/80 px-2.5 py-1 text-xs font-bold text-cinnabar hover:bg-cinnabar hover:text-silk-pure transition-all"
                    >
                      {t("nav.logout")}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <NavLink
                      to="/login"
                      className="text-xs font-bold text-ink-charcoal hover:text-cinnabar px-2 py-1"
                    >
                      {t("nav.login")}
                    </NavLink>
                    <NavLink
                      to="/register"
                      className="rounded-full bg-cinnabar px-3.5 py-1.5 text-xs font-bold text-silk-pure shadow-seal hover:bg-cinnabar-hover hover:scale-105 active:scale-95 transition-all"
                    >
                      {t("nav.register")}
                    </NavLink>
                  </div>
                )}
              </div>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 pb-24 pt-20 md:pb-12 md:pl-72 md:pr-10">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
