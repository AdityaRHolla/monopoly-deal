import React from "react";
import type { Card } from "../types";

interface GameCardViewProps {
  card: Card;
  onAction?: () => void;
  actionLabel?: string;
  disabled?: boolean;
  isCompact?: boolean; // Set to true for compact table cards
}

// Global helper function to look up the exact rent tiers without using arrays
function getRentSchemeText(colorKey: string): string {
  const cleanKey = colorKey.split("_")[0].toLowerCase();
  switch (cleanKey) {
    case "darkblue":
      return "1:3M | 2:8M";
    case "green":
      return "1:2M | 2:4M | 3:7M";
    case "yellow":
      return "1:2M | 2:4M | 3:6M";
    case "red":
      return "1:2M | 2:3M | 3:6M";
    case "orange":
      return "1:1M | 2:3M | 3:5M";
    case "pink":
      return "1:1M | 2:2M | 3:4M";
    case "lightblue":
      return "1:1M | 2:2M | 3:3M";
    case "brown":
      return "1:1M | 2:2M";
    case "railroad":
      return "1:1M | 2:2M | 3:3M | 4:4M";
    case "utility":
      return "1:1M | 2:2M";
    default:
      return "";
  }
}

const colorMap: Record<string, string> = {
  darkblue: "bg-blue-800 text-white border-blue-400",
  green: "bg-emerald-800 text-white border-emerald-400",
  yellow: "bg-amber-400 text-slate-950 border-amber-300",
  red: "bg-rose-600 text-white border-rose-400",
  orange: "bg-orange-500 text-white border-orange-400",
  pink: "bg-pink-500 text-white border-pink-400",
  lightblue: "bg-sky-400 text-slate-950 border-sky-300",
  brown: "bg-amber-900 text-white border-amber-700",
  railroad: "bg-zinc-800 text-white border-zinc-600",
  utility: "bg-lime-600 text-white border-lime-400",
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

  let backgroundStyle = "bg-slate-800 border-slate-600 text-slate-200";
  let isSplitWild = false;
  let splitColors: string[] = [];

  // 🎨 STYLING PARSER ROUTER
  if (card.type === "property" && "color" in card) {
    backgroundStyle = colorMap[card.color] || backgroundStyle;
  } else if (card.type === "money") {
    backgroundStyle =
      "bg-emerald-950 border-emerald-600 text-emerald-400 font-mono";
  } else if (card.type === "action") {
    backgroundStyle = "bg-red-950 border-red-800 text-red-200";
  } else if (card.type === "rent") {
    const rentColors = (card as any).colors || [];
    if (rentColors.length === 2) {
      isSplitWild = true;
      splitColors = rentColors;
    } else {
      backgroundStyle =
        "bg-gradient-to-tr from-amber-700 to-orange-900 border-amber-600 text-amber-100";
    }
  } else if (card.type === "wildcard") {
    const wildColors = (card as any).colorsAvailable || [];
    if ((card as any).isCompleteWild) {
      backgroundStyle =
        "bg-gradient-to-r from-red-600 via-yellow-500 via-green-600 to-blue-600 border-white/30";
    } else if (wildColors.length === 2) {
      isSplitWild = true;
      splitColors = wildColors;
    }
  }

  // 📐 SHRUNK LAYOUT DIMENSIONS FOR PORTABILITY
  const baseClasses = `rounded-lg border flex flex-col justify-between shadow-md transition-all duration-200 select-none overflow-hidden ${
    isCompact
      ? "w-10 h-16 p-0.5 text-[6px]"
      : "w-[18vw] h-[26vw] sm:w-24 sm:h-36 p-1 sm:p-1.5 text-[8px] sm:text-[9px] hover:-translate-y-2 hover:scale-105 hover:z-50 hover:shadow-xl"
  } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-grab active:cursor-grabbing"}`;

  const inlineStyle =
    isSplitWild && splitColors.length === 2
      ? {
          background: `linear-gradient(135deg, ${splitColors[0] === "darkblue" ? "#1e40af" : splitColors[0] === "lightblue" ? "#38bdf8" : splitColors[0]} 50%, ${splitColors[1] === "darkblue" ? "#1e40af" : splitColors[1] === "lightblue" ? "#38bdf8" : splitColors[1]} 50%)`,
        }
      : undefined;

  // Identify active target lookup color name
  const currentCardColor =
    card.type === "property"
      ? (card as any).color
      : (card as any).currentColor ||
        ((card as any).colorsAvailable && (card as any).colorsAvailable[0]) ||
        "";

  const rentText = getRentSchemeText(currentCardColor);

  return (
    <div
      draggable={true} // 💎 ENABLES DRAG & DROP ON ALL ASSETS GLOBALLY
      onDragStart={handleDragStart}
      className={baseClasses}
      style={inlineStyle || undefined}
    >
      {/* 🏷️ CARD HEADER: Category & Money Valuation */}
      <div className="flex items-center justify-between w-full border-b border-white/10 pb-0.5">
        <span className="uppercase text-[5px] sm:text-[6px] font-black tracking-wider bg-black/40 px-1 rounded truncate max-w-10.5">
          {card.type === "wildcard" ? "WILD" : card.type}
        </span>
        {card.value > 0 && (
          <span className="font-mono font-black text-[7px] sm:text-[8px] text-emerald-400 bg-slate-950/80 px-1 rounded border border-white/5">
            {card.value}M
          </span>
        )}
      </div>

      {/* 📝 CARD BODY: Bold Heading Title Descriptor */}
      <div className="w-full text-center mt-0.5 flex-1 flex flex-col items-center justify-start min-h-0">
        <p className="font-black tracking-wide leading-tight text-white uppercase text-[7px] sm:text-[9px] drop-shadow-sm truncate w-full">
          {card.name}
        </p>

        {/* 📊 REAL-TIME RENT VALUES SCHEMA GRID LINE */}
        {rentText && (
          <p className="text-[5.5px] sm:text-[6.5px] font-mono font-black text-amber-300 mt-1 uppercase bg-black/20 w-full py-0.5 rounded border border-white/5 tracking-tighter">
            {rentText}
          </p>
        )}
      </div>

      {/* ⚙️ EMBEDDED BUTTON: Hides when resting in compact slots to save space */}
      {onAction && actionLabel && !isCompact ? (
        <button
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onAction();
          }}
          className="w-full text-[6px] sm:text-[7px] font-black uppercase py-0.5 rounded bg-slate-950/80 text-white border border-white/5 hover:bg-white hover:text-slate-950 transition-colors"
        >
          {actionLabel}
        </button>
      ) : (
        <div className="w-full h-0.5 bg-white/10 rounded-full mt-auto" />
      )}
    </div>
  );
};
