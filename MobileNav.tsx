import type { CSSProperties } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NAV_ITEMS } from "./navItems";

export default function MobileNav() {
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 z-40 flex w-full items-center justify-around border-t border-outline-variant/60 bg-silk-paper/95 py-2 px-1 backdrop-blur-xl md:hidden shadow-lg">
      {NAV_ITEMS.map(({ to, icon, labelKey, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
              isActive
                ? "text-cinnabar font-black scale-105"
                : "text-ink-light hover:text-ink-charcoal font-semibold"
            }`
          }
          style={({ isActive }) => ({ "--icon-fill": isActive ? 1 : 0 }) as CSSProperties}
        >
          <span className="material-symbols-outlined !text-[22px]">{icon}</span>
          <span className="text-[10px]">{t(labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
