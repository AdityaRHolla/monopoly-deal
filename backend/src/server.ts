import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import type { GameRoom, Player } from "./types.ts";
import { createDeck, shuffleDeck } from "./deck.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      /\.github\.io$/, // Allows your future GitHub Pages URL automatically
      /vercel\.app$/, // Pre-authorizes Vercel fallback links
    ],
    methods: ["GET", "POST"],
  },
});

const rooms = new Map<string, GameRoom>();

function generateRoomCode(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  do {
    result = "";
    for (let i = 0; i < 4; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
  } while (rooms.has(result));
  return result;
}

io.on("connection", (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on(
    "play_money_card",
    ({ roomId, cardId }: { roomId: string; cardId: string }) => {
      const upperRoomId = roomId.toUpperCase();
      const room = rooms.get(upperRoomId);

      if (!room || room.status !== "playing") {
        socket.emit("error_message", {
          message: "Active game room not found.",
        });
        return;
      }

      const currentPlayer = room.players[room.turn];

      // Validation: Is it this user's turn?
      if (currentPlayer.id !== socket.id) {
        socket.emit("error_message", { message: "It is not your turn!" });
        return;
      }

      // Validation: Does the player have moves remaining?
      if (room.actionsLeft <= 0) {
        socket.emit("error_message", {
          message: "No actions remaining this turn.",
        });
        return;
      }

      // Validation: Does the card exist in their private hand?
      const cardIndex = currentPlayer.hand.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) {
        socket.emit("error_message", {
          message: "Card not found in your hand.",
        });
        return;
      }

      const cardToPlay = currentPlayer.hand[cardIndex];

      // Execution: Any card with a face value can be banked (Money, Actions, or Rents)
      if (cardToPlay.value <= 0) {
        socket.emit("error_message", {
          message: "This card has no monetary value and cannot be banked.",
        });
        return;
      }

      // Move from hand to bank collection array
      currentPlayer.hand.splice(cardIndex, 1);
      currentPlayer.bank.push(cardToPlay);

      // Spend an action points counter
      room.actionsLeft -= 1;

      // Sync state changes to all players in the room
      io.to(upperRoomId).emit("room_updated", room);
      console.log(
        `${currentPlayer.name} banked ${cardToPlay.name} in room ${upperRoomId}`,
      );
    },
  );

  // 2. HANDLER: END TURN
  socket.on("end_turn", ({ roomId }: { roomId: string }) => {
    const upperRoomId = roomId.toUpperCase();
    const room = rooms.get(upperRoomId);

    if (!room || room.status !== "playing") return;

    const currentPlayer = room.players[room.turn];

    if (currentPlayer.id !== socket.id) {
      socket.emit("error_message", { message: "It is not your turn!" });
      return;
    }

    // Strict Rule Check: Hand size cap check at end of turn (Max 7 cards allowed)
    if (currentPlayer.hand.length > 7) {
      socket.emit("error_message", {
        message: `Too many cards! You have ${currentPlayer.hand.length} cards. You must discard down to 7.`,
      });
      return;
    }

    // Rotate turn index to the next connected player
    room.turn = (room.turn + 1) % room.players.length;
    room.actionsLeft = 3; // Reset action points pool

    const nextPlayer = room.players[room.turn];

    // Draw rule logic: Draw 2 cards, or draw 5 cards if your hand is completely empty!
    const cardsToDrawCount = nextPlayer.hand.length === 0 ? 5 : 2;

    // If deck runs low, flip the discard pile back into the deck automatically
    if (room.deck.length < cardsToDrawCount) {
      if (room.discardPile.length > 0) {
        import("./deck.js").then(({ shuffleDeck }) => {
          room.deck.push(...shuffleDeck(room.discardPile));
          room.discardPile = [];
        });
      }
    }

    // Pull cards out of deck array directly into the next player's private hand
    const drawnCards = room.deck.splice(0, cardsToDrawCount);
    nextPlayer.hand.push(...drawnCards);

    io.to(upperRoomId).emit("room_updated", room);
    console.log(`Turn passed to ${nextPlayer.name} in room ${upperRoomId}`);
  });

  socket.on("create_room", ({ playerName }: { playerName: string }) => {
    const roomId = generateRoomCode();

    const newRoom: GameRoom = {
      roomId,
      status: "waiting",
      hostId: socket.id,
      turn: 0,
      actionsLeft: 0,
      deck: [],
      discardPile: [],
      players: [
        {
          id: socket.id,
          name: playerName,
          hand: [],
          bank: [],
          propertySets: {},
        },
      ],
    };

    rooms.set(roomId, newRoom);
    socket.join(roomId);
    socket.emit("room_created", newRoom);
  });

  socket.on(
    "join_room",
    ({ roomId, playerName }: { roomId: string; playerName: string }) => {
      const upperRoomId = roomId.toUpperCase();
      const room = rooms.get(upperRoomId);

      if (!room) {
        socket.emit("error_message", { message: "Room not found." });
        return;
      }

      if (room.status !== "waiting") {
        socket.emit("error_message", { message: "Game has already started." });
        return;
      }

      if (room.players.length >= 5) {
        socket.emit("error_message", { message: "Room is full." });
        return;
      }

      const newPlayer: Player = {
        id: socket.id,
        name: playerName,
        hand: [],
        bank: [],
        propertySets: {},
      };

      room.players.push(newPlayer);
      socket.join(upperRoomId);
      io.to(upperRoomId).emit("room_updated", room);
    },
  );

  socket.on("start_game", ({ roomId }: { roomId: string }) => {
    const upperRoomId = roomId.toUpperCase();
    const room = rooms.get(upperRoomId);

    if (!room) {
      socket.emit("error_message", { message: "Room not found." });
      return;
    }

    if (room.hostId !== socket.id) {
      socket.emit("error_message", {
        message: "Only the host can start the game.",
      });
      return;
    }

    if (room.players.length < 2) {
      socket.emit("error_message", {
        message: "You need at least 2 players to start.",
      });
      return;
    }

    // 1. Initialize and shuffle the deck
    let completeDeck = shuffleDeck(createDeck());

    // 2. Deal 5 cards to each player
    room.players.forEach((player) => {
      player.hand = completeDeck.splice(0, 5);
      player.bank = [];
      player.propertySets = {};
    });

    // 3. Give the first player 2 cards for their starting draw phase
    const activePlayer = room.players[0];
    activePlayer.hand.push(...completeDeck.splice(0, 2));

    // 4. Update room details
    room.deck = completeDeck;
    room.discardPile = [];
    room.status = "playing";
    room.turn = 0; // First player's turn index

    // Broadcast the running game board state to everyone in the room
    io.to(upperRoomId).emit("room_updated", room);
    console.log(`Game started in room ${upperRoomId}`);
  });

  socket.on(
    "play_pass_go",
    ({ roomId, cardId }: { roomId: string; cardId: string }) => {
      const upperRoomId = roomId.toUpperCase();
      const room = rooms.get(upperRoomId);

      // 1. Core Validation Checks
      if (!room || room.status !== "playing") return;

      const currentPlayer = room.players[room.turn];

      if (currentPlayer.id !== socket.id) {
        socket.emit("error_message", { message: "It is not your turn!" });
        return;
      }

      if (room.actionsLeft <= 0) {
        socket.emit("error_message", {
          message: "No actions remaining this turn.",
        });
        return;
      }

      const cardIndex = currentPlayer.hand.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) {
        socket.emit("error_message", {
          message: "Card not found in your hand.",
        });
        return;
      }

      const card = currentPlayer.hand[cardIndex];

      // 2. Rule Check: Make sure it's actually a Pass Go card
      if (card.type !== "action" || (card as any).actionType !== "pass_go") {
        socket.emit("error_message", {
          message: "This is not a Pass Go card.",
        });
        return;
      }

      // 3. Execution: Remove the card from hand and push it to the shared discard pile
      currentPlayer.hand.splice(cardIndex, 1);
      room.discardPile.push(card);

      // 4. Action Effect: Draw exactly 2 cards from the deck
      // If the deck runs empty, recycle the discard pile
      if (room.deck.length < 2 && room.discardPile.length > 0) {
        // Basic fallback to ensure there are always cards to draw
        room.deck.push(...room.discardPile.reverse());
        room.discardPile = [];
      }

      const drawnCards = room.deck.splice(0, 2);
      currentPlayer.hand.push(...drawnCards);

      // 5. Spend one turn action point
      room.actionsLeft -= 1;

      // Sync state changes instantly to everyone in the room
      io.to(upperRoomId).emit("room_updated", room);
      console.log(`${currentPlayer.name} played Pass Go and drew 2 cards.`);
    },
  );

  socket.on("disconnect", () => {
    for (const [roomId, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex((p) => p.id === socket.id);
      if (playerIndex !== -1) {
        const removedPlayer = room.players.splice(playerIndex, 1)[0];
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          if (room.hostId === socket.id) {
            room.hostId = room.players[0].id;
          }
          io.to(roomId).emit("room_updated", room);
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Production Socket Server live on port ${PORT}`);
});
