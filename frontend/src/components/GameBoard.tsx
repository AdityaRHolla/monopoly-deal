import React, { useState } from "react";
import { useGame } from "../context/SocketContext";
import { CardTable } from "./CardTable";
import { GameCardView } from "./GameCardView";
import { TargetModal } from "./TargetModal";
import { PaymentBanner } from "./PaymentBanner";
import { TargetingBanner } from "./TargetingBanner";
import { OrientationLock } from "./OrientationLock";
import { CounterStackModal } from "./CounterStackModal";
import { RentSelectionModal } from "./RentSelectionModal";
import { MatchResultsModal } from "./MatchResultsModal";
import { PlayerHandDrawer } from "./PlayerHandDrawer";

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
  const counterStack = gameState.activeCounterStack;
  const isVetoTargetMe = counterStack?.currentVetoPlayerId === myId;

  const handlePlayJustSayNo = (cardId: string) => {
    socket.emit("play_just_say_no", { roomId: gameState.roomId, cardId });
  };

  const handleAcceptActionEffect = () => {
    socket.emit("accept_action_effect", { roomId: gameState.roomId });
  };

  // Rent Card active tracking sub-states
  const [activeRentCardId, setActiveRentCardId] = useState<string | null>(null);
  // const [rentColorsAvailable, setRentColorsAvailable] = useState<string[]>([]);
  // Building active modifier tracking sub-states
  const [activeBuildingCardId, setActiveBuildingCardId] = useState<
    string | null
  >(null);
  const [activeBuildingType, setActiveBuildingType] = useState<
    "house" | "hotel" | null
  >(null);

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

    // 🚨 1. EXCESS HAND OVERFLOW DISCARD RE-ROUTING TRAP
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

    // 🚨 2. GESTURE ZONE INTERCEPTION ENGINE

    // ZONE A: Dropped into the Bank Vault compartment
    if (targetZone === "bank") {
      if (card.value > 0) {
        socket.emit("play_money_card", { roomId: gameState.roomId, cardId });
      } else {
        socket.emit("error_message", {
          message: "This card has no monetary bank value value!",
        });
      }
      return;
    }

    // ZONE B: Dropped directly onto the explicit Property slots row
    if (targetZone === "property") {
      if (card.type === "property" || card.type === "wildcard") {
        socket.emit("play_property_card", { roomId: gameState.roomId, cardId });
      } else {
        socket.emit("error_message", {
          message:
            "Only properties or wildcards can be laid into your color sets!",
        });
      }
      return;
    }

    // ZONE C: Dropped onto the main Table Felt map (Processes actions, properties, or rent)
    if (targetZone === "table") {
      if (card.type === "property" || card.type === "wildcard") {
        // Safe fallback: allow laying property by dropping onto the open table too
        socket.emit("play_property_card", { roomId: gameState.roomId, cardId });
      } else if (card.type === "rent") {
        // 🔥 CRITICAL GESTURE FIX: Intercept rent drops and open the selection prompt modal!
        const colors = (card as any).colors || [];
        const isWildRent = (card as any).isWildRent === true;

        if (isWildRent) {
          (window as any)._cachedRentColors = [
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
          ];
        } else {
          (window as any)._cachedRentColors = colors;
        }
        setActiveRentCardId(card.id);
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
        } else if (actionType === "double_rent") {
          socket.emit("play_double_rent", {
            roomId: gameState.roomId,
            actionCardId: card.id,
          });
        }
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
        <CounterStackModal
          counterStack={counterStack}
          isVetoTargetMe={isVetoTargetMe}
          me={me}
          handlePlayJustSayNo={handlePlayJustSayNo}
          handleAcceptActionEffect={handleAcceptActionEffect}
        />
        <TargetingBanner
          activeStealCardId={activeStealCardId}
          forcedDealMyOfferId={forcedDealMyOfferId}
          handCards={me?.hand || []}
          onCancel={() => {
            setActiveStealCardId(null);
            setForcedDealMyOfferId(null);
          }}
        />

        <MatchResultsModal
          status={gameState.status}
          winnerName={gameState.players[gameState.turn]?.name}
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
            activeBuildingCardId={activeBuildingCardId}
            buildingType={activeBuildingType}
            onBuildModifier={(targetColor) => {
              if (activeBuildingCardId) {
                socket.emit("play_building_modifier", {
                  roomId: gameState.roomId,
                  cardId: activeBuildingCardId,
                  targetColor,
                });
                setActiveBuildingCardId(null);
                setActiveBuildingType(null);
              }
            }}
            onDropOnBankVault={(cardId) =>
              handleProcessCardDrop(cardId, "bank")
            }
            onDropOnCenterFelt={(cardId) =>
              handleProcessCardDrop(cardId, "table")
            }
            onDropOnPropertySet={(cardId) => {
              // Routes straight into your rules block logic for properties
              handleProcessCardDrop(cardId, "property");

              // Note: If you ever want to expand your layout engine to drop cards
              // directly into specific columns, you can pass targetColor to the server here!
            }}
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
        <PlayerHandDrawer
          hand={me?.hand || []}
          isMyTurn={isMyTurn}
          actionsLeft={gameState.actionsLeft}
          hasPaymentState={!!paymentState}
          onEndTurn={handleEndTurn}
          onPlayPassGo={handlePlayPassGo}
          onPlayProperty={handlePlayProperty}
          onBankMoney={handleBankMoney}
          onSetStealCard={(cardId) => {
            setActiveStealCardId(cardId);
            setForcedDealMyOfferId(null);
          }}
          onPlayTargetedAction={(cardId, actionType) => {
            if (actionType === "birthday") {
              socket.emit("play_targeted_action", {
                roomId: gameState.roomId,
                cardId,
              });
            } else {
              setTargetModalCardId(cardId);
            }
          }}
        />
        <RentSelectionModal
          activeRentCardId={activeRentCardId}
          me={me}
          gameState={gameState}
          setTargetModalCardId={setTargetModalCardId}
          setActiveRentCardId={setActiveRentCardId}
          socket={socket}
        />

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
