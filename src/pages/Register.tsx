import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import ChineseSeal from "../components/ChineseSeal";
import { AuspiciousClouds } from "../components/AuspiciousPattern";

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password, displayName.trim() || undefined);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-6 text-center">
        <ChineseSeal text="学" size="lg" variant="solid" className="mb-3" />
        <h1 className="font-display text-2xl font-black text-ink-charcoal">
          {t("auth.registerTitle")}
        </h1>
        <p className="mt-1 text-xs text-ink-gray">{t("auth.registerSubtitle")}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="parchment-card rounded-2xl p-7 shadow-parchment border border-amber-gold/30 relative overflow-hidden"
      >
        <AuspiciousClouds className="absolute right-0 top-0 w-24 h-12 text-cinnabar/10" />

        <label className="block text-xs font-bold uppercase tracking-wide text-jade">
          {t("auth.displayNameLabel")}
        </label>
        <input
          type="text"
          autoFocus
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Master Lin"
          className="mt-1.5 w-full rounded-xl border border-outline-variant/60 bg-silk-pure/90 px-3.5 py-2.5 text-xs text-ink-charcoal outline-none focus:border-cinnabar focus:ring-1 focus:ring-cinnabar"
        />

        <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-jade">
          {t("auth.emailLabel")}
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-outline-variant/60 bg-silk-pure/90 px-3.5 py-2.5 text-xs text-ink-charcoal outline-none focus:border-cinnabar focus:ring-1 focus:ring-cinnabar"
        />

        <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-jade">
          {t("auth.passwordLabel")}
        </label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-outline-variant/60 bg-silk-pure/90 px-3.5 py-2.5 text-xs text-ink-charcoal outline-none focus:border-cinnabar focus:ring-1 focus:ring-cinnabar"
        />
        <p className="mt-1 text-[11px] text-ink-light">{t("auth.passwordHint")}</p>

        {error && <p className="mt-4 text-xs font-bold text-cinnabar">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-xl bg-cinnabar py-3 text-xs font-bold text-silk-pure shadow-seal hover:bg-cinnabar-hover hover:scale-102 active:scale-98 transition-all disabled:opacity-60"
        >
          {submitting ? t("auth.submitting") : t("auth.submitRegister")}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-ink-gray">
        {t("auth.hasAccount")}
        <Link to="/login" className="font-bold text-cinnabar hover:underline ml-1">
          {t("auth.logInLink")}
        </Link>
      </p>
    </div>
  );
}
