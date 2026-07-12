import type { Server, Socket } from "socket.io";
import type { GameRoom } from "../types.js";

export function registerCounterCardHandlers(
  io: Server,
  socket: Socket,
  rooms: Map<string, GameRoom>,
) {
  // ====================================================
  // 🛡️ ACTION 1: INTERCEPT WITH A "JUST SAY NO" CARD
  // ====================================================
  socket.on(
    "play_just_say_no",
    ({ roomId, cardId }: { roomId: string; cardId: string }) => {
      const upperRoomId = roomId.toUpperCase();
      const room = rooms.get(upperRoomId);

      // Verify there is actually an active action card waiting to be countered
      if (!room || !room.activeCounterStack) return;

      const stack = room.activeCounterStack;
      const playerReacting = room.players.find((p) => p.id === socket.id);
      if (!playerReacting) return;

      // Verify this player is allowed to counter right now
      if (socket.id !== stack.currentVetoPlayerId) {
        socket.emit("error_message", {
          message: "You cannot play Just Say No right now!",
        });
        return;
      }

      const cardIdx = playerReacting.hand.findIndex((c) => c.id === cardId);
      if (cardIdx === -1) return;

      const card = playerReacting.hand[cardIdx];
      if (card.type !== "action" || (card as any).actionType !== "just_say_no")
        return;

      // 🔄 REVERSE THE TARGET: Pass the veto right back to the original attacker
      // This allows them to throw down a counter-Just Say No!
      const nextVetoTarget =
        stack.currentVetoPlayerId === stack.playedBy
          ? stack.targetPlayerId || ""
          : stack.playedBy;

      stack.currentVetoPlayerId = nextVetoTarget;

      // Remove the Just Say No card from hand and push it to the discard pile
      const [usedCounter] = playerReacting.hand.splice(cardIdx, 1);
      room.discardPile.push(usedCounter);

      io.to(upperRoomId).emit("room_updated", room);
      console.log(
        `🛡️ JUST SAY NO PLAYED: ${playerReacting.name} blocked the action loop!`,
      );
    },
  );

  // ====================================================
  // 🤝 ACTION 2: ACCEPT ACTION (PASS ON COUNTERING)
  // ====================================================
  socket.on("accept_action_effect", ({ roomId }: { roomId: string }) => {
    const upperRoomId = roomId.toUpperCase();
    const room = rooms.get(upperRoomId);

    if (!room || !room.activeCounterStack) return;

    const stack = room.activeCounterStack;

    // Ensure only the current veto player can pass
    if (socket.id !== stack.currentVetoPlayerId) return;

    // If the person who clicked "Pass" is the victim, the action card resolves natively!
    if (
      stack.currentVetoPlayerId === stack.targetPlayerId ||
      (!stack.targetPlayerId && stack.currentVetoPlayerId !== stack.playedBy)
    ) {
      console.log(
        `🤝 Action accepted by victim. Resolving original card behavior...`,
      );

      // Clear stack before resolving to unlock state barriers
      const originalAction = stack.originalCard;
      delete room.activeCounterStack;

      // Re-trigger the original action processing loop directly on the server
      // (This safely triggers the Rent, Sly Deal, or Deal Breaker code)
      io.to(upperRoomId).emit("resolve_confirmed_action", {
        originalAction,
        stack,
      });
    } else {
      // If the original attacker clicked "Pass" after a Just Say No, it means the block wins!
      console.log(`🛡️ Attacker gave up. Action successfully blocked.`);
      delete room.activeCounterStack;
    }

    io.to(upperRoomId).emit("room_updated", room);
  });
}
