import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arun-D'Chat | Production AI Chatbot & Vector Memory",
  description:
    "Chatbot AI Full-Stack Next.js 14+ dengan Vercel AI SDK, Memori Jangka Panjang Otomatis (pgvector RAG), dan Penalaran Terstruktur.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark h-full">
      <body className="h-full bg-[#212121] text-[#ececec] antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
