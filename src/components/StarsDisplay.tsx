"use client";

import { type FC } from "react";

interface StarsDisplayProps {
  stars: number | null | undefined;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const starsConfig = {
  sm: { filled: "★", empty: "☆", class: "text-yellow-500 text-sm" },
  md: { filled: "★", empty: "☆", class: "text-yellow-500 text-base" },
  lg: { filled: "★", empty: "☆", class: "text-yellow-500 text-lg" },
} as const;

export const StarsDisplay: FC<StarsDisplayProps> = ({ stars, size = "md", showLabel = false }) => {
  const config = starsConfig[size];
  const filled = stars ?? 0;
  const empty = 5 - filled;

  return (
    <span className="flex items-center gap-1" aria-label={showLabel ? `Hotel rating: ${filled} out of 5 stars` : undefined}>
      {[...Array(filled)].map((_, i) => (
        <span key={`f${i}`} className={config.class}>{config.filled}</span>
      ))}
      {[...Array(empty)].map((_, i) => (
        <span key={`e${i}`} className="text-gray-300">{config.empty}</span>
      ))}
      {showLabel && filled > 0 && <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">({filled}/5)</span>}
    </span>
  );
};