import React from "react";
import { User, Layers, Landmark } from "lucide-react";
import type { Player } from "../types";

interface OpponentPlateProps {
  opponent: Player;
  isActive: boolean;
}

export const OpponentPlate: React.FC<OpponentPlateProps> = ({
  opponent,
  isActive,
}) => {
  // Simple calculation helper to grab an opponent's banked value
  const bankTotal = opponent.bank.reduce((sum, card) => sum + card.value, 0);

  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-300 ${
        isActive
          ? "bg-amber-950/20 border-amber-500 shadow-xl shadow-amber-950/40 animate-pulse"
          : "bg-slate-900 border-slate-800"
      }`}
    >
      {/* Header Info Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 max-w-[70%]">
          <div
            className={`p-1.5 rounded-lg ${isActive ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-slate-400"}`}
          >
            <User size={16} />
          </div>
          <span
            className={`text-sm font-black truncate ${isActive ? "text-amber-400" : "text-slate-200"}`}
          >
            {opponent.name}
          </span>
        </div>

        {isActive && (
          <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full tracking-wider uppercase">
            Thinking
          </span>
        )}
      </div>

      {/* Asset Values Counter Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs font-bold">
        <div className="flex items-center gap-1.5 text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
          <Layers size={14} className="text-slate-500" />
          <span>Hand: {opponent.hand.length}</span>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/20 p-2 rounded-lg border border-emerald-900/20">
          <Landmark size={14} className="text-emerald-500" />
          <span>Bank: {bankTotal}M</span>
        </div>
      </div>

      {/* Mini Color Strip of Played Properties */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap gap-1 min-h-[16px]">
        {Object.entries(opponent.propertySets).map(([color, set]) => {
          if (set.cards.length === 0) return null;

          return (
            <div
              key={color}
              className="w-3 h-5 rounded border border-slate-700/60 shadow-sm relative group"
              style={{
                backgroundColor:
                  color === "railroad"
                    ? "#334155"
                    : color === "utility"
                      ? "#854d0e"
                      : color,
              }}
              title={`${color} set: ${set.cards.length} cards`}
            >
              {/* Mini multiplier pill indicator */}
              <span className="absolute -bottom-1 -right-1 bg-slate-950 text-white font-mono text-[7px] w-3 h-3 rounded-full flex items-center justify-center scale-75 border border-slate-800">
                {set.cards.length}
              </span>
            </div>
          );
        })}
        {Object.values(opponent.propertySets).every(
          (set) => set.cards.length === 0,
        ) && (
          <span className="text-[10px] text-slate-600 font-medium italic">
            No assets down
          </span>
        )}
      </div>
    </div>
  );
};
