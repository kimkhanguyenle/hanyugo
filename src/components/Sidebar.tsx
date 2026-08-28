import type { CSSProperties } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NAV_ITEMS } from "./navItems";
import ChineseSeal from "./ChineseSeal";
import { AuspiciousClouds } from "./AuspiciousPattern";

export default function Sidebar() {
  const { t } = useTranslation();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col justify-between border-r border-outline-variant/50 bg-silk-paper/85 p-5 pt-8 backdrop-blur-xl md:flex shadow-parchment">
      <div>
        {/* Branding Header */}
        <div className="mb-8 flex items-center gap-3 px-2">
          <ChineseSeal text="汉" size="lg" variant="solid" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-xl font-black tracking-wide text-cinnabar">
                HanyuGo
              </span>
              <span className="font-hanzi text-xs font-bold text-amber-gold">汉羽</span>
            </div>
            <p className="text-[11px] font-medium text-ink-light leading-tight mt-0.5">
              {t("nav.tagline")}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {NAV_ITEMS.map(({ to, icon, labelKey, sealText, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-cinnabar to-cinnabar-hover text-silk-pure shadow-seal translate-x-1"
                    : "text-ink-charcoal hover:bg-silk-parchment/80 hover:text-cinnabar"
                }`
              }
              style={({ isActive }) => ({ "--icon-fill": isActive ? 1 : 0 }) as CSSProperties}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined !text-[20px] transition-transform group-hover:scale-110">
                      {icon}
                    </span>
                    <span>{t(labelKey)}</span>
                  </div>
                  <span
                    className={`font-hanzi text-xs px-1.5 py-0.5 rounded ${
                      isActive ? "bg-cinnabar-dark text-silk-pure" : "bg-silk-dim text-ink-light"
                    }`}
                  >
                    {sealText}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Cultural Accent */}
      <div className="relative rounded-xl border border-amber-gold/30 bg-amber-light/40 p-3.5 text-center overflow-hidden">
        <AuspiciousClouds className="absolute -right-2 -bottom-2 w-16 h-10 text-amber-gold/30" />
        <p className="font-hanzi text-xs font-bold text-amber-warm tracking-widest">
          学海无涯 · 勤者先行
        </p>
        <p className="text-[10px] text-ink-light mt-0.5">
          Infinite ocean of knowledge
        </p>
      </div>
    </aside>
  );
}
