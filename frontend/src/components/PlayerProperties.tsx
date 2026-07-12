import React, { useState } from "react";
import { GameCardView } from "./GameCardView";
import { RefreshCw } from "lucide-react";
import type { Player } from "../types";

interface PlayerPropertiesProps {
  propertySets: Player["propertySets"];
  iOweMoney: boolean;
  onPayDebt: (cardId: string, source: "bank" | "property") => void;
  onReorganizeWildcard?: (
    cardId: string,
    fromColor: string,
    toColor: string,
  ) => void;
  isMyTurn?: boolean;
}

export const PlayerProperties: React.FC<PlayerPropertiesProps> = ({
  propertySets,
  iOweMoney,
  onPayDebt,
  onReorganizeWildcard,
  isMyTurn = false,
}) => {
  const [activeWildcardId, setActiveWildcardId] = useState<string | null>(null);
  const hasProperties = Object.values(propertySets).some(
    (set) => set.cards.length > 0,
  );

  // All 10 valid target color rows for the 0M complete multicolor wild card option
  const allGameColors = [
    "darkblue",
    "green",
    "yellow",
    "red",
    "orange",
    "pink",
    "lightblue",
    "brown",
    "railroad",
    "utility",
  ];

  return (
    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-3xl shadow-xl h-full backdrop-blur-sm relative">
      <span className="text-xs font-black text-blue-400 mb-3 block uppercase tracking-widest border-b border-slate-900/60 pb-2">
        🏠 Your Real Estate Columns
      </span>

      <div className="flex flex-wrap gap-4 min-h-35 bg-slate-950/40 p-3 rounded-2xl border border-slate-900/40 items-start justify-start overflow-x-auto">
        {Object.entries(propertySets).map(([color, set]) => {
          if (set.cards.length === 0) return null;

          return (
            <div
              key={color}
              className="flex flex-col gap-2 bg-slate-900/40 border border-slate-800/60 p-2 rounded-xl shadow-inner min-w-27.5 relative"
            >
              <div className="text-[8px] font-black uppercase text-center text-white px-2 py-1 rounded-md tracking-wider bg-slate-800 border border-slate-700/60">
                {color}
              </div>

              <div className="flex flex-col gap-1 mt-1">
                {set.cards.map((c, idx) => {
                  const isWildcard = c.type === "wildcard";
                  const isMenuOpen = activeWildcardId === c.id;

                  // Determine available target colors based on card metadata
                  const isCompleteWild = (c as any).isCompleteWild === true;
                  const colorsAvailable = isCompleteWild
                    ? allGameColors
                    : (c as any).colorsAvailable || [];

                  return (
                    <div
                      key={`${c.id}-${idx}`}
                      className="relative group transition-transform duration-200"
                    >
                      <div className="scale-90 origin-top">
                        <GameCardView card={c} />
                      </div>

                      {/* 🔄 FREE WILDCARD FLIP ICON TRIGGER BUTTON */}
                      {isMyTurn &&
                        isWildcard &&
                        !iOweMoney &&
                        onReorganizeWildcard && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveWildcardId(isMenuOpen ? null : c.id);
                            }}
                            className="absolute top-1 right-2 p-1 bg-slate-950/90 border border-slate-800 hover:border-blue-500 text-blue-400 rounded-lg shadow-md transition-all active:scale-90 z-20 cursor-pointer"
                            title="Flip / Reassign Wildcard Color Group"
                          >
                            <RefreshCw
                              size={10}
                              className={isMenuOpen ? "animate-spin" : ""}
                            />
                          </button>
                        )}

                      {/* 📋 INLINE QUICK DROP-DOWN SELECTOR PANEL */}
                      {isMenuOpen && (
                        <div className="absolute inset-x-1 top-6 bg-slate-950/95 border border-blue-900 rounded-xl p-1.5 shadow-2xl z-30 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150 max-h-27.5 overflow-y-auto">
                          <p className="text-[7px] font-black uppercase text-slate-500 tracking-wider text-center border-b border-slate-900 pb-0.5">
                            Move To:
                          </p>
                          {colorsAvailable
                            .filter(
                              (targetColor: string) => targetColor !== color,
                            )
                            .map((targetColor: string) => (
                              <button
                                key={targetColor}
                                onClick={() => {
                                  onReorganizeWildcard?.(
                                    c.id,
                                    color,
                                    targetColor,
                                  );
                                  setActiveWildcardId(null);
                                }}
                                className="w-full text-[8px] font-black uppercase py-0.5 px-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-blue-600 hover:text-white text-left transition-colors truncate"
                              >
                                🎨 {targetColor}
                              </button>
                            ))}
                        </div>
                      )}

                      {iOweMoney && (
                        <button
                          onClick={() => onPayDebt(c.id, "property")}
                          className="absolute inset-x-1 inset-y-2 bg-red-950/90 border border-red-500 rounded-xl flex items-center justify-center text-white font-black text-[9px] uppercase tracking-wider shadow-xl opacity-90 hover:opacity-100 transition-opacity cursor-pointer z-10"
                        >
                          Surrender
                        </button>
                      )}
                    </div>
                  );
                })}
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
