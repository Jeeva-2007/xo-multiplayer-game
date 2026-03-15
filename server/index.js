import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Tic Tac Toe Arena backend is running" });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const rooms = new Map();

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function checkWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return board.every(cell => cell) ? "draw" : null;
}

io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Register client ID and let players reconnect to an existing room
  socket.on("register", ({ clientId, roomCode, isHost }) => {
    socket.data.clientId = clientId;
    socket.data.roomCode = roomCode;
    socket.data.isHost = isHost;

    console.log(`Register: ${socket.id}, clientId: ${clientId}, room: ${roomCode}, isHost: ${isHost}`);

    if (!roomCode) {
      console.log(`No roomCode provided, skipping room sync`);
      return;
    }

    if (!rooms.has(roomCode)) {
      console.log(`Room ${roomCode} not found! Available rooms:`, Array.from(rooms.keys()));
      return;
    }

    const room = rooms.get(roomCode);
    if (!room) return;

    console.log(`Room found. clientIds: X=${room.clientIds.X}, O=${room.clientIds.O}, looking for: ${clientId}`);

    // Determine whether this user is X or O (supports reconnects)
    let symbol = null;
    if (room.clientIds.X === clientId) symbol = "X";
    else if (room.clientIds.O === clientId) symbol = "O";

    console.log(`Matched symbol: ${symbol}`);

    if (!symbol) {
      socket.emit("error", { message: "Not authorized for this room" });
      return;
    }

    // Clear any pending reconnect timeout
    if (room.reconnectTimeout) {
      clearTimeout(room.reconnectTimeout);
      room.reconnectTimeout = null;
      console.log(`Cleared reconnect timeout for room ${roomCode}`);
    }

    socket.data.playerSymbol = symbol;
    room.players[symbol] = socket.id;
    room.activePlayers[symbol] = socket.id;
    socket.join(roomCode);

    const winner = checkWinner(room.board);
    if (winner) {
      socket.emit("game_end", { winner, board: room.board });
    } else {
      socket.emit("game_sync", {
        board: room.board,
        currentTurn: room.currentTurn,
        playerSymbol: symbol,
      });
    }

    console.log(`Player synced as ${symbol} (room ${roomCode})`);
  });

  // Host creates room
  socket.on("create_room", () => {
    let roomCode;
    do {
      roomCode = generateRoomCode();
    } while (rooms.has(roomCode));

    const clientId = socket.data.clientId;
    
    rooms.set(roomCode, {
      players: { X: socket.id, O: null },
      clientIds: { X: clientId, O: null },
      board: Array(9).fill(null),
      currentTurn: "X",
      activePlayers: { X: socket.id, O: null },
      hostClientId: clientId,
      gameStarted: false,  // Game hasn't started yet
    });
    
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.playerSymbol = "X";
    
    console.log(`Room created: ${roomCode} by ${socket.id}`);
    socket.emit("room_created", { roomCode });
  });

  // Player joins room
  socket.on("join_room", ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit("error", { message: "Room not found" });
      return;
    }
    if (room.clientIds.O) {
      socket.emit("error", { message: "Room is full" });
      return;
    }

    const clientId = socket.data.clientId;
    room.clientIds.O = clientId;
    room.players.O = socket.id;
    room.activePlayers.O = socket.id;
    room.gameStarted = true;  // Game started when second player joins
    
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.playerSymbol = "O";
    
    console.log(`Player O joined: ${socket.id}, room: ${roomCode}`);
    
    // Notify both players game is starting
    io.to(room.players.X).emit("game_start", { 
      roomCode,
      playerSymbol: "X",
      board: room.board,
      currentTurn: room.currentTurn
    });
    
    io.to(room.players.O).emit("game_start", { 
      roomCode,
      playerSymbol: "O", 
      board: room.board,
      currentTurn: room.currentTurn
    });
  });

  // Player makes move
  socket.on("make_move", ({ roomCode, index }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const playerSymbol = socket.data.playerSymbol;
    if (!playerSymbol) return;
    
    // Validate move
    if (playerSymbol !== room.currentTurn) return;
    if (room.board[index]) return;
    if (room.activePlayers[playerSymbol] !== socket.id) return;

    // Make move
    room.board[index] = playerSymbol;
    room.currentTurn = playerSymbol === "X" ? "O" : "X";

    console.log(`Move: ${playerSymbol} at ${index}, next turn: ${room.currentTurn}`);

    const winner = checkWinner(room.board);
    if (winner) {
      io.to(roomCode).emit("game_over", { winner, board: room.board });
    } else {
      io.to(roomCode).emit("move_made", { 
        board: room.board, 
        currentTurn: room.currentTurn 
      });
    }
  });

  // Restart game
  socket.on("restart", ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    
    room.board = Array(9).fill(null);
    room.currentTurn = "X";
    
    io.to(roomCode).emit("game_restart", {
      board: room.board,
      currentTurn: room.currentTurn
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    const roomCode = socket.data.roomCode;
    const playerSymbol = socket.data.playerSymbol;
    if (!roomCode || !playerSymbol) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    const isHost = playerSymbol === "X";
    const otherSymbol = isHost ? "O" : "X";
    const otherSocketId = room.players[otherSymbol];

    // Clear out this player's slot so someone else can join (if game hasn't started)
    if (room.players[playerSymbol] === socket.id) {
      room.players[playerSymbol] = null;
      room.activePlayers[playerSymbol] = null;
    }

    if (!room.gameStarted) {
      if (isHost) {
        // If host leaves before the game starts, remove the room entirely.
        rooms.delete(roomCode);
        console.log(`Room ${roomCode} deleted - host disconnected before game start`);
      } else {
        console.log(`Player O disconnected from room ${roomCode} before game start; room can be rejoined`);
      }
      return;
    }

    // Game started: give a grace period for reconnection before deleting
    console.log(`Player ${playerSymbol} disconnected, waiting for reconnection...`);
    
    // Notify other player that opponent disconnected
    if (otherSocketId) {
      io.to(otherSocketId).emit("opponent_disconnected");
    }

    // Set a timeout to delete the room if player doesn't reconnect
    room.reconnectTimeout = setTimeout(() => {
      const currentRoom = rooms.get(roomCode);
      if (currentRoom && currentRoom.players[playerSymbol] === null) {
        // Player didn't reconnect, delete the room
        rooms.delete(roomCode);
        console.log(`Room ${roomCode} deleted - ${playerSymbol} did not reconnect`);
        
        if (otherSocketId) {
          io.to(otherSocketId).emit("opponent_left");
        }
      }
    }, 10000); // 10 second grace period
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server on port ${PORT}`);
});
