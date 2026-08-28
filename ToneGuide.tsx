import React from "react";

interface ToneGuideProps {
  onInsertTone?: (toneChar: string) => void;
  className?: string;
}

const TONE_SAMPLES = [
  { name: "1st Tone (Flat · 阴平)", curve: "—", desc: "High & Level (mā / 1)", example: "ā" },
  { name: "2nd Tone (Rising · 阳平)", curve: "／", desc: "Rising (má / 2)", example: "á" },
  { name: "3rd Tone (Dipping · 上声)", curve: "∨", desc: "Dipping & Rising (mǎ / 3)", example: "ǎ" },
  { name: "4th Tone (Falling · 去声)", curve: "＼", desc: "Sharp & Falling (mà / 4)", example: "à" },
  { name: "Neutral (轻声)", curve: "·", desc: "Soft & Short (ma / 5)", example: "a" },
];

export default function ToneGuide({ onInsertTone, className = "" }: ToneGuideProps) {
  return (
    <div className={`rounded-xl border border-amber-gold/30 bg-amber-light/50 p-3.5 backdrop-blur-sm ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-jade flex items-center gap-1.5">
          <span className="material-symbols-outlined !text-[16px]">graphic_eq</span>
          Pinyin Tone Assistant
        </span>
        <span className="text-[11px] text-ink-light">Type digits (1-5) or click tone buttons</span>
      </div>

      <div className="grid grid-cols-5 gap-1.5 text-center">
        {TONE_SAMPLES.map((tone, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onInsertTone && onInsertTone(String(idx + 1))}
            className="group flex flex-col items-center justify-center p-1.5 rounded-lg border border-outline-variant/60 bg-silk-pure/80 hover:bg-cinnabar hover:text-silk-paper hover:border-cinnabar transition-all shadow-xs"
            title={tone.desc}
          >
            <span className="font-mono text-sm font-extrabold text-cinnabar group-hover:text-silk-paper">
              {tone.curve}
            </span>
            <span className="text-[10px] font-semibold text-ink-charcoal group-hover:text-silk-paper">
              Tone {idx + 1}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
