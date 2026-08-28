import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { LessonDetail } from "@hanyugo/shared";
import { getLesson } from "../api";
import ReviewToggle from "../components/ReviewToggle";
import AudioButton from "../components/AudioButton";

type LoadState = "loading" | "ready" | "error";

export default function Lesson() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<LessonDetail | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setState("loading");
    getLesson(id)
      .then((data) => {
        if (!cancelled) {
          setDetail(data);
          setState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-cinnabar border-t-transparent animate-spin" />
        <p className="text-xs text-ink-light">{t("lesson.loading")}</p>
      </div>
    );
  }

  if (state === "error" || !detail) {
    return <p className="text-center text-xs font-bold text-cinnabar">{t("lesson.error")}</p>;
  }

  return (
    <div className="relative">
      <Link
        to="/library"
        className="inline-flex items-center gap-1 text-xs font-bold text-jade hover:text-jade-dark transition-colors mb-4"
      >
        <span className="material-symbols-outlined !text-[16px]">arrow_back</span>
        {t("lesson.backToAll")}
      </Link>

      <div className="parchment-card rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-amber-gold/30">
        <div>
          <span className="inline-block font-hanzi text-xs font-bold px-2 py-0.5 rounded bg-cinnabar-light text-cinnabar mb-1">
            {t("lesson.learnLabel", { n: detail.lesson.order_index })}
          </span>
          <h1 className="font-display text-2xl font-black text-ink-charcoal">
            {detail.lesson.title}
          </h1>
          <p className="text-xs text-ink-gray mt-1">
            {detail.words.length} Vocabulary Characters in this scroll
          </p>
        </div>

        <Link
          to={`/lesson/${detail.lesson.id}/practice`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cinnabar px-6 py-3 text-xs font-bold text-silk-pure shadow-seal hover:bg-cinnabar-hover hover:scale-105 active:scale-95 transition-all"
        >
          <span>{t("lesson.startPractice")}</span>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {detail.words.map((word) => (
          <div
            key={word.id}
            className="parchment-card rounded-2xl p-5 relative overflow-hidden transition-all hover:border-cinnabar/40"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="mizige-bg flex h-16 w-16 items-center justify-center rounded-xl border border-cinnabar/30 shadow-xs">
                  <span className="font-hanzi text-3xl font-bold text-ink-charcoal">
                    {word.hanzi}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-cinnabar">
                      {word.pinyin}
                    </span>
                    <AudioButton text={word.hanzi} size="sm" />
                  </div>
                  <p className="text-xs font-medium text-ink-charcoal mt-1 line-clamp-2">
                    {word.meaning_en}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-outline-variant/30 pt-3">
              <Link
                to={`/characters/${word.id}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-jade hover:underline"
              >
                <span className="material-symbols-outlined !text-[16px]">draw</span>
                {t("lesson.practiceWriting")}
              </Link>
              <ReviewToggle wordId={word.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
