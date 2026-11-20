import React from "react";
import type { CaseStatus } from "@/types";

const STATUS: Record<CaseStatus, { label: string; dot: string; text: string }> = {
  in_analysis: { label: "Awaiting supervision", dot: "bg-ochre", text: "text-ochre" },
  report_ready: { label: "Report ready", dot: "bg-moss", text: "text-moss" },
  archived: { label: "Archived", dot: "bg-ink-3", text: "text-ink-3" },
};

export function StatusLabel({ status }: { status: CaseStatus }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12.5px] ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 36e5;
  if (diffH < 1) return `${Math.max(1, Math.round(diffH * 60))} min ago`;
  if (diffH < 24) return `${Math.round(diffH)} h ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
