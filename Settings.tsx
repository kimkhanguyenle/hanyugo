import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import ChineseSeal from "../components/ChineseSeal";

export default function Settings() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <ChineseSeal text="室" size="lg" variant="solid" className="mb-3" />
        <h1 className="font-display text-3xl font-black text-ink-charcoal">
          {t("settings.title")}
        </h1>
      </div>

      {user && (
        <div className="parchment-card rounded-2xl p-6 border border-amber-gold/30 shadow-parchment">
          <h2 className="font-display text-base font-bold text-ink-charcoal flex items-center gap-2">
            <span className="material-symbols-outlined text-jade !text-[20px]">person</span>
            {t("settings.account")}
          </h2>
          <div className="mt-3 space-y-1">
            <p className="text-xs font-bold text-ink-charcoal">
              {user.display_name ?? t("settings.noDisplayName")}
            </p>
            <p className="text-xs text-ink-light">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 rounded-xl border border-outline-variant bg-silk-pure px-4 py-2 text-xs font-bold text-cinnabar hover:bg-cinnabar hover:text-silk-pure transition-all shadow-xs"
          >
            {t("nav.logout")}
          </button>
        </div>
      )}

      <div className="parchment-card rounded-2xl p-6 border border-amber-gold/30 shadow-parchment">
        <h2 className="font-display text-base font-bold text-ink-charcoal flex items-center gap-2">
          <span className="material-symbols-outlined text-jade !text-[20px]">translate</span>
          {t("settings.language")}
        </h2>
        <div className="mt-3">
          <LanguageSwitcher />
        </div>
      </div>

      <p className="text-center text-[11px] text-ink-light">
        {t("settings.moreComingSoon")}
      </p>
    </div>
  );
}
