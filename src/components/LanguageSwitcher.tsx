import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../i18n";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  return (
    <div className="relative inline-flex items-center">
      <span className="sr-only">{t("language.label")}</span>
      <div className="flex items-center gap-1.5 rounded-full border border-amber-gold/40 bg-silk-pure/80 px-2.5 py-1 text-xs shadow-xs backdrop-blur-sm">
        <span className="material-symbols-outlined !text-[16px] text-amber-gold">translate</span>
        <select
          value={i18n.resolvedLanguage}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          className="bg-transparent text-xs font-semibold text-ink-charcoal outline-none cursor-pointer pr-1"
          aria-label={t("language.label")}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
