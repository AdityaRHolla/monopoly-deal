import React from "react";
import type { Card } from "../types";

interface GameCardViewProps {
  card: Card;
  onAction?: () => void;
  actionLabel?: string;
  disabled?: boolean;
}

// Authentic Monopoly Deal Hex Color Codes Mapping Palette
const colorMap: Record<string, string> = {
  darkblue: "from-blue-800 to-blue-950 border-blue-400",
  green: "from-emerald-700 to-emerald-900 border-emerald-400",
  yellow: "from-amber-400 to-yellow-500 border-amber-300 text-slate-950",
  red: "from-rose-600 to-red-800 border-rose-400",
  orange: "from-orange-500 to-orange-700 border-orange-400",
  pink: "from-pink-500 to-pink-700 border-pink-400",
  lightblue: "from-sky-400 to-sky-600 border-sky-300 text-slate-950",
  brown: "from-amber-800 to-amber-950 border-amber-600",
  railroad: "from-zinc-700 to-zinc-900 border-zinc-500",
  utility: "from-lime-700 to-yellow-800 border-lime-500",
};

export const GameCardView: React.FC<GameCardViewProps> = ({
  card,
  onAction,
  actionLabel,
  disabled = false,
}) => {
  // Determine dynamic gradient theme styles based on card classifications
  let colorStyle = "from-slate-700 to-slate-900 border-slate-500";

  if (card.type === "property" && "color" in card) {
    colorStyle = colorMap[card.color] || colorStyle;
  } else if (card.type === "money") {
    colorStyle =
      "from-emerald-800 to-emerald-950 border-emerald-500 text-emerald-300";
  } else if (card.type === "action") {
    colorStyle = "from-red-700 to-red-900 border-red-500 text-red-100";
  } else if (card.type === "rent") {
    colorStyle = "from-amber-600 to-orange-800 border-amber-400 text-amber-100";
  } else if (card.type === "wildcard") {
    colorStyle = "from-indigo-700 to-purple-900 border-indigo-400";
  }

  return (
    <div className="relative group perspective-1000 w-24 h-36 sm:w-28 sm:h-40 shrink-0">
      {/* 🚀 SMOOTH 1.2x HOVER-ZOOM CARD CORE CANVAS */}
      <div
        className={`w-full h-full rounded-xl border bg-linear-to-br p-2 flex flex-col justify-between shadow-lg 
        transition-all duration-300 ease-out transform origin-bottom
        group-hover:-translate-y-6 group-hover:scale-125 group-hover:z-50 group-hover:shadow-2xl group-hover:border-white/40
        ${colorStyle}`}
      >
        {/* Card Header: Currency Tracker badge */}
        <div className="flex items-center justify-between w-full">
          <span className="text-[7px] font-black uppercase tracking-widest opacity-80">
            {card.type}
          </span>
          {card.value > 0 && (
            <span className="font-mono font-black text-[10px] bg-slate-950/80 px-1.5 py-0.5 rounded-md border border-white/10 text-emerald-400">
              {card.value}M
            </span>
          )}
        </div>

        {/* Minimal Middle Layout: Main identity text */}
        <div className="flex-1 flex items-center justify-center text-center p-0.5">
          <p className="text-[10px] sm:text-xs font-black tracking-wide leading-tight text-white drop-shadow-md line-clamp-3 uppercase">
            {card.name}
          </p>
        </div>

        {/* Action Button: Renders action label inside the expanded hover state view panel */}
        {onAction && actionLabel ? (
          <button
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            className="w-full text-[8px] font-black uppercase tracking-wider py-1 rounded bg-slate-950/80 border border-white/10 
              text-white hover:bg-white hover:text-slate-950 transition-colors duration-150 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            {actionLabel}
          </button>
        ) : (
          <div className="w-full h-1 bg-white/10 rounded-full" />
        )}
      </div>
    </div>
  );
};
