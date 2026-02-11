const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// --- THE GAME ROOM CLASS ---
class GameRoom {
  constructor(name) {
    this.name = name;
    this.players = []; // Array of objects: { id, name, hand: [], ready: false }
    this.turnIndex = 0; // 0 to 3
    this.deck = [];
    this.discardPile = [];
    this.currentTurn = 0;
    this.gameStarted = false;
  }

  addPlayer(socketId, name) {
    if (this.players.length < 4) {
      // Store the name along with the ID
      this.players.push({ id: socketId, name: name, hand: [] });
      return true;
    }
    return false;
  }

  dealCards(io) {
    this.createDeck();
    this.players.forEach((player) => {
      player.hand = this.deck.splice(0, 14);
    });
    this.gameStarted = true;
    this.currentTurn = 0; // Use currentTurn consistently

    // Tell everyone who the active player is
    const activePlayerId = this.players[this.currentTurn].id;
    io.to(this.name).emit("turn-update", activePlayerId);

    // Send deck count
    io.to(this.name).emit("game-state", {
      deckCount: this.deck.length,
      lastDiscard: null,
    });
  }

  startCountdown(io) {
    let seconds = 2;
    if (this.countdownTimer) clearInterval(this.countdownTimer);

    this.countdownTimer = setInterval(() => {
      io.to(this.name).emit("timer-update", seconds);

      if (seconds <= 0) {
        clearInterval(this.countdownTimer);

        // 1. DEAL LOGIC FIRST
        this.dealCards(io);

        // 2. TRIGGER UI SWITCH
        io.to(this.name).emit("game-start");

        // 3. SEND PRIVATE HANDS
        this.players.forEach((p) => {
          if (!p.id.startsWith("bot-")) {
            io.to(p.id).emit("deal-hand", p.hand);
          }
        });
        handleBotTurn(this, io);
      }
      seconds--;
    }, 1000);
  }

  createDeck() {
    const suits = ["Spades", "Hearts", "Diamonds", "Clubs"];
    const ranks = [
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
      "A",
    ];
    let newDeck = [];
    // Two decks of 52
    for (let i = 0; i < 2; i++) {
      for (let suit of suits) {
        for (let rank of ranks) {
          newDeck.push({ id: newDeck.length, suit, rank });
        }
      }
    }
    // Two Jokers
    newDeck.push(
      { id: 104, suit: "Joker", rank: "J" },
      { id: 105, suit: "Joker", rank: "J" },
    );
    this.deck = this.shuffle(newDeck);
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Inside GameRoom class in server.js
  drawCard(socketId, io) {
    // <--- io parametresini buraya ekledik
    const currentPlayer = this.players[this.currentTurn];
    if (!currentPlayer || currentPlayer.id !== socketId) return;

    if (this.deck.length === 0) return;

    const drawnCard = this.deck.pop();
    currentPlayer.hand.push(drawnCard);

    // Şimdi 'io' tanımlı olduğu için bu satır hata vermeyecek
    io.to(socketId).emit("receive-drawn-card", drawnCard);

    // Tüm odaya yeni deste sayısını bildir
    io.to(this.name).emit("update-deck-count", this.deck.length);
  }
}

// --- GLOBAL STATE ---
let activeRooms = {
  Table_1: new GameRoom("Table_1"),
  Table_2: new GameRoom("Table_2"),
  Table_3: new GameRoom("Table_2"),
  Table_4: new GameRoom("Table_2"),
};

const botNames = ["bot-Alpha", "bot-Beta", "bot-Gamma"];
botNames.forEach((name, index) => {
  // We give them fake socket IDs like 'bot-0', 'bot-1'
  activeRooms["Table_1"].addPlayer(`bot-${index}`, name);
});

// --- SOCKET LOGIC ---
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // 1. Send lobby info
  socket.emit(
    "update-lobby",
    Object.keys(activeRooms).map((key) => ({
      name: key,
      count: activeRooms[key].players.length,
      started: activeRooms[key].gameStarted,
    })),
  );

  const lobbyData = Object.keys(activeRooms).map((k) => ({
    name: k,
    count: activeRooms[k].players.length,
    playerData: activeRooms[k].players.map((p) => ({ name: p.name })), // Send the names
  }));
  io.emit("update-lobby", lobbyData);

  // 2. Joining a room
  socket.on("join-room", (data) => {
    const { roomName, playerName } = data;
    const room = activeRooms[roomName];

    if (room && room.addPlayer(socket.id, playerName)) {
      socket.join(roomName);

      // 1. Update everyone in the room about the new player
      const playersList = room.players.map((p) => ({ id: p.id, name: p.name }));
      io.to(roomName).emit("player-update", playersList);

      // 2. Refresh the lobby for everyone else
      broadcastLobbyUpdate();

      // 3. THE TRIGGER: Check if we hit exactly 4 players
      if (room.players.length === 4) {
        console.log(`Table ${roomName} is full. Starting countdown...`);
        room.startCountdown(io); // Pass 'io' so the class can send messages
      }
    }
  });

  //before bots
  /*function broadcastLobbyUpdate() {
    const lobbyData = Object.keys(activeRooms).map((k) => ({
      name: k,
      count: activeRooms[k].players.length,
      // Map player names to initials for the lobby chairs
      playerData: activeRooms[k].players.map((p) => ({
        name: p.name,
        initials: p.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .substring(0, 2),
      })),
    }));
    io.emit("update-lobby", lobbyData);
  }*/
  function broadcastLobbyUpdate() {
    const lobbyData = Object.keys(activeRooms).map((k) => ({
      name: k,
      count: activeRooms[k].players.length,
      playerData: activeRooms[k].players.map((p) => ({
        name: p.name, // The initials logic in client.js will handle the rest
      })),
    }));
    io.emit("update-lobby", lobbyData);
  }

  socket.on("leave-room", (roomName) => {
    const room = activeRooms[roomName];
    if (room) {
      // Remove the player from the array
      room.players = room.players.filter((p) => p.id !== socket.id);
      room.gameStarted = false; // Reset game if someone leaves

      socket.leave(roomName);

      // Tell everyone remaining at the table to update their view
      io.to(roomName).emit(
        "player-update",
        room.players.map((p) => ({
          id: p.id,
          name: p.name,
        })),
      );

      // Update the lobby for everyone else
      io.emit(
        "update-lobby",
        Object.keys(activeRooms).map((k) => ({
          name: k,
          count: activeRooms[k].players.length,
        })),
      );
    }
  });

  // Also handle if they just close the tab
  socket.on("disconnect", () => {
    for (let roomName in activeRooms) {
      let room = activeRooms[roomName];
      if (room.players.some((p) => p.id === socket.id)) {
        room.players = room.players.filter((p) => p.id !== socket.id);
        room.gameStarted = false;
        io.to(roomName).emit(
          "player-update",
          room.players.map((p) => ({ id: p.id, name: p.name })),
        );
        io.emit(
          "update-lobby",
          Object.keys(activeRooms).map((k) => ({
            name: k,
            count: activeRooms[k].players.length,
          })),
        );
      }
    }
  });

  socket.on("request-draw", (roomName) => {
    const room = activeRooms[roomName];
    if (room) {
      // io nesnesini buradan içeri gönderiyoruz
      room.drawCard(socket.id, io);
    }
  });

  // Inside your turn-passing logic
  socket.on("discard-card", (card) => {
    // ... validate and process discard ...

    // Move to next player
    this.currentTurn = (this.currentTurn + 1) % 4;

    // Broadcast the new turn
    io.to(this.name).emit("turn-update", this.players[this.currentTurn].id);

    // CHECK FOR BOTS: Trigger logic for the next player
    handleBotTurn(this, io);
  });
});

// Inside server.js
function handleBotTurn(room, io) {
  const activePlayer = room.players[room.currentTurn];

  if (activePlayer && activePlayer.id.startsWith("bot-")) {
    setTimeout(() => {
      // DÜZELTME: drawCard çağrılırken ikinci parametre olarak 'io' gönderilmeli
      room.drawCard(activePlayer.id, io);

      // Botun rastgele bir kart atması
      const discardIndex = Math.floor(Math.random() * activePlayer.hand.length);
      const discarded = activePlayer.hand.splice(discardIndex, 1)[0];
      room.discardPile.push(discarded);

      // ... diğer bot mantığı (turn geçişi vb.)
    }, 2000);
  }
}

server.listen(3000, () =>
  console.log("Server running on http://localhost:3000"),
);
