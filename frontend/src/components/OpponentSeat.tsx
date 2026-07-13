import React from "react";
import type { Player } from "../types";

interface OpponentSeatProps {
  opponent: Player;
  isOppTurn: boolean;
  isTargetingMode: boolean;
  onSelectTargetCard?: (cardId: string) => void;
  label?: string; // e.g. "Top", "Left", "Right"
}

export const OpponentSeat: React.FC<OpponentSeatProps> = ({
  opponent,
  isOppTurn,
  isTargetingMode,
  onSelectTargetCard,
  label,
}) => {
  return (
    <div
      className={`px-3 py-1.5 rounded-2xl border transition-all duration-300 transform shadow-lg max-w-37.5 select-none ${
        isOppTurn
          ? "bg-amber-950/80 border-amber-400 scale-105"
          : "bg-slate-950/80 border-slate-800"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <div
          className={`w-1.5 h-1.5 rounded-full ${isOppTurn ? "bg-amber-400" : "bg-slate-600"}`}
        />
        <span className="text-[10px] font-black text-slate-200 uppercase tracking-wide truncate">
          {opponent.name} {label ? `(${label})` : ""}
        </span>
      </div>

      {/* 🏠 Grid tracking clickable target squares */}
      <div className="flex flex-wrap gap-1 mt-1.5 border-t border-slate-900 pt-1">
        {Object.entries(opponent.propertySets).map(([color, set]) =>
          set.cards.map((card, cIdx) => (
            <button
              key={`${card.id}-${cIdx}`}
              disabled={!isTargetingMode}
              onClick={() => onSelectTargetCard?.(card.id)}
              className={`w-3 h-4 rounded border transition-all ${
                isTargetingMode
                  ? "border-blue-400 scale-110 hover:scale-125 cursor-pointer ring-1 ring-blue-500 shadow-md"
                  : "border-transparent opacity-80"
              }`}
              style={{
                backgroundColor:
                  color === "darkblue"
                    ? "#1e40af"
                    : color === "lightblue"
                      ? "#38bdf8"
                      : color,
              }}
            />
          )),
        )}
        {Object.keys(opponent.propertySets).length === 0 && (
          <span className="text-[7px] font-bold text-slate-600 italic">
            No Assets
          </span>
        )}
      </div>
    </div>
  );
};
