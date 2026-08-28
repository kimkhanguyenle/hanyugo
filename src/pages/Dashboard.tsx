import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { DashboardSummary } from "@hanyugo/shared";
import { getDashboardSummary } from "../api";
import { useAuth } from "../context/AuthContext";
import { levelLabel } from "../components/LevelSwitcher";
import ChineseSeal from "../components/ChineseSeal";
import AudioButton from "../components/AudioButton";
import { AuspiciousClouds, DecorativeCurve } from "../components/AuspiciousPattern";

type LoadState = "loading" | "ready" | "error" | "loggedOut";

function MandalaFlower({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const doneCount = Math.round((clamped / 100) * 8);
  const petalAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <div className="relative flex items-center justify-center aspect-square w-full max-w-[380px] mx-auto select-none">
      <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-cinnabar/10 via-jade/10 to-amber-gold/20 blur-2xl animate-pulse-glow" />

      <svg
        viewBox="0 0 200 200"
        className="animate-spin-slow relative z-10 h-full w-full drop-shadow-md"
        role="img"
        aria-label={`${clamped}% through current tier lessons`}
      >
        <defs>
          <linearGradient id="mandala-jade" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#0D7377" />
            <stop offset="100%" stopColor="#5EEAD4" />
          </linearGradient>
          <linearGradient id="mandala-cinnabar" x1="100%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#C72C41" />
            <stop offset="100%" stopColor="#FCA5A5" />
          </linearGradient>
        </defs>

        <circle cx="100" cy="100" r="92" fill="none" stroke="#D4AF37" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        <circle cx="100" cy="100" r="80" fill="none" stroke="#C72C41" strokeWidth="0.75" strokeDasharray="6 2" opacity="0.4" />
        <circle cx="100" cy="100" r="62" fill="none" stroke="#0D7377" strokeWidth="0.5" opacity="0.3" />

        <g>
          {petalAngles.map((angle, i) => {
            const state = i < doneCount ? "done" : i === doneCount ? "current" : "locked";
            return (
              <path
                key={angle}
                d="M100,24 Q116,62 100,100 Q84,62 100,24 Z"
                transform={`rotate(${angle}, 100, 100)`}
                fill={
                  state === "locked"
                    ? "none"
                    : state === "done"
                    ? "url(#mandala-jade)"
                    : "url(#mandala-cinnabar)"
                }
                stroke={state === "locked" ? "#A8948F" : "#D4AF37"}
                strokeWidth={state === "locked" ? 1 : 0.8}
                opacity={state === "done" ? 0.9 : state === "current" ? 0.65 : 0.25}
              />
            );
          })}
        </g>
      </svg>

      <div className="absolute z-20 flex flex-col items-center justify-center h-24 w-24 rounded-full border-2 border-amber-gold bg-silk-pure/95 shadow-seal animate-pulse-glow">
        <span className="font-hanzi text-3xl font-black text-cinnabar">道</span>
        <span className="text-[10px] font-bold text-jade tracking-widest">{clamped}%</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setState("loggedOut");
      return;
    }
    let cancelled = false;
    setState("loading");
    getDashboardSummary()
      .then((data) => {
        if (!cancelled) {
          setSummary(data);
          setState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  if (state === "loggedOut") {
    return (
      <div className="mx-auto max-w-lg text-center parchment-card p-10 rounded-2xl shadow-parchment animate-fade-in-up mt-6">
        <ChineseSeal text="道" size="xl" variant="solid" className="mb-4" />
        <h1 className="font-display text-3xl font-bold text-ink-charcoal">
          {t("dashboard.title")}
        </h1>
        <p className="mt-3 text-sm text-ink-gray leading-relaxed">
          {t("dashboard.loggedOutHint")}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/login"
            className="rounded-xl border border-outline-variant bg-silk-pure px-6 py-2.5 text-sm font-bold text-ink-charcoal hover:border-cinnabar transition-all shadow-xs"
          >
            {t("nav.login")}
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-cinnabar px-6 py-2.5 text-sm font-bold text-silk-pure shadow-seal hover:bg-cinnabar-hover hover:scale-105 active:scale-95 transition-all"
          >
            {t("nav.register")}
          </Link>
        </div>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="h-10 w-10 rounded-full border-3 border-cinnabar border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-ink-gray">{t("dashboard.loading")}</p>
      </div>
    );
  }

  if (state === "error" || !summary) {
    return (
      <div className="parchment-card p-8 text-center max-w-md mx-auto rounded-2xl">
        <p className="text-sm font-semibold text-cinnabar">{t("dashboard.apiError")}</p>
      </div>
    );
  }

  const overallPercent =
    summary.currentLessons.length > 0
      ? Math.round(
          summary.currentLessons.reduce((sum, l) => sum + l.percent, 0) / summary.currentLessons.length
        )
      : 0;
  const continueHref = summary.currentLessons[0] ? `/lesson/${summary.currentLessons[0].id}` : "/library";
  const lockedCharacterSlots = Math.max(0, 6 - summary.characterSample.length);

  return (
    <div className="relative">
      <DecorativeCurve />

      {/* Hero Welcome & Daily Chengyu Banner */}
      <div className="mb-8 rounded-2xl border border-amber-gold/40 bg-gradient-to-r from-silk-pure/90 via-amber-light/40 to-silk-pure/90 p-6 shadow-parchment backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <ChineseSeal text="进" size="sm" variant="gold" />
              <h1 className="font-display text-2xl font-black text-ink-charcoal">
                {t("dashboard.greeting", { name: user?.display_name ?? user?.email.split("@")[0] ?? "" })}
              </h1>
            </div>
            <p className="text-xs font-semibold text-jade mt-1">
              Current Tier: <strong className="text-cinnabar">{levelLabel(summary.activeLevel, t)}</strong> · Continual Cultivation
            </p>
          </div>

          {/* Daily Idiom Card */}
          <div className="flex items-center gap-3 rounded-xl border border-cinnabar/20 bg-cinnabar-light/60 px-4 py-2.5">
            <AudioButton text={t("dashboard.dailyQuoteHanzi")} size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-hanzi font-bold text-sm text-cinnabar tracking-wider">
                  {t("dashboard.dailyQuoteHanzi")}
                </span>
                <span className="text-[11px] font-mono text-ink-light">
                  {t("dashboard.dailyQuotePinyin")}
                </span>
              </div>
              <p className="text-[11px] text-ink-gray italic">
                "{t("dashboard.dailyQuoteMeaning")}"
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Left Column: Streak & In-Progress Lessons */}
        <div className="flex flex-col gap-6 md:col-span-4">
          {/* Flame Streak Card */}
          <div className="parchment-card p-5 rounded-2xl relative overflow-hidden">
            <AuspiciousClouds className="absolute right-0 top-0 w-24 h-12 text-cinnabar/10" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-ink-light uppercase tracking-wider">
                  {t("dashboard.streakDays")}
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display text-3xl font-black text-cinnabar">
                    {summary.streak}
                  </span>
                  <span className="text-xs font-semibold text-ink-gray">Days in Flow</span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cinnabar-light text-cinnabar shadow-seal animate-pulse-glow">
                <span className="material-symbols-outlined !text-[28px]">local_fire_department</span>
              </div>
            </div>
          </div>

          {/* Current Lessons Card */}
          <div className="parchment-card flex-grow p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
                <h3 className="font-display text-base font-bold text-ink-charcoal flex items-center gap-2">
                  <span className="material-symbols-outlined text-jade !text-[18px]">menu_book</span>
                  {t("dashboard.currentLessons")}
                </h3>
              </div>

              {summary.currentLessons.length === 0 ? (
                <p className="mt-4 text-xs text-ink-light leading-relaxed">
                  {t("dashboard.noLessons")}
                </p>
              ) : (
                <ul className="mt-4 space-y-3.5">
                  {summary.currentLessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link
                        to={`/lesson/${lesson.id}`}
                        className="group flex items-start gap-3 p-2 rounded-xl hover:bg-silk-parchment/70 transition-all"
                      >
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-jade-light text-jade font-bold text-xs border border-jade/30">
                          {lesson.orderIndex}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-xs font-bold text-ink-charcoal group-hover:text-cinnabar transition-colors">
                            {lesson.title}
                          </h4>
                          <p className="text-[11px] text-ink-light mt-0.5">
                            {t("dashboard.wordsKnown", { known: lesson.known, total: lesson.total })}
                          </p>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-silk-dim">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-jade to-emerald-400 transition-all duration-500"
                              style={{ width: `${lesson.percent}%` }}
                            />
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Link
              to={continueHref}
              className="mt-6 flex items-center justify-center gap-2 w-full rounded-xl bg-cinnabar py-3 text-center text-xs font-bold text-silk-pure shadow-seal hover:bg-cinnabar-hover hover:scale-102 active:scale-98 transition-all"
            >
              <span>{t("dashboard.practiceNow")}</span>
              <span className="material-symbols-outlined !text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Center Column: Rotating Celestial Mandala */}
        <div className="flex flex-col items-center justify-center parchment-card p-6 rounded-2xl md:col-span-5 text-center">
          <div className="mb-2">
            <h2 className="font-display text-2xl font-extrabold text-ink-charcoal">
              {t("dashboard.overallProgress")}
            </h2>
            <p className="text-xs text-ink-light mt-1">
              {t("dashboard.wordsKnown", {
                known: summary.currentLessons.reduce((s, l) => s + l.known, 0),
                total: summary.currentLessons.reduce((s, l) => s + l.total, 0),
              })}
            </p>
          </div>

          <MandalaFlower percent={overallPercent} />

          <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-jade-light/80 border border-jade/30 px-3 py-1 text-jade font-semibold">
              <span className="h-2 w-2 rounded-full bg-jade" /> {t("dashboard.legendMastered")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cinnabar-light/80 border border-cinnabar/30 px-3 py-1 text-cinnabar font-semibold">
              <span className="h-2 w-2 rounded-full bg-cinnabar" /> {t("dashboard.legendLearning")}
            </span>
          </div>
        </div>

        {/* Right Column: Hanzi Vault & Daily Dedication */}
        <div className="flex flex-col gap-6 md:col-span-3">
          {/* Character Library */}
          <div className="parchment-card p-5 rounded-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
              <h3 className="font-display text-sm font-bold text-ink-charcoal">
                {t("dashboard.characterLibrary")}
              </h3>
              <Link to="/characters" className="text-[11px] font-bold text-jade hover:underline">
                {t("dashboard.viewAll")}
              </Link>
            </div>
            <div className="mt-3.5 grid grid-cols-3 gap-2">
              {summary.characterSample.map((char) => (
                <Link
                  key={char.id}
                  to={`/characters/${char.id}`}
                  className={`group flex aspect-square flex-col items-center justify-center rounded-xl border transition-all ${
                    char.mastered
                      ? "border-jade/40 bg-jade-light/70 hover:bg-jade hover:text-silk-pure"
                      : "border-outline-variant/50 bg-silk-pure/70 hover:border-cinnabar/60"
                  }`}
                >
                  <span className="font-hanzi text-2xl font-bold transition-transform group-hover:scale-110">
                    {char.hanzi}
                  </span>
                  {char.mastered && (
                    <span className="text-[9px] font-bold text-jade group-hover:text-silk-pure">
                      ✓
                    </span>
                  )}
                </Link>
              ))}
              {Array.from({ length: lockedCharacterSlots }).map((_, i) => (
                <div
                  key={`locked-${i}`}
                  className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-outline-variant/60 text-outline"
                >
                  <span className="material-symbols-outlined !text-[18px]">lock</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Goal Card */}
          <div className="parchment-card p-5 rounded-2xl border border-amber-gold/30 bg-gradient-to-br from-silk-pure/80 to-amber-light/40">
            <h3 className="font-display text-sm font-bold text-ink-charcoal flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber-warm !text-[18px]">star</span>
              {t("dashboard.dailyGoal")}
            </h3>
            <p className="mt-2 text-xs text-ink-gray">
              {t("dashboard.dailyGoalProgress", {
                completed: summary.dailyGoal.completed,
                target: summary.dailyGoal.target,
              })}
            </p>
            <div className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-silk-dim">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-amber-warm to-amber-gold transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round((summary.dailyGoal.completed / summary.dailyGoal.target) * 100))}%`,
                }}
              />
            </div>
            <p className="mt-1.5 text-right text-[11px] font-bold text-amber-warm">
              {summary.dailyGoal.completed} / {summary.dailyGoal.target}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
