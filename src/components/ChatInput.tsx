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
      if (e.nativeEvent.isComposing) return;
      e.preventDefault();
      if (input.trim() && !isLoading) {
        const form = textareaRef.current?.form;
        if (form) form.requestSubmit();
      }
    }
  };

  return (
    <div className="composer-wrap">
      <form onSubmit={handleSubmit} className="composer-card">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ketik pertanyaan atau instruksi untuk AI..."
          rows={1}
          className="composer-textarea"
        />

        <div className="composer-footer">
          <div className="composer-tools">
            <span className="composer-hint">Shift + Enter untuk baris baru</span>
          </div>

          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="stop-button"
              title="Hentikan pembuatan respon"
              aria-label="Hentikan pembuatan respon"
            >
              <Square size={15} fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="send-button"
              title="Kirim pesan"
              aria-label="Kirim pesan"
            >
              <ArrowUp size={16} />
            </button>
          )}
        </div>
      </form>

      <p className="composer-disclaimer">
        Arun-D&apos;Chat dapat melakukan kesalahan. Selalu verifikasi fakta dan informasi penting.
      </p>
    </div>
  );
}
