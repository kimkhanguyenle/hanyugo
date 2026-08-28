import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import HanziWriter from "hanzi-writer";
import type { ApiWord } from "@hanyugo/shared";
import { getWord } from "../api";
import AudioButton from "../components/AudioButton";

type LoadState = "loading" | "ready" | "error";

export default function CharacterPractice() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [word, setWord] = useState<ApiWord | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [mode, setMode] = useState<"trace" | "quiz-summary">("trace");
  const [mistakes, setMistakes] = useState<number | null>(null);

  const targetRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setState("loading");
    setMode("trace");
    setMistakes(null);
    getWord(id)
      .then((data) => {
        if (!cancelled) {
          setWord(data.word);
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

  useEffect(() => {
    if (state !== "ready" || !word || !targetRef.current) return;

    targetRef.current.innerHTML = "";
    writerRef.current = HanziWriter.create(targetRef.current, word.hanzi, {
      width: 280,
      height: 280,
      padding: 16,
      showOutline: true,
      strokeColor: "#C72C41",
      outlineColor: "#E8DCD9",
      drawingColor: "#0D7377",
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 180,
      radicalColor: "#0D7377",
    });

    return () => {
      writerRef.current = null;
    };
  }, [state, word]);

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-cinnabar border-t-transparent animate-spin" />
        <p className="text-xs text-ink-light">{t("characters.loadingChar")}</p>
      </div>
    );
  }

  if (state === "error" || !word) {
    return <p className="text-center text-xs font-bold text-cinnabar">{t("characters.errorChar")}</p>;
  }

  function showStrokeOrder() {
    writerRef.current?.animateCharacter();
  }

  function startQuiz() {
    setMode("trace");
    setMistakes(null);
    writerRef.current?.quiz({
      onComplete: (summary: { totalMistakes: number }) => {
        setMistakes(summary.totalMistakes);
        setMode("quiz-summary");
      },
    });
  }

  function reset() {
    setMode("trace");
    setMistakes(null);
    writerRef.current?.hideCharacter();
    writerRef.current?.showCharacter();
  }

  return (
    <div className="mx-auto max-w-md">
      <Link
        to="/characters"
        className="inline-flex items-center gap-1 text-xs font-bold text-jade hover:text-jade-dark transition-colors mb-4"
      >
        <span className="material-symbols-outlined !text-[16px]">arrow_back</span>
        {t("characters.backToAll")}
      </Link>

      <div className="parchment-card rounded-2xl p-6 text-center border border-amber-gold/30 shadow-parchment">
        <div className="flex items-center justify-center gap-3">
          <AudioButton text={word.hanzi} size="sm" />
          <h1 className="font-mono text-xl font-bold text-cinnabar">{word.pinyin}</h1>
        </div>
        <p className="mt-1 text-xs text-ink-gray">"{word.meaning_en}"</p>

        <div className="relative mx-auto my-6 flex h-[310px] w-[310px] items-center justify-center rounded-2xl border-4 border-amber-warm/40 bg-silk-pure p-2 shadow-inner">
          <div className="mizige-bg absolute inset-2 rounded-xl" />
          <div ref={targetRef} className="relative z-10" />
        </div>

        {mode === "quiz-summary" && mistakes !== null && (
          <div className="mb-4 rounded-xl bg-jade-light p-3 text-xs font-bold text-jade border border-jade/30 animate-fade-in-up">
            {mistakes === 0
              ? t("characters.perfect")
              : t("characters.mistakesSummary", { count: mistakes })}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2.5">
          <button
            onClick={showStrokeOrder}
            className="flex items-center gap-1.5 rounded-xl border border-jade bg-jade-light/60 px-4 py-2 text-xs font-bold text-jade hover:bg-jade hover:text-silk-pure transition-all shadow-xs"
          >
            <span className="material-symbols-outlined !text-[16px]">play_circle</span>
            {t("characters.showStrokeOrder")}
          </button>
          <button
            onClick={startQuiz}
            className="flex items-center gap-1.5 rounded-xl bg-cinnabar px-4 py-2 text-xs font-bold text-silk-pure shadow-seal hover:bg-cinnabar-hover hover:scale-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined !text-[16px]">edit</span>
            {t("characters.practiceWriting")}
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-xl border border-outline-variant bg-silk-pure px-3 py-2 text-xs font-bold text-ink-light hover:text-ink-charcoal transition-all shadow-xs"
          >
            <span className="material-symbols-outlined !text-[16px]">refresh</span>
            {t("characters.reset")}
          </button>
        </div>

        <p className="mt-4 text-[11px] text-ink-light italic">
          {t("characters.noProgressNote")}
        </p>
      </div>
    </div>
  );
}
