import React, { useState } from "react";
import { useGame } from "../context/SocketContext";
import { CardTable } from "./CardTable";
import { PlayerVault } from "./PlayerVault";
import { PlayerProperties } from "./PlayerProperties";
import { GameCardView } from "./GameCardView";
import { TargetModal } from "./TargetModal";
import { OrientationLock } from "./OrientationLock";
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

  // Active Payment extraction hooks
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
    <OrientationLock>
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 p-4 select-none font-sans relative overflow-x-hidden">
        {/* 🔥 DYNAMIC FLOATING PAYMENT NOTIFICATION ALARM BLOCK */}
        {paymentState && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-bounce">
            <div
              className={`p-3 rounded-xl border shadow-2xl flex items-center justify-between backdrop-blur-md ${
                iOweMoney
                  ? "bg-red-950/90 border-red-500 text-red-200"
                  : "bg-amber-950/90 border-amber-500 text-amber-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle
                  size={18}
                  className={iOweMoney ? "text-red-400" : "text-amber-400"}
                />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    {iOweMoney
                      ? "⚠️ SETTLE OBLIGATION"
                      : "📢 CASH TRANSACTION PENDING"}
                  </h4>
                  <p className="text-[10px] font-bold opacity-90">
                    {iOweMoney
                      ? `Select table cards to clear ${paymentState.amountOwed}M`
                      : "Waiting for opponents to settle up..."}
                  </p>
                </div>
              </div>
              <span className="text-sm font-mono font-black bg-black/40 px-2 py-0.5 rounded border border-white/10">
                {paymentState.amountOwed}M
              </span>
            </div>
          </div>
        )}

        {/* 🎰 THE MAIN ELLIPSE CARD TABLE CANVAS EMBED */}
        <CardTable
          gameState={gameState}
          activePlayer={activePlayer}
          isMyTurn={isMyTurn}
          hasActivePayment={!!paymentState}
          opponents={opponents}
        />

        {/* 🗺️ PLAYER BOARD MATRIX LAYOUT (VAULT & COLUMNS ROW) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 max-w-5xl w-full mx-auto">
          <div className="md:col-span-1">
            <PlayerVault
              bankCards={me?.bank || []}
              iOweMoney={iOweMoney}
              onPayDebt={handlePayDebt}
            />
          </div>
          <div className="md:col-span-2">
            <PlayerProperties
              propertySets={me?.propertySets || {}}
              iOweMoney={iOweMoney}
              onPayDebt={handlePayDebt}
            />
          </div>
        </div>

        {/* 🎴 PLAYER ESCROW PRIVATE HAND STORAGE DRAWER TRAY */}
        <div className="w-full max-w-5xl mx-auto bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-2xl mt-auto">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
              Your Active Hand Tray ({me?.hand.length || 0} / 7)
            </span>
            {isMyTurn && !paymentState && (
              <button
                onClick={handleEndTurn}
                className="flex items-center gap-1.5 px-4 py-1 bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <span>End Turn</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-800 px-1 items-end min-h-42.5">
            {me?.hand.map((card) => {
              const isPassGo =
                card.type === "action" &&
                (card as any).actionType === "pass_go";
              const isTargetedAction =
                card.type === "action" &&
                ["debt_collector", "birthday"].includes(
                  (card as any).actionType,
                );
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
                <GameCardView
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

        {/* TARGET INPUT DIALOG SELECTION OVERLAY MODAL */}
        <TargetModal
          isOpen={!!targetModalCardId}
          onClose={() => setTargetModalCardId(null)}
          onSelectTarget={handleExecuteTargetedAction}
          opponents={opponents}
          title="Collect Money"
          subtitle="Select an opponent to collect 5M from:"
        />
      </div>
    </OrientationLock>
  );
};
