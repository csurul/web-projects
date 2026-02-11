const socket = io();
let currentRoom = "";
let myName = "";
let myLocalHand = [];
let currentPlayersData = [];

// Helper to get initials
function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

socket.on("game-start", () => {
  console.log("Game is starting, switching UI...");

  const lobby = document.getElementById("lobby-screen");
  const game = document.getElementById("game-screen");

  if (lobby && game) {
    lobby.style.display = "none";
    game.style.display = "block";
  }
});

function renderHand() {
  const handDiv = document.getElementById("my-hand");
  handDiv.innerHTML = "";
  const mid = (myLocalHand.length - 1) / 2;

  myLocalHand.forEach((card, i) => {
    const suit = card.suit.toLowerCase();
    const isRed = suit === "hearts" || suit === "diamonds";
    const suitID = suit === "joker" ? "icon-joker" : `icon-${suit}`;
    const cardEl = document.createElement("div");
    cardEl.className = `card ${suit === "joker" ? "joker" : isRed ? "red" : "black"}`;

    const dist = i - mid;
    const transform = `rotate(${dist * 2.5}deg) translateY(${Math.pow(dist, 2) * 1.2}px)`;
    cardEl.style.transform = transform;
    cardEl.style.setProperty("--original-transform", transform);
    cardEl.style.marginLeft = "-65px";

    cardEl.onclick = () => {
      if (myLocalHand.length === 15) {
        // Remove card from local hand
        myLocalHand.splice(i, 1);
        renderHand();

        // Tell server we discarded this card
        socket.emit("discard-card", {
          roomName: currentRoom,
          card: card,
        });
      }
    };

    cardEl.innerHTML = `
      <div class="card-top"><span>${card.rank}</span><svg class="card-mini-suit"><use href="#${suitID}"></use></svg></div>
      <svg class="card-center-suit"><use href="#${suitID}"></use></svg>
      <div class="card-bottom" style="transform:rotate(180deg)"><span>${card.rank}</span><svg class="card-mini-suit"><use href="#${suitID}"></use></svg></div>
    `;
    handDiv.appendChild(cardEl);
  });
}

function renderDiscardPile(card) {
  const discardPile = document.getElementById("discard-pile");
  const suitLower = card.suit.toLowerCase();
  const isRed = suitLower === "hearts" || suitLower === "diamonds";
  const suitID = `icon-${suitLower}`;

  discardPile.innerHTML = `
        <div class="card ${isRed ? "red" : "black"}" style="width:100%; height:100%; margin:0">
            <div class="card-top">
                <span class="card-rank" style="font-size:0.8rem">${card.rank}</span>
                <svg class="card-mini-suit" style="width:10px; height:10px"><use href="#${suitID}"></use></svg>
            </div>
            <svg class="card-center-suit" style="width:25px; height:25px"><use href="#${suitID}"></use></svg>
        </div>`;
}

// Function to create a closed card (for Deck or Opponents)
function createBackCard() {
  const cardEl = document.createElement("div");
  cardEl.className = "card back";
  cardEl.innerHTML = `<svg class="card-inner-pattern"><use href="#icon-back-pattern"></use></svg>`;
  return cardEl;
}

socket.on("receive-drawn-card", (card) => {
  console.log("Drawn card:", card);
  myLocalHand.push(card); // Add to local array
  renderHand(); // Re-draw the hand with the new curve math
});

// Make the Deck clickable
document.getElementById("deck-pile").addEventListener("click", () => {
  // Only allow draw if it's my turn and I have 14 cards
  const mySlot = document.getElementById("slot-bottom");
  const isMyTurn = mySlot
    .querySelector(".user-avatar")
    .classList.contains("active-turn");

  if (isMyTurn && myLocalHand.length === 14) {
    socket.emit("request-draw", currentRoom);
  } else if (myLocalHand.length >= 15) {
    alert("You already drew! Now discard a card.");
  }
});

// 1. Lobby Logic: Handling Table Visuals
socket.on("update-lobby", (rooms) => {
  const container = document.getElementById("visual-tables-container");
  container.innerHTML = "";

  rooms.forEach((room) => {
    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper";

    // Table Positions
    const positions = ["c-top", "c-bottom", "c-left", "c-right"];

    for (let i = 0; i < 4; i++) {
      const chair = document.createElement("div");
      chair.className = `mini-chair ${positions[i]}`;

      // room.playerData should be an array of {name, id} sent by server
      const playerAtSeat = room.playerData ? room.playerData[i] : null;

      if (playerAtSeat) {
        chair.classList.add("occupied");
        chair.innerText = getInitials(playerAtSeat.name);
      } else {
        chair.innerText = "Play";
        chair.style.cursor = "pointer";
        chair.onclick = () => handleJoin(room.name);
      }

      wrapper.appendChild(chair);
    }

    const table = document.createElement("div");
    table.className = "poker-table";
    table.innerHTML = `<span>${room.name}</span>`;
    wrapper.appendChild(table);

    container.appendChild(wrapper);
  });
});

// 2. Room Logic: Updating Chairs and Names
socket.on("player-update", (playersData) => {
  currentPlayersData = playersData; // Store globally for turn-logic
  const slots = ["bottom", "left", "top", "right"];

  // 1. Find your own index in the server's list
  const myIndex = playersData.findIndex((p) => p.id === socket.id);

  // 2. Clear all slots first
  slots.forEach((s) => {
    const slotEl = document.getElementById(`slot-${s}`);
    slotEl.querySelector(".player-name").innerText = "Empty";
    slotEl.querySelector(".user-avatar").style.background = "#4a4a4a";
  });

  // 3. Map players relative to YOU
  playersData.forEach((player, index) => {
    // This math "rotates" the table so you are always index 0 (bottom)
    const relativeIndex = (index - myIndex + 4) % 4;
    const slotName = slots[relativeIndex];
    const slotEl = document.getElementById(`slot-${slotName}`);

    if (slotEl) {
      const avatar = slotEl.querySelector(".user-avatar");
      const nameText = slotEl.querySelector(".player-name");

      nameText.innerText = player.name;
      avatar.style.background = player.id === socket.id ? "#3498db" : "#f1c40f";
      avatar.style.borderColor = "#ffffff";
    }
  });
});

function handleJoin(roomName) {
  myName = prompt("Enter your Name:");
  if (!myName) return;

  currentRoom = roomName;
  socket.emit("join-room", { roomName: roomName, playerName: myName });

  document.getElementById("lobby-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "block";
}

// 3. Game Logic: Timer and Dealing
socket.on("timer-update", (seconds) => {
  const timerEl = document.getElementById("countdown-display");
  timerEl.style.display = "block";
  timerEl.innerText = seconds;
  document.getElementById("status-msg").innerText = `Starting in ${seconds}...`;

  if (seconds === 0) timerEl.style.display = "none";
});

socket.on("timer-clear", () => {
  document.getElementById("countdown-display").style.display = "none";
  document.getElementById("status-msg").innerText = "Waiting for players...";
});

socket.on("deal-hand", (hand) => {
  console.log("Hand received from server:", hand);
  myLocalHand = hand;
  renderHand(); // This calls your mathematical fan function
  renderBotHands();
});

function renderBotHands() {
  const opponentSlots = ["top", "left", "right"];

  opponentSlots.forEach((slot) => {
    const container = document.getElementById(`hand-${slot}`);
    if (!container) return;

    container.innerHTML = "";
    // Draw 14 face-down cards
    for (let i = 0; i < 14; i++) {
      const cardBack = document.createElement("div");
      cardBack.className = "card back";
      // Important: Use the SVG pattern we defined in index.html
      cardBack.innerHTML = `<svg><use href="#icon-back-pattern"></use></svg>`;
      container.appendChild(cardBack);
    }
  });
}

// Replace your existing turn-update listener in client.js with this:

socket.on("turn-update", (activePlayerId) => {
  document
    .querySelectorAll(".user-avatar")
    .forEach((a) => a.classList.remove("active-turn"));

  const myIndex = currentPlayersData.findIndex((p) => p.id === socket.id);
  const activeIndex = currentPlayersData.findIndex(
    (p) => p.id === activePlayerId,
  );

  if (activeIndex !== -1) {
    const slots = ["bottom", "left", "top", "right"];
    // Calculate which visual slot the active player is in
    const relativeIndex = (activeIndex - myIndex + 4) % 4;
    const slotId = `slot-${slots[relativeIndex]}`;

    const avatar = document
      .getElementById(slotId)
      .querySelector(".user-avatar");
    avatar.classList.add("active-turn");

    document.getElementById("status-msg").innerText =
      activePlayerId === socket.id
        ? "It's YOUR turn!"
        : "Waiting for opponent...";
  }
});

socket.on("game-state", (data) => {
  document.getElementById("deck-count-label").innerText = data.deckCount;

  if (data.lastDiscard) {
    renderDiscardPile(data.lastDiscard);
  }
});

function exitTable() {
  if (confirm("Leave table?")) {
    socket.emit("leave-room", currentRoom);
    location.reload(); // Simplest way to reset the client state
  }
}
