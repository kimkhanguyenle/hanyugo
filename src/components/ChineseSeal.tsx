import React from "react";

interface ChineseSealProps {
  text: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "solid" | "outline" | "gold";
  shape?: "square" | "circle";
  className?: string;
  animate?: boolean;
}

export default function ChineseSeal({
  text,
  size = "md",
  variant = "solid",
  shape = "square",
  className = "",
  animate = false,
}: ChineseSealProps) {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-11 h-11 text-base",
    xl: "w-14 h-14 text-xl",
  }[size];

  const variantClasses = {
    solid: "bg-cinnabar text-silk-paper border-2 border-cinnabar-dark shadow-seal",
    outline: "bg-cinnabar-light/60 text-cinnabar border-2 border-cinnabar",
    gold: "bg-gradient-to-br from-amber-gold to-amber-warm text-silk-paper border-2 border-amber-warm shadow-md",
  }[variant];

  const shapeClasses = shape === "circle" ? "rounded-full" : "rounded-[4px]";
  const animClass = animate ? "animate-stamp-in" : "";

  return (
    <div
      className={`inline-flex items-center justify-center font-hanzi font-bold select-none tracking-tight ${sizeClasses} ${variantClasses} ${shapeClasses} ${animClass} ${className}`}
      style={{
        boxShadow: variant === "solid" ? "inset 0 0 4px rgba(0,0,0,0.25), 0 2px 8px rgba(199,44,65,0.3)" : undefined,
      }}
    >
      <span className="leading-none transform translate-y-[-0.5px]">{text}</span>
    </div>
  );
}
