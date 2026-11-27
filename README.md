# Arun-D'Chat

Aplikasi web AI Chatbot full-stack berbasis Next.js 14 App Router dan TypeScript. Proyek ini dibangun dengan dukungan streaming teks real-time melalui Vercel AI SDK, penataan tata letak pesan dua arah (user di kanan, AI di kiri), serta sistem memori jangka panjang otomatis menggunakan database vektor (Supabase pgvector).

Arsitektur aplikasi dirancang modular agar provider model AI dapat diganti antara Google Gemini dan OpenAI hanya melalui konfigurasi file environment tanpa merombak logika kode.

---

## Tech Stack

- **Framework**: Next.js 14.2 (App Router)
- **Bahasa**: TypeScript 5
- **Styling**: Tailwind CSS
- **Ikon**: Lucide React
- **AI Integration**: Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/openai`)
- **Database & Vektor**: Supabase (PostgreSQL + pgvector)
- **Markdown & Syntax Highlighting**: React Markdown, Remark GFM, Rehype Highlight (dimuat secara dinamis di sisi klien)

---

## Fitur Utama

- **Streaming Respon Real-Time**: Respon teks mengalir bertahap menggunakan protokol data stream dari Vercel AI SDK.
- **Tata Letak Percakapan Asimetris**: Pesan pengguna berada di sisi kanan dengan bubble yang menyesuaikan panjang teks, sedangkan respon AI berada di sisi kiri dengan ruang baca penuh.
- **Memori Jangka Panjang Otomatis (Self-Learning)**: Setiap putaran percakapan dianalisis oleh model ringan di latar belakang (*background task*). Fakta penting atau preferensi pengguna diekstraksi, dibuat representasi vektornya, dan disimpan ke database vektor setelah melalui proses deduplikasi.
- **Kesadaran Temporal & Sistem Real-Time**: Akses dinamis ke zona waktu lokal pengguna (misal: `Asia/Jakarta`), nama hari saat ini (Senin - Minggu), tanggal & jam lokal presisi, serta identifikasi sistem operasi perangkat. AI memiliki kesadaran waktu nyata tanpa batas cutoff pengetahuan.
- **Context Retrieval (RAG)**: Sebelum AI menyusun jawaban, sistem mencari potongan memori terdahulu yang paling relevan melalui pencarian *cosine similarity* dan menyuntikkannya ke dalam *system prompt*.
- **System Prompt Anti-Halusinasi**: Instruksi sistem dikonfigurasi agar AI memberikan jawaban yang logis, objektif, terstruktur, langsung ke inti permasalahan, dan mengakui batasan jika informasi tidak pasti.
- **Sidebar Riwayat Percakapan**: Navigasi riwayat chat dengan dukungan pembuatan sesi baru, penghapusan sesi, dan penamaan judul chat otomatis dari pesan pertama.
- **Modal Kelola Memori**: Antarmuka untuk melihat daftar fakta yang tersimpan di database vektor, menyaring berdasarkan kategori, menambahkan memori manual, atau menghapus data yang tidak lagi relevan.
- **Graceful Fallback**: Jika kredensial Supabase belum diisi, aplikasi tetap dapat berjalan secara lokal tanpa crash. Sesi chat dan balasan AI tetap berfungsi normal.
- **Proteksi Rate Limiting**: Pembatasan frekuensi permintaan berbasis alamat IP pada endpoint backend untuk menghindari pemakaian kuota API yang berlebihan.

---

## Struktur Direktori

```text
Arun-D'Chat/
├── .env.example
├── .gitignore
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── README.md
├── schema.sql
├── tailwind.config.ts
├── tsconfig.json
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   └── route.ts
│   │   │   ├── chats/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       └── messages/
│   │   │   │           └── route.ts
│   │   │   └── memories/
│   │   │       └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ChatArea.tsx
│   │   ├── ChatInput.tsx
│   │   ├── MarkdownRenderer.tsx
│   │   ├── MemoryManagerModal.tsx
│   │   └── Sidebar.tsx
│   ├── lib/
│   │   ├── ai/
│   │   │   └── provider.ts
│   │   ├── memory/
│   │   │   └── service.ts
│   │   ├── rate-limit.ts
│   │   ├── supabase.ts
│   │   └── utils.ts
│   └── types/
│       └── index.ts
```

---

## Setup dan Instalasi Lokal

### 1. Prasyarat

- Node.js versi 18.17.0 atau lebih baru
- Akun Google AI Studio (untuk API Key Gemini) atau OpenAI
- Akun Supabase (opsional jika ingin mengaktifkan penyimpanan memori permanen)

### 2. Kloning Repositori dan Pasang Dependensi

```bash
git clone https://github.com/arundaya24/Arun-D-Chat.git
cd "Arun-D'Chat"
npm install
```

### 3. Konfigurasi Environment Variables

Salin file contoh konfigurasi:

```bash
cp .env.example .env.local
```

Buka file `.env.local` dan sesuaikan nilainya:

```env
# Provider pilihan: 'google' (default) atau 'openai'
AI_PROVIDER=google

# Konfigurasi Google Gemini
# Dapatkan API key di https://aistudio.google.com/app/apikey
GOOGLE_GENERATIVE_AI_API_KEY=masukkan_api_key_gemini_anda
AI_MODEL=gemini-3.5-flash-lite
AI_FAST_MODEL=gemini-3.1-flash-lite
EMBEDDING_MODEL=gemini-embedding-001
EMBEDDING_DIMENSIONS=768

# Konfigurasi OpenAI (opsional, jika menggunakan AI_PROVIDER=openai)
# OPENAI_API_KEY=masukkan_api_key_openai_anda
# AI_MODEL=gpt-4o
# AI_FAST_MODEL=gpt-4o-mini
# EMBEDDING_MODEL=text-embedding-3-small
# EMBEDDING_DIMENSIONS=1536

# Konfigurasi Database Supabase (diambil dari menu Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://id-proyek-anda.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=masukkan_anon_key_anda
SUPABASE_SERVICE_ROLE_KEY=masukkan_service_role_key_anda

# Konfigurasi Tambahan
DEFAULT_USER_ID=user_default_01
RATE_LIMIT_REQUESTS_PER_MINUTE=30
```

### 4. Setup Skema Database (Supabase)

Jika Anda menghubungkan Supabase untuk fitur memori dan riwayat percakapan:

1. Buka dashboard proyek Anda di Supabase.
2. Masuk ke menu **SQL Editor**.
3. Buka file `schema.sql` pada repositori ini, salin seluruh isinya, lalu jalankan query tersebut.
4. Skema akan mengaktifkan ekstensi `vector`, tabel `chats`, `messages`, `memories` (dimensi vektor 768), indeks HNSW, serta fungsi pencarian RAG `match_memories`.

*Catatan dimensi vektor:*
- Default implementasi Google Gemini pada proyek ini menggunakan dimensi 768 (`outputDimensionality: 768`), sinkron dengan `schema.sql`.
- Jika beralih ke OpenAI (`text-embedding-3-small`), ubah tipe kolom `embedding` pada `schema.sql` menjadi `vector(1536)` dan sesuaikan parameter fungsi `match_memories`.

### 5. Menjalankan Server Development

```bash
npm run dev
```

Buka peramban di alamat `http://localhost:3000`.

### 6. Build Produksi

Untuk memverifikasi kompilasi produksi:

```bash
npm run build
npm start
```

---

## Endpoint API

- `POST /api/chat`: Menerima riwayat pesan, mengambil konteks memori terkait via RAG, dan melakukan streaming balasan model AI.
- `GET /api/chat`: Health-check endpoint untuk memeriksa status aktif API dan status konfigurasi provider/database.
- `GET /api/chats`: Mengambil daftar sesi percakapan milik pengguna.
- `POST /api/chats`: Membuat sesi percakapan baru.
- `DELETE /api/chats?id=:id`: Menghapus sesi percakapan beserta seluruh pesannya.
- `GET /api/chats/:id`: Mengambil metadata sesi percakapan tertentu.
- `PATCH /api/chats/:id`: Memperbarui judul sesi percakapan.
- `GET /api/chats/:id/messages`: Mengambil histori pesan dari satu sesi percakapan.
- `GET /api/memories`: Mengambil daftar memori yang telah dipelajari tentang pengguna.
- `POST /api/memories`: Menyimpan fakta memori baru dan membuat vektor embedding secara manual.
- `DELETE /api/memories?id=:id`: Menghapus catatan memori dari database vektor.

---

## Lisensi

Proyek ini dirilis di bawah lisensi MIT.
