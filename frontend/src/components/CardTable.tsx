import React from "react";
import { RefreshCw } from "lucide-react";
import { GameCardView } from "./GameCardView";
import type { GameRoom, Player } from "../types";

interface CardTableProps {
  gameState: GameRoom;
  activePlayer: Player | undefined;
  isMyTurn: boolean;
  hasActivePayment: boolean;
  opponents: Player[];
  isTargetingMode?: boolean;
  onSelectTargetCard?: (cardId: string) => void;
  children?: React.ReactNode;
}

export const CardTable: React.FC<CardTableProps> = ({
  gameState,
  activePlayer,
  isMyTurn,
  hasActivePayment,
  opponents,
  children,
}) => {
  return (
    <div className="flex-1 w-full max-w-5xl mx-auto my-4 bg-slate-900/60 rounded-[100px] sm:rounded-[200px] border-4 border-slate-800 shadow-2xl relative p-6 min-h-95 flex flex-col justify-between overflow-hidden group">
      {/* 🎰 Visual Anchor: Real Felt Underlay Textures */}
      <div className="absolute inset-4 rounded-[80px] sm:rounded-[180px] bg-linear-to-b from-emerald-950 via-emerald-900 to-emerald-950 border border-emerald-800/40 shadow-inner -z-10" />

      {/* 👥 1. OPPONENT RIMS: Dynamic Seat Layout Distribution */}
      <div className="flex justify-around items-start w-full px-4 -mt-2">
        {opponents.map((opp) => {
          const isOppTurn = activePlayer?.id === opp.id;
          return (
            <div
              key={opp.id}
              className={`px-4 py-2 rounded-2xl border transition-all duration-300 transform shadow-lg ${
                isOppTurn
                  ? "bg-amber-950/80 border-amber-400 scale-105 animate-pulse"
                  : "bg-slate-950/80 border-slate-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${isOppTurn ? "bg-amber-400" : "bg-slate-600"}`}
                />
                <span className="text-[11px] font-black text-slate-200 uppercase tracking-wide truncate max-w-20">
                  {opp.name}
                </span>
              </div>
              <div className="flex gap-3 text-[9px] font-mono mt-1 text-slate-400 font-bold">
                <span>🎴 H: {opp.hand.length}</span>
                <span className="text-emerald-400">
                  💰 B: {opp.bank.reduce((s, c) => s + c.value, 0)}M
                </span>
              </div>
            </div>
          );
        })}
        {opponents.length === 0 && (
          <span className="text-xs text-emerald-700/60 font-black tracking-widest font-mono uppercase mt-2">
            Solitary Practice Table
          </span>
        )}
      </div>

      {/* 🃏 2. CENTRAL DECKS: Shared Action Hub */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-8 bg-slate-950/40 border border-slate-900/60 px-6 py-4 rounded-3xl backdrop-blur-sm">
        {/* Draw Pile Column */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-16 h-24 sm:w-20 sm:h-28 bg-linear-to-br from-red-600 to-red-950 border-2 border-slate-200 rounded-xl shadow-xl flex items-center justify-center relative overflow-hidden transition-transform duration-300 hover:scale-105 active:scale-95">
            <span className="text-[8px] font-black text-white/90 transform -rotate-12 border border-white/20 px-1 py-0.5 uppercase tracking-widest bg-black/10 select-none">
              DECK
            </span>
          </div>
          <span className="text-[9px] font-bold text-emerald-500 font-mono bg-black/50 px-2 py-0.5 rounded border border-emerald-900/40">
            {gameState.deck.length} LEFT
          </span>
        </div>

        {/* Discard Pile Column */}
        <div className="flex flex-col items-center gap-1.5">
          {gameState.discardPile.length > 0 ? (
            <div className="scale-75 sm:scale-90 origin-bottom">
              <GameCardView
                card={gameState.discardPile[gameState.discardPile.length - 1]}
              />
            </div>
          ) : (
            <div className="w-16 h-24 sm:w-20 sm:h-28 border-2 border-dashed border-emerald-800/40 rounded-xl flex flex-col items-center justify-center text-emerald-800 text-[10px] font-bold gap-1 bg-black/10">
              <RefreshCw
                size={14}
                className="animate-spin [animation-duration:10s]"
              />
              <span>EMPTY</span>
            </div>
          )}
          <span className="text-[9px] font-bold text-slate-500 font-mono bg-black/50 px-2 py-0.5 rounded border border-slate-900/40">
            DISCARD ({gameState.discardPile.length})
          </span>
        </div>
      </div>

      {/* 🌟 3. TABLE LOWER EDGE: Centralized Status Ticker */}
      <div className="w-full text-center mt-auto pb-2 z-10">
        <p className="text-xs font-black tracking-widest text-slate-400 uppercase">
          {isMyTurn
            ? "🌟 Active Turn: Yours"
            : `🎙️ Thinking: ${activePlayer?.name}`}
        </p>
        {isMyTurn && !hasActivePayment && (
          <div className="inline-block mt-1 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-900/40 animate-pulse">
            Actions Remaining: {gameState.actionsLeft} / 3
          </div>
        )}
      </div>

      {children}
    </div>
  );
};
