import React from "react";
import { GameCard } from "./GameCard";
import type { Player } from "../types";

interface PropertySectionProps {
  propertySets: Player["propertySets"];
  iOweMoney: boolean;
  onPayDebt: (cardId: string, source: "bank" | "property") => void;
}

export const PropertySection: React.FC<PropertySectionProps> = ({
  propertySets,
  iOweMoney,
  onPayDebt,
}) => {
  const hasProperties = Object.values(propertySets).some(
    (set) => set.cards.length > 0,
  );

  return (
    <div className="p-4 bg-slate-900/60 border border-slate-900 rounded-2xl shadow-xl h-full">
      {/* Structural section title header descriptor text */}
      <span className="text-xs font-black text-blue-400 mb-3 block uppercase tracking-wider">
        🏠 Your Properties Board Lots
      </span>

      {/* Layout content card container column */}
      <div className="flex flex-wrap gap-4 min-h-15 bg-slate-950/40 p-3 rounded-xl border border-slate-900/40 items-center justify-start">
        {Object.entries(propertySets).map(([color, set]) => {
          if (set.cards.length === 0) return null;

          return (
            <div
              key={color}
              className="flex flex-col gap-1.5 bg-slate-900/80 border border-slate-800 p-2 rounded-xl shadow-md"
            >
              {/* Colored pillar title block indicator banner */}
              <div className="text-[9px] font-black uppercase text-center text-white px-2 py-0.5 rounded-md bg-slate-700 tracking-wider">
                {color}
              </div>

              {/* Stacked layout items wrapper block row */}
              <div className="flex gap-1.5 mt-1">
                {set.cards.map((c, idx) => (
                  <div
                    key={`${c.id}-${idx}`}
                    className="scale-90 origin-top-left -mr-4 last:mr-0 relative group"
                  >
                    <GameCard card={c} />

                    {/* Dark red blocking layout action veil button if player owes cash debt */}
                    {iOweMoney && (
                      <button
                        onClick={() => onPayDebt(c.id, "property")}
                        className="absolute inset-0 bg-red-950/90 border-2 border-red-500 rounded-xl flex items-center justify-center text-white font-black text-[11px] uppercase tracking-wider shadow-lg opacity-80 hover:opacity-100 transition-all duration-200 cursor-pointer"
                      >
                        Surrender
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {!hasProperties && (
          <span className="text-xs font-medium text-slate-600 m-auto italic">
            No real estate claims on the board yet
          </span>
        )}
      </div>
    </div>
  );
};
