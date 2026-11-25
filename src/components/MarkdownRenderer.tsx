"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert max-w-none text-[#ececec] text-[15px] leading-relaxed break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");

            if (match) {
              return <CodeBlock language={match[1]} code={codeString} />;
            }

            return (
              <code
                className="bg-[#2f2f2f] text-emerald-300 font-mono text-[13px] px-1.5 py-0.5 rounded border border-[#3c3c3c]"
                {...props}
              >
                {children}
              </code>
            );
          },
          table({ children }: any) {
            return (
              <div className="my-4 overflow-x-auto rounded-lg border border-[#3c3c3c]">
                <table className="w-full text-left text-sm text-[#ececec] border-collapse">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }: any) {
            return (
              <thead className="bg-[#2f2f2f] text-xs uppercase font-semibold text-neutral-300 border-b border-[#3c3c3c]">
                {children}
              </thead>
            );
          },
          th({ children }: any) {
            return <th className="px-4 py-3 font-semibold">{children}</th>;
          },
          td({ children }: any) {
            return (
              <td className="px-4 py-3 border-b border-[#2d2d2d] bg-[#212121]/50">
                {children}
              </td>
            );
          },
          blockquote({ children }: any) {
            return (
              <blockquote className="my-3 border-l-4 border-emerald-500 bg-[#2a2a2a] px-4 py-2 italic text-neutral-300 rounded-r">
                {children}
              </blockquote>
            );
          },
          a({ href, children }: any) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
              >
                {children}
              </a>
            );
          },
          ul({ children }: any) {
            return <ul className="my-2 list-disc pl-6 space-y-1">{children}</ul>;
          },
          ol({ children }: any) {
            return <ol className="my-2 list-decimal pl-6 space-y-1">{children}</ol>;
          },
          h1({ children }: any) {
            return (
              <h1 className="text-xl font-bold mt-4 mb-2 text-white border-b border-[#3c3c3c] pb-1">
                {children}
              </h1>
            );
          },
          h2({ children }: any) {
            return (
              <h2 className="text-lg font-bold mt-3 mb-2 text-neutral-100">
                {children}
              </h2>
            );
          },
          h3({ children }: any) {
            return (
              <h3 className="text-base font-semibold mt-2 mb-1 text-neutral-200">
                {children}
              </h3>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Gagal menyalin kode:", err);
    }
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-[#3c3c3c] bg-[#161b22]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1f242c] border-b border-[#30363d] text-xs text-neutral-400">
        <span className="font-mono uppercase font-semibold text-neutral-300">
          {language || "teks"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2c313a] hover:bg-[#383e4a] text-neutral-200 hover:text-white transition-colors duration-150"
          title="Salin Kode"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Salin</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed bg-[#161b22]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
