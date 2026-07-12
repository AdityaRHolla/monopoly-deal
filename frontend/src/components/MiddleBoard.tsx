import React from "react";
import { RefreshCw } from "lucide-react";
import { GameCard } from "./GameCard";
import type { GameRoom, Player } from "../types";

interface MiddleBoardProps {
  gameState: GameRoom;
  activePlayer: Player | undefined;
  isMyTurn: boolean;
  hasActivePayment: boolean;
}

export const MiddleBoard: React.FC<MiddleBoardProps> = ({
  gameState,
  activePlayer,
  isMyTurn,
  hasActivePayment,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center border border-slate-900 bg-linear-to-b from-slate-900/40 to-slate-950 rounded-2xl p-6 mb-6 shadow-inner">
      <div className="text-center mb-6">
        <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
          Game Status
        </span>
        <p className="text-xl font-black text-slate-200 mt-2 tracking-wide">
          {isMyTurn ? "🌟 YOUR TURN" : `${activePlayer?.name}'s Action Turn`}
        </p>
        {isMyTurn && !hasActivePayment && (
          <p className="text-xs text-amber-400 font-extrabold mt-1 animate-pulse">
            Actions Remaining: {gameState.actionsLeft} / 3
          </p>
        )}
      </div>

      <div className="flex items-center gap-12">
        {/* Main Draw Pile */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-24 h-36 bg-linear-to-br from-red-600 to-red-900 border-2 border-slate-200/90 rounded-2xl shadow-2xl flex items-center justify-center relative overflow-hidden">
            <span className="text-[10px] font-black text-white/90 transform -rotate-12 border border-white/30 px-1.5 py-0.5 uppercase tracking-widest bg-black/20">
              DECK
            </span>
          </div>
          <span className="text-xs font-bold text-slate-500 font-mono bg-slate-900 px-2 py-0.5 rounded-md">
            {gameState.deck.length} Left
          </span>
        </div>

        {/* Shared Discard Pile */}
        <div className="flex flex-col items-center gap-2">
          {gameState.discardPile.length > 0 ? (
            <GameCard
              card={gameState.discardPile[gameState.discardPile.length - 1]}
            />
          ) : (
            <div className="w-24 h-36 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-700 text-xs font-bold gap-1 bg-slate-950/20">
              <RefreshCw size={16} className="text-slate-800" />
              <span>Empty</span>
            </div>
          )}
          <span className="text-xs font-bold text-slate-500 font-mono bg-slate-900 px-2 py-0.5 rounded-md">
            Discard ({gameState.discardPile.length})
          </span>
        </div>
      </div>
    </div>
  );
};
