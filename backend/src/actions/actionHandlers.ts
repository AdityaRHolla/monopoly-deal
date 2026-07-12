import type { Server, Socket } from "socket.io";
import type { GameRoom, PropertyCard, WildcardCard } from "../types.js";
import { checkForWinCondition } from "../utils/winChecker.js";

export function registerActionCardHandlers(
  io: Server,
  socket: Socket,
  rooms: Map<string, GameRoom>,
) {
  // ====================================================
  // 🃏 HANDLER: SLY DEAL (STEAL SINGLE LOOSE PROPERTY)
  // ====================================================
  socket.on(
    "play_sly_deal",
    ({
      roomId,
      actionCardId,
      targetPlayerId,
      targetCardId,
    }: {
      roomId: string;
      actionCardId: string;
      targetPlayerId: string;
      targetCardId: string;
    }) => {
      const room = rooms.get(roomId.toUpperCase());
      if (!room || room.status !== "playing" || room.activePayment) return;

      const currentPlayer = room.players[room.turn];
      if (currentPlayer.id !== socket.id || room.actionsLeft <= 0) return;

      const cardIndex = currentPlayer.hand.findIndex(
        (c) => c.id === actionCardId,
      );
      if (cardIndex === -1) return;

      const targetPlayer = room.players.find((p) => p.id === targetPlayerId);
      if (!targetPlayer) return;

      let stolenCard: any = null;
      let targetColorGroup = "";

      for (const color of Object.keys(targetPlayer.propertySets)) {
        const currentSet = targetPlayer.propertySets[color];
        const cardIdx = currentSet.cards.findIndex(
          (c) => c.id === targetCardId,
        );

        if (cardIdx !== -1) {
          if (currentSet.isComplete) {
            socket.emit("error_message", {
              message: "You cannot steal a card from a completed set!",
            });
            return;
          }
          targetColorGroup = color;
          stolenCard = currentSet.cards.splice(cardIdx, 1)[0]; // Extract from array wrapper

          if (currentSet.cards.length === 0) {
            delete targetPlayer.propertySets[color];
          }
          break;
        }
      }

      if (!stolenCard) return;

      if (!currentPlayer.propertySets[targetColorGroup]) {
        currentPlayer.propertySets[targetColorGroup] = {
          cards: [],
          isComplete: false,
        };
      }
      currentPlayer.propertySets[targetColorGroup].cards.push(stolenCard);

      const [playedSlyDeal] = currentPlayer.hand.splice(cardIndex, 1);
      room.discardPile.push(playedSlyDeal);
      room.actionsLeft -= 1;

      if (checkForWinCondition(currentPlayer)) {
        room.status = "ended";
        console.log(
          `🏆 MATCH ENDED: ${currentPlayer.name} has won the match by securing 3 completed sets!`,
        );
      }
      io.to(roomId.toUpperCase()).emit("room_updated", room);
    },
  );

  // ====================================================
  // 🔄 HANDLER: FORCED DEAL (SWAP TWO PROPERTIES)
  // ====================================================
  socket.on(
    "play_forced_deal",
    ({
      roomId,
      actionCardId,
      targetPlayerId,
      targetCardId,
      myCardId,
    }: {
      roomId: string;
      actionCardId: string;
      targetPlayerId: string;
      targetCardId: string;
      myCardId: string;
    }) => {
      const room = rooms.get(roomId.toUpperCase());
      if (!room || room.status !== "playing" || room.activePayment) return;

      const currentPlayer = room.players[room.turn];
      if (currentPlayer.id !== socket.id || room.actionsLeft <= 0) return;

      const actionIdx = currentPlayer.hand.findIndex(
        (c) => c.id === actionCardId,
      );
      if (actionIdx === -1) return;

      const targetPlayer = room.players.find((p) => p.id === targetPlayerId);
      if (!targetPlayer || targetPlayer.id === socket.id) return;

      let myOfferedCard: any = null;
      let myOfferedColor = "";

      for (const color of Object.keys(currentPlayer.propertySets)) {
        const mySet = currentPlayer.propertySets[color];
        const matchIdx = mySet.cards.findIndex((c) => c.id === myCardId);

        if (matchIdx !== -1) {
          if (mySet.isComplete) {
            socket.emit("error_message", {
              message: "You cannot trade a card from your completed sets!",
            });
            return;
          }
          myOfferedColor = color;
          myOfferedCard = mySet.cards.splice(matchIdx, 1)[0];
          if (mySet.cards.length === 0)
            delete currentPlayer.propertySets[color];
          break;
        }
      }

      if (!myOfferedCard) return;

      let opponentStolenCard: any = null;
      let opponentStolenColor = "";

      for (const color of Object.keys(targetPlayer.propertySets)) {
        const targetSet = targetPlayer.propertySets[color];
        const matchIdx = targetSet.cards.findIndex(
          (c) => c.id === targetCardId,
        );

        if (matchIdx !== -1) {
          if (targetSet.isComplete) {
            if (!currentPlayer.propertySets[myOfferedColor]) {
              currentPlayer.propertySets[myOfferedColor] = {
                cards: [],
                isComplete: false,
              };
            }
            currentPlayer.propertySets[myOfferedColor].cards.push(
              myOfferedCard,
            );
            socket.emit("error_message", {
              message: "You cannot target a card inside a completed set!",
            });
            return;
          }
          opponentStolenColor = color;
          opponentStolenCard = targetSet.cards.splice(matchIdx, 1)[0];
          if (targetSet.cards.length === 0)
            delete targetPlayer.propertySets[color];
          break;
        }
      }

      if (!opponentStolenCard) {
        if (!currentPlayer.propertySets[myOfferedColor]) {
          currentPlayer.propertySets[myOfferedColor] = {
            cards: [],
            isComplete: false,
          };
        }
        currentPlayer.propertySets[myOfferedColor].cards.push(myOfferedCard);
        return;
      }

      if (!currentPlayer.propertySets[opponentStolenColor]) {
        currentPlayer.propertySets[opponentStolenColor] = {
          cards: [],
          isComplete: false,
        };
      }
      currentPlayer.propertySets[opponentStolenColor].cards.push(
        opponentStolenCard,
      );

      if (!targetPlayer.propertySets[myOfferedColor]) {
        targetPlayer.propertySets[myOfferedColor] = {
          cards: [],
          isComplete: false,
        };
      }
      targetPlayer.propertySets[myOfferedColor].cards.push(myOfferedCard);

      const [playedForcedDeal] = currentPlayer.hand.splice(actionIdx, 1);
      room.discardPile.push(playedForcedDeal);
      room.actionsLeft -= 1;

      if (checkForWinCondition(currentPlayer)) {
        room.status = "ended";
        console.log(
          `🏆 MATCH ENDED: ${currentPlayer.name} has won the match by securing 3 completed sets!`,
        );
      }

      io.to(roomId.toUpperCase()).emit("room_updated", room);
    },
  );

  socket.on(
    "play_deal_breaker",
    ({
      roomId,
      actionCardId,
      targetPlayerId,
      targetColor,
    }: {
      roomId: string;
      actionCardId: string;
      targetPlayerId: string;
      targetColor: string;
    }) => {
      const room = rooms.get(roomId.toUpperCase());
      if (!room || room.status !== "playing" || room.activePayment) return;

      const currentPlayer = room.players[room.turn];
      if (currentPlayer.id !== socket.id || room.actionsLeft <= 0) return;

      // Verify attacker holds the Deal Breaker card
      const actionIdx = currentPlayer.hand.findIndex(
        (c) => c.id === actionCardId,
      );
      if (actionIdx === -1) return;

      const actionCard = currentPlayer.hand[actionIdx];
      if (
        actionCard.type !== "action" ||
        (actionCard as any).actionType !== "deal_breaker"
      )
        return;

      const targetPlayer = room.players.find((p) => p.id === targetPlayerId);
      if (!targetPlayer || targetPlayer.id === socket.id) return;

      // Fetch the target color column from the opponent's layout
      const targetSet = targetPlayer.propertySets[targetColor];
      if (!targetSet) {
        socket.emit("error_message", {
          message: "The targeted property group does not exist.",
        });
        return;
      }

      // Strict Rule Check: Must be a completed set
      if (!targetSet.isComplete) {
        socket.emit("error_message", {
          message:
            "You can only use a Deal Breaker on a completely finished full set!",
        });
        return;
      }

      // Rule Check: If the attacker already has cards down in this color group,
      // the official rules state you can hold multiple separate sets of the same color.
      // To avoid mixing arrays, we transfer the exact set object structure.

      // 1. Check if attacker already occupies this color path
      let destinationColor = targetColor;
      if (
        currentPlayer.propertySets[targetColor] &&
        currentPlayer.propertySets[targetColor].cards.length > 0
      ) {
        // Create a unique clone identifier string for holding duplicate sets (e.g., "green_2")
        destinationColor = `${targetColor}_2`;
      }

      // 2. Transfer the entire set object bundle seamlessly (including Houses/Hotels)
      currentPlayer.propertySets[destinationColor] = {
        cards: [...targetSet.cards],
        isComplete: true,
      };

      // 3. Delete the column completely from the victim player's table
      delete targetPlayer.propertySets[targetColor];

      // 4. Burn the Deal Breaker card and spend turn point metrics
      const [playedDealBreaker] = currentPlayer.hand.splice(actionIdx, 1);
      room.discardPile.push(playedDealBreaker);
      room.actionsLeft -= 1;

      if (checkForWinCondition(currentPlayer)) {
        room.status = "ended";
        console.log(
          `🏆 MATCH ENDED: ${currentPlayer.name} has won the match by securing 3 completed sets!`,
        );
      }

      // Synchronize out state values across all real-time players
      io.to(roomId.toUpperCase()).emit("room_updated", room);
      console.log(
        `💥 DEAL BREAKER EXECUTED: ${currentPlayer.name} stole the entire full ${targetColor} set from ${targetPlayer.name}!`,
      );
    },
  );
}
