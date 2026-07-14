import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import type { GameRoom, Player } from "./types.ts";
import { createDeck, shuffleDeck } from "./deck.js";
import { registerActionCardHandlers } from "./actions/actionHandlers.js";
import { registerRentCardHandlers } from "./actions/rentHandlers.js";
import { checkForWinCondition } from "./utils/winChecker.js";
import { registerCounterCardHandlers } from "./actions/counterHandlers.js";
import { registerPropertyCardHandlers } from "./actions/propertyHandlers.js";

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
      "https://monopoly-deal-roan.vercel.app",
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
      actionsLeft: 3,
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

    if (room.players.length < 1) {
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
    room.actionsLeft = 3;

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

  socket.on(
    "play_targeted_action",
    ({
      roomId,
      cardId,
      targetPlayerId,
    }: {
      roomId: string;
      cardId: string;
      targetPlayerId?: string;
    }) => {
      const upperRoomId = roomId.toUpperCase();
      const room = rooms.get(upperRoomId);

      if (!room || room.status !== "playing" || room.activePayment) return;

      const currentPlayer = room.players[room.turn];
      if (currentPlayer.id !== socket.id || room.actionsLeft <= 0) return;

      const cardIndex = currentPlayer.hand.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) return;

      const card = currentPlayer.hand[cardIndex];
      if (card.type !== "action") return;

      const actionType = (card as any).actionType;
      let amountToCollect = 0;
      let payersList: string[] = [];

      // Rule Setup: Differentiate Debt Collector (5M) vs Birthday (2M)
      if (actionType === "debt_collector") {
        if (!targetPlayerId) {
          socket.emit("error_message", { message: "Select a target player." });
          return;
        }
        amountToCollect = 5; // Fixed rule value: 5M
        payersList = [targetPlayerId];
      } else if (actionType === "birthday") {
        amountToCollect = 2; // Fixed rule value: 2M
        payersList = room.players
          .filter((p) => p.id !== socket.id)
          .map((p) => p.id);
      } else {
        return;
      }

      // Filter out any target who is completely broke (No money AND no properties)
      // If a target has assets, they must stay in the pendingPayers list
      const activePayers = payersList.filter((playerId) => {
        const p = room.players.find((player) => player.id === playerId);
        if (!p) return false;
        const hasMoney = p.bank.length > 0;
        const hasProperties = Object.values(p.propertySets).some(
          (set) => set.cards.length > 0,
        );
        return hasMoney || hasProperties;
      });

      // If anyone has assets to pay, create the payment request cycle state
      if (activePayers.length > 0) {
        room.activePayment = {
          owedTo: socket.id,
          amountOwed: amountToCollect,
          pendingPayers: activePayers,
        };
      }

      // Burn card from hand and spend 1 action counter points pool
      currentPlayer.hand.splice(cardIndex, 1);
      room.discardPile.push(card);
      room.actionsLeft -= 1;

      io.to(upperRoomId).emit("room_updated", room);
      console.log(`Payment state activated: Demanded ${amountToCollect}M`);
    },
  );

  // HANDLER: PAY DEBT WITH ASSET FROM TABLE
  socket.on(
    "pay_debt_with_card",
    ({
      roomId,
      cardId,
      cardSource,
    }: {
      roomId: string;
      cardId: string;
      cardSource: "bank" | "property";
    }) => {
      const upperRoomId = roomId.toUpperCase();
      const room = rooms.get(upperRoomId);

      // 1. Verify active payment state loop is active
      if (!room || !room.activePayment) return;

      const payment = room.activePayment;
      // Ensure the user calling this event is actually the person who owes money
      if (!payment.pendingPayers.includes(socket.id)) return;

      const payer = room.players.find((p) => p.id === socket.id);
      const collector = room.players.find((p) => p.id === payment.owedTo);
      if (!payer || !collector) return;

      let cardToTransfer: any = null;

      // 2. Extract card from Payer's table board assets
      if (cardSource === "bank") {
        const idx = payer.bank.findIndex((c) => c.id === cardId);
        if (idx !== -1) {
          cardToTransfer = payer.bank.splice(idx, 1)[0];
        }
      } else if (cardSource === "property") {
        // Scan all property sets to locate the targeted card ID
        for (const color of Object.keys(payer.propertySets)) {
          const idx = payer.propertySets[color].cards.findIndex(
            (c) => c.id === cardId,
          );
          if (idx !== -1) {
            cardToTransfer = payer.propertySets[color].cards.splice(idx, 1)[0];
            // Clean up the column if it's empty
            if (payer.propertySets[color].cards.length === 0) {
              delete payer.propertySets[color];
            }
            break;
          }
        }
      }

      if (!cardToTransfer) return;

      // 3. Deliver card asset to the Collector based on type definitions
      if (
        cardToTransfer.type === "property" ||
        cardToTransfer.type === "wildcard"
      ) {
        const targetColor =
          cardToTransfer.color || cardToTransfer.colorsAvailable[0];
        if (!collector.propertySets[targetColor]) {
          collector.propertySets[targetColor] = {
            cards: [],
            isComplete: false,
          };
        }
        collector.propertySets[targetColor].cards.push(cardToTransfer);
      } else {
        // Banknotes, Action cards, or Rent cards paid as money go directly into collector's bank vault
        collector.bank.push(cardToTransfer);
      }

      // 4. Update debt balance math (No change is given in Monopoly Deal rules)
      payment.amountOwed -= cardToTransfer.value;

      // Check if this player has fully satisfied their individual debt obligation
      // or if they ran completely out of cards on table (Bankruptcy protection safety clause)
      const hasMoney = payer.bank.length > 0;
      const hasProperties = Object.values(payer.propertySets).some(
        (set) => set.cards.length > 0,
      );
      const isBroke = !hasMoney && !hasProperties;

      if (payment.amountOwed <= 0 || isBroke) {
        payment.pendingPayers = payment.pendingPayers.filter(
          (id) => id !== socket.id,
        );
      }

      // 5. Clean up payment state once all obligations are fully processed
      if (payment.pendingPayers.length === 0) {
        delete room.activePayment;
      }

      io.to(upperRoomId).emit("room_updated", room);
      console.log(
        `${payer.name} paid a card to ${collector.name}. Remaining debt state updated.`,
      );
    },
  );

  // HANDLER: DISCARD EXCESS CARDS FROM HAND WHEN OVER 7
  socket.on(
    "discard_card",
    ({ roomId, cardId }: { roomId: string; cardId: string }) => {
      const upperRoomId = roomId.toUpperCase();
      const room = rooms.get(upperRoomId);

      if (!room || room.status !== "playing") return;

      const currentPlayer = room.players[room.turn];
      if (currentPlayer.id !== socket.id) return;

      // Rule Validation: Only allow discarding if hand size exceeds the strict limit of 7
      if (currentPlayer.hand.length <= 7) {
        socket.emit("error_message", {
          message: "You only need to discard if you have more than 7 cards!",
        });
        return;
      }

      const cardIdx = currentPlayer.hand.findIndex((c) => c.id === cardId);
      if (cardIdx === -1) return;

      // Extract from hand and dump straight onto the public discard pile
      const [discardedCard] = currentPlayer.hand.splice(cardIdx, 1);
      room.discardPile.push(discardedCard);

      io.to(upperRoomId).emit("room_updated", room);
      console.log(
        `🗑️ Discard: ${currentPlayer.name} dropped excess card ${discardedCard.name}`,
      );
    },
  );

  registerActionCardHandlers(io, socket, rooms);
  registerRentCardHandlers(io, socket, rooms);
  registerCounterCardHandlers(io, socket, rooms);
  registerPropertyCardHandlers(io, socket, rooms);

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
