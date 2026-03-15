"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BackgroundScene } from "../../components/BackgroundScene";
import { GlassCard } from "../../components/ui/GlassCard";
import { NeonButton } from "../../components/ui/NeonButton";
import { getCurrentUser, getUserStats, getAllStats, isLoggedIn, UserStats, getOfflineSessionStats, OfflineSessionStats, clearOfflineSessionStats } from "../../utils/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [myStats, setMyStats] = useState<UserStats | null>(null);
  const [allStats, setAllStats] = useState<UserStats[]>([]);
  const [offlineSession, setOfflineSession] = useState<OfflineSessionStats>({ player1Wins: 0, player2Wins: 0, draws: 0, totalGames: 0 });

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setMyStats(getUserStats(currentUser.username));
      setAllStats(getAllStats().slice(0, 10));
      setOfflineSession(getOfflineSessionStats());
    }
  }, [router]);

  const getWinRate = (wins: number, losses: number, draws: number) => {
    const total = wins + losses + draws;
    if (total === 0) return 0;
    return Math.round((wins / total) * 100);
  };

  const StatRow = ({ label, stats, highlight = false }: { label: string; stats: { wins: number; losses: number; draws: number; totalGames: number }; highlight?: boolean }) => (
    <tr className={highlight ? "bg-cyan-500/10" : "hover:bg-white/5"}>
      <td className={`px-4 py-3 text-sm font-medium ${highlight ? "text-cyan-300" : "text-white"}`}>{label}</td>
      <td className="px-4 py-3 text-center">
        <span className="inline-block rounded-lg bg-green-500/20 px-3 py-1 text-sm font-bold text-green-400">
          {stats.wins}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="inline-block rounded-lg bg-red-500/20 px-3 py-1 text-sm font-bold text-red-400">
          {stats.losses}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="inline-block rounded-lg bg-yellow-500/20 px-3 py-1 text-sm font-bold text-yellow-400">
          {stats.draws}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="inline-block rounded-lg bg-white/10 px-3 py-1 text-sm font-bold text-white">
          {stats.totalGames}
        </span>
      </td>
    </tr>
  );

  if (!user || !myStats) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <BackgroundScene />
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden px-4 py-12">
      <BackgroundScene />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(129,35,255,0.22),transparent_55%),radial-gradient(circle_at_bottom,rgba(0,229,255,0.14),transparent_65%)]" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-5xl"
      >
        <div className="mb-8 flex items-center justify-between">
          <NeonButton onClick={() => router.push("/")} variant="secondary">
            ← Back
          </NeonButton>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <div className="w-24" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard>
            <h2 className="mb-4 text-xl font-bold text-white">Your Statistics</h2>
            
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white/70">Mode</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-green-400">Wins</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-red-400">Losses</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-yellow-400">Draws</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-white/70">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <StatRow label="Total" stats={myStats.total} highlight />
                  <StatRow label="vs AI" stats={myStats.ai} />
                  <StatRow label="Online" stats={myStats.online} />
                  <StatRow label="Offline" stats={myStats.offline} />
                </tbody>
              </table>
            </div>
          </GlassCard>

          <div className="flex flex-col gap-6">
            <GlassCard>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Offline Session (P1 vs P2)</h2>
                {offlineSession.totalGames > 0 && (
                  <button
                    onClick={() => {
                      clearOfflineSessionStats();
                      setOfflineSession({ player1Wins: 0, player2Wins: 0, draws: 0, totalGames: 0 });
                    }}
                    className="text-xs text-white/50 hover:text-white"
                  >
                    Reset Session
                  </button>
                )}
              </div>
              
              {offlineSession.totalGames === 0 ? (
                <p className="mt-4 text-white/50">No games played in this session yet</p>
              ) : (
                <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white/70">Player</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-green-400">Wins</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-red-400">Losses</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-yellow-400">Draws</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-white/70">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-white/5">
                        <td className="px-4 py-3 text-sm font-medium text-cyan-300">Player 1</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block rounded-lg bg-green-500/20 px-3 py-1 text-sm font-bold text-green-400">
                            {offlineSession.player1Wins}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block rounded-lg bg-red-500/20 px-3 py-1 text-sm font-bold text-red-400">
                            {offlineSession.player2Wins}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block rounded-lg bg-yellow-500/20 px-3 py-1 text-sm font-bold text-yellow-400">
                            {offlineSession.draws}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block rounded-lg bg-white/10 px-3 py-1 text-sm font-bold text-white">
                            {offlineSession.totalGames}
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-white/5">
                        <td className="px-4 py-3 text-sm font-medium text-purple-300">Player 2</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block rounded-lg bg-green-500/20 px-3 py-1 text-sm font-bold text-green-400">
                            {offlineSession.player2Wins}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block rounded-lg bg-red-500/20 px-3 py-1 text-sm font-bold text-red-400">
                            {offlineSession.player1Wins}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block rounded-lg bg-yellow-500/20 px-3 py-1 text-sm font-bold text-yellow-400">
                            {offlineSession.draws}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block rounded-lg bg-white/10 px-3 py-1 text-sm font-bold text-white">
                            {offlineSession.totalGames}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>

            <GlassCard>
              <h2 className="mb-4 text-xl font-bold text-white">Leaderboard</h2>
              {allStats.length === 0 ? (
                <p className="text-white/50">No players yet</p>
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {allStats.map((stats, index) => (
                    <div
                      key={stats.username}
                      className={`flex items-center justify-between rounded-lg p-2 ${
                        stats.username === user.username ? "bg-cyan-500/20" : "bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <span className={`font-medium ${stats.username === user.username ? "text-cyan-400" : "text-white"}`}>
                          {stats.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-400">{stats.total.wins}W</span>
                        <span className="text-red-400">{stats.total.losses}L</span>
                        <span className="text-white/50">{getWinRate(stats.total.wins, stats.total.losses, stats.total.draws)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <NeonButton onClick={() => router.push("/mode-selection")}>
            Play Now
          </NeonButton>
        </div>
      </motion.div>
    </div>
  );
}
