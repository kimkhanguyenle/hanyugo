import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { LessonSummary } from "@hanyugo/shared";
import { getLessons } from "../api";
import LevelSwitcher, { LEVEL_STORAGE_KEY, levelLabel } from "../components/LevelSwitcher";
import ChineseSeal from "../components/ChineseSeal";
import { AuspiciousClouds, ChineseLatticeDivider } from "../components/AuspiciousPattern";

type LoadState = "loading" | "ready" | "error";

function initialLevel(): number {
  const stored = Number(localStorage.getItem(LEVEL_STORAGE_KEY));
  return stored >= 1 && stored <= 7 ? stored : 1;
}

export default function Library() {
  const { t } = useTranslation();
  const [level, setLevel] = useState<number>(initialLevel);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [search, setSearch] = useState("");
  const [state, setState] = useState<LoadState>("loading");

  function handleLevelChange(next: number) {
    setLevel(next);
    localStorage.setItem(LEVEL_STORAGE_KEY, String(next));
  }

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    getLessons(level)
      .then((data) => {
        if (!cancelled) {
          setLessons(data.lessons);
          setState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [level]);

  const filtered = lessons.filter(l =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    String(l.order_index).includes(search)
  );

  return (
    <div className="relative">
      <div className="mb-6 text-center">
        <ChineseSeal text="典" size="lg" variant="solid" className="mb-3" />
        <h1 className="font-display text-3xl font-black text-ink-charcoal">
          {t("library.title")}
        </h1>
        <p className="mt-1 text-xs text-ink-gray">
          {t("library.subtitle", { level: levelLabel(level, t) })}
        </p>
      </div>

      <LevelSwitcher value={level} onChange={handleLevelChange} />

      <div className="mb-8 max-w-md mx-auto relative">
        <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-ink-light !text-[20px]">
          search
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("library.searchPlaceholder")}
          className="w-full rounded-full border border-outline-variant/60 bg-silk-pure/90 py-2.5 pl-10 pr-4 text-xs font-semibold text-ink-charcoal outline-none focus:border-cinnabar focus:ring-1 focus:ring-cinnabar shadow-xs"
        />
      </div>

      {state === "loading" && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-cinnabar border-t-transparent animate-spin" />
          <p className="text-xs text-ink-light">{t("library.loading")}</p>
        </div>
      )}

      {state === "error" && (
        <p className="text-center text-xs font-bold text-cinnabar">{t("library.apiError")}</p>
      )}

      {state === "ready" && filtered.length === 0 && (
        <p className="text-center text-xs text-ink-light py-8">{t("library.noLessons")}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((lesson) => (
          <Link
            key={lesson.id}
            to={`/lesson/${lesson.id}`}
            className="group parchment-card rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
          >
            <AuspiciousClouds className="absolute right-0 bottom-0 w-20 h-10 text-cinnabar/5 group-hover:text-cinnabar/10 transition-colors" />
            
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-jade-light px-2.5 py-0.5 text-[11px] font-bold text-jade border border-jade/20">
                <span className="font-hanzi">第{lesson.order_index}课</span>
              </span>
              <span className="text-[11px] font-bold text-amber-warm">
                {levelLabel(lesson.hsk_level, t)}
              </span>
            </div>

            <h2 className="font-display text-lg font-bold text-ink-charcoal group-hover:text-cinnabar transition-colors line-clamp-1">
              {lesson.title}
            </h2>

            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-ink-light border-t border-outline-variant/30 pt-3">
              <span>Explore Lesson →</span>
              <span className="material-symbols-outlined !text-[18px] text-cinnabar transform group-hover:translate-x-1 transition-transform">
                menu_book
              </span>
            </div>
          </Link>
        ))}
      </div>

      <ChineseLatticeDivider />
    </div>
  );
}
