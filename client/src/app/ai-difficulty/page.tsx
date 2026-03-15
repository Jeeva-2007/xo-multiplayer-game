"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BackgroundScene } from "../../components/BackgroundScene";
import { GlassCard } from "../../components/ui/GlassCard";
import { NeonButton } from "../../components/ui/NeonButton";

type Difficulty = "easy" | "medium" | "hard";

export default function AIDifficultyPage() {
  const router = useRouter();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);

  const difficulties = [
    {
      id: "easy" as Difficulty,
      name: "Easy",
      description: "Perfect for beginners",
      color: "green",
    },
    {
      id: "medium" as Difficulty,
      name: "Medium",
      description: "A fair challenge",
      color: "yellow",
    },
    {
      id: "hard" as Difficulty,
      name: "Hard",
      description: "Unbeatable AI",
      color: "red",
    },
  ];

  const handleStart = () => {
    if (selectedDifficulty) {
      router.push(`/game?mode=ai&difficulty=${selectedDifficulty}`);
    }
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case "green":
        return "border-green-400/50 hover:border-green-400 hover:bg-green-500/20";
      case "yellow":
        return "border-yellow-400/50 hover:border-yellow-400 hover:bg-yellow-500/20";
      case "red":
        return "border-red-400/50 hover:border-red-400 hover:bg-red-500/20";
      default:
        return "";
    }
  };

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
        <div className="mb-6 flex items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            ← Back
          </button>
        </div>

        <GlassCard>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_0_25px_rgba(129,35,255,0.75)] sm:text-3xl">
              Select Difficulty
            </h1>
            <p className="mt-2 text-sm text-gray-300">
              Choose your opponent&apos;s skill level
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            {difficulties.map((diff) => (
              <button
                key={diff.id}
                onClick={() => setSelectedDifficulty(diff.id)}
                className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
                  selectedDifficulty === diff.id
                    ? getColorClass(diff.color)
                    : "border-white/15 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-white">{diff.name}</div>
                  <div className="text-sm text-white/50">{diff.description}</div>
                </div>
                {selectedDifficulty === diff.id && (
                  <div className={`h-5 w-5 rounded-full border-2 border-${diff.color}-400`}>
                    <div className={`h-full w-full rounded-full bg-${diff.color}-400`} />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-8">
            <NeonButton
              onClick={handleStart}
              disabled={!selectedDifficulty}
              className="w-full"
            >
              START GAME
            </NeonButton>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
