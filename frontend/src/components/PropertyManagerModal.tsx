import React from "react";
import { X } from "lucide-react";
import { GameCardView } from "./GameCardView";
import type { Player } from "../types";

interface PropertyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  me: Player | undefined;
  isMyTurn: boolean;
  onReorganizeWildcard?: (
    cardId: string,
    fromColor: string,
    toColor: string,
  ) => void;
}

export const PropertyManagerModal: React.FC<PropertyManagerModalProps> = ({
  isOpen,
  onClose,
  me,
  isMyTurn,
  onReorganizeWildcard,
}) => {
  if (!isOpen || !me) return null;

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
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-4 select-none overflow-y-auto">
      {/* Header Container */}
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-black text-slate-100 uppercase tracking-wider">
            🏛️ Real Estate Portfolio Manager
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Flip wildcards, audit completed sets, and manage your assets safely.
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl w-full mx-auto mt-6 pb-8">
        {Object.entries(me.propertySets).map(([color, set]) => {
          if (set.cards.length === 0) return null;

          return (
            <div
              key={color}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3"
            >
              {/* Header Meta Data */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-[11px] font-black uppercase text-slate-200 tracking-wide flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      color === "darkblue"
                        ? "bg-blue-600"
                        : color === "green"
                          ? "bg-emerald-600"
                          : color === "yellow"
                            ? "bg-amber-400"
                            : color === "red"
                              ? "bg-red-600"
                              : color === "orange"
                                ? "bg-orange-500"
                                : color === "pink"
                                  ? "bg-pink-500"
                                  : color === "lightblue"
                                    ? "bg-sky-400"
                                    : color === "brown"
                                      ? "bg-amber-900"
                                      : color === "railroad"
                                        ? "bg-zinc-700"
                                        : "bg-lime-500"
                    }`}
                  />
                  {color}
                </span>
                <span
                  className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
                    set.isComplete
                      ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-400 animate-pulse"
                      : "bg-slate-950 border-slate-800 text-slate-500"
                  }`}
                >
                  {set.isComplete
                    ? "💎 COMPLETE SET"
                    : `${set.cards.length} CARDS`}
                </span>
              </div>

              {/* Cards Grid Box */}
              <div className="flex flex-wrap gap-2 items-center justify-start p-2 bg-slate-950/40 border border-slate-950 rounded-xl min-h-24">
                {set.cards.map((card, idx) => (
                  <div
                    key={idx}
                    className="relative group p-1 bg-slate-900/40 border border-slate-800/40 rounded-lg flex flex-col items-center gap-1.5 shadow"
                  >
                    <GameCardView card={card} isCompact={false} />

                    {/* Inline Flip Button Trigger Row */}
                    {isMyTurn &&
                      card.type === "wildcard" &&
                      onReorganizeWildcard && (
                        <div className="flex flex-col gap-1 w-full mt-1">
                          <span className="text-[7px] text-slate-500 text-center font-bold font-mono">
                            Move To:
                          </span>
                          <div className="flex flex-wrap gap-1 justify-center max-w-24">
                            {allGameColors
                              .filter((t) => t !== color)
                              .map((targetColor) => (
                                <button
                                  key={targetColor}
                                  onClick={() =>
                                    onReorganizeWildcard(
                                      card.id,
                                      color,
                                      targetColor,
                                    )
                                  }
                                  className="text-[6px] px-1 py-0.5 bg-slate-950 hover:bg-blue-600 border border-slate-800 text-slate-300 rounded font-black uppercase truncate max-w-12 cursor-pointer"
                                >
                                  {targetColor.substring(0, 3)}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
