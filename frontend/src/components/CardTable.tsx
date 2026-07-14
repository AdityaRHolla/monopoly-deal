import React from "react";
// import { RefreshCw } from "lucide-react";
// import { GameCardView } from "./GameCardView";
import { OpponentSeat } from "./OpponentSeat";
// import { PokerChips } from "./PokerChips";
import type { GameRoom, Player } from "../types";
// import { PropertySetColumn } from "./PropertySetColumn";
import { BankVaultTray } from "./BankVaultTray";
import { CenterDeckField } from "./CenterDeckField";

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

  // 🚀 PRECISE DND PIPELINES
  onDropOnBankVault?: (cardId: string) => void;
  onDropOnPropertySet?: (cardId: string, targetColor?: string) => void;
  onDropOnCenterFelt?: (cardId: string) => void;
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
  // onReorganizeWildcard,
  isTargetingMode = false,
  onSelectTargetCard,
  doubleRentActive,
  // activeBuildingCardId,
  // buildingType,
  // onBuildModifier,
  onDropOnBankVault,
  // onDropOnPropertySet,
  onDropOnCenterFelt,
}) => {
  // const [activeWildcardId, setActiveWildcardId] = useState<string | null>(null);

  // const allGameColors = [
  //   "darkblue",
  //   "green",
  //   "yellow",
  //   "red",
  //   "orange",
  //   "pink",
  //   "lightblue",
  //   "brown",
  //   "railroad",
  //   "utility",
  // ];

  const leftOpp = opponents[0];
  const topOpp = opponents[1];
  const rightOpp = opponents[2];

  // 🛡️ REJECT BROWSER BLOCK ACTION HELPERS
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getCardId = (e: React.DragEvent): string => {
    return (
      e.dataTransfer.getData("text/plain") || e.dataTransfer.getData("cardId")
    );
  };

  // const getCardIdFromPayload = (e: React.DragEvent): string => {
  //   return (
  //     e.dataTransfer.getData("text/plain") || e.dataTransfer.getData("cardId")
  //   );
  // };

  return (
    <div
      className="w-full max-w-5xl h-[44vh] sm:h-[55vh] bg-blue-600 rounded-[40px] sm:rounded-[100px] border-4 sm:border-8 border-slate-800 shadow-2xl relative p-2 sm:p-4 flex flex-col justify-between items-center group overflow-hidden"
      // 🎯 ZONE 1: OPEN CENTER FELT DROP TARGET
      onDragOver={handleDragOver}
      onDrop={(e) => {
        // Prevent event bubbles from nested elements triggering duplicate table matches
        if (e.target !== e.currentTarget) return;
        const id = getCardId(e);
        if (id && onDropOnCenterFelt) onDropOnCenterFelt(id);
      }}
    >
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
      <CenterDeckField
        gameState={gameState}
        onDropOnCenterFelt={onDropOnCenterFelt}
      />

      {/* ==================================================== */}
      {/* 👑 USER TABLE ASSETS ROW BLOCK                       */}
      {/* ==================================================== */}
      <div className="w-full mt-auto flex items-end justify-between px-6 pb-2 border-t border-white/5 pt-3 bg-black/10 rounded-b-[100px]">
        {/* Cash vault tray section */}
        <BankVaultTray
          me={me}
          iOweMoney={iOweMoney}
          onPayDebt={onPayDebt}
          onDropOnBankVault={onDropOnBankVault}
        />

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
        {/* Condensed Property Strips Container Dashboard to maintain desktop context without layout shrinkages */}
        <div
          onClick={() => (window as any)._openPropertyManager?.()}
          className="flex gap-1.5 overflow-x-auto max-w-112.5 pb-1 items-end bg-slate-950/40 border border-white/5 hover:border-blue-500/40 transition-colors p-1.5 rounded-xl cursor-pointer"
          title="Click to manage real estate portfolio portfolio"
        >
          {Object.entries(me?.propertySets || {}).map(([color, set]) => {
            if (set.cards.length === 0) return null;

            return (
              <div
                key={color}
                className="flex flex-col gap-0.5 bg-slate-900 border border-slate-800 p-1 rounded-md min-w-10 max-w-14 items-center"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
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
                <span className="text-[6px] font-black font-mono text-slate-300 uppercase tracking-tighter">
                  {set.cards.length} {set.isComplete ? "👑" : "•"}
                </span>
              </div>
            );
          })}
          {Object.values(me?.propertySets || {}).every(
            (s) => s.cards.length === 0,
          ) && (
            <span className="text-[7px] font-black text-slate-500 italic uppercase px-4 py-1">
              No property properties placed
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
