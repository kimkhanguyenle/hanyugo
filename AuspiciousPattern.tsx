import React from "react";

export function AuspiciousClouds({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 60"
      className={`opacity-25 pointer-events-none fill-current ${className}`}
      aria-hidden="true"
    >
      <path d="M20,45 C10,45 5,38 8,30 C10,23 18,22 22,25 C25,18 35,12 45,16 C55,10 68,14 70,24 C78,22 88,27 88,35 C96,36 100,43 96,48 C90,52 30,52 20,45 Z M45,35 C42,28 35,28 32,32 C30,35 34,38 38,38 C45,38 48,32 45,35 Z" />
    </svg>
  );
}

export function ChineseLatticeDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 my-6 opacity-40 select-none ${className}`}>
      <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-cinnabar" />
      <span className="font-hanzi text-xs text-cinnabar">❖ ❖ ❖</span>
      <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-cinnabar" />
    </div>
  );
}

export function DecorativeCurve() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 top-1/4 -z-10 h-[500px] w-full opacity-35"
      viewBox="0 0 1200 420"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="curve-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C72C41" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#0D7377" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <path
        d="M-50,320 C150,180 320,390 520,240 S850,50 970,180 S1150,320 1250,200"
        fill="none"
        stroke="url(#curve-gradient)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
