import React, { useState } from "react";
import { useGame } from "../context/SocketContext";
import { OpponentPlate } from "./OpponentPlate";
import { GameCard } from "./GameCard";
import { TargetModal } from "./TargetModal";
import { MiddleBoard } from "./MiddleBoard";
import { BankSection } from "./BankSection";
import { PropertySection } from "./PropertySection";
import { ArrowRight, AlertTriangle } from "lucide-react";

export const GameBoard: React.FC = () => {
  const { gameState, socket } = useGame();
  const [targetModalCardId, setTargetModalCardId] = useState<string | null>(
    null,
  );

  if (!gameState || !socket) return null;

  const myId = socket.id;
  const me = gameState.players.find((p) => p.id === myId);
  const opponents = gameState.players.filter((p) => p.id !== myId);
  const activePlayer = gameState.players[gameState.turn];
  const isMyTurn = activePlayer?.id === myId;

  // Active Payment tracking extraction variables
  const paymentState = gameState.activePayment;
  const iOweMoney = paymentState?.pendingPayers.includes(myId || "") || false;

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

  const handlePayDebt = (cardId: string, source: "bank" | "property") => {
    socket.emit("pay_debt_with_card", {
      roomId: gameState.roomId,
      cardId,
      cardSource: source,
    });
  };

  const handleExecuteTargetedAction = (targetPlayerId: string) => {
    if (targetModalCardId) {
      socket.emit("play_targeted_action", {
        roomId: gameState.roomId,
        cardId: targetModalCardId,
        targetPlayerId,
      });
      setTargetModalCardId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 p-6 select-none font-sans relative">
      {/* 📢 REAL-TIME DEBT NOTIFICATION ALARM BLOCK BANNER */}
      {paymentState && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-bounce">
          <div
            className={`p-4 rounded-xl border shadow-2xl flex items-center justify-between backdrop-blur-md ${
              iOweMoney
                ? "bg-red-950/90 border-red-500 text-red-200"
                : "bg-amber-950/90 border-amber-500 text-amber-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle
                size={20}
                className={iOweMoney ? "text-red-400" : "text-amber-400"}
              />
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider">
                  {iOweMoney
                    ? "⚠️ ACTION REQUIRED: PAY DEBT"
                    : "📢 CASH TRANSACTION PENDING"}
                </h4>
                <p className="text-xs font-semibold opacity-90 mt-0.5">
                  {iOweMoney
                    ? `You owe exactly ${paymentState.amountOwed}M! Click assets on your board to pay.`
                    : `Collecting cash... Waiting on ${paymentState.pendingPayers.length} players.`}
                </p>
              </div>
            </div>
            <span className="text-lg font-mono font-black bg-black/40 px-3 py-1 rounded-lg border border-white/10">
              {paymentState.amountOwed}M
            </span>
          </div>
        </div>
      )}

      {/* SECTION 1: OPPONENTS MULTIPLAYER HUD PANELS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {opponents.map((opp) => (
          <OpponentPlate
            key={opp.id}
            opponent={opp}
            isActive={activePlayer?.id === opp.id}
          />
        ))}
      </div>

      {/* SECTION 2: CENTRAL SHARED DECK STACKS MODULE */}
      <MiddleBoard
        gameState={gameState}
        activePlayer={activePlayer}
        isMyTurn={isMyTurn}
        hasActivePayment={!!paymentState}
      />

      {/* SECTION 3: YOUR ON-TABLE ASSET COLLECTION BLOCK GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 mt-auto border-t border-slate-900 pt-6">
        <div className="lg:col-span-1">
          <BankSection
            bankCards={me?.bank || []}
            iOweMoney={iOweMoney}
            onPayDebt={handlePayDebt}
          />
        </div>
        <div className="lg:col-span-2">
          <PropertySection
            propertySets={me?.propertySets || {}}
            iOweMoney={iOweMoney}
            onPayDebt={handlePayDebt}
          />
        </div>
      </div>

      {/* SECTION 4: PRIVATE PLAYER DRAWER CARD HAND CONTAINER */}
      <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-3">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">
            Your Active Hand ({me?.hand.length || 0} / 7)
          </span>
          {isMyTurn && !paymentState && (
            <button
              onClick={handleEndTurn}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-black uppercase tracking-wider rounded-full shadow-lg"
            >
              <span>End Turn</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-3 pt-1">
          {me?.hand.map((card) => {
            const isPassGo =
              card.type === "action" && (card as any).actionType === "pass_go";
            const isTargetedAction =
              card.type === "action" &&
              ["debt_collector", "birthday"].includes((card as any).actionType);
            const isProperty =
              card.type === "property" || card.type === "wildcard";

            let actionFn: (() => void) | undefined = undefined;
            let label = "";

            if (isMyTurn && gameState.actionsLeft > 0 && !paymentState) {
              if (isPassGo) {
                actionFn = () => handlePlayPassGo(card.id);
                label = "Pass Go";
              } else if (isTargetedAction) {
                actionFn = () => {
                  if ((card as any).actionType === "birthday") {
                    socket.emit("play_targeted_action", {
                      roomId: gameState.roomId,
                      cardId: card.id,
                    });
                  } else {
                    setTargetModalCardId(card.id);
                  }
                };
                label =
                  (card as any).actionType === "birthday"
                    ? "Birthday"
                    : "Collect 5M";
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
                disabled={
                  !isMyTurn || gameState.actionsLeft <= 0 || !!paymentState
                }
              />
            );
          })}
        </div>
      </div>

      {/* POPUP MODAL CONTROL OVERLAY */}
      <TargetModal
        isOpen={!!targetModalCardId}
        onClose={() => setTargetModalCardId(null)}
        onSelectTarget={handleExecuteTargetedAction}
        opponents={opponents}
        title="Collect Money"
        subtitle="Select an opponent to demand 5M cash from:"
      />
    </div>
  );
};
