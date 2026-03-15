"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BackgroundScene } from "../../components/BackgroundScene";
import { GlassCard } from "../../components/ui/GlassCard";
import { NeonButton } from "../../components/ui/NeonButton";
import { isLoggedIn } from "../../utils/auth";

export default function ModeSelectionPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      <BackgroundScene />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(129,35,255,0.24),transparent_55%),radial-gradient(circle_at_bottom,rgba(0,229,255,0.15),transparent_65%)]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex w-full max-w-5xl flex-col gap-10"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-[0_0_25px_rgba(129,35,255,0.7)] sm:text-5xl">
            Choose Your Arena
          </h1>
          <p className="max-w-lg text-sm text-white/60">
            Select a game mode and dive into a glowing 3D grid. The arena awaits.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <GlassCard className="p-6">
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-white">Offline with Friend</h2>
              <p className="text-sm text-white/60">
                Pass the device between you and a friend for a quick match in the arena.
              </p>
              <NeonButton onClick={() => router.push("/game?mode=offline")}>Play Together</NeonButton>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-white">Versus AI Bot</h2>
              <p className="text-sm text-white/60">
                Challenge an adaptive AI with multiple difficulty levels.
              </p>
              <NeonButton onClick={() => router.push("/ai-difficulty")}>Face the Bot</NeonButton>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-white">Online Match</h2>
              <p className="text-sm text-white/60">
                Connect with a friend in real-time and play in a shared 3D arena.
              </p>
              <NeonButton onClick={() => router.push("/online-lobby")}>Join Match</NeonButton>
            </div>
          </GlassCard>
        </div>

        <div className="flex justify-center">
          <NeonButton
            className="w-full max-w-xs"
            onClick={() => router.push("/")}
            type="button"
          >
            Back to Login
          </NeonButton>
        </div>
      </motion.div>
    </div>
  );
}
