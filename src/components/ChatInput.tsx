"use client";

import React, { useRef, useEffect } from "react";
import { ArrowUp, Square } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

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
  const { t } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasContent = Boolean(input.trim());

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
      if (hasContent && !isLoading) {
        const form = textareaRef.current?.form;
        if (form) form.requestSubmit();
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 md:pb-6">
      <form
        onSubmit={handleSubmit}
        className="chat-composer pointer-events-auto relative flex flex-col w-full rounded-2xl md:rounded-3xl border border-black/10 dark:border-white/10 backdrop-blur-md shadow-2xl transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-within:border-black/25 dark:focus-within:border-white/25 focus-within:shadow-md"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={t("messagePlaceholder")}
          rows={1}
          className="w-full min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent px-4 pt-3.5 pb-2 text-sm md:text-base font-sans not-italic text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-0 leading-relaxed"
        />

        <div className="flex items-center justify-between px-4 pb-3 pt-1 select-none">
          <span className="hidden sm:inline text-[11px] font-sans not-italic text-neutral-600 dark:text-neutral-400">
            {t("newLineHint")}
          </span>
          <span className="sm:hidden" />

          <div className="flex items-center shrink-0">
            {isLoading ? (
              <button
                type="button"
                onClick={stop}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 transition-all duration-150 active:scale-95 shadow-sm"
                title={t("stopGenerationTitle")}
                aria-label={t("stopGeneration")}
              >
                <Square size={13} fill="currentColor" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!hasContent}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  hasContent
                  ? "chat-submit-active active:scale-95 shadow-sm cursor-pointer"
                    : "bg-neutral-200 text-neutral-600 dark:bg-zinc-800 dark:text-zinc-300 cursor-not-allowed"
                }`}
                title={t("sendMessage")}
                aria-label={t("sendMessage")}
              >
                <ArrowUp size={16} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>
      </form>

      <p className="mt-2.5 text-center text-xs font-sans text-neutral-700 dark:text-neutral-300 select-none tracking-tight">
        {t("disclaimer")}
      </p>
    </div>
  );
}
