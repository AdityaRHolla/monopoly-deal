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
  // Fetch active counter stack tracking parameters from room metadata
  const counterStack = gameState.activeCounterStack;
  const isVetoTargetMe = counterStack?.currentVetoPlayerId === myId;

  // Targeting sub-states for complex action plays
  const [activeStealCardId, setActiveStealCardId] = useState<string | null>(
    null,
  ); // Holds the Sly/Forced action card ID
  const [forcedDealMyOfferId, setForcedDealMyOfferId] = useState<string | null>(
    null,
  ); // Holds your offered property ID

  const handSize = me?.hand.length || 0;
  const mustDiscard = isMyTurn && gameState.actionsLeft <= 0 && handSize > 7;

  // Standard action emitter pipelines
  const handleProcessCardDrop = (
    cardId: string,
    targetZone: "bank" | "property" | "discard",
  ) => {
    // Condition check: If the player must discard, force drop to act as a discard regardless of zone
    if (mustDiscard || targetZone === "discard") {
      socket.emit("discard_card", { roomId: gameState.roomId, cardId });
      return;
    }

    const card = me?.hand.find((c) => c.id === cardId);
    if (!card) return;

    if (targetZone === "bank" && card.value > 0) {
      socket.emit("play_money_card", { roomId: gameState.roomId, cardId });
    } else if (
      targetZone === "property" &&
      (card.type === "property" || card.type === "wildcard")
    ) {
      socket.emit("play_property_card", { roomId: gameState.roomId, cardId });
    } else if (
      card.type === "action" &&
      (card as any).actionType === "pass_go"
    ) {
      socket.emit("play_pass_go", { roomId: gameState.roomId, cardId });
    } else if (
      card.type === "action" &&
      ["debt_collector", "birthday"].includes((card as any).actionType)
    ) {
      if ((card as any).actionType === "birthday") {
        socket.emit("play_targeted_action", {
          roomId: gameState.roomId,
          cardId,
        });
      } else {
        setTargetModalCardId(card.id);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Crucial: unlocks drop behaviors in browsers
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

  // React to an action card: Play a Just Say No from your hand
  const handlePlayJustSayNo = (cardId: string) => {
    socket.emit("play_just_say_no", { roomId: gameState.roomId, cardId });
  };

  // Accept the action card effect: Click pass to clear the block loop
  const handleAcceptActionEffect = () => {
    socket.emit("accept_action_effect", { roomId: gameState.roomId });
  };

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

        {/* 🛡️ REACTIVE COUNTER LAYER: JUST SAY NO TRANSACTION STACK */}
        {counterStack && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 select-none">
            <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl relative text-center">
              <span className="inline-block px-3 py-1 bg-red-950/40 border border-red-900/60 text-red-400 text-[10px] font-black tracking-widest uppercase rounded-full animate-pulse">
                Instant Counter Stack Active
              </span>

              <h3 className="text-lg font-black text-slate-100 uppercase mt-4 tracking-wide">
                {counterStack.originalCard.name} Played!
              </h3>

              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                An opponent is deploying an action card effect. The table is
                frozen waiting for reactions.
              </p>

              {/* 🛠️ Dynamic Action Buttons Panel depending on if it's your turn to veto */}
              {isVetoTargetMe ? (
                <div className="mt-6 space-y-3">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                    <p className="text-xs font-bold text-slate-300">
                      Do you want to block this action?
                    </p>

                    {/* Filter hand tray to expose any playable Just Say No cards instantly */}
                    <div className="flex gap-2 justify-center mt-3 overflow-x-auto py-1">
                      {me?.hand
                        .filter(
                          (c) =>
                            c.type === "action" &&
                            (c as any).actionType === "just_say_no",
                        )
                        .map((card) => (
                          <button
                            key={card.id}
                            onClick={() => handlePlayJustSayNo(card.id)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                          >
                            💥 Use Just Say No
                          </button>
                        ))}
                      {me?.hand.filter(
                        (c) =>
                          c.type === "action" &&
                          (c as any).actionType === "just_say_no",
                      ).length === 0 && (
                        <span className="text-[10px] font-bold text-slate-600 italic">
                          You do not hold a Just Say No card in your hand
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleAcceptActionEffect}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98]"
                  >
                    🤝 Accept Effect (Pass)
                  </button>
                </div>
              ) : (
                <div className="mt-6 py-4 bg-slate-950 border border-slate-800/60 rounded-xl text-xs font-bold text-slate-500 uppercase tracking-widest">
                  ⏳ Waiting on player response...
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🎯 ATTACK TARGETING SUB-STATE NAVIGATION BANNER */}
        {activeStealCardId && (
          <div className="w-full max-w-5xl mx-auto my-2 p-3 bg-blue-950/90 border border-blue-500 rounded-2xl flex items-center justify-between text-xs font-bold text-blue-200">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
              <p>
                {!forcedDealMyOfferId &&
                me?.hand.find((c) => c.id === activeStealCardId)?.name ===
                  "Forced Deal"
                  ? "👉 STEP 1: Click one of YOUR loose properties below to offer as a trade..."
                  : "👉 STEP 2: Now look at an opponent's panel above and click their loose property to steal!"}
              </p>
            </div>
            <button
              onClick={() => {
                setActiveStealCardId(null);
                setForcedDealMyOfferId(null);
              }}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-black uppercase text-slate-400 tracking-wider cursor-pointer"
            >
              Cancel Steal
            </button>
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
        {mustDiscard && (
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnZone(e, "discard")}
            className="fixed inset-x-4 top-20 z-40 p-8 border-4 border-dashed border-red-500 bg-red-950/80 rounded-2xl text-center animate-pulse"
          >
            <p className="text-sm font-black uppercase tracking-widest text-red-200">
              🚨 Hand Overflow Error: You hold {handSize} cards!
            </p>
            <p className="text-xs font-bold text-red-400 mt-1">
              Drag and drop excess cards directly into this box to discard down
              to 7 before ending your turn.
            </p>
          </div>
        )}

        {/* COMPONENT MOUNT WITH ATTACHED DROP EVENT LISTENERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 max-w-5xl w-full mx-auto">
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnZone(e, "bank")}
            className="md:col-span-1 rounded-3xl transition-all duration-200 hover:ring-2 hover:ring-emerald-500/40"
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
            className="md:col-span-2 rounded-3xl transition-all duration-200 hover:ring-2 hover:ring-blue-500/40"
          >
            <PlayerProperties
              propertySets={me?.propertySets || {}}
              iOweMoney={iOweMoney}
              onPayDebt={handlePayDebt}
              isMyTurn={isMyTurn}
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
              const isSlyDeal =
                card.type === "action" &&
                (card as any).actionType === "sly_deal";
              const isForcedDeal =
                card.type === "action" &&
                (card as any).actionType === "forced_deal";

              if (isMyTurn && gameState.actionsLeft > 0 && !paymentState) {
                if (isPassGo) {
                  actionFn = () => handlePlayPassGo(card.id);
                  label = "Pass Go";
                } else if (isSlyDeal) {
                  actionFn = () => {
                    setActiveStealCardId(card.id);
                    setForcedDealMyOfferId(null); // Clear any old cache states
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
