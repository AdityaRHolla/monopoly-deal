import React, { useState } from "react";
import { useGame } from "../context/SocketContext";
import { CardTable } from "./CardTable";
import { GameCardView } from "./GameCardView";
import { TargetModal } from "./TargetModal";
import { PaymentBanner } from "./PaymentBanner";
import { TargetingBanner } from "./TargetingBanner";
import { OrientationLock } from "./OrientationLock";
import { ArrowRight } from "lucide-react";

export const GameBoard: React.FC = () => {
  const { gameState, socket } = useGame();
  const [targetModalCardId, setTargetModalCardId] = useState<string | null>(
    null,
  );
  const [activeStealCardId, setActiveStealCardId] = useState<string | null>(
    null,
  );
  const [forcedDealMyOfferId, setForcedDealMyOfferId] = useState<string | null>(
    null,
  );

  if (!gameState || !socket) return null;

  const myId = socket.id;
  const me = gameState.players.find((p) => p.id === myId);
  const opponents = gameState.players.filter((p) => p.id !== myId);
  const activePlayer = gameState.players[gameState.turn];
  const isMyTurn = activePlayer?.id === myId;
  const paymentState = gameState.activePayment;
  const iOweMoney = paymentState?.pendingPayers.includes(myId || "") || false;

  const handSize = me?.hand.length || 0;
  const mustDiscard = isMyTurn && gameState.actionsLeft <= 0 && handSize > 7;

  const handleBankMoney = (cardId: string) => {
    socket.emit("play_money_card", { roomId: gameState.roomId, cardId });
  };

  const handlePlayProperty = (cardId: string) => {
    socket.emit("play_property_card", { roomId: gameState.roomId, cardId });
  };

  const handlePlayPassGo = (cardId: string) => {
    socket.emit("play_pass_go", { roomId: gameState.roomId, cardId });
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

  const handleProcessCardDrop = (
    cardId: string,
    targetZone: "bank" | "property" | "table",
  ) => {
    const card = me?.hand.find((c) => c.id === cardId);
    if (!card) return;

    if (mustDiscard) {
      socket.emit("discard_card", { roomId: gameState.roomId, cardId });
      return;
    }

    if (targetZone === "bank" && card.value > 0) {
      socket.emit("play_money_card", { roomId: gameState.roomId, cardId });
    } else if (
      (targetZone === "property" || targetZone === "table") &&
      (card.type === "property" || card.type === "wildcard")
    ) {
      socket.emit("play_property_card", { roomId: gameState.roomId, cardId });
    } else if (card.type === "action") {
      const actionType = (card as any).actionType;
      if (actionType === "pass_go") {
        socket.emit("play_pass_go", { roomId: gameState.roomId, cardId });
      } else if (actionType === "birthday") {
        socket.emit("play_targeted_action", {
          roomId: gameState.roomId,
          cardId,
        });
      } else if (actionType === "debt_collector") {
        setTargetModalCardId(card.id);
      } else if (
        ["sly_deal", "forced_deal", "deal_breaker"].includes(actionType)
      ) {
        setActiveStealCardId(card.id);
        setForcedDealMyOfferId(null);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnZone = (
    e: React.DragEvent,
    zone: "bank" | "property" | "table",
  ) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData("text/plain");
    if (cardId) {
      handleProcessCardDrop(cardId, zone);
    }
  };

  const handlePayDebt = (cardId: string, source: "bank" | "property") => {
    socket.emit("pay_debt_with_card", {
      roomId: gameState.roomId,
      cardId,
      cardSource: source,
    });
  };

  const handleReorganizeWildcard = (
    cardId: string,
    fromColor: string,
    toColor: string,
  ) => {
    socket.emit("reorganize_wildcard", {
      roomId: gameState.roomId,
      cardId,
      fromColor,
      toColor,
    });
  };

  const handleEndTurn = () => {
    socket.emit("end_turn", { roomId: gameState.roomId });
  };

  return (
    <OrientationLock>
      {/* 🎰 UNIFIED FULL SCREEN MAP STRUCTURE */}
      <div className="flex flex-col h-screen max-h-screen bg-slate-950 text-slate-100 p-2 overflow-hidden select-none font-sans relative">
        <PaymentBanner paymentState={paymentState} iOweMoney={iOweMoney} />

        <TargetingBanner
          activeStealCardId={activeStealCardId}
          forcedDealMyOfferId={forcedDealMyOfferId}
          handCards={me?.hand || []}
          onCancel={() => {
            setActiveStealCardId(null);
            setForcedDealMyOfferId(null);
          }}
        />

        {/* 🎴 STADIUM SCALE GAME FELT TABLE AREA (Occupies 75-80% height canvas) */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropOnZone(e, "table")}
          className="flex-4 min-h-0 flex items-center justify-center p-1 sm:p-2 rounded-[50px] overflow-hidden"
        >
          <CardTable
            gameState={gameState}
            activePlayer={activePlayer}
            isMyTurn={isMyTurn}
            hasActivePayment={!!paymentState}
            opponents={opponents}
            me={me} // Crucial link line to draw your cards on the lower edge
            iOweMoney={iOweMoney}
            onPayDebt={handlePayDebt}
            onReorganizeWildcard={handleReorganizeWildcard}
            isTargetingMode={!!activeStealCardId}
          />
        </div>

        {/* 🗃️ PLAYER HAND DRAWER (Tucked at the rock bottom edge) */}
        <div className="flex-1 max-h-[22vh] w-full max-w-5xl mx-auto bg-slate-900/90 rounded-2xl border border-slate-800 p-2 flex flex-col justify-between shadow-2xl z-20">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-1 mb-1">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">
              Your Hand Tray ({handSize} / 7)
            </span>
            {isMyTurn && !paymentState && (
              <button
                onClick={handleEndTurn}
                className="flex items-center gap-1 px-3 py-0.5 bg-blue-600 hover:bg-blue-500 text-[9px] font-black uppercase rounded-full shadow-md cursor-pointer transition-transform active:scale-95"
              >
                <span>End Turn</span> <ArrowRight size={10} />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 items-end min-h-0 flex-1 justify-center scrollbar-none">
            {me?.hand.map((card) => {
              const isPassGo =
                card.type === "action" &&
                (card as any).actionType === "pass_go";
              const isTargetedAction =
                card.type === "action" &&
                ["debt_collector", "birthday"].includes(
                  (card as any).actionType,
                );
              const isSlyDeal =
                card.type === "action" &&
                (card as any).actionType === "sly_deal";
              const isForcedDeal =
                card.type === "action" &&
                (card as any).actionType === "forced_deal";
              const isProperty =
                card.type === "property" || card.type === "wildcard";

              let actionFn: (() => void) | undefined = undefined;
              let label = "";

              if (isMyTurn && gameState.actionsLeft > 0 && !paymentState) {
                if (isPassGo) {
                  actionFn = () => handlePlayPassGo(card.id);
                  label = "Pass Go";
                } else if (isSlyDeal) {
                  actionFn = () => setActiveStealCardId(card.id);
                  label = "Sly";
                } else if (isForcedDeal) {
                  actionFn = () => setActiveStealCardId(card.id);
                  label = "Forced";
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
                    (card as any).actionType === "birthday" ? "BDay" : "5M";
                } else if (isProperty) {
                  actionFn = () => handlePlayProperty(card.id);
                  label = "Lay";
                } else if (card.value > 0) {
                  actionFn = () => handleBankMoney(card.id);
                  label = "Bank";
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
