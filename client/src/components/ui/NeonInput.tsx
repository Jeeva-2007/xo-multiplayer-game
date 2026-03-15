"use client";

import clsx from "clsx";
import { InputHTMLAttributes } from "react";

export function NeonInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-sm text-white outline-none backdrop-blur-lg",
        "transition focus:border-white/70 focus:ring-2 focus:ring-fuchsia-400/40",
        "placeholder:text-white/40",
        props.className
      )}
    />
  );
}
