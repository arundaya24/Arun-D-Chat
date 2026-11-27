import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function generateFastTitle(prompt: string): string {
  const cleaned = prompt
    .replace(/^["'`]|["'`]$/g, "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "Percakapan Baru";

  const firstSentence = cleaned.split(/[.?!;\n]/)[0].trim();
  const words = firstSentence.split(" ").filter(Boolean);

  if (words.length <= 6) {
    const candidate = words.join(" ");
    return candidate.slice(0, 38).trim();
  }

  return words.slice(0, 6).join(" ").slice(0, 36).trim();
}
