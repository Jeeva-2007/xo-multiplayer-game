"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { BackgroundScene } from "../../components/BackgroundScene";
import { GlassCard } from "../../components/ui/GlassCard";
import { NeonButton } from "../../components/ui/NeonButton";
import { NeonInput } from "../../components/ui/NeonInput";

export default function OnlineLobbyPage() {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    // Get or create client ID
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
      console.log("Connected to server:", newSocket.id);
      newSocket.emit("register", { clientId, roomCode: null, isHost: false });
    });

    newSocket.on("room_created", (data: { roomCode: string }) => {
      console.log("Room created:", data.roomCode);
      setIsCreating(false);
      setRoomCode(data.roomCode);
      setWaiting(true);
      
      // Register as host
      newSocket.emit("register", { clientId, roomCode: data.roomCode, isHost: true });
    });

    newSocket.on("game_start", (data: { roomCode: string; playerSymbol: string }) => {
      console.log("Game starting! Player:", data.playerSymbol);
      if (typeof window !== "undefined") {
        localStorage.setItem("playerSymbol", data.playerSymbol);
        // Store socket ID for game page to reuse
        localStorage.setItem("socketId", newSocket.id || "");
      }
      router.push(`/game?mode=online&room=${data.roomCode}`);
    });

    newSocket.on("error", (data: { message: string }) => {
      setIsJoining(false);
      setError(data.message);
    });

    // Don't disconnect on unmount - let the game page reuse the connection
  }, [router]);

  const handleCreateRoom = () => {
    if (!socket) return;
    setIsCreating(true);
    setError("");
    socket.emit("create_room");
  };

  const handleJoinRoom = () => {
    if (!socket || !joinCode.trim()) return;
    setIsJoining(true);
    setError("");
    socket.emit("join_room", { roomCode: joinCode.trim().toUpperCase() });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      <BackgroundScene />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(129,35,255,0.22),transparent_55%),radial-gradient(circle_at_bottom,rgba(0,229,255,0.14),transparent_65%)]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex w-full max-w-2xl flex-col gap-8"
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-[0_0_25px_rgba(129,35,255,0.75)] sm:text-5xl">
            Online Arena Lobby
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Create a room or join a friend to start your real-time match.
          </p>
        </div>

        {!roomCode ? (
          <div className="grid gap-6 md:grid-cols-2">
            <GlassCard className="p-6">
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-white">Create Room</h2>
                <p className="text-sm text-white/60">
                  Start a new game and share the room code with your friend.
                </p>
                <NeonButton onClick={handleCreateRoom} loading={isCreating}>
                  Create Room
                </NeonButton>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-white">Join Room</h2>
                <p className="text-sm text-white/60">
                  Enter a room code to join an existing match.
                </p>
                <NeonInput
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter room code"
                  maxLength={6}
                />
                <NeonButton onClick={handleJoinRoom} loading={isJoining} disabled={!joinCode.trim()}>
                  Join Match
                </NeonButton>
              </div>
            </GlassCard>
          </div>
        ) : (
          <GlassCard className="p-8">
            <div className="flex flex-col gap-6 text-center">
              <h2 className="text-xl font-semibold text-white">
                {waiting ? "Room Created!" : "Joined!"}
              </h2>
              <p className="text-sm text-white/60">
                {waiting ? "Share code with friend" : "Starting game..."}
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="glass rounded-lg px-4 py-2 text-2xl font-mono font-bold text-cyan-300">
                  {roomCode}
                </div>
                <NeonButton onClick={copyCode}>Copy</NeonButton>
              </div>
              {waiting && <NeonButton onClick={() => { setRoomCode(""); setWaiting(false); }}>Cancel</NeonButton>}
            </div>
          </GlassCard>
        )}

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-lg p-4 text-center">
            <p className="text-red-300">{error}</p>
          </motion.div>
        )}

        <div className="flex justify-center">
          <NeonButton onClick={() => router.push("/mode-selection")}>Back to Modes</NeonButton>
        </div>
      </motion.div>
    </div>
  );
}
