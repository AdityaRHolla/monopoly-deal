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

  // Rent Card active tracking sub-states
  const [activeRentCardId, setActiveRentCardId] = useState<string | null>(null);
  const [rentColorsAvailable, setRentColorsAvailable] = useState<string[]>([]);

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
      const activeCard = me?.hand.find((c) => c.id === targetModalCardId);
      const isWildRent =
        activeCard?.type === "rent" && (activeCard as any).isWildRent === true;

      if (isWildRent) {
        // Read the color chosen from the window cache parameter
        const chosenColor = (window as any)._cachedRentColor || "";
        socket.emit("play_rent_card", {
          roomId: gameState.roomId,
          actionCardId: targetModalCardId,
          chosenColor,
          targetPlayerId,
        });
        delete (window as any)._cachedRentColor; // Clean up cache
      } else {
        // Standard Debt Collector execution workflow route
        socket.emit("play_targeted_action", {
          roomId: gameState.roomId,
          cardId: targetModalCardId,
          targetPlayerId,
        });
      }
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
            me={me}
            iOweMoney={iOweMoney}
            onPayDebt={handlePayDebt}
            onReorganizeWildcard={handleReorganizeWildcard}
            isTargetingMode={!!activeStealCardId}
            doubleRentActive={gameState.doubleRentActive}
            onSelectTargetCard={(cardId) => {
              // 🔍 1. Locate which opponent owns this clicked property tile
              const targetedOpponent = opponents.find((o) =>
                Object.values(o.propertySets).some((set) =>
                  set.cards.some((c) => c.id === cardId),
                ),
              );

              if (!targetedOpponent) return;

              // 🔍 2. Extract which specific color group column was targeted
              let targetColor = "";
              for (const [color, set] of Object.entries(
                targetedOpponent.propertySets,
              )) {
                if (set.cards.some((c) => c.id === cardId)) {
                  targetColor = color;
                  break;
                }
              }

              const activeCard = me?.hand.find(
                (c) => c.id === activeStealCardId,
              );
              const actionType = activeCard
                ? (activeCard as any).actionType
                : "";

              // 📡 3. Route to respective backend handlers
              if (actionType === "deal_breaker") {
                socket.emit("play_deal_breaker", {
                  roomId: gameState.roomId,
                  actionCardId: activeStealCardId,
                  targetPlayerId: targetedOpponent.id,
                  targetColor: targetColor, // Pass the color group instead of a single card ID
                });
                setActiveStealCardId(null);
              } else if (actionType === "sly_deal") {
                socket.emit("play_sly_deal", {
                  roomId: gameState.roomId,
                  actionCardId: activeStealCardId,
                  targetPlayerId: targetedOpponent.id,
                  targetCardId: cardId,
                });
                setActiveStealCardId(null);
              } else if (actionType === "forced_deal") {
                if (!forcedDealMyOfferId) {
                  socket.emit("error_message", {
                    message: "Select your offer trade card first!",
                  });
                  return;
                }
                socket.emit("play_forced_deal", {
                  roomId: gameState.roomId,
                  actionCardId: activeStealCardId,
                  targetPlayerId: targetedOpponent.id,
                  targetCardId: cardId,
                  myCardId: forcedDealMyOfferId,
                });
                setActiveStealCardId(null);
                setForcedDealMyOfferId(null);
              }
            }}
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
              const isDoubleRent =
                card.type === "action" &&
                (card as any).actionType === "double_rent";
              const isRentCard = card.type === "rent";
              const isDealBreaker =
                card.type === "action" &&
                (card as any).actionType === "deal_breaker";

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
                } else if (isDealBreaker) {
                  actionFn = () => {
                    setActiveStealCardId(card.id); // Triggers targeting mode!
                    setForcedDealMyOfferId(null); // Deal Breaker doesn't require an offer trade card
                  };
                  label = "Deal Breaker";
                } else if (isDoubleRent) {
                  actionFn = () => {
                    socket.emit("play_double_rent", {
                      roomId: gameState.roomId,
                      actionCardId: card.id,
                    });
                  };
                  label = "Double Rent";
                } else if (isRentCard) {
                  actionFn = () => {
                    const colors = (card as any).colors || [];
                    const isWildRent = (card as any).isWildRent === true;

                    if (isWildRent) {
                      // Wild Rent covers all 10 available board colors
                      setRentColorsAvailable([
                        "darkblue",
                        "green",
                        "yellow",
                        "red",
                        "orange",
                        "pink",
                        "lightblue",
                        "brown",
                        "railroad",
                        "utility",
                      ]);
                    } else {
                      // Standard Rent covers its 2 specific configured color options
                      setRentColorsAvailable(colors);
                    }
                    setActiveRentCardId(card.id);
                  };
                  label = (card as any).isWildRent ? "Wild Rent" : "Rent";
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
        {activeRentCardId && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-center">
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                💰 Select Rent Color
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Choose which property column to calculate rent values from:
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4 max-h-40 overflow-y-auto p-1">
                {rentColorsAvailable.map((color) => {
                  // Only enable the button if the player actually owns at least one card in that color group
                  const ownsColor =
                    me?.propertySets[color] &&
                    me.propertySets[color].cards.length > 0;
                  const activeCard = me?.hand.find(
                    (c) => c.id === activeRentCardId,
                  );
                  const isWildRent = activeCard
                    ? (activeCard as any).isWildRent === true
                    : false;

                  return (
                    <button
                      key={color}
                      disabled={!ownsColor}
                      onClick={() => {
                        if (isWildRent) {
                          // Multi-color wild rent needs an explicit single target player id.
                          // To keep it simple, we open the target selection grid right after clicking the color!
                          setTargetModalCardId(activeRentCardId);
                          // Store chosen color inside window cache variable temporarily to read it on player selection
                          (window as any)._cachedRentColor = color;
                        } else {
                          // Standard rent targets everyone on the table automatically
                          socket.emit("play_rent_card", {
                            roomId: gameState.roomId,
                            actionCardId: activeRentCardId,
                            chosenColor: color,
                          });
                        }
                        setActiveRentCardId(null);
                      }}
                      className={`py-2 px-3 border rounded-xl text-[10px] font-black uppercase text-left transition-all truncate flex items-center justify-between ${
                        ownsColor
                          ? "bg-slate-950 border-slate-800 hover:border-emerald-500 text-slate-200 cursor-pointer active:scale-95"
                          : "bg-slate-950/20 border-slate-900 text-slate-600 opacity-40 cursor-not-allowed"
                      }`}
                    >
                      <span>{color}</span>
                      {ownsColor && (
                        <span className="text-[8px] bg-emerald-950 border border-emerald-900/60 text-emerald-400 px-1 rounded">
                          Own
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setActiveRentCardId(null)}
                className="w-full mt-4 py-2 border border-dashed border-slate-800 hover:border-slate-700 text-[10px] font-black uppercase text-slate-400 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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
