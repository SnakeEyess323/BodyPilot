"use client";

import ReactMarkdown from "react-markdown";

interface ProgramOutputProps {
  content: string;
  title?: string;
  onCopy?: () => void;
  onDownload?: () => void;
}

export default function ProgramOutput({
  content,
  title = "Oluşturulan Program",
  onCopy,
  onDownload,
}: ProgramOutputProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <div className="flex gap-2">
          {onCopy && (
            <button
              type="button"
              onClick={onCopy}
              className="rounded bg-muted px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/80"
            >
              Kopyala
            </button>
          )}
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="rounded bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20"
            >
              İndir (.txt)
            </button>
          )}
        </div>
      </div>
      <div className="prose max-w-none dark:prose-invert">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
