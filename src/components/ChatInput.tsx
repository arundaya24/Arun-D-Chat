"use client";

import React, { useRef, useEffect } from "react";
import { ArrowUp, Square } from "lucide-react";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  stop: () => void;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  stop,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        const form = textareaRef.current?.form;
        if (form) form.requestSubmit();
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 pt-2">
      <form
        onSubmit={handleSubmit}
        className="relative flex flex-col w-full bg-[#2f2f2f] border border-[#3c3c3c] focus-within:border-[#555] rounded-2xl shadow-lg transition-all"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ketik pertanyaan atau instruksi untuk AI..."
          rows={1}
          className="w-full pl-4 pr-12 pt-3.5 pb-3 bg-transparent text-[#ececec] placeholder-neutral-400 text-sm focus:outline-none resize-none max-h-48 overflow-y-auto"
        />

        <div className="flex items-center justify-between px-3 pb-2 pt-1 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <span>Shift + Enter untuk baris baru</span>
          </div>

          <div className="flex items-center gap-2">
            {isLoading ? (
              <button
                type="button"
                onClick={stop}
                className="p-1.5 rounded-full bg-white text-black hover:bg-neutral-200 transition shadow"
                title="Hentikan pembuatan respon"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-1.5 rounded-full bg-white text-black hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-white transition shadow"
                title="Kirim pesan"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="text-center mt-2 text-[11px] text-neutral-400">
        Arun-D&apos;Chat dapat melakukan kesalahan. Selalu verifikasi fakta dan informasi penting.
      </div>
    </div>
  );
}
