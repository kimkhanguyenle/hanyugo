import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ReviewWord } from "@hanyugo/shared";
import { getReviewQueue, markWord } from "../api";
import { useAuth } from "../context/AuthContext";
import ChineseSeal from "../components/ChineseSeal";
import AudioButton from "../components/AudioButton";

type LoadState = "loading" | "ready" | "error";

export default function Review() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [words, setWords] = useState<ReviewWord[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [flippedIds, setFlippedIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setState("ready");
      return;
    }
    let cancelled = false;
    setState("loading");
    getReviewQueue()
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
  }, [user, authLoading]);

  function toggleFlip(id: number) {
    setFlippedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleMarkKnown(id: number) {
    await markWord(id, "known");
    setWords((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <div className="relative">
      <div className="mb-8 text-center">
        <ChineseSeal text="忆" size="lg" variant="solid" className="mb-3" />
        <h1 className="font-display text-3xl font-black text-ink-charcoal">
          {t("review.title")}
        </h1>
        <p className="mt-1 text-xs text-ink-gray">{t("review.subtitle")}</p>
      </div>

      {!authLoading && !user && (
        <div className="parchment-card p-8 rounded-2xl max-w-md mx-auto text-center">
          <p className="text-xs font-semibold text-ink-gray mb-4">
            {t("review.loginRequired")}
          </p>
          <Link
            to="/login"
            className="rounded-xl bg-cinnabar px-6 py-2.5 text-xs font-bold text-silk-pure shadow-seal hover:bg-cinnabar-hover"
          >
            {t("nav.login")}
          </Link>
        </div>
      )}

      {user && state === "loading" && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-cinnabar border-t-transparent animate-spin" />
          <p className="text-xs text-ink-light">{t("review.loading")}</p>
        </div>
      )}

      {user && state === "error" && (
        <p className="text-center text-xs font-bold text-cinnabar">{t("review.error")}</p>
      )}

      {user && state === "ready" && words.length === 0 && (
        <div className="parchment-card p-10 rounded-2xl max-w-md mx-auto text-center">
          <p className="text-xs text-ink-gray leading-relaxed">{t("review.empty")}</p>
        </div>
      )}

      {user && state === "ready" && words.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {words.map((word) => {
            const isFlipped = flippedIds[word.id];
            return (
              <div
                key={word.id}
                onClick={() => toggleFlip(word.id)}
                className="parchment-card rounded-2xl p-5 cursor-pointer transition-all hover:border-cinnabar/50 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-warm uppercase">
                    Tap to Flip Card
                  </span>
                  <AudioButton text={word.hanzi} size="sm" />
                </div>

                <div className="mizige-bg my-3 mx-auto flex h-20 w-20 items-center justify-center rounded-xl border border-cinnabar/30 shadow-xs">
                  <span className="font-hanzi text-4xl font-black text-ink-charcoal">
                    {word.hanzi}
                  </span>
                </div>

                {isFlipped ? (
                  <div className="animate-fade-in-up text-center border-t border-outline-variant/30 pt-3">
                    <p className="font-mono text-sm font-bold text-cinnabar">{word.pinyin}</p>
                    <p className="text-xs text-ink-charcoal mt-1">{word.meaning_en}</p>
                    {word.note && (
                      <p className="mt-2 rounded bg-amber-light/70 p-2 text-[11px] text-ink-gray italic">
                        Note: {word.note}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-xs text-ink-light pt-2 italic">
                    (Click to reveal pinyin & meaning)
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-outline-variant/30 pt-3">
                  <Link
                    to={`/characters/${word.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-bold text-jade hover:underline"
                  >
                    Trace Strokes ✍️
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkKnown(word.id);
                    }}
                    className="rounded-lg bg-jade-light px-2.5 py-1 text-[11px] font-bold text-jade hover:bg-jade hover:text-silk-pure transition-all"
                  >
                    ✓ Mastered
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
