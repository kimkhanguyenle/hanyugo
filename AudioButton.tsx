import React, { useState } from "react";

interface AudioButtonProps {
  text: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function AudioButton({ text, size = "md", className = "" }: AudioButtonProps) {
  const [playing, setPlaying] = useState(false);

  function speak() {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.85;

    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.startsWith("zh") || v.lang.includes("Chinese"));
    if (zhVoice) utterance.voice = zhVoice;

    utterance.onstart = () => setPlaying(true);
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);

    window.speechSynthesis.speak(utterance);
  }

  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
  }[size];

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        speak();
      }}
      title="Listen to pronunciation"
      className={`inline-flex items-center justify-center rounded-full border border-jade/30 bg-jade-light/80 text-jade hover:bg-jade hover:text-silk-pure hover:scale-105 active:scale-95 transition-all shadow-xs ${sizeClasses} ${playing ? "ring-2 ring-jade animate-pulse" : ""} ${className}`}
    >
      <span className="material-symbols-outlined !text-[18px]">
        {playing ? "volume_up" : "volume_down"}
      </span>
    </button>
  );
}
