import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ApiWord } from "@hanyugo/shared";
import { getWords } from "../api";
import LevelSwitcher, { LEVEL_STORAGE_KEY } from "../components/LevelSwitcher";
import ChineseSeal from "../components/ChineseSeal";

type LoadState = "loading" | "ready" | "error";

function initialLevel(): number {
  const stored = Number(localStorage.getItem(LEVEL_STORAGE_KEY));
  return stored >= 1 && stored <= 7 ? stored : 1;
}

export default function Characters() {
  const { t } = useTranslation();
  const [level, setLevel] = useState<number>(initialLevel);
  const [words, setWords] = useState<ApiWord[]>([]);
  const [search, setSearch] = useState("");
  const [state, setState] = useState<LoadState>("loading");

  function handleLevelChange(next: number) {
    setLevel(next);
    localStorage.setItem(LEVEL_STORAGE_KEY, String(next));
  }

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    getWords(level)
      .then((data) => {
        if (!cancelled) {
          setWords(data.words);
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

  const filtered = words.filter(w =>
    w.hanzi.includes(search) ||
    w.pinyin.toLowerCase().includes(search.toLowerCase()) ||
    w.meaning_en.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <div className="mb-6 text-center">
        <ChineseSeal text="字" size="lg" variant="solid" className="mb-3" />
        <h1 className="font-display text-3xl font-black text-ink-charcoal">
          {t("characters.title")}
        </h1>
        <p className="mt-1 text-xs text-ink-gray">{t("characters.subtitle")}</p>
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
          placeholder={t("characters.searchPlaceholder")}
          className="w-full rounded-full border border-outline-variant/60 bg-silk-pure/90 py-2.5 pl-10 pr-4 text-xs font-semibold text-ink-charcoal outline-none focus:border-cinnabar focus:ring-1 focus:ring-cinnabar shadow-xs"
        />
      </div>

      {state === "loading" && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-cinnabar border-t-transparent animate-spin" />
          <p className="text-xs text-ink-light">{t("characters.loading")}</p>
        </div>
      )}

      {state === "error" && (
        <p className="text-center text-xs font-bold text-cinnabar">{t("characters.error")}</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {filtered.map((word) => (
          <Link
            key={word.id}
            to={`/characters/${word.id}`}
            className="group parchment-card rounded-2xl p-4 text-center flex flex-col items-center justify-between transition-all duration-200 hover:-translate-y-1 hover:border-cinnabar/60"
          >
            <div className="mizige-bg flex h-16 w-16 items-center justify-center rounded-xl border border-cinnabar/20 shadow-xs mb-2 group-hover:border-cinnabar">
              <span className="font-hanzi text-3xl font-black text-ink-charcoal group-hover:text-cinnabar transition-colors">
                {word.hanzi}
              </span>
            </div>

            <div className="w-full">
              <p className="font-mono text-xs font-bold text-cinnabar">{word.pinyin}</p>
              <p className="text-[11px] text-ink-light truncate mt-0.5">{word.meaning_en}</p>
            </div>

            <div className="mt-2 text-[10px] font-bold text-jade opacity-0 group-hover:opacity-100 transition-opacity">
              Write Strokes ✍️
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
