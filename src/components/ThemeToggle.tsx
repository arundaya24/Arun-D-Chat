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
    <button
      type="button"
      onClick={onToggle}
      className="theme-toggle-button active:scale-95"
      aria-label={isLight ? "Beralih ke mode gelap" : "Beralih ke mode terang"}
      title={isLight ? "Mode gelap" : "Mode terang"}
    >
      {isLight ? (
        <Moon size={15} className="theme-toggle-icon" />
      ) : (
        <Sun size={15} className="theme-toggle-icon" />
      )}
      <span className="theme-toggle-label">{isLight ? "Gelap" : "Terang"}</span>
    </button>
  );
}
