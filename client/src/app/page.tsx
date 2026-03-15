"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BackgroundScene } from "../components/BackgroundScene";
import { GlassCard } from "../components/ui/GlassCard";
import { NeonButton } from "../components/ui/NeonButton";
import { getCurrentUser, logoutUser, getUserStats, UserStats } from "../utils/auth";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setStats(getUserStats(currentUser.username));
    }
  }, []);

  const handleLogout = () => {
    logoutUser();
    router.push("/login");
  };

  if (user && stats) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
        <BackgroundScene />

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(129,35,255,0.22),transparent_55%),radial-gradient(circle_at_bottom,rgba(0,229,255,0.14),transparent_65%)]" />

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md"
        >
          <GlassCard>
            <div className="flex flex-col gap-6">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_25px_rgba(129,35,255,0.75)] sm:text-4xl">
                  Welcome, <span className="text-cyan-400">{user.username}</span>
                </h1>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg bg-white/5 p-3">
                  <div className="text-2xl font-bold text-green-400">{stats.total.wins}</div>
                  <div className="text-xs text-white/50">Wins</div>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <div className="text-2xl font-bold text-red-400">{stats.total.losses}</div>
                  <div className="text-xs text-white/50">Losses</div>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <div className="text-2xl font-bold text-yellow-400">{stats.total.draws}</div>
                  <div className="text-xs text-white/50">Draws</div>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <div className="text-2xl font-bold text-white">{stats.total.totalGames}</div>
                  <div className="text-xs text-white/50">Total</div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <NeonButton onClick={() => router.push("/mode-selection")} className="w-full">
                  PLAY NOW
                </NeonButton>

                <NeonButton 
                  onClick={() => router.push("/dashboard")} 
                  variant="secondary" 
                  className="w-full"
                >
                  DASHBOARD
                </NeonButton>

                <NeonButton 
                  onClick={handleLogout} 
                  variant="secondary" 
                  className="w-full"
                >
                  LOGOUT
                </NeonButton>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <BackgroundScene />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(129,35,255,0.26),transparent_55%),radial-gradient(circle_at_bottom,rgba(0,229,255,0.18),transparent_65%)]" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex w-full max-w-md flex-col gap-8"
      >
        <GlassCard className="glass-border-gradient p-8">
          <div className="flex flex-col gap-6">
            <div className="space-y-2 text-center">
              <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-[0_0_25px_rgba(129,35,255,0.75)] sm:text-5xl">
                <span className="bg-gradient-to-r from-indigo-200 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
                  TIC TAC TOE
                </span>{" "}
                <span className="text-white/70">ARENA</span>
              </h1>
              <p className="mx-auto max-w-sm text-sm text-white/60">
                Enter the futuristic arena and challenge your friends. Start your voyage through a neon-drenched battle grid.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <NeonButton
                className="w-full"
                onClick={() => router.push("/login")}
              >
                SIGN IN
              </NeonButton>

              <p className="mt-1 text-center text-xs text-white/40">
                New players can create an account when signing in.
              </p>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
