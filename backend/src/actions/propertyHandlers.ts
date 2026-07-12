import type { Server, Socket } from "socket.io";
import type { GameRoom } from "../types.js";
import { checkForWinCondition } from "../utils/winChecker.js";

export function registerPropertyCardHandlers(
  io: Server,
  socket: Socket,
  rooms: Map<string, GameRoom>,
) {
  // ====================================================
  // 🏠 ACTION 1: PLACE STANDARD PROPERTY CARD OUT OF HAND
  // ====================================================
  socket.on(
    "play_property_card",
    ({ roomId, cardId }: { roomId: string; cardId: string }) => {
      const upperRoomId = roomId.toUpperCase();
      const room = rooms.get(upperRoomId);

      if (!room || room.status !== "playing" || room.activePayment) return;
      const currentPlayer = room.players[room.turn];

      if (currentPlayer.id !== socket.id || room.actionsLeft <= 0) return;

      const cardIndex = currentPlayer.hand.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) return;

      const card = currentPlayer.hand[cardIndex];
      if (card.type !== "property" && card.type !== "wildcard") return;

      // Identify target color group mapping path
      let targetColor = "";
      if (card.type === "property") {
        targetColor = (card as any).color;
      } else {
        // If playing a wildcard out of hand, choose its first available color as a default
        targetColor = (card as any).colorsAvailable[0];
        (card as any).currentColor = targetColor;
      }

      if (!currentPlayer.propertySets[targetColor]) {
        currentPlayer.propertySets[targetColor] = {
          cards: [],
          isComplete: false,
        };
      }

      currentPlayer.hand.splice(cardIndex, 1);
      currentPlayer.propertySets[targetColor].cards.push(card);
      room.actionsLeft -= 1;

      if (checkForWinCondition(currentPlayer)) {
        room.status = "ended";
      }

      io.to(upperRoomId).emit("room_updated", room);
    },
  );

  // ====================================================
  // 🏢 ACTION 2: PLACE BUILDING MODIFIER (HOUSE / HOTEL)
  // ====================================================
  socket.on(
    "play_building_modifier",
    ({
      roomId,
      cardId,
      targetColor,
    }: {
      roomId: string;
      cardId: string;
      targetColor: string;
    }) => {
      const upperRoomId = roomId.toUpperCase();
      const room = rooms.get(upperRoomId);

      if (!room || room.status !== "playing" || room.activePayment) return;
      const currentPlayer = room.players[room.turn];

      if (currentPlayer.id !== socket.id || room.actionsLeft <= 0) return;

      const cardIdx = currentPlayer.hand.findIndex((c) => c.id === cardId);
      if (cardIdx === -1) return;

      const card = currentPlayer.hand[cardIdx];
      if (card.type !== "action") return;

      const buildingType = (card as any).actionType;
      if (buildingType !== "house" && buildingType !== "hotel") return;

      const targetSet = currentPlayer.propertySets[targetColor];
      if (!targetSet || !targetSet.isComplete) return;
      if (targetColor === "railroad" || targetColor === "utility") return;

      const hasHouse = targetSet.cards.some(
        (c: any) => c.type === "action" && c.actionType === "house",
      );
      const hasHotel = targetSet.cards.some(
        (c: any) => c.type === "action" && c.actionType === "hotel",
      );

      if (buildingType === "house" && hasHouse) return;
      if (buildingType === "hotel" && (!hasHouse || hasHotel)) return;

      currentPlayer.hand.splice(cardIdx, 1);
      targetSet.cards.push(card);
      room.actionsLeft -= 1;

      io.to(upperRoomId).emit("room_updated", room);
    },
  );

  // ====================================================
  // 🔄 ACTION 3: RE-ORGANIZE OR FLIP PROPERTY WILDCARDS
  // ====================================================
  socket.on(
    "reorganize_wildcard",
    ({
      roomId,
      cardId,
      fromColor,
      toColor,
    }: {
      roomId: string;
      cardId: string;
      fromColor: string;
      toColor: string;
    }) => {
      const upperRoomId = roomId.toUpperCase();
      const room = rooms.get(upperRoomId);

      if (!room || room.status !== "playing" || room.activePayment) return;
      const currentPlayer = room.players[room.turn];

      if (currentPlayer.id !== socket.id) return;

      const sourceSet = currentPlayer.propertySets[fromColor];
      if (!sourceSet) return;

      const cardIdx = sourceSet.cards.findIndex((c) => c.id === cardId);
      if (cardIdx === -1) return;

      const card = sourceSet.cards[cardIdx];
      if (card.type !== "wildcard") return;

      // Check availability rules for standard vs. "all-knowing" multi-color wilds
      const isMultiColorWild = (card as any).isCompleteWild === true;
      const colorsAvailable = (card as any).colorsAvailable || [];

      if (!isMultiColorWild && !colorsAvailable.includes(toColor)) {
        socket.emit("error_message", {
          message: `This standard wildcard cannot join the ${toColor} set.`,
        });
        return;
      }

      // Extract wildcard from old column safely
      sourceSet.cards.splice(cardIdx, 1);
      if (sourceSet.cards.length === 0) {
        delete currentPlayer.propertySets[fromColor];
      }

      // Bind new color assignment string parameter tag
      (card as any).currentColor = toColor;

      if (!currentPlayer.propertySets[toColor]) {
        currentPlayer.propertySets[toColor] = { cards: [], isComplete: false };
      }
      currentPlayer.propertySets[toColor].cards.push(card);

      // Re-check win condition states completely free of action points charges
      if (checkForWinCondition(currentPlayer)) {
        room.status = "ended";
      }

      io.to(upperRoomId).emit("room_updated", room);
    },
  );
}
