import React from "react";
import type { Card } from "../types";

interface GameCardProps {
  card: Card;
  onAction?: () => void;
  actionLabel?: string;
  disabled?: boolean;
}

// Map color tokens safely to rich background aesthetics
const colorMap: Record<string, string> = {
  darkblue: "bg-blue-900 border-blue-400",
  green: "bg-emerald-800 border-emerald-400",
  yellow: "bg-amber-500 border-amber-300 text-slate-950",
  red: "bg-rose-700 border-rose-400",
  orange: "bg-orange-600 border-orange-400",
  pink: "bg-pink-600 border-pink-400",
  lightblue: "bg-sky-400 border-sky-200 text-slate-950",
  brown: "bg-amber-950 border-amber-700",
  railroad: "bg-slate-700 border-slate-400",
  utility: "bg-zinc-600 border-zinc-400",
};

export const GameCard: React.FC<GameCardProps> = ({
  card,
  onAction,
  actionLabel,
  disabled = false,
}) => {
  // Determine color bar banner styling based on card traits
  let bannerStyle = "bg-slate-700 border-slate-500";
  if (card.type === "property" && "color" in card) {
    bannerStyle = colorMap[card.color] || bannerStyle;
  } else if (card.type === "money") {
    bannerStyle = "bg-emerald-900 border-emerald-500 text-emerald-300";
  } else if (card.type === "action") {
    bannerStyle = "bg-red-900 border-red-500 text-red-200";
  } else if (card.type === "rent") {
    bannerStyle =
      "bg-gradient-to-r from-amber-600 to-yellow-600 border-amber-400";
  }

  return (
    <div className="flex-shrink-0 w-32 h-48 bg-slate-800 border border-slate-700 rounded-xl p-2 flex flex-col justify-between shadow-lg hover:-translate-y-2 hover:shadow-2xl hover:border-slate-500 transition-all duration-300 group">
      {/* Dynamic Header Banner */}
      <div
        className={`px-2 py-1.5 rounded-lg border text-center relative ${bannerStyle}`}
      >
        <div className="text-[10px] font-black uppercase tracking-wider truncate">
          {card.type}
        </div>
        {card.value > 0 && (
          <div className="absolute -top-1 -right-1 bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center shadow-md">
            {card.value}M
          </div>
        )}
      </div>

      {/* Main Body Title Descriptor */}
      <div className="my-2 flex-1 flex items-center justify-center px-1">
        <p className="text-center text-xs font-bold leading-tight tracking-wide text-slate-100 group-hover:text-white transition-colors line-clamp-3">
          {card.name}
        </p>
      </div>

      {/* Action Footer Button Layer */}
      {onAction && actionLabel && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction();
          }}
          disabled={disabled}
          className="w-full text-[10px] font-black uppercase tracking-wider py-1.5 px-2 bg-slate-700 border border-slate-600 hover:bg-blue-600 hover:border-blue-400 disabled:bg-slate-900 disabled:border-slate-800 disabled:text-slate-600 text-slate-200 hover:text-white rounded-lg transition-all duration-200"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
