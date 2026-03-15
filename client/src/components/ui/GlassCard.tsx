import { ReactNode } from "react";

export function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={
        "glass max-w-lg rounded-3xl border border-white/10 p-8 shadow-glow backdrop-blur-2xl " +
        (className ?? "")
      }
    >
      {children}
    </div>
  );
}
