import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import HanziWriter from "hanzi-writer";
import type { ApiWord } from "@hanyugo/shared";
import { getWord } from "../api";
import AudioButton from "../components/AudioButton";

type LoadState = "loading" | "ready" | "error";

// Stroke-order practice.
//
// This page used to pass the whole vocabulary entry to hanzi-writer:
//   HanziWriter.create(el, word.hanzi, ...)
// which only works when the entry happens to be a single character. hanzi-writer
// stores stroke data per character, so anything longer -- 爸爸, 出租车, 不好意思 --
// silently rendered nothing. That was 85% of the vocabulary (8,590 of 10,057
// words), and worse at higher levels: 91% of HSK 7-9 entries were unusable.
//
// The fix is to treat a word as the sequence of characters it actually is, and
// let the learner practise each one in turn. Only 2,966 unique characters make
// up the entire 10k-word corpus, and hanzi-writer fetches each on demand, so
// there is nothing extra to ship or store.
export default function CharacterPractice() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [word, setWord] = useState<ApiWord | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [mistakes, setMistakes] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [charError, setCharError] = useState(false);

  const targetRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);

  // Array.from (not .split("")) so characters outside the Basic Multilingual
  // Plane aren't torn in half -- rare CJK extensions are stored as surrogate
  // pairs, and splitting those produces two broken halves rather than one glyph.
  const characters = useMemo(
    () => (word ? Array.from(word.hanzi) : []),
    [word]
  );
  const isMultiChar = characters.length > 1;
  const activeChar = characters[activeIndex] ?? "";

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setState("loading");
    setMistakes(null);
    setActiveIndex(0);
    setCompleted(new Set());
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

  // Rebuild the writer whenever the selected character changes.
  useEffect(() => {
    if (state !== "ready" || !activeChar || !targetRef.current) return;

    targetRef.current.innerHTML = "";
    setCharError(false);
    setMistakes(null);

    writerRef.current = HanziWriter.create(targetRef.current, activeChar, {
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
      // A handful of rare characters have no stroke data upstream. Surface that
      // honestly instead of leaving the learner staring at an empty box.
      onLoadCharDataError: () => setCharError(true),
    });

    return () => {
      writerRef.current = null;
    };
  }, [state, activeChar]);

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
    setMistakes(null);
    writerRef.current?.quiz({
      onComplete: (summary: { totalMistakes: number }) => {
        setMistakes(summary.totalMistakes);
        setCompleted((prev) => new Set(prev).add(activeIndex));
      },
    });
  }

  function reset() {
    setMistakes(null);
    writerRef.current?.hideCharacter();
    writerRef.current?.showCharacter();
  }

  const allDone = isMultiChar && completed.size === characters.length;

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

        {/* Character picker — only shown for words of more than one character.
            Single-character words keep the original, simpler layout. */}
        {isMultiChar && (
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-light">
              {t("characters.charOf", {
                current: activeIndex + 1,
                total: characters.length,
              })}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {characters.map((ch, i) => {
                const isActive = i === activeIndex;
                const isDone = completed.has(i);
                return (
                  <button
                    key={`${ch}-${i}`}
                    onClick={() => setActiveIndex(i)}
                    aria-label={t("characters.practiceThisChar", { char: ch })}
                    aria-current={isActive}
                    className={`relative flex h-12 w-12 items-center justify-center rounded-xl border-2 font-hanzi text-2xl transition-all ${
                      isActive
                        ? "border-cinnabar bg-cinnabar text-silk-pure shadow-seal scale-110"
                        : isDone
                        ? "border-jade bg-jade-light text-jade"
                        : "border-outline-variant bg-silk-pure text-ink-charcoal hover:border-cinnabar/50"
                    }`}
                  >
                    {ch}
                    {isDone && !isActive && (
                      <span className="material-symbols-outlined absolute -right-1 -top-1 !text-[14px] rounded-full bg-jade text-silk-pure">
                        check
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="relative mx-auto my-6 flex h-[310px] w-[310px] items-center justify-center rounded-2xl border-4 border-amber-warm/40 bg-silk-pure p-2 shadow-inner">
          <div className="mizige-bg absolute inset-2 rounded-xl" />
          <div ref={targetRef} className="relative z-10" />
          {charError && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-silk-pure/90 p-4">
              <p className="text-xs font-bold text-cinnabar">
                {t("characters.noStrokeData", { char: activeChar })}
              </p>
            </div>
          )}
        </div>

        {allDone && (
          <div className="mb-4 rounded-xl bg-jade-light p-3 text-xs font-bold text-jade border border-jade/30 animate-fade-in-up">
            {t("characters.wordComplete", { word: word.hanzi })}
          </div>
        )}

        {mistakes !== null && (
          <div className="mb-4 rounded-xl bg-jade-light p-3 text-xs font-bold text-jade border border-jade/30 animate-fade-in-up">
            {mistakes === 0
              ? t("characters.perfect")
              : t("characters.mistakesSummary", { count: mistakes })}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2.5">
          <button
            onClick={showStrokeOrder}
            disabled={charError}
            className="flex items-center gap-1.5 rounded-xl border border-jade bg-jade-light/60 px-4 py-2 text-xs font-bold text-jade hover:bg-jade hover:text-silk-pure transition-all shadow-xs disabled:opacity-40"
          >
            <span className="material-symbols-outlined !text-[16px]">play_circle</span>
            {t("characters.showStrokeOrder")}
          </button>
          <button
            onClick={startQuiz}
            disabled={charError}
            className="flex items-center gap-1.5 rounded-xl bg-cinnabar px-4 py-2 text-xs font-bold text-silk-pure shadow-seal hover:bg-cinnabar-hover hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100"
          >
            <span className="material-symbols-outlined !text-[16px]">edit</span>
            {t("characters.practiceWriting")}
          </button>
          <button
            onClick={reset}
            disabled={charError}
            className="flex items-center gap-1.5 rounded-xl border border-outline-variant bg-silk-pure px-3 py-2 text-xs font-bold text-ink-light hover:text-ink-charcoal transition-all shadow-xs disabled:opacity-40"
          >
            <span className="material-symbols-outlined !text-[16px]">refresh</span>
            {t("characters.reset")}
          </button>
        </div>

        {/* Move between characters without going back to the list. */}
        {isMultiChar && (
          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              disabled={activeIndex === 0}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-ink-light hover:text-cinnabar disabled:opacity-30 transition-colors"
            >
              <span className="material-symbols-outlined !text-[16px]">chevron_left</span>
              {t("characters.prevChar")}
            </button>
            <button
              onClick={() => setActiveIndex((i) => Math.min(characters.length - 1, i + 1))}
              disabled={activeIndex === characters.length - 1}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-ink-light hover:text-cinnabar disabled:opacity-30 transition-colors"
            >
              {t("characters.nextChar")}
              <span className="material-symbols-outlined !text-[16px]">chevron_right</span>
            </button>
          </div>
        )}

        <p className="mt-4 text-[11px] text-ink-light italic">
          {t("characters.noProgressNote")}
        </p>
      </div>
    </div>
  );
}
