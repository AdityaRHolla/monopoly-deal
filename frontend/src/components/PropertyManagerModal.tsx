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

  // Wires to support the trade offer workflow
  activeStealCardId: string | null;
  meHand: any[] | undefined;
  onSelectMyOffer: (cardId: string) => void;
}

export const PropertyManagerModal: React.FC<PropertyManagerModalProps> = ({
  isOpen,
  onClose,
  me,
  isMyTurn,
  onReorganizeWildcard,
  activeStealCardId,
  meHand,
  onSelectMyOffer,
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

  // Detect if we are currently looking for a Forced Deal offer
  const activeActionCard = meHand?.find((c) => c.id === activeStealCardId);
  const isForcedDealSelectionMode =
    activeActionCard?.actionType === "forced_deal";

  return (
    <div className="fixed inset-0 z-50 bg-red-950/95 backdrop-blur-sm flex flex-col p-4 select-none overflow-y-auto border-4 border-amber-500 rounded-3xl m-2 sm:m-4 shadow-2xl">
      {/* Header Container */}
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto pb-4 border-b border-amber-500/30">
        <div>
          <h2 className="text-base font-black text-amber-400 uppercase tracking-wider">
            {isForcedDealSelectionMode
              ? "🤝 Forced Deal: Select Your Trade Offer"
              : "🏛️ Real Estate Portfolio Manager"}
          </h2>
          <p className="text-[10px] text-amber-200/70 mt-0.5 font-medium">
            {isForcedDealSelectionMode
              ? "Tap the gold button on any of your properties below to offer it in the trade swap."
              : "Manage your assets, flip wildcards, and monitor your color columns."}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-amber-500 hover:bg-amber-400 text-red-950 font-black rounded-xl cursor-pointer shadow-lg transition-transform active:scale-95"
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
              className="bg-linear-to-b from-red-900/40 to-red-950/60 border border-amber-500/20 rounded-2xl p-4 flex flex-col gap-3 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                <span className="text-[11px] font-black uppercase text-amber-300 tracking-wide flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white/20" />
                  {color}
                </span>
                <span
                  className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
                    set.isComplete
                      ? "bg-amber-400 text-red-950 border-amber-300"
                      : "bg-red-950/80 border-amber-500/10 text-amber-400/60"
                  }`}
                >
                  {set.isComplete
                    ? "👑 COMPLETE SET"
                    : `${set.cards.length} CARDS`}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 items-center justify-start p-2 bg-red-950/60 border border-red-950 rounded-xl min-h-24 shadow-inner">
                {set.cards.map((card, idx) => {
                  const isWild = card.type === "wildcard";
                  const availableColors: string[] =
                    (card as any).colorsAvailable || [];

                  const isCompleteWild =
                    isWild && (card as any).isCompleteWild === true;

                  return (
                    <div
                      key={idx}
                      className="relative group p-1 bg-red-900/20 border border-amber-500/10 rounded-lg flex flex-col items-center gap-1.5 shadow-sm"
                    >
                      <GameCardView card={card} isCompact={false} />

                      {/* TRADE INTERCEPT MODE BUTTON */}
                      {isMyTurn && isForcedDealSelectionMode ? (
                        <button
                          onClick={() => onSelectMyOffer(card.id)}
                          className="w-full text-[7px] py-1 bg-linear-to-r from-amber-400 to-yellow-500 text-red-950 rounded font-black uppercase text-center cursor-pointer shadow active:scale-95 transition-all mt-1 border border-amber-300"
                        >
                          Offer This Card
                        </button>
                      ) : (
                        /* Standard Reorganization Flip Toggles when not trading */
                        isMyTurn &&
                        isWild &&
                        onReorganizeWildcard && (
                          <div className="flex flex-col gap-1 w-full mt-1">
                            {isCompleteWild ? (
                              /* 🌟 If it's a 10-color wildcard, we DO use allGameColors to show all choices */
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-[6px] font-bold text-amber-400/60 uppercase font-mono">
                                  Any Set:
                                </span>
                                <div className="flex flex-wrap gap-0.5 justify-center max-w-24">
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
                                        className="text-[5.5px] px-1 py-0.5 bg-red-950 hover:bg-amber-500 text-amber-300 hover:text-red-950 border border-amber-500/20 rounded font-black uppercase truncate max-w-10 cursor-pointer transition-colors"
                                      >
                                        {targetColor.substring(0, 3)}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            ) : (
                              /* 🔄 If it's a standard dual-color wildcard, we skip the 10 colors and just show the single alternative flip option */
                              availableColors
                                .filter((t) => t !== color)
                                .map((altColor) => (
                                  <button
                                    key={altColor}
                                    onClick={() =>
                                      onReorganizeWildcard(
                                        card.id,
                                        color,
                                        altColor,
                                      )
                                    }
                                    className="w-full text-[7px] py-1 px-1.5 bg-linear-to-r from-amber-500 to-yellow-400 text-red-950 hover:from-amber-400 hover:to-yellow-300 rounded font-black uppercase flex items-center justify-center gap-1 cursor-pointer shadow active:scale-95 transition-all"
                                  >
                                    <span>Flip to {altColor}</span>
                                  </button>
                                ))
                            )}
                          </div>
                        )
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
