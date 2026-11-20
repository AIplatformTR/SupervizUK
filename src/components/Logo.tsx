import React from "react";

/**
 * Wordmark: a small serif monogram set in a square, followed by the name.
 * Deliberately quiet — it should read like a practice letterhead.
 */
export function Logo({
  accent,
  subtitle,
  size = "md",
}: {
  accent?: string;
  subtitle?: string;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "w-7 h-7 text-[17px]" : "w-8 h-8 text-[19px]";
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className={`${box} inline-flex items-center justify-center rounded-[3px] text-white font-serif italic leading-none`}
        style={{ backgroundColor: accent || "var(--ink)" }}
      >
        S
      </span>
      <span className="leading-none">
        <span className="font-serif text-[21px] tracking-[-0.01em] text-ink">
          Superviz
        </span>
        {subtitle && (
          <span className="block mt-1 text-[11px] text-ink-3 truncate max-w-[220px]">
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
}
