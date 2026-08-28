import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import confetti from "canvas-confetti";
import type { ApiWord, LessonDetail } from "@hanyugo/shared";
import { getLesson, recordPracticeResult } from "../api";
import { gradePinyinAnswer, type GradeResult } from "../pinyin";
import { useAuth } from "../context/AuthContext";
import ToneGuide from "../components/ToneGuide";
import AudioButton from "../components/AudioButton";
import ChineseSeal from "../components/ChineseSeal";

type LoadState = "loading" | "ready" | "error";

export default function Practice() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<LessonDetail | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [streakCombo, setStreakCombo] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
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

  function triggerConfetti() {
    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#C72C41", "#0D7377", "#D4AF37", "#FAF7EE"],
      });
    } catch {
      // safe fallback
    }
  }

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-cinnabar border-t-transparent animate-spin" />
        <p className="text-xs text-ink-light">{t("practice.loading")}</p>
      </div>
    );
  }

  if (state === "error" || !detail || detail.words.length === 0) {
    return <p className="text-center text-xs font-bold text-cinnabar">{t("practice.error")}</p>;
  }

  const words = detail.words;
  const word: ApiWord = words[index];
  const isLastWord = index === words.length - 1;
  const isDone = index >= words.length;

  function checkAnswer() {
    const graded = gradePinyinAnswer(input, word.pinyin_numbered);
    setResult(graded);

    if (graded === "correct") {
      setCorrectCount((c) => c + 1);
      setStreakCombo((s) => s + 1);
      triggerConfetti();
    } else {
      setStreakCombo(0);
    }

    if (user) {
      recordPracticeResult(word.id, graded === "correct").catch(() => {});
    }
  }

  function nextWord() {
    setInput("");
    setResult(null);
    setIndex((i) => i + 1);
  }

  function insertTone(digit: string) {
    setInput((prev) => prev + digit);
  }

  if (isDone) {
    const pct = Math.round((correctCount / words.length) * 100);
    return (
      <div className="mx-auto max-w-md text-center parchment-card p-8 rounded-2xl shadow-parchment animate-fade-in-up mt-6 border border-amber-gold/40">
        <ChineseSeal text="通" size="xl" variant="gold" className="mb-4" />
        <h1 className="font-display text-2xl font-black text-ink-charcoal">
          {t("practice.complete")}
        </h1>
        <p className="mt-2 text-xs font-semibold text-jade">
          {t("practice.score", { correct: correctCount, total: words.length, pct })}
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            to={`/lesson/${detail.lesson.id}`}
            className="rounded-xl bg-cinnabar px-6 py-2.5 text-xs font-bold text-silk-pure shadow-seal hover:bg-cinnabar-hover hover:scale-105 active:scale-95 transition-all"
          >
            {t("practice.backToLesson")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex items-center justify-between text-xs font-bold text-ink-gray">
        <span>{t("practice.wordOf", { current: index + 1, total: words.length })}</span>
        {streakCombo > 1 && (
          <span className="text-amber-warm animate-pulse">
            🔥 {t("practice.combo", { count: streakCombo })}
          </span>
        )}
      </div>

      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-silk-dim">
        <div
          className="h-full rounded-full bg-gradient-to-r from-jade to-emerald-400 transition-all duration-300"
          style={{ width: `${(index / words.length) * 100}%` }}
        />
      </div>

      <div className="parchment-card rounded-2xl p-8 text-center relative border border-amber-gold/30 shadow-parchment">
        <div className="flex justify-center mb-2">
          <AudioButton text={word.hanzi} size="md" />
        </div>

        <div className="mizige-bg mx-auto flex h-28 w-28 items-center justify-center rounded-2xl border-2 border-cinnabar/30 shadow-xs my-4">
          <span className="font-hanzi text-6xl font-black text-ink-charcoal">
            {word.hanzi}
          </span>
        </div>

        <p className="text-xs font-semibold text-ink-gray">
          Meaning: <strong className="text-ink-charcoal">{word.meaning_en}</strong>
        </p>

        <div className="mt-6">
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (result === null) checkAnswer();
                else if (!isLastWord) nextWord();
                else setIndex((i) => i + 1);
              }
            }}
            placeholder={t("practice.placeholder")}
            className="w-full rounded-xl border-2 border-outline-variant/60 bg-silk-pure/90 px-4 py-3 text-center text-lg font-mono font-bold text-ink-charcoal outline-none focus:border-cinnabar shadow-xs"
            disabled={result !== null}
          />
        </div>

        {result === null && (
          <ToneGuide onInsertTone={insertTone} className="mt-4" />
        )}

        {result && (
          <div
            className={`mt-4 rounded-xl p-3.5 text-xs font-bold animate-fade-in-up border ${
              result === "correct"
                ? "bg-jade-light text-jade border-jade/30"
                : result === "close"
                ? "bg-amber-light text-amber-warm border-amber-gold/40"
                : "bg-red-50 text-cinnabar border-cinnabar/30"
            }`}
          >
            {result === "correct" && (
              <div className="flex items-center justify-center gap-1.5">
                <ChineseSeal text="正" size="sm" variant="solid" animate={true} />
                <span>{t("practice.correct")}</span>
              </div>
            )}
            {result === "close" && t("practice.close", { pinyin: word.pinyin })}
            {result === "incorrect" &&
              t("practice.incorrect", { pinyin: word.pinyin, numbered: word.pinyin_numbered })}
          </div>
        )}

        <button
          onClick={result === null ? checkAnswer : nextWord}
          className="mt-6 w-full rounded-xl bg-cinnabar py-3 text-xs font-bold text-silk-pure shadow-seal hover:bg-cinnabar-hover hover:scale-102 active:scale-98 transition-all"
        >
          {result === null
            ? t("practice.check")
            : isLastWord
            ? t("practice.finish")
            : t("practice.next")}
        </button>
      </div>
    </div>
  );
}
