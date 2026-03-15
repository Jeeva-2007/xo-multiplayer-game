"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { BackgroundScene } from "../../components/BackgroundScene";
import { GlassCard } from "../../components/ui/GlassCard";
import { NeonButton } from "../../components/ui/NeonButton";
import { getCurrentUser, updateStats, getAiFirstPreference, setAiFirstPreference, getOfflineFirstPreference, setOfflineFirstPreference, getOfflineLastResult, setOfflineLastResult, updateOfflineSessionStats } from "../../utils/auth";

type Player = "X" | "O";
type Board = (Player | null)[];

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWinner(board: Board): Player | "draw" | null {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as Player;
    }
  }
  if (board.every(cell => cell !== null)) return "draw";
  return null;
}

function minimax(board: Board, depth: number, isMaximizing: boolean): number {
  const result = checkWinner(board);
  if (result !== null) {
    if (result === "O") return 10 - depth;
    if (result === "X") return depth - 10;
    return 0;
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = "O";
        const score = minimax(board, depth + 1, false);
        board[i] = null;
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = "X";
        const score = minimax(board, depth + 1, true);
        board[i] = null;
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

function findBestMove(board: Board): number {
  let bestScore = -Infinity;
  let move = 0;
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = "O";
      const score = minimax(board, 0, false);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
}

function getAIMove(board: Board, difficulty: "easy" | "medium" | "hard"): number {
  const emptyIndices = board.map((cell, idx) => cell === null ? idx : -1).filter(idx => idx !== -1);
  
  if (emptyIndices.length === 0) return -1;
  
  if (difficulty === "easy") {
    const randomIdx = Math.floor(Math.random() * emptyIndices.length);
    if (Math.random() < 0.3) {
      return findBestMove(board);
    }
    return emptyIndices[randomIdx];
  }
  
  if (difficulty === "medium") {
    if (Math.random() < 0.5) {
      return findBestMove(board);
    }
    const randomIdx = Math.floor(Math.random() * emptyIndices.length);
    return emptyIndices[randomIdx];
  }
  
  return findBestMove(board);
}

function getWinningLine(board: Board): number[] | null {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return combo;
    }
  }
  return null;
}

function GamePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") as "ai" | "online" | "offline" | null;
  const roomCode = searchParams.get("room");
  const difficulty = searchParams.get("difficulty") as "easy" | "medium" | "hard" | null;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [mySymbol, setMySymbol] = useState<Player | null>(null);
  const [winner, setWinner] = useState<Player | "draw" | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [aiGoesFirst, setAiGoesFirst] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [lastGameResult, setLastGameResult] = useState<"user" | "ai" | "draw" | null>(null);
  const [player1GoesFirst, setPlayer1GoesFirst] = useState(false);
  const [offlineLastResult, setOfflineLastResult] = useState<"player1" | "player2" | "draw" | null>(null);
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">(difficulty || "medium");

  useEffect(() => {
    if (mode === "ai") {
      const storedAiFirst = getAiFirstPreference();
      setAiGoesFirst(storedAiFirst);
      
      if (storedAiFirst) {
        setCurrentPlayer("O");
        setAiThinking(true);
        setTimeout(() => {
          const newBoard = Array(9).fill(null);
          const aiMove = getAIMove(newBoard, aiDifficulty);
          newBoard[aiMove] = "O";
          setBoard(newBoard);
          setCurrentPlayer("X");
          setAiThinking(false);
        }, 800);
      } else {
        setCurrentPlayer("X");
      }
    }
    
    if (mode === "offline") {
      const storedP1First = getOfflineFirstPreference();
      setPlayer1GoesFirst(storedP1First);
      setCurrentPlayer(storedP1First ? "X" : "O");
      
      const lastResult = getOfflineLastResult();
      if (lastResult) {
        setOfflineLastResult(lastResult);
      }
    }
  }, [mode, gameKey, aiDifficulty]);

  useEffect(() => {
    if (mode !== "online" || !roomCode) return;

    let clientId = "";
    if (typeof window !== "undefined") {
      clientId = localStorage.getItem("clientId") || "";
      if (!clientId) {
        clientId = "client_" + Math.random().toString(36).substring(2, 15);
        localStorage.setItem("clientId", clientId);
      }
    }

    const newSocket = io(process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected:", newSocket.id);
      
      // Get player symbol from localStorage (set by lobby)
      const playerSymbol = localStorage.getItem("playerSymbol");
      const isHost = playerSymbol === "X";
      
      // Register with server
      newSocket.emit("register", { clientId, roomCode, isHost });
    });

    newSocket.on("game_sync", (data: { board: Board; currentTurn: Player; playerSymbol: Player }) => {
      console.log("Game sync:", data);
      setBoard(data.board);
      setCurrentPlayer(data.currentTurn);
      setMySymbol(data.playerSymbol);
      setIsReady(true);
    });

    newSocket.on("game_start", (data: { board: Board; currentTurn: Player; playerSymbol: Player }) => {
      console.log("Game start:", data);
      setBoard(data.board);
      setCurrentPlayer(data.currentTurn);
      setMySymbol(data.playerSymbol as Player);
      setIsReady(true);
    });

    newSocket.on("move_made", (data: { board: Board; currentTurn: Player }) => {
      console.log("Move made:", data);
      setBoard(data.board);
      setCurrentPlayer(data.currentTurn);
    });

    newSocket.on("game_over", (data: { winner: Player | "draw"; board: Board }) => {
      console.log("Game over:", data.winner);
      setWinner(data.winner);
      setBoard(data.board);
      setWinningLine(getWinningLine(data.board));
      
      const currentUser = getCurrentUser();
      if (currentUser && mySymbol) {
        if (data.winner === "draw") {
          updateStats(currentUser.username, "draw", "online");
        } else if (data.winner === mySymbol) {
          updateStats(currentUser.username, "win", "online");
        } else {
          updateStats(currentUser.username, "lose", "online");
        }
      }
    });

    newSocket.on("game_restart", (data: { board: Board; currentTurn: Player }) => {
      setBoard(data.board);
      setCurrentPlayer(data.currentTurn);
      setWinner(null);
      setWinningLine(null);
    });

    newSocket.on("opponent_left", () => {
      console.log("Opponent left!");
      setOpponentLeft(true);
    });

    newSocket.on("opponent_disconnected", () => {
      console.log("Opponent disconnected, waiting for reconnection...");
    });

    newSocket.on("error", (data: { message: string }) => {
      console.error("Socket error:", data.message);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Connection error:", err.message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [mode, roomCode]);

  const trackGameResult = useCallback((result: Player | "draw") => {
    const currentUser = getCurrentUser();
    if (!currentUser || !mode) return;

    if (result === "draw") {
      updateStats(currentUser.username, "draw", mode);
      if (mode === "ai") {
        setLastGameResult("draw");
      }
      if (mode === "offline") {
        setOfflineLastResult("draw");
        updateOfflineSessionStats("draw");
      }
    } else if (mode === "ai") {
      if (result === "X") {
        updateStats(currentUser.username, "win", mode);
        setLastGameResult("user");
      } else {
        updateStats(currentUser.username, "lose", mode);
        setLastGameResult("ai");
      }
    } else if (mode === "offline") {
      if (result === "X") {
        updateStats(currentUser.username, "win", mode);
        setOfflineLastResult("player1");
        updateOfflineSessionStats("player1");
      } else {
        updateStats(currentUser.username, "lose", mode);
        setOfflineLastResult("player2");
        updateOfflineSessionStats("player2");
      }
    } else if (mode === "online") {
      if (result === mySymbol) {
        updateStats(currentUser.username, "win", mode);
      } else {
        updateStats(currentUser.username, "lose", mode);
      }
    }
  }, [mode, currentPlayer, mySymbol]);

  const handleCellClick = useCallback((index: number) => {
    if (board[index] || winner || aiThinking || opponentLeft) return;

    if (mode === "online") {
      if (!socket || !isReady || currentPlayer !== mySymbol) return;
      console.log("Making move:", index);
      socket.emit("make_move", { roomCode, index });
    } else if (mode === "offline") {
      const newBoard = [...board];
      newBoard[index] = currentPlayer;
      setBoard(newBoard);

      const gameWinner = checkWinner(newBoard);
      if (gameWinner) {
        setWinner(gameWinner);
        if (gameWinner !== "draw") setWinningLine(getWinningLine(newBoard));
        trackGameResult(gameWinner);
      } else {
        setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
      }
    } else if (mode === "ai") {
      if (currentPlayer !== "X") return;
      const newBoard = [...board];
      newBoard[index] = "X";
      setBoard(newBoard);

      const gameWinner = checkWinner(newBoard);
      if (gameWinner) {
        setWinner(gameWinner);
        if (gameWinner !== "draw") setWinningLine(getWinningLine(newBoard));
      } else {
        setCurrentPlayer("O");
        setAiThinking(true);
        
        setTimeout(() => {
          const aiMove = getAIMove(newBoard, aiDifficulty);
          newBoard[aiMove] = "O";
          setBoard(newBoard);
          
          const aiWinner = checkWinner(newBoard);
          if (aiWinner) {
            setWinner(aiWinner);
            if (aiWinner !== "draw") setWinningLine(getWinningLine(newBoard));
            trackGameResult(aiWinner);
          } else {
            setCurrentPlayer("X");
          }
          setAiThinking(false);
        }, 800);
      }
    }
  }, [mode, socket, isReady, mySymbol, board, winner, aiThinking, opponentLeft, roomCode, currentPlayer, trackGameResult, aiDifficulty]);

  const handleRestart = useCallback(() => {
    if (mode === "online" && socket && roomCode) {
      socket.emit("restart", { roomCode });
    } else {
      setBoard(Array(9).fill(null));
      setWinner(null);
      setWinningLine(null);
      setAiThinking(false);
      
      if (mode === "ai") {
        let firstPlayer: Player;
        if (lastGameResult === "user") {
          firstPlayer = "X";
        } else if (lastGameResult === "ai") {
          firstPlayer = "O";
        } else if (lastGameResult === "draw") {
          firstPlayer = aiGoesFirst ? "O" : "X";
          setAiGoesFirst(!aiGoesFirst);
          setAiFirstPreference(!aiGoesFirst);
        } else {
          firstPlayer = aiGoesFirst ? "O" : "X";
        }
        setCurrentPlayer(firstPlayer);
        
        if (firstPlayer === "O") {
          setAiThinking(true);
          setTimeout(() => {
            const aiMove = getAIMove(Array(9).fill(null), aiDifficulty);
            const newBoard = Array(9).fill(null);
            newBoard[aiMove] = "O";
            setBoard(newBoard);
            setCurrentPlayer("X");
            setAiThinking(false);
          }, 800);
        }
      } else if (mode === "offline") {
        let firstPlayer: Player;
        if (offlineLastResult === "player1") {
          firstPlayer = "X";
        } else if (offlineLastResult === "player2") {
          firstPlayer = "O";
        } else if (offlineLastResult === "draw") {
          firstPlayer = player1GoesFirst ? "X" : "O";
          setPlayer1GoesFirst(!player1GoesFirst);
          setOfflineFirstPreference(!player1GoesFirst);
        } else {
          firstPlayer = player1GoesFirst ? "X" : "O";
        }
        setCurrentPlayer(firstPlayer);
      } else {
        setCurrentPlayer("X");
      }
    }
  }, [mode, socket, roomCode, lastGameResult, aiGoesFirst, aiDifficulty, offlineLastResult, player1GoesFirst]);

  const isWinningCell = (index: number) => winningLine?.includes(index) ?? false;

  if (mode !== "offline" && mode !== "ai" && mode !== "online") {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <BackgroundScene />
        <GlassCard className="p-8">
          <p className="text-white">Invalid mode</p>
          <NeonButton onClick={() => router.push("/mode-selection")}>Back</NeonButton>
        </GlassCard>
      </div>
    );
  }

  if (mode === "online" && !isReady) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <BackgroundScene />
        <GlassCard className="p-8">
          <p className="text-white">Connecting to game...</p>
        </GlassCard>
      </div>
    );
  }

  const isMyTurn = mode === "online" ? currentPlayer === mySymbol : (mode === "ai" ? currentPlayer === "X" : true);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden px-4 py-8">
      <BackgroundScene />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(129,35,255,0.22),transparent_55%),radial-gradient(circle_at_bottom,rgba(0,229,255,0.14),transparent_65%)]" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 mx-auto w-full max-w-4xl"
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white drop-shadow-[0_0_25px_rgba(129,35,255,0.75)]">
            TIC TAC TOE ARENA
          </h1>
          <p className="text-sm text-white/60">
            {mode === "online" ? `Room: ${roomCode}` : mode === "ai" ? `Battle vs AI (${aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)})` : "Offline"}
          </p>
        </div>

        {/* AI First Move Toggle */}
        {mode === "ai" && (
          <div className="mb-6 flex justify-center gap-4">
            <button
              onClick={() => {
                setAiGoesFirst(false);
                setAiFirstPreference(false);
                setBoard(Array(9).fill(null));
                setCurrentPlayer("X");
                setWinner(null);
                setWinningLine(null);
                setAiThinking(false);
                setLastGameResult(null);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                !aiGoesFirst 
                  ? "bg-cyan-500/30 text-cyan-300 ring-2 ring-cyan-400" 
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              You Go First
            </button>
            <button
              onClick={() => {
                setAiGoesFirst(true);
                setAiFirstPreference(true);
                setBoard(Array(9).fill(null));
                setCurrentPlayer("O");
                setWinner(null);
                setWinningLine(null);
                setAiThinking(true);
                setLastGameResult(null);
                setTimeout(() => {
                  const newBoard = Array(9).fill(null);
                  const aiMove = getAIMove(newBoard, aiDifficulty);
                  newBoard[aiMove] = "O";
                  setBoard(newBoard);
                  setCurrentPlayer("X");
                  setAiThinking(false);
                }, 800);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                aiGoesFirst 
                  ? "bg-purple-500/30 text-purple-300 ring-2 ring-purple-400" 
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              AI Goes First
            </button>
          </div>
        )}

        {/* Offline First Player Toggle */}
        {mode === "offline" && (
          <div className="mb-6 flex justify-center gap-4">
            <button
              onClick={() => {
                setPlayer1GoesFirst(true);
                setOfflineFirstPreference(true);
                setBoard(Array(9).fill(null));
                setCurrentPlayer("X");
                setWinner(null);
                setWinningLine(null);
                setOfflineLastResult(null);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                player1GoesFirst 
                  ? "bg-cyan-500/30 text-cyan-300 ring-2 ring-cyan-400" 
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              Player 1 First
            </button>
            <button
              onClick={() => {
                setPlayer1GoesFirst(false);
                setOfflineFirstPreference(false);
                setBoard(Array(9).fill(null));
                setCurrentPlayer("O");
                setWinner(null);
                setWinningLine(null);
                setOfflineLastResult(null);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                !player1GoesFirst 
                  ? "bg-purple-500/30 text-purple-300 ring-2 ring-purple-400" 
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              Player 2 First
            </button>
          </div>
        )}

        {/* Player indicators */}
        <div className="mb-8 flex justify-center gap-8">
          <motion.div
            className={`glass rounded-2xl px-6 py-3 ${currentPlayer === "X" && !winner && !aiThinking ? "ring-2 ring-cyan-400" : ""}`}
            animate={currentPlayer === "X" && !winner && !aiThinking ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-300">X</div>
              <div className="text-xs text-white/60">
                {mode === "online" ? (mySymbol === "X" ? "You" : "Opponent") : mode === "ai" ? "You" : "Player 1"}
              </div>
            </div>
          </motion.div>
          <motion.div
            className={`glass rounded-2xl px-6 py-3 ${((currentPlayer === "O" && mode === "offline") || aiThinking || (mode === "online" && currentPlayer === "O")) && !winner ? "ring-2 ring-pink-400" : ""}`}
            animate={((currentPlayer === "O" && mode === "offline") || aiThinking || (mode === "online" && currentPlayer === "O")) && !winner ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-300">O</div>
              <div className="text-xs text-white/60">
                {mode === "online" ? (mySymbol === "O" ? "You" : "Opponent") : mode === "ai" ? "AI Bot" : "Player 2"}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Status */}
        <div className="mb-8 text-center">
          <AnimatePresence mode="wait">
            {opponentLeft ? (
              <motion.div key="left" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl text-red-300">
                Opponent left the game
              </motion.div>
            ) : winner ? (
              <motion.div key="winner" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-2xl font-bold text-white">
                {winner === "draw" ? "Draw!" : mode === "online" ? (winner === mySymbol ? "You Win!" : "Opponent Wins!") : winner === "X" ? (mode === "ai" ? "You Win!" : "Player 1 Wins!") : (mode === "ai" ? "AI Wins!" : "Player 2 Wins!")}
              </motion.div>
            ) : aiThinking ? (
              <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl text-pink-300">
                AI is thinking...
              </motion.div>
            ) : (
              <motion.div key="turn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl text-white/80">
                {mode === "online" ? (currentPlayer === mySymbol ? "Your turn" : "Opponent's turn") : mode === "ai" ? (currentPlayer === "X" ? "Your turn" : "AI's turn") : `Player ${currentPlayer}'s turn`}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Board */}
        <div className="mb-8 flex justify-center">
          <div className="grid grid-cols-3 gap-2 aspect-square w-full max-w-sm mx-auto">
            {board.map((cell, index) => (
              <motion.button
                key={index}
                onClick={() => handleCellClick(index)}
                disabled={!!cell || !!winner || aiThinking || opponentLeft || (mode === "online" && !isMyTurn)}
                className={`aspect-square rounded-xl border-2 backdrop-blur-lg ${
                  isWinningCell(index) ? "border-yellow-400 bg-yellow-400/20" : "border-white/20 bg-black/20 hover:border-white/40"
                }`}
                whileHover={!cell && !winner && !aiThinking && (mode !== "online" || isMyTurn) ? { scale: 1.05 } : {}}
                whileTap={!cell && !winner && !aiThinking ? { scale: 0.95 } : {}}
              >
                <AnimatePresence>
                  {cell && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={`flex h-full w-full items-center justify-center text-4xl font-bold ${
                        cell === "X" ? "text-cyan-300 drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]" : "text-pink-300 drop-shadow-[0_0_10px_rgba(255,0,255,0.8)]"
                      }`}
                    >
                      {cell}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <NeonButton onClick={handleRestart}>
            {mode === "online" ? (winner ? "Play Again" : "Back to Lobby") : "Restart Match"}
          </NeonButton>
          <NeonButton onClick={() => router.push("/mode-selection")}>Exit</NeonButton>
        </div>
      </motion.div>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-black text-white">Loading...</div>}>
      <GamePageContent />
    </Suspense>
  );
}
