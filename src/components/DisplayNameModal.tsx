"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, UserRound, X } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

interface DisplayNameModalProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (name: string) => boolean;
}

export function DisplayNameModal({
  isOpen,
  currentName,
  onClose,
  onSave,
}: DisplayNameModalProps) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState(currentName);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    setDraft(currentName);
    setErrorMessage(null);
    inputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentName, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = draft.trim();

    if (!name) {
      setErrorMessage(t("nameRequired"));
      return;
    }

    if (onSave(name)) {
      onClose();
    } else {
      setErrorMessage(t("nameSaveFailed"));
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal-dialog display-name-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="display-name-title"
      >
        <header className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge" aria-hidden="true">
              <UserRound size={16} />
            </div>
            <div>
              <h2 className="modal-title" id="display-name-title">
                {t("yourName")}
              </h2>
              <p className="modal-subtitle">
                {t("nameDescription")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-button active:scale-95"
            aria-label={t("closeNameSettings")}
          >
            <X size={15} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="display-name-form">
          <label htmlFor="display-name-input" className="display-name-label">
            {t("yourName")}
          </label>
          <input
            ref={inputRef}
            id="display-name-input"
            type="text"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setErrorMessage(null);
            }}
            maxLength={40}
            autoComplete="nickname"
            className="display-name-input"
            aria-invalid={Boolean(errorMessage)}
            aria-describedby={errorMessage ? "display-name-error" : undefined}
          />
          {errorMessage && (
            <p id="display-name-error" className="display-name-error" role="alert">
              {errorMessage}
            </p>
          )}
          <div className="display-name-actions">
            <button
              type="button"
              onClick={onClose}
              className="display-name-cancel active:scale-95"
            >
              {t("cancel")}
            </button>
            <button type="submit" className="modal-primary-btn active:scale-95">
              <Check size={14} />
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
