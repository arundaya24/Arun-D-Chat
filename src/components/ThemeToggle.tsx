"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  theme: "dark" | "light";
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isLight = theme === "light";

  return (
    <div className="theme-toggle-control" role="group" aria-label="Pilih tema">
      <button
        type="button"
        onClick={() => {
          if (!isLight) onToggle();
        }}
        className="theme-toggle-option active:scale-95"
        aria-label="Mode terang"
        aria-pressed={isLight}
        title="Mode terang"
      >
        <Sun size={15} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => {
          if (isLight) onToggle();
        }}
        className="theme-toggle-option active:scale-95"
        aria-label="Mode gelap"
        aria-pressed={!isLight}
        title="Mode gelap"
      >
        <Moon size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
