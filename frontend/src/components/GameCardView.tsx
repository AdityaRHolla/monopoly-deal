import React from "react";
import type { Card } from "../types";

interface GameCardViewProps {
  card: Card;
  onAction?: () => void;
  actionLabel?: string;
  disabled?: boolean;
  isCompact?: boolean; // Set to true to shrink cards resting on the table
}

const colorMap: Record<string, string> = {
  darkblue: "bg-blue-800 text-white",
  green: "bg-emerald-800 text-white",
  yellow: "bg-amber-400 text-slate-950",
  red: "bg-rose-600 text-white",
  orange: "bg-orange-500 text-white",
  pink: "bg-pink-500 text-white",
  lightblue: "bg-sky-400 text-slate-950",
  brown: "bg-amber-900 text-white",
  railroad: "bg-zinc-800 text-white",
  utility: "bg-lime-600 text-white",
};

export const GameCardView: React.FC<GameCardViewProps> = ({
  card,
  onAction,
  actionLabel,
  disabled = false,
  isCompact = false,
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", card.id);
    e.dataTransfer.effectAllowed = "move";
  };

  // 🎨 DYNAMIC RENDERING LAYER FOR SPECIALIST CARD CLASSES
  let backgroundStyle = "bg-slate-800 border-slate-600";
  let isSplitWild = false;
  let splitColors: string[] = [];

  if (card.type === "property" && "color" in card) {
    backgroundStyle = colorMap[card.color] || backgroundStyle;
  } else if (card.type === "money") {
    backgroundStyle =
      "bg-emerald-950 border-emerald-500 text-emerald-400 font-mono";
  } else if (card.type === "action") {
    backgroundStyle = "bg-red-950 border-red-700 text-red-200";
  } else if (card.type === "rent") {
    const rentColors = (card as any).colors || [];
    if (rentColors.length === 2) {
      isSplitWild = true;
      splitColors = rentColors;
    } else {
      backgroundStyle =
        "bg-gradient-to-tr from-amber-600 to-orange-800 border-amber-500 text-amber-100";
    }
  } else if (card.type === "wildcard") {
    const wildColors = (card as any).colorsAvailable || [];
    if ((card as any).isCompleteWild) {
      backgroundStyle =
        "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500 border-white/40";
    } else if (wildColors.length === 2) {
      isSplitWild = true;
      splitColors = wildColors;
    }
  }

  const baseClasses = `rounded-xl border flex flex-col justify-between shadow-md transition-all duration-200 select-none ${
    isCompact
      ? "w-16 h-24 p-1 text-[8px] hover:scale-110 hover:z-20"
      : "w-24 h-36 sm:w-28 sm:h-40 p-2 text-[10px] group-hover:-translate-y-4 group-hover:scale-125 group-hover:z-50 group-hover:shadow-2xl group-hover:border-white/40"
  } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-grab active:cursor-grabbing"}`;

  // Inline styling for true split dual-color property wildcards
  const inlineStyle =
    isSplitWild && splitColors.length === 2
      ? {
          background: `linear-gradient(135deg, ${splitColors[0] === "darkblue" ? "#1e40af" : splitColors[0] === "lightblue" ? "#38bdf8" : splitColors[0]} 50%, ${splitColors[1] === "darkblue" ? "#1e40af" : splitColors[1] === "lightblue" ? "#38bdf8" : splitColors[1]} 50%)`,
        }
      : undefined;

  return (
    <div
      draggable={!disabled}
      onDragStart={handleDragStart}
      className={baseClasses}
      style={inlineStyle || undefined}
    >
      {/* Top Banner Asset Value Badge */}
      <div className="flex items-center justify-between w-full opacity-90">
        <span className="uppercase text-[6px] font-black tracking-widest bg-black/40 px-1 rounded">
          {card.type === "wildcard" ? "WILD" : card.type}
        </span>
        {card.value > 0 && (
          <span className="font-mono font-black bg-slate-950/80 px-1 rounded text-emerald-400 border border-white/5">
            {card.value}M
          </span>
        )}
      </div>

      {/* Middle Label Card Header Descriptor */}
      <div className="flex-1 flex items-center justify-center text-center p-0.5 bg-black/20 rounded my-1">
        <p className="font-black tracking-wide leading-tight text-white uppercase wrap-break-word line-clamp-3">
          {card.name}
        </p>
      </div>

      {/* Embedded Action Button row */}
      {onAction && actionLabel && !isCompact ? (
        <button
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onAction();
          }}
          className="w-full text-[7px] font-black uppercase py-0.5 rounded bg-slate-950/80 border border-white/10 text-white hover:bg-white hover:text-slate-950 transition-colors"
        >
          {actionLabel}
        </button>
      ) : (
        <div className="w-full h-0.5 bg-white/20 rounded-full" />
      )}
    </div>
  );
};
