import type { Server, Socket } from "socket.io";
import type { GameRoom, Card } from "../types.js";

// Official Monopoly Deal Rent Value Matrix Scale (in Millions)
const rentPriceMatrix: Record<string, number[]> = {
  darkblue: [3, 8], // 1 Card = 3M, 2 Cards = 8M
  green: [2, 4, 7], // 1 Card = 2M, 2 Cards = 4M, 3 Cards = 7M
  yellow: [2, 4, 6], // 1 Card = 2M, 2 Cards = 4M, 3 Cards = 6M
  red: [2, 3, 6], // 1 Card = 2M, 2 Cards = 3M, 3 Cards = 6M
  orange: [1, 3, 5], // 1 Card = 1M, 2 Cards = 3M, 3 Cards = 5M
  pink: [1, 2, 4], // 1 Card = 1M, 2 Cards = 2M, 3 Cards = 4M
  lightblue: [1, 2, 3], // 1 Card = 1M, 2 Cards = 2M, 3 Cards = 3M
  brown: [1, 2], // 1 Card = 1M, 2 Cards = 2M
  railroad: [1, 2, 3, 4], // 1 Card = 1M, 2 Cards = 2M, 3 Cards = 3M, 4 Cards = 4M
  utility: [1, 2], // 1 Card = 1M, 2 Cards = 2M
};

export function registerRentCardHandlers(
  io: Server,
  socket: Socket,
  rooms: Map<string, GameRoom>,
) {
  // ====================================================
  // ⚡ ACTION 1: ACTIVATE DOUBLE RENT MODIFIER FLAG
  // ====================================================
  socket.on(
    "play_double_rent",
    ({ roomId, actionCardId }: { roomId: string; actionCardId: string }) => {
      const upperRoomId = roomId.toUpperCase();
      const room = rooms.get(upperRoomId);

      if (!room || room.status !== "playing" || room.activePayment) return;

      const currentPlayer = room.players[room.turn];
      if (currentPlayer.id !== socket.id || room.actionsLeft <= 0) return;

      const cardIdx = currentPlayer.hand.findIndex(
        (c) => c.id === actionCardId,
      );
      if (cardIdx === -1) return;

      const card = currentPlayer.hand[cardIdx];
      // Rule validation: Ensure it is a standard action card of sub-type 'double_rent'
      if (card.type !== "action" || (card as any).actionType !== "double_rent")
        return;

      // Set the room modifier state active
      room.doubleRentActive = true;

      // Consume the card out of hand and burn 1 turn action point
      const [playedCard] = currentPlayer.hand.splice(cardIdx, 1);
      room.discardPile.push(playedCard);
      room.actionsLeft -= 1;

      io.to(upperRoomId).emit("room_updated", room);
      console.log(
        `⚡ Modifier Stacked: ${currentPlayer.name} activated Double Rent for their next rent action.`,
      );
    },
  );

  // ====================================================
  // 💰 ACTION 2: PLAY RENT CARD (WITH DOUBLE RENT CHECK)
  // ====================================================
  socket.on(
    "play_rent_card",
    ({
      roomId,
      actionCardId,
      chosenColor,
      targetPlayerId,
    }: {
      roomId: string;
      actionCardId: string;
      chosenColor: string;
      targetPlayerId?: string;
    }) => {
      const upperRoomId = roomId.toUpperCase();
      const room = rooms.get(upperRoomId);

      if (!room || room.status !== "playing" || room.activePayment) return;

      const currentPlayer = room.players[room.turn];
      if (currentPlayer.id !== socket.id || room.actionsLeft <= 0) return;

      const cardIdx = currentPlayer.hand.findIndex(
        (c) => c.id === actionCardId,
      );
      if (cardIdx === -1) return;

      const rentCard = currentPlayer.hand[cardIdx];
      if (rentCard.type !== "rent") return;

      const isWildRent = (rentCard as any).isWildRent;

      const primarySet = currentPlayer.propertySets[chosenColor] || {
        cards: [],
      };
      const duplicateSet = currentPlayer.propertySets[`${chosenColor}_2`] || {
        cards: [],
      };
      let matchingCardCount =
        primarySet.cards.length + duplicateSet.cards.length;

      if (matchingCardCount === 0) {
        socket.emit("error_message", {
          message: `No property lots owned in group: ${chosenColor}`,
        });
        return;
      }

      const scaleArray = rentPriceMatrix[chosenColor] || [];
      const lookupIndex = Math.min(
        matchingCardCount - 1,
        scaleArray.length - 1,
      );
      let rentOwed = scaleArray[lookupIndex];

      const allMatchingCards = [...primarySet.cards, ...duplicateSet.cards];
      allMatchingCards.forEach((c: any) => {
        if (c.type === "action") {
          if (c.actionType === "house") rentOwed += 3;
          if (c.actionType === "hotel") rentOwed += 4;
        }
      });

      // 🔍 CORE DOUBLE RENT MODIFIER EVALUATION:
      if (room.doubleRentActive) {
        rentOwed = rentOwed * 2; // Double the calculation cash math total!
        delete room.doubleRentActive; // Clear flag out of cache after applying
      }

      let targetPlayerIds: string[] = [];
      if (isWildRent) {
        if (!targetPlayerId) return;
        targetPlayerIds = [targetPlayerId];
      } else {
        targetPlayerIds = room.players
          .filter((p) => p.id !== socket.id)
          .map((p) => p.id);
      }

      const validPayers = targetPlayerIds.filter((playerId) => {
        const p = room.players.find((player) => player.id === playerId);
        if (!p) return false;
        const hasMoney = p.bank.length > 0;
        const hasProperties = Object.values(p.propertySets).some(
          (set) => set.cards.length > 0,
        );
        return hasMoney || hasProperties;
      });

      if (validPayers.length > 0) {
        room.activePayment = {
          owedTo: socket.id,
          amountOwed: rentOwed,
          pendingPayers: validPayers,
        };
      }

      const [playedRentCard] = currentPlayer.hand.splice(cardIdx, 1);
      room.discardPile.push(playedRentCard);
      room.actionsLeft -= 1;

      io.to(upperRoomId).emit("room_updated", room);
    },
  );
}
