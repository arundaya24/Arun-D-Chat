"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

interface ThemeToggleProps {
  theme: "dark" | "light";
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isLight = theme === "light";
  const { t } = useLanguage();

  return (
    <div className="theme-toggle-control" role="group" aria-label={t("chooseTheme")}>
      <button
        type="button"
        onClick={() => {
          if (!isLight) onToggle();
        }}
        className="theme-toggle-option active:scale-95"
        aria-label={t("lightMode")}
        aria-pressed={isLight}
        title={t("lightMode")}
      >
        <Sun size={15} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => {
          if (isLight) onToggle();
        }}
        className="theme-toggle-option active:scale-95"
        aria-label={t("darkMode")}
        aria-pressed={!isLight}
        title={t("darkMode")}
      >
        <Moon size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
