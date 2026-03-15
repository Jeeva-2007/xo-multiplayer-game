"use client";

import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import clsx from "clsx";

type NeonButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  children?: ReactNode;
  loading?: boolean;
  variant?: "primary" | "secondary";
};

export function NeonButton({
  className,
  children,
  loading,
  disabled,
  variant = "primary",
  ...rest
}: NeonButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className={clsx(
        "relative inline-flex items-center justify-center rounded-2xl px-8 py-3 text-sm font-semibold tracking-wide text-white",
        variant === "primary" 
          ? "border border-white/15 bg-gradient-to-r from-[#7e34ff]/70 via-[#4b32ff]/40 to-[#22d2ff]/55"
          : "border border-white/15 bg-white/5 hover:bg-white/10",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.16),0_22px_40px_rgba(0,0,0,0.35)]",
        "backdrop-blur-lg",
        "transition-all duration-200",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      <span className="relative z-10 flex items-center gap-2">
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
        ) : null}
        {children}
      </span>
    </motion.button>
  );
}
