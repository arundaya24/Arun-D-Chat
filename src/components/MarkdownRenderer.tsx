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
    <div className="markdown-body">
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
                className="markdown-inline-code"
                {...props}
              >
                {children}
              </code>
            );
          },
          table({ children }: any) {
            return (
              <div className="markdown-table-wrap">
                <table className="markdown-table">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }: any) {
            return (
              <thead>{children}</thead>
            );
          },
          th({ children }: any) {
            return <th>{children}</th>;
          },
          td({ children }: any) {
            return <td>{children}</td>;
          },
          blockquote({ children }: any) {
            return <blockquote>{children}</blockquote>;
          },
          a({ href, children }: any) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
          ul({ children }: any) {
            return <ul>{children}</ul>;
          },
          ol({ children }: any) {
            return <ol>{children}</ol>;
          },
          h1({ children }: any) {
            return <h1>{children}</h1>;
          },
          h2({ children }: any) {
            return <h2>{children}</h2>;
          },
          h3({ children }: any) {
            return <h3>{children}</h3>;
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
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-language">{language || "teks"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="copy-code-button active:scale-95"
          title="Salin Kode"
        >
          {copied ? (
            <>
              <Check size={14} />
              <span>Tersalin!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Salin</span>
            </>
          )}
        </button>
      </div>
      <pre>
        <code className="hljs">{code}</code>
      </pre>
    </div>
  );
}
