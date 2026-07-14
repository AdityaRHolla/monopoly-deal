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
  myOfferCardId,
  onSelectTargetCard,
}) => {
  if (!isOpen || !actionType) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-4 select-none overflow-y-auto">
      {/* Header Container */}
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            🎯 Select Theft Target ({actionType.replace("_", " ")})
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {actionType === "deal_breaker"
              ? "Choose any completed property set column from an opponent to orchestrate a heist."
              : "Tap any specific item or wildcard stack below to steal."}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Opponents Selection Matrix Loop */}
      <div className="max-w-4xl w-full mx-auto mt-6 space-y-6 pb-12">
        {opponents.map((opponent) => {
          const hasProps = Object.values(opponent.propertySets).some(
            (s) => s.cards.length > 0,
          );
          if (!hasProps) return null;

          return (
            <div
              key={opponent.id}
              className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4"
            >
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest bg-slate-950/60 inline-block px-3 py-1 rounded-full border border-slate-800 mb-4">
                👤 Opponent: {opponent.name}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(opponent.propertySets).map(([color, set]) => {
                  if (set.cards.length === 0) return null;

                  // Rule enforcement check for Deal Breakers
                  const isDealBreakerMismatch =
                    actionType === "deal_breaker" && !set.isComplete;
                  if (isDealBreakerMismatch) return null;

                  return (
                    <div
                      key={color}
                      className="bg-slate-950/60 border border-slate-900 rounded-xl p-3 flex flex-col gap-2 relative"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {color}
                        </span>
                        {set.isComplete && (
                          <span className="text-[6.5px] font-black bg-amber-950 text-amber-400 border border-amber-900/60 px-1 rounded uppercase tracking-tighter">
                            Set
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 items-end justify-start min-h-16 pt-1">
                        {set.cards.map((card, idx) => (
                          <div key={idx} className="relative group">
                            <GameCardView card={card} isCompact={true} />

                            {/* Standard Selector Action Button for Single Card Thefts */}
                            {actionType !== "deal_breaker" && (
                              <button
                                onClick={() => {
                                  onSelectTargetCard(card.id);
                                  onClose();
                                }}
                                className="absolute inset-0 bg-rose-600/90 hover:bg-rose-500 rounded opacity-0 group-hover:opacity-100 flex items-center justify-center text-[7px] text-white font-black uppercase cursor-pointer transition-opacity"
                              >
                                Steal Card
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Complete Column Heist Button Layer for Deal Breakers */}
                      {actionType === "deal_breaker" && (
                        <button
                          onClick={() => {
                            // Target any card in the set; the parent engine hooks safely extract the matching column color
                            if (set.cards[0])
                              onSelectTargetCard(set.cards[0].id);
                            onClose();
                          }}
                          className="w-full text-[8px] font-black uppercase tracking-wider py-1.5 rounded-lg bg-rose-950 border border-rose-500/40 text-rose-400 hover:bg-rose-600 hover:text-white transition-all cursor-pointer mt-1"
                        >
                          ⚡ Heist Whole Set
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
