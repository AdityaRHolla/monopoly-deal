import React, { useState } from "react";
import { RefreshCw, Shuffle } from "lucide-react";
import { GameCardView } from "./GameCardView";
import { OpponentSeat } from "./OpponentSeat";
import { PokerChips } from "./PokerChips";
import type { GameRoom, Player } from "../types";

interface CardTableProps {
  gameState: GameRoom;
  activePlayer: Player | undefined;
  isMyTurn: boolean;
  hasActivePayment: boolean;
  opponents: Player[];
  me: Player | undefined;
  iOweMoney: boolean;
  onPayDebt: (cardId: string, source: "bank" | "property") => void;
  onReorganizeWildcard?: (
    cardId: string,
    fromColor: string,
    toColor: string,
  ) => void;
  isTargetingMode?: boolean;
  onSelectTargetCard?: (cardId: string) => void;
  doubleRentActive?: boolean;
  activeBuildingCardId?: string | null;
  buildingType?: "house" | "hotel" | null;
  onBuildModifier?: (targetColor: string) => void;
  onDropOnBankVault?: () => void;
}

export const CardTable: React.FC<CardTableProps> = ({
  gameState,
  activePlayer,
  isMyTurn,
  hasActivePayment,
  opponents,
  me,
  iOweMoney,
  onPayDebt,
  onReorganizeWildcard,
  isTargetingMode = false,
  onSelectTargetCard,
  doubleRentActive,
  activeBuildingCardId,
  buildingType,
  onBuildModifier,
  onDropOnBankVault,
}) => {
  const [activeWildcardId, setActiveWildcardId] = useState<string | null>(null);
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

  // Positional allocations matching the drawing model
  const leftOpp = opponents[0];
  const topOpp = opponents[1];
  const rightOpp = opponents[2];

  return (
    <div className="w-full max-w-5xl h-[44vh] sm:h-[55vh] bg-blue-600 rounded-[40px] sm:rounded-[100px] border-4 sm:border-8 border-slate-800 shadow-2xl relative p-2 sm:p-4 flex flex-col justify-between items-center group overflow-hidden">
      {/* 🎰 Visual Felt Canvas Background Textures */}
      <div className="absolute inset-0 bg-linear-to-b from-blue-600 via-blue-500 to-blue-700 shadow-inner -z-10" />

      {/* ==================================================== */}
      {/* 👥 OPPONENT SEAT POSITION PLACEMENTS                 */}
      {/* ==================================================== */}
      {topOpp && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
          <OpponentSeat
            opponent={topOpp}
            isOppTurn={activePlayer?.id === topOpp.id}
            isTargetingMode={isTargetingMode}
            onSelectTargetCard={onSelectTargetCard}
            label="Top"
          />
        </div>
      )}

      {leftOpp && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
          <OpponentSeat
            opponent={leftOpp}
            isOppTurn={activePlayer?.id === leftOpp.id}
            isTargetingMode={isTargetingMode}
            onSelectTargetCard={onSelectTargetCard}
            label="Left"
          />
        </div>
      )}

      {rightOpp && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
          <OpponentSeat
            opponent={rightOpp}
            isOppTurn={activePlayer?.id === rightOpp.id}
            isTargetingMode={isTargetingMode}
            onSelectTargetCard={onSelectTargetCard}
            label="Right"
          />
        </div>
      )}

      {/* ==================================================== */}
      {/* 🃏 DRAW & DISCARD CORE TRACKERS                      */}
      {/* ==================================================== */}
      <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-4 sm:gap-6 bg-slate-950/40 p-2 sm:p-3 rounded-2xl border border-white/5 backdrop-blur-sm shadow-2xl">
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-18 bg-linear-to-br from-red-600 to-red-950 border border-slate-200 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-[6px] font-black text-white/80 tracking-widest uppercase transform -rotate-12">
              DECK
            </span>
          </div>
          <span className="text-[8px] font-bold text-slate-400 font-mono">
            {gameState.deck.length} Left
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          {gameState.discardPile.length > 0 ? (
            <div className="scale-50 origin-bottom -my-9">
              <GameCardView
                card={gameState.discardPile[gameState.discardPile.length - 1]}
                isCompact={true}
              />
            </div>
          ) : (
            <div className="w-12 h-18 border border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-[7px] font-bold text-white/20 gap-0.5">
              <RefreshCw size={10} />
              <span>EMPTY</span>
            </div>
          )}
          <span className="text-[8px] font-bold text-slate-400 font-mono">
            DISCARD ({gameState.discardPile.length})
          </span>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 👑 USER TABLE ASSETS ROW BLOCK                       */}
      {/* ==================================================== */}
      <div className="w-full mt-auto flex items-end justify-between px-6 pb-2 border-t border-white/5 pt-3 bg-black/10 rounded-b-[100px]">
        {/* Cash vault tray section */}
        <div className="flex flex-col items-start gap-1 max-w-45">
          <span className="text-[8px] font-black text-emerald-300 uppercase tracking-widest flex items-center gap-1">
            🏦 Bank Vault
          </span>
          <div className="flex gap-1 overflow-x-auto max-w-40 pb-1">
            {me?.bank.map((card, idx) => (
              <button
                key={idx}
                disabled={!iOweMoney}
                onClick={() => onPayDebt(card.id, "bank")}
                className={`shrink-0 px-2 py-1 border rounded-lg font-mono font-black text-[9px] ${iOweMoney ? "bg-red-900 border-red-400 text-white animate-pulse" : "bg-slate-900 border-slate-800 text-emerald-400"}`}
              >
                {card.value}M
              </button>
            ))}
          </div>
        </div>

        {/* Turn state notifier ticker */}
        <div className="text-center pb-1">
          <p className="text-[9px] font-black tracking-widest text-slate-300 uppercase">
            {isMyTurn
              ? "🌟 YOUR TURN"
              : activePlayer
                ? `🧠 ${activePlayer.name}'s Move`
                : ""}
            {doubleRentActive && (
              <div className="text-[7px] font-black tracking-widest text-red-400 bg-red-950/80 px-2 py-0.5 rounded-md border border-red-500/40 mt-0.5 animate-pulse uppercase">
                💥 2X Rent Active
              </div>
            )}
          </p>
          {isMyTurn && !hasActivePayment && (
            <div className="text-[8px] font-black text-amber-400 uppercase tracking-wide bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-900 mt-0.5">
              Actions: {gameState.actionsLeft} / 3
            </div>
          )}
        </div>

        {/* Modular property sets matching drawing profile */}
        <div className="flex gap-2 overflow-x-auto max-w-112.5 pb-1 items-end">
          {Object.entries(me?.propertySets || {}).map(([color, set]) => {
            if (set.cards.length === 0) return null;
            const hasHouse = set.cards.some(
              (c: any) => c.type === "action" && c.actionType === "house",
            );
            const hasHotel = set.cards.some(
              (c: any) => c.type === "action" && c.actionType === "hotel",
            );
            const isEligible =
              set.isComplete &&
              color !== "railroad" &&
              color !== "utility" &&
              !!activeBuildingCardId;
            let showBuildOverlay = false;
            if (isEligible && buildingType === "house" && !hasHouse)
              showBuildOverlay = true;
            if (isEligible && buildingType === "hotel" && hasHouse && !hasHotel)
              showBuildOverlay = true;

            return (
              <div
                key={color}
                className="flex flex-col gap-1 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800 max-w-21.25 relative"
              >
                {showBuildOverlay && onBuildModifier && (
                  <button
                    onClick={() => onBuildModifier(color)}
                    className="absolute inset-0 z-30 bg-amber-500/90 border border-amber-400 rounded-lg flex flex-col items-center justify-center text-slate-950 font-black text-[8px] uppercase tracking-wider shadow-2xl animate-pulse cursor-pointer"
                  >
                    <span>🏗️ Build</span>
                    <span className="text-[6px] font-mono opacity-80 mt-0.5">
                      {buildingType}
                    </span>
                  </button>
                )}
                {/* 🔌 PLUGGED MODULAR POKER CHIPS DISPLAY ROW LINK */}
                <PokerChips cardCount={set.cards.length} color={color} />

                <div className="flex flex-col gap-0.5 max-h-20 overflow-visible">
                  {set.cards.map((c, idx) => (
                    <div
                      key={idx}
                      className="scale-75 origin-top -my-3 first:mt-0 last:mb-0 relative group"
                    >
                      <GameCardView card={c} isCompact={true} />
                      {isMyTurn &&
                        c.type === "wildcard" &&
                        onReorganizeWildcard && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveWildcardId(
                                activeWildcardId === c.id ? null : c.id,
                              );
                            }}
                            className="absolute top-0.5 right-0.5 p-0.5 bg-slate-900 border border-slate-700 text-blue-400 rounded z-20 cursor-pointer scale-75"
                          >
                            <Shuffle size={8} />
                          </button>
                        )}
                      {activeWildcardId === c.id && (
                        <div className="absolute inset-x-0.5 top-4 bg-slate-950 border border-blue-900 rounded p-0.5 z-30 flex flex-col gap-0.5 max-h-12.5 overflow-y-auto">
                          {allGameColors
                            .filter((t) => t !== color)
                            .map((targetColor) => (
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
                                className="w-full text-[6px] py-0.5 px-0.5 bg-slate-900 border border-slate-800 text-slate-300 text-left truncate hover:bg-blue-600 hover:text-white uppercase font-black"
                              >
                                ➡️ {targetColor}
                              </button>
                            ))}
                        </div>
                      )}
                      {iOweMoney && (
                        <button
                          onClick={() => onPayDebt(c.id, "property")}
                          className="absolute inset-0 bg-red-950/90 border-2 border-red-500 rounded-md flex items-center justify-center text-white font-black text-[7px] uppercase tracking-wider shadow opacity-90 cursor-pointer z-10"
                        >
                          Pay
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
