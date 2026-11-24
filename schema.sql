-- ====================================================================
-- SKEMA DATABASE CHATBOT & VEKTOR MEMORI JANGKA PANJANG (SUPABASE)
-- ====================================================================

-- 1. Aktifkan Ekstensi pgvector untuk pencarian kesamaan vektor (Similarity Search)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Buat Tabel Percakapan (chats)
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL DEFAULT 'user_default_01',
    title TEXT NOT NULL DEFAULT 'Percakapan Baru',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index untuk filter chats berdasarkan user dan waktu terbaru
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON public.chats(updated_at DESC);

-- 3. Buat Tabel Pesan (messages)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index untuk pencarian pesan berdasarkan chat_id
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id, created_at ASC);

-- 4. Buat Tabel Memori Jangka Panjang (memories)
-- Catatan Dimensi:
-- Google Gemini 'text-embedding-004' menggunakan 768 dimensi (DEFAULT).
-- Jika menggunakan OpenAI 'text-embedding-3-small', ganti 768 menjadi 1536.
CREATE TABLE IF NOT EXISTS public.memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL DEFAULT 'user_default_01',
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general', -- 'preference', 'fact', 'profile', 'goal', 'work'
    embedding vector(768), -- Ubah ke vector(1536) jika beralih ke OpenAI embedding
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index untuk user_id memori
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON public.memories(user_id);

-- Index HNSW untuk pencarian vektor cosine similarity berkecepatan tinggi
CREATE INDEX IF NOT EXISTS idx_memories_embedding_hnsw 
ON public.memories 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 5. Fungsi RPC (Remote Procedure Call) untuk Pencarian Kesamaan Memori (Context Retrieval / RAG)
CREATE OR REPLACE FUNCTION match_memories(
    query_embedding vector(768), -- Sesuaikan dengan dimensi embedding (768 untuk Gemini / 1536 untuk OpenAI)
    match_threshold float DEFAULT 0.65,
    match_count int DEFAULT 5,
    p_user_id text DEFAULT 'user_default_01'
)
RETURNS TABLE (
    id uuid,
    content text,
    category text,
    similarity float,
    created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.content,
        m.category,
        1 - (m.embedding <=> query_embedding) AS similarity,
        m.created_at
    FROM public.memories m
    WHERE m.user_id = p_user_id
      AND m.embedding IS NOT NULL
      AND 1 - (m.embedding <=> query_embedding) >= match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

-- 6. Trigger Otomatis untuk memperbarui kolom updated_at pada chats
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_chats_updated_at ON public.chats;
CREATE TRIGGER trigger_update_chats_updated_at
BEFORE UPDATE ON public.chats
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 7. Row Level Security (RLS) - Siap untuk production / multi-user
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Kebijakan akses sederhana (di backend menggunakan Supabase Service Role Key untuk bypass aman, atau sesuaikan auth.uid())
CREATE POLICY "Public / Service Access Chats" ON public.chats FOR ALL USING (true);
CREATE POLICY "Public / Service Access Messages" ON public.messages FOR ALL USING (true);
CREATE POLICY "Public / Service Access Memories" ON public.memories FOR ALL USING (true);
