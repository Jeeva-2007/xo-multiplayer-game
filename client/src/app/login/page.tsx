"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BackgroundScene } from "../../components/BackgroundScene";
import { GlassCard } from "../../components/ui/GlassCard";
import { NeonButton } from "../../components/ui/NeonButton";
import { NeonInput } from "../../components/ui/NeonInput";
import { loginUser, registerUser, isLoggedIn } from "../../utils/auth";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) {
      router.push("/mode-selection");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username.trim() || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (isLogin) {
      const result = loginUser(username, password);
      if (result.success) {
        router.push("/mode-selection");
      } else {
        setError(result.message);
      }
    } else {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      const result = registerUser(username, password);
      if (result.success) {
        // Auto login after register
        const loginResult = loginUser(username, password);
        if (loginResult.success) {
          router.push("/mode-selection");
        } else {
          setError(loginResult.message);
        }
      } else {
        setError(result.message);
      }
    }

    setLoading(false);
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
        <GlassCard>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_25px_rgba(129,35,255,0.75)] sm:text-4xl">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="mt-2 text-sm text-gray-300">
              {isLogin
                ? "Sign in to continue playing"
                : "Join the arena and compete"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <NeonInput
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />

            <NeonInput
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />

            {!isLogin && (
              <NeonInput
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-sm text-red-400"
              >
                {error}
              </motion.p>
            )}

            <NeonButton type="submit" disabled={loading} className="mt-2">
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </NeonButton>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setConfirmPassword("");
              }}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              {isLogin ? (
                <>
                  Don&apos;t have an account?{" "}
                  <span className="font-medium text-cyan-400">Sign up</span>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <span className="font-medium text-cyan-400">Sign in</span>
                </>
              )}
            </button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
