import React, { useState } from "react";
import { useGame } from "../context/SocketContext";
import { CardTable } from "./CardTable";
import { PlayerVault } from "./PlayerVault";
import { PlayerProperties } from "./PlayerProperties";
import { GameCardView } from "./GameCardView";
import { TargetModal } from "./TargetModal";
import { PaymentBanner } from "./PaymentBanner";
import { TargetingBanner } from "./TargetingBanner"; // Assuming name match
import { OrientationLock } from "./OrientationLock";
import { ArrowRight } from "lucide-react";

export const GameBoard: React.FC = () => {
  const { gameState, socket } = useGame();
  const [targetModalCardId, setTargetModalCardId] = useState<string | null>(
    null,
  );

  // Targeting sub-states for complex action plays
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

  const handleProcessCardDrop = (
    cardId: string,
    targetZone: "bank" | "property" | "discard",
  ) => {
    const card = me?.hand.find((c) => c.id === cardId);
    if (!card) return;

    if (mustDiscard) {
      if (targetZone === "bank") {
        socket.emit("error_message", {
          message: "You cannot discard cards into your Bank vault!",
        });
        return;
      }
      socket.emit("discard_card", { roomId: gameState.roomId, cardId });
      return;
    }

    if (targetZone === "bank" && card.value > 0) {
      socket.emit("play_money_card", { roomId: gameState.roomId, cardId });
    } else if (
      targetZone === "property" &&
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

  // ⚡ RESTORED BASE ACTION EMITTERS
  const handleBankMoney = (cardId: string) => {
    socket.emit("play_money_card", { roomId: gameState.roomId, cardId });
  };

  const handlePlayProperty = (cardId: string) => {
    socket.emit("play_property_card", { roomId: gameState.roomId, cardId });
  };

  const handlePlayPassGo = (cardId: string) => {
    socket.emit("play_pass_go", { roomId: gameState.roomId, cardId });
  };

  const handleDropOnZone = (
    e: React.DragEvent,
    zone: "bank" | "property" | "discard",
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
      <div className="flex flex-col h-screen max-h-screen bg-slate-950 text-slate-100 p-2 sm:p-4 select-none font-sans relative overflow-hidden">
        {/* 📢 PLUGGED MODULAR PAYMENT WARNING BANNER */}
        <PaymentBanner paymentState={paymentState} iOweMoney={iOweMoney} />

        {/* 🗑️ OVERFLOW DISCARD ZONE MODAL */}
        {mustDiscard && (
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnZone(e, "discard")}
            className="fixed inset-x-4 top-16 z-40 p-4 border-2 border-dashed border-red-500 bg-red-950/90 rounded-xl text-center"
          >
            <p className="text-xs font-black uppercase text-red-200">
              🚨 Hand Overflow: {handSize} cards!
            </p>
            <p className="text-[10px] font-bold text-red-400 mt-0.5">
              Drag excess cards onto the green property board to discard down to
              7.
            </p>
          </div>
        )}

        {/* 🎯 PLUGGED MODULAR ATTACK SELECTOR TARGETING PROMPT LAYER */}
        <TargetingBanner
          activeStealCardId={activeStealCardId}
          forcedDealMyOfferId={forcedDealMyOfferId}
          handCards={me?.hand || []}
          onCancel={() => {
            setActiveStealCardId(null);
            setForcedDealMyOfferId(null);
          }}
        />

        {/* 🎰 SHRUNK CENTRAL FELT MAP */}
        <div className="flex-1 min-h-0 max-h-[42vh] flex items-center justify-center">
          <CardTable
            gameState={gameState}
            activePlayer={activePlayer}
            isMyTurn={isMyTurn}
            hasActivePayment={!!paymentState}
            opponents={opponents}
          />
        </div>

        {/* 🏠 TABLE ASSETS ROW DISPLAY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-2 max-w-5xl w-full mx-auto min-h-0 overflow-hidden">
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnZone(e, "bank")}
            className="md:col-span-1 rounded-2xl transition-all duration-200"
          >
            <PlayerVault
              bankCards={me?.bank || []}
              iOweMoney={iOweMoney}
              onPayDebt={handlePayDebt}
            />
          </div>
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnZone(e, "property")}
            className="md:col-span-2 rounded-2xl transition-all duration-200"
          >
            <PlayerProperties
              propertySets={me?.propertySets || {}}
              iOweMoney={iOweMoney}
              onPayDebt={handlePayDebt}
              onReorganizeWildcard={handleReorganizeWildcard}
              isMyTurn={isMyTurn}
            />
          </div>
        </div>

        {/* 🎴 PLAYER HAND TRAY SLIDER */}
        <div className="w-full max-w-5xl mx-auto bg-slate-900/90 rounded-xl p-3 border border-slate-800 shadow-2xl mt-auto">
          <div className="flex items-center justify-between mb-2 border-b border-slate-800/60 pb-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
              Your Active Hand Tray ({handSize} / 7)
            </span>
            {isMyTurn && !paymentState && (
              <button
                onClick={handleEndTurn}
                className="flex items-center gap-1 px-3 py-0.5 bg-blue-600 hover:bg-blue-500 text-[9px] font-black uppercase tracking-wider rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <span>End Turn</span> <ArrowRight size={10} />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 items-end min-h-36.25">
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
                  actionFn = () => {
                    setActiveStealCardId(card.id);
                    setForcedDealMyOfferId(null);
                  };
                  label = "Sly Deal";
                } else if (isForcedDeal) {
                  actionFn = () => {
                    setActiveStealCardId(card.id);
                    setForcedDealMyOfferId(null);
                  };
                  label = "Forced Deal";
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
