import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arun-D'Chat",
  description:
    "Ruang percakapan untuk mencari jawaban, menulis, belajar, dan memecahkan masalah.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark h-full" suppressHydrationWarning>
      <body className="h-full antialiased selection:bg-emerald-500/30 selection:text-emerald-900 dark:selection:text-emerald-100">
        {children}
      </body>
    </html>
  );
}
