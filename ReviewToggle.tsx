import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { markWord } from "../api";

export default function ReviewToggle({ wordId }: { wordId: number }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [marked, setMarked] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function toggle() {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    const nextMarked = !marked;
    setSaving(true);
    try {
      await markWord(wordId, nextMarked ? "marked_for_review" : "new", nextMarked ? note : undefined);
      setMarked(nextMarked);
      setShowNote(nextMarked);
    } finally {
      setSaving(false);
    }
  }

  async function saveNote() {
    setSaving(true);
    try {
      await markWord(wordId, "marked_for_review", note);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 pt-2 border-t border-outline-variant/30">
      <button
        type="button"
        onClick={toggle}
        disabled={saving}
        className={`inline-flex items-center gap-1.5 text-xs font-bold transition-all ${
          marked
            ? "text-cinnabar hover:text-cinnabar-dark"
            : "text-ink-light hover:text-cinnabar"
        }`}
      >
        <span className="material-symbols-outlined !text-[16px]">
          {marked ? "bookmark_added" : "bookmark_add"}
        </span>
        <span>{marked ? t("review.marked") : t("review.markButton")}</span>
      </button>

      {showNote && (
        <div className="mt-2 animate-fade-in-up">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={saveNote}
            placeholder={t("review.notePlaceholder")}
            rows={2}
            className="w-full rounded-lg border border-amber-gold/40 bg-silk-pure/90 p-2.5 text-xs text-ink-charcoal outline-none focus:ring-1 focus:ring-cinnabar"
          />
        </div>
      )}
    </div>
  );
}
