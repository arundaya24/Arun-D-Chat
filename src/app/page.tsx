"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useChat } from "ai/react";
import { Message } from "ai";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { ChatInput } from "@/components/ChatInput";
import { MemoryManagerModal } from "@/components/MemoryManagerModal";
import { DisplayNameModal } from "@/components/DisplayNameModal";
import { LanguageProvider, useLanguage } from "@/components/LanguageProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AccentColor, ChatSession } from "@/types";
import { getClientSystemContext } from "@/lib/client-context";
import { generateFastTitle } from "@/lib/utils";
import { Brain, ChevronRight, Menu, Settings, UserRound } from "lucide-react";

const ArtisanalCanvas = dynamic(
  () => import("@/components/ArtisanalCanvas").then((mod) => mod.ArtisanalCanvas),
  { ssr: false }
);

export default function ChatPage() {
  return (
    <LanguageProvider>
      <ChatWorkspace />
    </LanguageProvider>
  );
}

function ChatWorkspace() {
  const { language, setLanguage, t } = useLanguage();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [accentColor, setAccentColor] = useState<AccentColor>("green");
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isDisplayNameModalOpen, setIsDisplayNameModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [memoryCount, setMemoryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSubmittingRef = useRef(false);
  const settingsControlRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const loadingChatIdRef = useRef<string | null>(null);
  const selectChatAbortControllerRef = useRef<AbortController | null>(null);
  const messagesCacheRef = useRef<Map<string, Message[]>>(new Map());
  const memoryRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (memoryRefreshTimerRef.current) {
        clearTimeout(memoryRefreshTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (!isSettingsOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !settingsControlRef.current?.contains(event.target)
      ) {
        setIsSettingsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSettingsOpen(false);
        settingsButtonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSettingsOpen]);

  useEffect(() => {
    const storedTheme = localStorage.getItem("arun_theme") as "dark" | "light" | null;
    const storedAccent = localStorage.getItem("arun_accent");
    const storedDisplayName = localStorage.getItem("arun_display_name")?.trim();
    const initialAccent: AccentColor =
      storedAccent === "red" || storedAccent === "yellow"
        ? storedAccent
        : "green";
    if (storedDisplayName) setDisplayName(storedDisplayName);
    const initialTheme =
      storedTheme ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setTheme(initialTheme);
    setAccentColor(initialAccent);
    document.documentElement.dataset.accent = initialAccent;
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(initialTheme);
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("arun_theme", nextTheme);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(nextTheme);
  };

  const handleAccentChange = (nextAccentColor: AccentColor) => {
    setAccentColor(nextAccentColor);
    document.documentElement.dataset.accent = nextAccentColor;
    try {
      localStorage.setItem("arun_accent", nextAccentColor);
    } catch (error) {
      console.error("Gagal menyimpan warna aksen:", error);
    }
  };

  const handleCloseDisplayNameModal = useCallback(() => {
    setIsDisplayNameModalOpen(false);
  }, []);

  const handleSaveDisplayName = useCallback((name: string) => {
    try {
      localStorage.setItem("arun_display_name", name);
    } catch (err) {
      console.error("Gagal menyimpan nama tampilan:", err);
      return false;
    }

    setDisplayName(name);
    return true;
  }, []);

  const loadChats = useCallback(async () => {
    try {
      const res = await fetch("/api/chats?userId=user_default_01");
      const data = await res.json().catch(() => ({}));
      if (data.chats && Array.isArray(data.chats)) {
        setChats(data.chats);
        try {
          localStorage.setItem("arun_chats_cache", JSON.stringify(data.chats));
        } catch {}
      }
    } catch (err) {
      console.warn("Gagal memuat daftar chat:", err);
    }
  }, []);

  const loadMemoryCount = useCallback(async () => {
    try {
      const res = await fetch("/api/memories?userId=user_default_01");
      const data = await res.json().catch(() => ({}));
      if (data.memories && Array.isArray(data.memories)) {
        setMemoryCount(data.memories.length);
      }
    } catch (err) {
      console.warn("Gagal memuat jumlah memori:", err);
    }
  }, []);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    reload,
    append,
    setMessages,
    setInput,
  } = useChat({
    api: "/api/chat",
    keepLastMessageOnError: true,
    body: {
      chatId: activeChatId,
      userId: "user_default_01",
    },
    onFinish: () => {
      setErrorMessage(null);
      loadMemoryCount();
      loadChats();
      if (memoryRefreshTimerRef.current) {
        clearTimeout(memoryRefreshTimerRef.current);
      }
      memoryRefreshTimerRef.current = setTimeout(() => {
        loadMemoryCount();
      }, 2200);
    },
    onError: (err) => {
      console.warn("Kesalahan streaming AI:", err);
      let msg = err.message || t("chatCommunicationError");
      try {
        if (
          typeof err.message === "string" &&
          err.message.trim().startsWith("{")
        ) {
          const parsed = JSON.parse(err.message);
          if (parsed.error) msg = parsed.error;
        }
      } catch {}
      setErrorMessage(msg);
    },
  });

  useEffect(() => {
    if (activeChatId && messages.length > 0) {
      messagesCacheRef.current.set(activeChatId, messages);
    }
  }, [activeChatId, messages]);

  const handleSelectChat = useCallback(
    async (chatId: string) => {
      if (chatId === activeChatIdRef.current && !isMessagesLoading) return;

      if (isLoading) {
        stop();
      }

      if (selectChatAbortControllerRef.current) {
        selectChatAbortControllerRef.current.abort();
      }

      loadingChatIdRef.current = chatId;
      setActiveChatId(chatId);
      setIsSidebarOpen(false);
      setErrorMessage(null);

      try {
        localStorage.setItem("arun_active_chat_id", chatId);
      } catch {}

      const cached = messagesCacheRef.current.get(chatId);
      if (cached && cached.length > 0) {
        setMessages(cached);
        setIsMessagesLoading(false);
      } else {
        setMessages([]);
        setIsMessagesLoading(true);
      }

      const controller = new AbortController();
      selectChatAbortControllerRef.current = controller;

      try {
        const res = await fetch(`/api/chats/${chatId}/messages`, {
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));

        if (loadingChatIdRef.current === chatId) {
          if (data.messages && Array.isArray(data.messages)) {
            const formatted: Message[] = data.messages.map(
              (m: { id: string; role: string; content: string }) => ({
                id: m.id,
                role: m.role as "user" | "assistant" | "system",
                content: m.content,
              })
            );
            messagesCacheRef.current.set(chatId, formatted);
            setMessages(formatted);
          } else {
            messagesCacheRef.current.set(chatId, []);
            setMessages([]);
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("Gagal memuat histori pesan:", err);
          if (loadingChatIdRef.current === chatId) {
            if (!cached || cached.length === 0) {
              setMessages([]);
            }
          }
        }
      } finally {
        if (loadingChatIdRef.current === chatId) {
          setIsMessagesLoading(false);
        }
      }
    },
    [isLoading, stop, setMessages, isMessagesLoading]
  );

  useEffect(() => {
    try {
      const cached = localStorage.getItem("arun_chats_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChats(parsed);
        }
      }
    } catch {}

    const init = async () => {
      await loadChats();
      await loadMemoryCount();
      try {
        const lastActiveId = localStorage.getItem("arun_active_chat_id");
        if (lastActiveId) {
          void handleSelectChat(lastActiveId);
        }
      } catch {}
    };

    init();
  }, [loadChats, loadMemoryCount, handleSelectChat]);

  const handleNewChat = useCallback(() => {
    if (isLoading) {
      stop();
    }
    if (selectChatAbortControllerRef.current) {
      selectChatAbortControllerRef.current.abort();
    }
    loadingChatIdRef.current = null;
    setIsMessagesLoading(false);
    setActiveChatId(null);
    setMessages([]);
    setInput("");
    setErrorMessage(null);
    setIsSidebarOpen(false);

    try {
      localStorage.removeItem("arun_active_chat_id");
    } catch {}
  }, [isLoading, stop, setMessages, setInput]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isMemoryModalOpen || isSidebarOpen) return;
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        (activeEl as HTMLElement)?.isContentEditable;
      if (isInput) return;

      if (
        (event.key === "n" || event.key === "N") &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        handleNewChat();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNewChat, isMemoryModalOpen, isSidebarOpen]);

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm(t("confirmDeleteConversation"))) return;

    messagesCacheRef.current.delete(chatId);

    if (activeChatId === chatId) {
      handleNewChat();
    }

    try {
      await fetch(`/api/chats?id=${chatId}`, { method: "DELETE" }).catch(() => {});
      setChats((prev) => {
        const updated = prev.filter((chat) => chat.id !== chatId);
        try {
          localStorage.setItem("arun_chats_cache", JSON.stringify(updated));
        } catch {}
        return updated;
      });
    } catch (err) {
      console.warn("Gagal menghapus chat:", err);
    }
  };

  const handleSendPreset = (presetText: string) => {
    setInput(presetText);
    setErrorMessage(null);
  };

  const handleChatSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || isLoading || isSubmittingRef.current || isMessagesLoading) return;

    setErrorMessage(null);
    const clientContext = getClientSystemContext();

    if (activeChatId) {
      handleSubmit(event, {
        body: {
          chatId: activeChatId,
          userId: "user_default_01",
          clientContext,
        },
      });
      return;
    }

    setInput("");
    isSubmittingRef.current = true;

    void (async () => {
      try {
        const fastTitle = generateFastTitle(prompt);
        const res = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: fastTitle,
            userId: "user_default_01",
          }),
        });

        const data = await res.json().catch(() => ({}));
        const newChat: ChatSession = data.chat || {
          id: crypto.randomUUID(),
          title: fastTitle,
          user_id: "user_default_01",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setActiveChatId(newChat.id);
        try {
          localStorage.setItem("arun_active_chat_id", newChat.id);
        } catch {}

        setChats((prev) => [
          newChat,
          ...prev.filter((c) => c.id !== newChat.id),
        ]);

        await append(
          { role: "user", content: prompt },
          {
            body: {
              chatId: newChat.id,
              userId: "user_default_01",
              clientContext,
            },
          }
        );
      } catch (err) {
        console.error("Gagal mengirim prompt:", err);
      } finally {
        isSubmittingRef.current = false;
      }
    })();
  };

  const handleReload = () => {
    if (isLoading || !activeChatId) return;
    reload({
      body: {
        chatId: activeChatId,
        userId: "user_default_01",
        clientContext: getClientSystemContext(),
      },
    });
  };

  const activeChatTitle =
    chats.find((chat) => chat.id === activeChatId)?.title || t("newChat");
  const isEmptyChat = messages.length === 0 && !isMessagesLoading;

  return (
    <div className="app-shell">
      <ArtisanalCanvas theme={theme} accent={accentColor} />
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onOpenMemoryModal={() => setIsMemoryModalOpen(true)}
        isOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        memoryCount={memoryCount}
      />

      <main className="workspace">
        <header className="workspace-header">
          <div className="workspace-title-wrap">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="mobile-menu active:scale-95"
              aria-label={t("openHistory")}
            >
              <Menu size={17} />
            </button>
            <span className="workspace-title">{activeChatTitle}</span>
          </div>
          <div className="workspace-actions">
            <div className="settings-control" ref={settingsControlRef}>
              <button
                ref={settingsButtonRef}
                type="button"
                onClick={() => setIsSettingsOpen((open) => !open)}
                className="settings-trigger active:scale-95"
                aria-label={t("settings")}
                title={t("settings")}
                aria-expanded={isSettingsOpen}
                aria-controls="settings-menu"
              >
                <Settings size={16} aria-hidden="true" />
              </button>
              {isSettingsOpen && (
                <div
                  id="settings-menu"
                  className="settings-menu"
                  role="group"
                  aria-label={t("settings")}
                >
                  <div className="settings-theme-row">
                    <span className="settings-section-label">{t("theme")}</span>
                    <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
                  </div>
                  <div className="settings-accent-row">
                    <span className="settings-section-label">
                      {t("accentColor")}
                    </span>
                    <div
                      className="settings-accent-options"
                      role="group"
                      aria-label={t("accentColor")}
                    >
                      <button
                        type="button"
                        onClick={() => handleAccentChange("green")}
                        className="settings-accent-option is-green active:scale-95"
                        aria-label={t("accentGreen")}
                        aria-pressed={accentColor === "green"}
                        title={t("accentGreen")}
                      />
                      <button
                        type="button"
                        onClick={() => handleAccentChange("red")}
                        className="settings-accent-option is-red active:scale-95"
                        aria-label={t("accentRed")}
                        aria-pressed={accentColor === "red"}
                        title={t("accentRed")}
                      />
                      <button
                        type="button"
                        onClick={() => handleAccentChange("yellow")}
                        className="settings-accent-option is-yellow active:scale-95"
                        aria-label={t("accentYellow")}
                        aria-pressed={accentColor === "yellow"}
                        title={t("accentYellow")}
                      />
                    </div>
                  </div>
                  <div className="settings-language-row">
                    <span className="settings-section-label">{t("language")}</span>
                    <div
                      className="settings-language-toggle"
                      role="group"
                      aria-label={t("chooseLanguage")}
                    >
                      <button
                        type="button"
                        onClick={() => setLanguage("id")}
                        className="settings-language-option active:scale-95"
                        aria-label={t("indonesian")}
                        aria-pressed={language === "id"}
                      >
                        ID
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage("en")}
                        className="settings-language-option active:scale-95"
                        aria-label={t("english")}
                        aria-pressed={language === "en"}
                      >
                        EN
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="settings-item"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setIsDisplayNameModalOpen(true);
                    }}
                  >
                    <UserRound size={15} aria-hidden="true" />
                    <span className="settings-item-copy">
                      <span>{t("yourName")}</span>
                      <small>{displayName || t("defaultUserName")}</small>
                    </span>
                    <ChevronRight size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="settings-item"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setIsMemoryModalOpen(true);
                    }}
                  >
                    <Brain size={15} aria-hidden="true" />
                    <span className="settings-item-copy">
                      <span>{t("memoryAI")}</span>
                      <small>{t("manageFacts")}</small>
                    </span>
                    <span className="settings-count">{memoryCount}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className={`workspace-body${isEmptyChat ? " is-empty" : ""}`}>
          <ChatArea
            messages={messages}
            displayName={displayName || t("defaultUserName")}
            isLoading={isLoading}
            isMessagesLoading={isMessagesLoading}
            activeChatId={activeChatId}
            onSendPreset={handleSendPreset}
            errorMessage={errorMessage}
            onDismissError={() => setErrorMessage(null)}
            onReload={handleReload}
          />

          <footer className="workspace-footer">
            <ChatInput
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleChatSubmit}
              isLoading={isLoading}
              stop={stop}
            />
          </footer>
        </div>
      </main>

      <MemoryManagerModal
        isOpen={isMemoryModalOpen}
        onClose={() => {
          setIsMemoryModalOpen(false);
          loadMemoryCount();
        }}
        userId="user_default_01"
        onMemoriesReset={loadMemoryCount}
      />
      <DisplayNameModal
        isOpen={isDisplayNameModalOpen}
        currentName={displayName || t("defaultUserName")}
        onClose={handleCloseDisplayNameModal}
        onSave={handleSaveDisplayName}
      />
    </div>
  );
}
