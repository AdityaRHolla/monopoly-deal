import React from "react";
import { RefreshCw } from "lucide-react";
import { GameCardView } from "./GameCardView";
import type { GameRoom } from "../types";

interface CenterDeckFieldProps {
  gameState: GameRoom;
  onDropOnCenterFelt?: (cardId: string) => void;
}

export const CenterDeckField: React.FC<CenterDeckFieldProps> = ({
  gameState,
  onDropOnCenterFelt,
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Unblocks standard action drop rules
  };

  return (
    <div
      className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-4 sm:gap-6 bg-slate-950/40 p-2 sm:p-3 rounded-2xl border border-white/5 backdrop-blur-sm shadow-2xl"
      onDragOver={handleDragOver}
      onDrop={(e) => {
        const cardId =
          e.dataTransfer.getData("text/plain") ||
          e.dataTransfer.getData("cardId");
        if (cardId && onDropOnCenterFelt) onDropOnCenterFelt(cardId);
      }}
    >
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
  );
};
