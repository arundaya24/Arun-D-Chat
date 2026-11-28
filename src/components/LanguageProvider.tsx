"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AppLanguage = "id" | "en";

const translations = {
  id: {
    settings: "Pengaturan",
    theme: "Tema",
    language: "Bahasa",
    chooseLanguage: "Pilih bahasa aplikasi",
    indonesian: "Bahasa Indonesia",
    english: "Bahasa Inggris",
    yourName: "Nama Anda",
    defaultUserName: "Anda",
    nameDescription: "Nama ini akan tampil di atas pesan yang kamu kirim.",
    nameRequired: "Nama tidak boleh kosong.",
    nameSaveFailed: "Nama gagal disimpan. Coba lagi.",
    closeNameSettings: "Tutup pengaturan nama",
    cancel: "Batal",
    save: "Simpan",
    close: "Tutup",
    closeNavigation: "Tutup navigasi",
    openHistory: "Buka riwayat percakapan",
    newChat: "Percakapan baru",
    conversations: "Percakapan",
    searchConversations: "Cari percakapan",
    noMatchingConversations: "Tidak ada percakapan yang cocok.",
    historyEmpty: "Percakapan yang kamu mulai akan muncul di sini.",
    today: "Hari ini",
    yesterday: "Kemarin",
    last7Days: "7 Hari Terakhir",
    older: "Lebih Lama",
    deleteConversation: "Hapus percakapan",
    confirmDeleteConversation: "Hapus percakapan ini secara permanen?",
    manageMemory: "Kelola memori",
    memoryAI: "Memori AI",
    manageFacts: "Kelola fakta dan preferensi",
    chooseTheme: "Pilih tema",
    lightMode: "Mode terang",
    darkMode: "Mode gelap",
    welcomeHeading: "Apa yang sedang kamu kerjakan?",
    welcomeDescription:
      "Tanyakan soal kode, simpan preferensi, atau bandingkan pilihan teknis.",
    presetCasualTitle: "Ngobrol santai aja",
    presetCasualDescription:
      "Mulai obrolan ringan, bahas random, atau sekadar cerita hari ini.",
    presetCasualPrompt:
      "Ayo ngobrol santai. Tanyakan bagaimana hari saya atau ajak bahas sesuatu yang ringan.",
    presetIdeasTitle: "Bantu mikir & cari ide",
    presetIdeasDescription:
      "Lempar ide kasar, rencana, atau dilema kecil buat diobrolin bareng.",
    presetIdeasPrompt:
      "Bantu saya memikirkan ide, rencana, atau dilema kecil. Ajukan pertanyaan dan tawarkan beberapa sudut pandang.",
    presetTasksTitle: "Bantu beresin tugas",
    presetTasksDescription:
      "Ringkas teks, rapihin tulisan, atau jawab pertanyaan cepat.",
    presetTasksPrompt:
      "Bantu saya menyelesaikan tugas. Saya mungkin perlu meringkas teks, merapikan tulisan, atau mendapat jawaban cepat.",
    loadingConversation: "Memuat percakapan...",
    processingResponse: "Memproses respon...",
    regenerateResponse: "Regenerasi",
    copied: "Tersalin",
    copyMessage: "Salin teks pesan",
    messagePlaceholder: "Tulis pesan...",
    newLineHint: "Shift + Enter untuk baris baru",
    stopGenerationTitle: "Hentikan pembuatan respon",
    stopGeneration: "Hentikan respon",
    sendMessage: "Kirim pesan",
    disclaimer:
      "Arun-D'Chat dapat melakukan kesalahan. Harap verifikasi data penting secara independen.",
    chatCommunicationError:
      "Terjadi kesalahan saat berkomunikasi dengan AI.",
    memoryIndexed: "Memori Terindeks",
    memoryBackendPgvector: "pgvector RAG",
    memoryBackendLocal: "Memori Lokal",
    memorySubtitle:
      "Fakta teknis dan preferensi kerja yang diindeks secara otomatis.",
    closeMemoryWindow: "Tutup jendela memori",
    memorySearch: "Saring berdasarkan kata kunci...",
    deleteAllMemories: "Hapus semua memori",
    resetting: "Mereset...",
    resetMemory: "Reset Memori",
    addFact: "Tambah Fakta",
    manualFactTitle: "Input Fakta Manual",
    memoryExample:
      "Contoh: Pengguna adalah senior engineer dengan fokus arsitektur sistem dan TypeScript.",
    category: "Kategori:",
    categoryAll: "Semua",
    categoryPreference: "Preferensi",
    categoryFact: "Fakta",
    categoryProfile: "Profil",
    categoryWork: "Pekerjaan",
    categoryGoal: "Tujuan",
    categoryGeneral: "Umum",
    saving: "Menyimpan...",
    saveToVector: "Simpan ke Vektor",
    loadingMemoryIndex: "Memuat indeks memori...",
    noMemoryTitle: "Belum ada data memori yang tersimpan.",
    noMemoryDescription:
      "Fakta baru akan otomatis diekstrak saat Anda berdiskusi, atau Anda dapat menambahkannya secara manual.",
    deleteMemory: "Hapus memori",
    confirmDeleteMemory: "Hapus catatan memori ini secara permanen?",
    confirmResetAllMemories:
      "Apakah Anda yakin ingin menghapus seluruh data memori?\n\nTindakan ini akan menghapus semua informasi personal, fakta, dan preferensi yang diingat AI tentang Anda. Riwayat percakapan tidak akan terhapus.",
    saveMemoryFailed: "Gagal menyimpan data memori",
    resetMemoryFailed: "Gagal mereset data memori",
    newFactSavedPgvector:
      "Fakta baru berhasil disimpan ke database vektor pgvector.",
    newFactSavedLocal:
      "Fakta baru disimpan pada memori lokal sesi aktif.",
    memoryResetSuccess: "Seluruh data memori berhasil direset secara permanen.",
    total: "Total:",
    entries: "entri",
    memoryFooterPgvector: "pgvector Cosine Distance Matching",
    memoryFooterLocal: "Penyimpanan Memori Lokal Sesi Aktif",
    copyCode: "Salin Kode",
    copiedCode: "Tersalin!",
    copy: "Salin",
    plainText: "teks",
  },
  en: {
    settings: "Settings",
    theme: "Theme",
    language: "Language",
    chooseLanguage: "Choose app language",
    indonesian: "Indonesian",
    english: "English",
    yourName: "Your name",
    defaultUserName: "You",
    nameDescription: "This name appears above the messages you send.",
    nameRequired: "Name cannot be empty.",
    nameSaveFailed: "Could not save your name. Please try again.",
    closeNameSettings: "Close name settings",
    cancel: "Cancel",
    save: "Save",
    close: "Close",
    closeNavigation: "Close navigation",
    openHistory: "Open conversation history",
    newChat: "New chat",
    conversations: "Conversations",
    searchConversations: "Search conversations",
    noMatchingConversations: "No matching conversations.",
    historyEmpty: "Conversations you start will appear here.",
    today: "Today",
    yesterday: "Yesterday",
    last7Days: "Last 7 days",
    older: "Older",
    deleteConversation: "Delete conversation",
    confirmDeleteConversation: "Delete this conversation permanently?",
    manageMemory: "Manage memory",
    memoryAI: "AI memory",
    manageFacts: "Manage facts and preferences",
    chooseTheme: "Choose theme",
    lightMode: "Light mode",
    darkMode: "Dark mode",
    welcomeHeading: "What are you working on?",
    welcomeDescription:
      "Ask about code, save preferences, or compare technical options.",
    presetCasualTitle: "Casual chat",
    presetCasualDescription:
      "Start a light chat, talk about random stuff, or share how your day is going.",
    presetCasualPrompt:
      "Let's have a casual chat. Ask how my day is going or bring up something light.",
    presetIdeasTitle: "Brainstorm & ideas",
    presetIdeasDescription:
      "Drop rough ideas, plans, or small dilemmas to think through together.",
    presetIdeasPrompt:
      "Help me think through an idea, plan, or small dilemma. Ask questions and offer a few useful perspectives.",
    presetTasksTitle: "Get tasks done",
    presetTasksDescription:
      "Summarize text, polish writing, or get quick answers.",
    presetTasksPrompt:
      "Help me get a task done. I may need a summary, polished writing, or a quick answer.",
    loadingConversation: "Loading conversation...",
    processingResponse: "Generating a response...",
    regenerateResponse: "Regenerate response",
    copied: "Copied",
    copyMessage: "Copy message text",
    messagePlaceholder: "Write a message...",
    newLineHint: "Shift + Enter for a new line",
    stopGenerationTitle: "Stop response generation",
    stopGeneration: "Stop response",
    sendMessage: "Send message",
    disclaimer:
      "Arun-D'Chat can make mistakes. Please independently verify important information.",
    chatCommunicationError: "An error occurred while communicating with AI.",
    memoryIndexed: "Indexed memory",
    memoryBackendPgvector: "pgvector RAG",
    memoryBackendLocal: "Local memory",
    memorySubtitle:
      "Technical facts and work preferences indexed automatically.",
    closeMemoryWindow: "Close memory window",
    memorySearch: "Filter by keyword...",
    deleteAllMemories: "Delete all memories",
    resetting: "Resetting...",
    resetMemory: "Reset memory",
    addFact: "Add fact",
    manualFactTitle: "Add a fact manually",
    memoryExample:
      "Example: The user is a senior engineer focused on system architecture and TypeScript.",
    category: "Category:",
    categoryAll: "All",
    categoryPreference: "Preferences",
    categoryFact: "Facts",
    categoryProfile: "Profile",
    categoryWork: "Work",
    categoryGoal: "Goals",
    categoryGeneral: "General",
    saving: "Saving...",
    saveToVector: "Save to vector store",
    loadingMemoryIndex: "Loading memory index...",
    noMemoryTitle: "No memory has been saved yet.",
    noMemoryDescription:
      "New facts are extracted automatically as you chat, or you can add them manually.",
    deleteMemory: "Delete memory",
    confirmDeleteMemory: "Permanently delete this memory entry?",
    confirmResetAllMemories:
      "Are you sure you want to delete all memory?\n\nThis removes all personal information, facts, and preferences remembered by AI. Conversation history will not be deleted.",
    saveMemoryFailed: "Failed to save memory",
    resetMemoryFailed: "Failed to reset memory",
    newFactSavedPgvector: "New fact saved to the pgvector database.",
    newFactSavedLocal: "New fact saved to local memory for this session.",
    memoryResetSuccess: "All memory was permanently reset.",
    total: "Total:",
    entries: "entries",
    memoryFooterPgvector: "pgvector cosine distance matching",
    memoryFooterLocal: "Active session local memory storage",
    copyCode: "Copy code",
    copiedCode: "Copied!",
    copy: "Copy",
    plainText: "text",
  },
} as const;

export type TranslationKey = keyof typeof translations.id;

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("id");

  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem("arun_language");
      if (savedLanguage === "id" || savedLanguage === "en") {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.error("Could not read the saved app language:", error);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    document.documentElement.lang = nextLanguage;

    try {
      localStorage.setItem("arun_language", nextLanguage);
    } catch (error) {
      console.error("Could not save the app language:", error);
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[language][key],
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider.");
  }
  return context;
}
