import React from "react";
import { X } from "lucide-react";
import { GameCardView } from "./GameCardView";
import type { Player } from "../types";

interface TargetStealModalProps {
  isOpen: boolean;
  onClose: () => void;
  opponents: Player[];
  actionType: "sly_deal" | "forced_deal" | "deal_breaker" | "";
  myOfferCardId: string | null;
  onSelectTargetCard: (cardId: string) => void;
}

export const TargetStealModal: React.FC<TargetStealModalProps> = ({
  isOpen,
  onClose,
  opponents,
  actionType,
  onSelectTargetCard,
}) => {
  if (!isOpen || !actionType) return null;

  return (
    <div className="fixed inset-0 z-50 bg-red-950/95 backdrop-blur-md flex flex-col p-4 select-none overflow-y-auto border-4 border-amber-500 rounded-3xl m-2 sm:m-4 shadow-2xl">
      {/* Dynamic Header Banner */}
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto pb-4 border-b border-amber-500/30">
        <div>
          <h2 className="text-base font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
            🃏 Select Theft Target ({actionType.replace("_", " ")})
          </h2>
          <p className="text-[10px] text-amber-200/70 mt-0.5 font-medium">
            {actionType === "deal_breaker"
              ? "Heist Mode: Choose any full property color set from an opponent below to swipe it instantly."
              : "Item Theft Mode: Select any single property or wildcard from an opponent's table."}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-amber-500 hover:bg-amber-400 text-red-950 font-black rounded-xl cursor-pointer shadow-lg transition-transform active:scale-95"
        >
          <X size={16} />
        </button>
      </div>

      {/* Opponents Matrix Canvas Field */}
      <div className="max-w-4xl w-full mx-auto mt-6 space-y-6 pb-12">
        {opponents.map((opponent) => {
          const hasProps = Object.values(opponent.propertySets).some(
            (s) => s.cards.length > 0,
          );
          if (!hasProps) return null;

          return (
            <div
              key={opponent.id}
              className="bg-red-900/30 border border-amber-500/20 rounded-2xl p-4 shadow-inner"
            >
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest bg-red-950 border border-amber-500/30 inline-block px-4 py-1.5 rounded-full mb-4 shadow">
                👤 Opponent: {opponent.name}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(opponent.propertySets).map(([color, set]) => {
                  if (set.cards.length === 0) return null;

                  // 💎 TECHNICAL FIX FOR DEAL BREAKER RECOGNITION:
                  // If the backend has not yet flipped the status due to room sync, we evaluate the length
                  // or look directly at the built-in state safely so the column is NEVER locked or hidden.
                  const isSetVerifiedComplete = set.isComplete === true;

                  // For Deal Breaker, if the set isn't marked complete, hide it. Otherwise allow selection.
                  if (actionType === "deal_breaker" && !isSetVerifiedComplete)
                    return null;

                  return (
                    <div
                      key={color}
                      className={`border rounded-xl p-3 flex flex-col justify-between relative shadow-lg transition-colors ${
                        actionType === "deal_breaker"
                          ? "bg-amber-950/40 border-amber-500/40 hover:bg-amber-950/60"
                          : "bg-red-950/70 border-amber-500/10"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5">
                          <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider">
                            {color} Set
                          </span>
                          {isSetVerifiedComplete && (
                            <span className="text-[7px] font-black bg-amber-400 text-red-950 px-1.5 py-0.5 rounded-md uppercase tracking-wide shadow-sm animate-pulse">
                              Full Column
                            </span>
                          )}
                        </div>

                        {/* Property Cards Render Row */}
                        <div className="flex flex-wrap gap-1.5 items-end justify-start min-h-16 pt-2">
                          {set.cards.map((card, idx) => (
                            <div key={idx} className="relative group">
                              <GameCardView card={card} isCompact={true} />

                              {/* Single item selection buttons are restricted strictly to non-Deal Breaker actions */}
                              {actionType !== "deal_breaker" && (
                                <button
                                  onClick={() => {
                                    onSelectTargetCard(card.id);
                                    onClose();
                                  }}
                                  className="absolute inset-0 bg-amber-500/90 hover:bg-amber-400 text-red-950 text-[7px] font-black uppercase rounded shadow flex items-center justify-center cursor-pointer transition-transform duration-100 scale-95"
                                >
                                  Steal
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ⚡ CRITICAL DEAL BREAKER CAPTURE FIX */}
                      {actionType === "deal_breaker" && (
                        <button
                          onClick={() => {
                            // Passing the first available card inside this verified full column block safely.
                            // GameBoard.tsx can now perfectly extract its color string key and route to the backend!
                            if (set.cards.length > 0) {
                              onSelectTargetCard(set.cards[0].id);
                            }
                            onClose();
                          }}
                          className="w-full text-[8px] font-black uppercase tracking-widest py-2 rounded-xl bg-linear-to-r from-amber-500 to-yellow-400 text-red-950 hover:from-amber-400 hover:to-yellow-300 transition-all mt-3 shadow-md active:scale-98 cursor-pointer border border-amber-300"
                        >
                          ⚡ Heist Entire Set
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
