import React from "react";
import { useGame } from "../context/SocketContext";
import { OpponentPlate } from "./OpponentPlate";
import { GameCard } from "./GameCard";
import { Landmark, ArrowRight, Coins, RefreshCw } from "lucide-react";
import type { Card } from "../types";

export const GameBoard: React.FC = () => {
  const { gameState, socket } = useGame();

  if (!gameState || !socket) return null;

  const myId = socket.id;
  const me = gameState.players.find((p) => p.id === myId);
  const opponents = gameState.players.filter((p) => p.id !== myId);
  const activePlayer = gameState.players[gameState.turn];
  const isMyTurn = activePlayer?.id === myId;

  const handleBankMoney = (cardId: string) => {
    socket.emit("play_money_card", { roomId: gameState.roomId, cardId });
  };

  const handlePlayProperty = (cardId: string) => {
    socket.emit("play_property_card", { roomId: gameState.roomId, cardId });
  };

  const handlePlayPassGo = (cardId: string) => {
    socket.emit("play_pass_go", { roomId: gameState.roomId, cardId });
  };

  const handleEndTurn = () => {
    socket.emit("end_turn", { roomId: gameState.roomId });
  };

  const calculateBankTotal = (bank: Card[]) => {
    return bank.reduce((sum, card) => sum + card.value, 0);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 p-6 select-none font-sans">
      {/* 1. OPPONENTS GRID SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {opponents.map((opp) => (
          <OpponentPlate
            key={opp.id}
            opponent={opp}
            isActive={activePlayer?.id === opp.id}
          />
        ))}
      </div>

      {/* 2. SHARED MID-BOARD (DECKS & CENTER PANEL) */}
      <div className="flex-1 flex flex-col items-center justify-center border border-slate-900 bg-gradient-to-b from-slate-900/40 to-slate-950 rounded-2xl p-6 mb-6 shadow-inner">
        <div className="text-center mb-6">
          <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            Game Status
          </span>
          <p className="text-xl font-black text-slate-200 mt-2 tracking-wide">
            {isMyTurn ? "🌟 YOUR TURN" : `${activePlayer?.name}'s Action Turn`}
          </p>
          {isMyTurn && (
            <p className="text-xs text-amber-400 font-extrabold mt-1 animate-pulse">
              Actions Remaining: {gameState.actionsLeft} / 3
            </p>
          )}
        </div>

        <div className="flex items-center gap-12">
          {/* Main Draw Pile */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-36 bg-gradient-to-br from-red-600 to-red-900 border-2 border-slate-200/90 rounded-2xl shadow-2xl flex items-center justify-center relative overflow-hidden transition-transform duration-300 hover:scale-105">
              <div className="absolute inset-2 border border-dashed border-white/20 rounded-xl flex items-center justify-center">
                <span className="text-[10px] font-black text-white/90 transform -rotate-12 border border-white/30 px-1.5 py-0.5 uppercase tracking-widest bg-black/20">
                  DECK
                </span>
              </div>
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

      {/* 3. YOUR DASHBOARD (VAULT & PROPERTY DISPLAY ROW) */}
      <div className="mt-auto border-t border-slate-900 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Bank Vault Component Card */}
          <div className="lg:col-span-1 p-4 bg-slate-900/60 border border-slate-900 rounded-2xl shadow-xl flex flex-col">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-400 mb-3 uppercase tracking-wider">
              <Landmark size={14} />
              <span>
                Your Bank Vault ({calculateBankTotal(me?.bank || [])}M)
              </span>
            </div>
            <div className="flex flex-wrap gap-2 content-start flex-1 min-h-[60px] bg-slate-950/40 p-3 rounded-xl border border-slate-900/40">
              {me?.bank.map((card, idx) => (
                <div
                  key={`${card.id}-${idx}`}
                  className="px-3 py-1.5 bg-emerald-950/80 border border-emerald-800/60 rounded-lg text-xs font-black text-emerald-300 shadow-sm flex items-center gap-1"
                >
                  <Coins size={12} className="text-emerald-500" />
                  <span>{card.value}M</span>
                </div>
              ))}
              {me?.bank.length === 0 && (
                <span className="text-xs font-medium text-slate-600 self-center m-auto italic">
                  Vault is empty
                </span>
              )}
            </div>
          </div>

          {/* Properties Board Grid */}
          <div className="lg:col-span-2 p-4 bg-slate-900/60 border border-slate-900 rounded-2xl shadow-xl">
            <div className="text-xs font-black text-blue-400 mb-3 uppercase tracking-wider">
              🏠 Your Property Columns
            </div>
            <div className="flex flex-wrap gap-4 min-h-[60px] bg-slate-950/40 p-3 rounded-xl border border-slate-900/40">
              {Object.entries(me?.propertySets || {}).map(([color, set]) => {
                if (set.cards.length === 0) return null;
                return (
                  <div
                    key={color}
                    className="flex flex-col gap-1.5 bg-slate-900/80 border border-slate-800 p-2 rounded-xl shadow-md"
                  >
                    <div className="text-[9px] font-black uppercase text-center text-white px-2 py-0.5 rounded-md tracking-widest shadow-sm bg-slate-700">
                      {color}
                    </div>
                    <div className="flex gap-1.5 mt-1 overflow-x-auto max-w-[180px]">
                      {set.cards.map((c, idx) => (
                        <div
                          key={idx}
                          className="scale-90 origin-top-left -mr-4 last:mr-0"
                        >
                          <GameCard card={c} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {Object.values(me?.propertySets || {}).every(
                (set) => set.cards.length === 0,
              ) && (
                <span className="text-xs font-medium text-slate-600 self-center m-auto italic">
                  No property lots claimed yet
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 4. PLAYER PRIVATE HAND STORAGE DRAWER */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">
              Your Active Hand ({me?.hand.length || 0} / 7)
            </span>
            {isMyTurn && (
              <button
                onClick={handleEndTurn}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-black uppercase tracking-wider rounded-full shadow-lg shadow-blue-900/30 transition-all duration-200 active:scale-95"
              >
                <span>End Turn</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-slate-800">
            {me?.hand.map((card) => {
              const isPassGo =
                card.type === "action" &&
                (card as any).actionType === "pass_go";
              const isProperty =
                card.type === "property" || card.type === "wildcard";

              // Determine correct single action configuration callback dynamically
              let actionFn: (() => void) | undefined = undefined;
              let label = "";

              if (isMyTurn && gameState.actionsLeft > 0) {
                if (isPassGo) {
                  actionFn = () => handlePlayPassGo(card.id);
                  label = "Pass Go";
                } else if (isProperty) {
                  actionFn = () => handlePlayProperty(card.id);
                  label = "Lay Prop";
                } else if (card.value > 0) {
                  actionFn = () => handleBankMoney(card.id);
                  label = "Bank It";
                }
              }

              return (
                <GameCard
                  key={card.id}
                  card={card}
                  onAction={actionFn}
                  actionLabel={label}
                  disabled={!isMyTurn || gameState.actionsLeft <= 0}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
