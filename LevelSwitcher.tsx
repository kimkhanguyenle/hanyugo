import { useTranslation } from "react-i18next";

export const LEVELS = [1, 2, 3, 4, 5, 6, 7] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_STORAGE_KEY = "hanyugo-level";

export function levelLabel(level: number, t: (key: string, opts?: Record<string, unknown>) => string): string {
  return level === 7 ? t("levels.advanced") : t("levels.hsk", { level });
}

const LEVEL_COLORS: Record<number, { text: string; bg: string; border: string; seal: string }> = {
  1: { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-300", seal: "初" },
  2: { text: "text-teal-700", bg: "bg-teal-50", border: "border-teal-300", seal: "阶" },
  3: { text: "text-sky-700", bg: "bg-sky-50", border: "border-sky-300", seal: "进" },
  4: { text: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-300", seal: "修" },
  5: { text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-300", seal: "通" },
  6: { text: "text-amber-800", bg: "bg-amber-50", border: "border-amber-400", seal: "精" },
  7: { text: "text-cinnabar", bg: "bg-red-50", border: "border-cinnabar", seal: "宗" },
};

export default function LevelSwitcher({
  value,
  onChange,
}: {
  value: number;
  onChange: (level: number) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="mb-8 flex flex-wrap justify-center gap-2 p-1.5 rounded-2xl bg-silk-parchment/60 border border-outline-variant/50 backdrop-blur-md max-w-2xl mx-auto shadow-xs">
      {LEVELS.map((level) => {
        const isSelected = value === level;
        const meta = LEVEL_COLORS[level];
        return (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            className={`group relative flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              isSelected
                ? "bg-cinnabar text-silk-pure shadow-seal scale-105"
                : "text-ink-gray hover:text-ink-charcoal hover:bg-silk-pure/80"
            }`}
          >
            <span
              className={`font-hanzi text-[11px] px-1 py-0.2 rounded ${
                isSelected ? "bg-cinnabar-dark text-silk-pure" : "bg-silk-dim text-ink-light"
              }`}
            >
              {meta.seal}
            </span>
            <span>{levelLabel(level, t)}</span>
          </button>
        );
      })}
    </div>
  );
}
