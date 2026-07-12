import React from "react";
import { GameCardView } from "./GameCardView";
import type { Player } from "../types";

interface PlayerPropertiesProps {
  propertySets: Player["propertySets"];
  iOweMoney: boolean;
  onPayDebt: (cardId: string, source: "bank" | "property") => void;
}

export const PlayerProperties: React.FC<PlayerPropertiesProps> = ({
  propertySets,
  iOweMoney,
  onPayDebt,
}) => {
  const hasProperties = Object.values(propertySets).some(
    (set) => set.cards.length > 0,
  );

  return (
    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-3xl shadow-xl h-full backdrop-blur-sm">
      {/* Dynamic Title Indicator */}
      <span className="text-xs font-black text-blue-400 mb-3 block uppercase tracking-widest border-b border-slate-900/60 pb-2">
        🏠 Your Real Estate Columns
      </span>

      {/* Horizontal Flex Grid to manage vertical property pillars */}
      <div className="flex flex-wrap gap-4 min-h-35 bg-slate-950/40 p-3 rounded-2xl border border-slate-900/40 items-start justify-start overflow-x-auto">
        {Object.entries(propertySets).map(([color, set]) => {
          if (set.cards.length === 0) return null;

          return (
            <div
              key={color}
              className="flex flex-col gap-2 bg-slate-900/40 border border-slate-800/60 p-2 rounded-xl shadow-inner min-w-27.5"
            >
              {/* Core Color Strip Header */}
              <div className="text-[8px] font-black uppercase text-center text-white px-2 py-1 rounded-md tracking-wider bg-slate-800 border border-slate-700/60">
                {color}
              </div>

              {/* Overlapping Stacking layout drawer */}
              <div className="flex flex-col gap-1 mt-1">
                {set.cards.map((c, idx) => (
                  <div
                    key={`${c.id}-${idx}`}
                    className="relative group transition-transform duration-200 hover:-translate-y-2"
                  >
                    {/* Scale-down adjustment to keep stacked lists tight on-screen */}
                    <div className="scale-90 origin-top">
                      <GameCardView card={c} />
                    </div>

                    {/* Absolute Payment Trigger Overlay Veil */}
                    {iOweMoney && (
                      <button
                        onClick={() => onPayDebt(c.id, "property")}
                        className="absolute inset-x-1 inset-y-2 bg-red-950/90 border border-red-500 rounded-xl flex items-center justify-center text-white font-black text-[9px] uppercase tracking-wider shadow-xl opacity-90 hover:opacity-100 transition-opacity cursor-pointer z-10"
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
          <span className="text-xs font-medium text-slate-600 m-auto italic tracking-wide">
            No real estate claims deployed on the table
          </span>
        )}
      </div>
    </div>
  );
};
