"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, X, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/components/AppProvider";
import { StatusLabel, formatDate } from "@/components/ui";
import { loadCases, saveCase, appendAuditLog } from "@/lib/store";
import { redactPII } from "@/lib/pii";
import type { PupilCase, CaseStatus } from "@/types";

function materialsOf(c: PupilCase) {
  const parts: string[] = [];
  const n = (k: string) => c.attachments.filter((a) => a.kind === k).length;
  if (n("image")) parts.push(n("image") > 1 ? `${n("image")} drawings` : "drawing");
  if (n("text") + n("pdf")) parts.push("notes");
  if (n("audio")) parts.push("audio");
  return parts.length ? parts.join(" · ") : "—";
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, authLoading, activeOrg, signInDemo } = useApp();

  const [cases, setCases] = useState<PupilCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CaseStatus>("all");

  const [showNew, setShowNew] = useState(false);
  const [pupilAlias, setPupilAlias] = useState("Pupil C");
  const [realName, setRealName] = useState("");
  const [yearGroup, setYearGroup] = useState("Year 6");
  const [caseTitle, setCaseTitle] = useState("");
  const [caseSummary, setCaseSummary] = useState("");
  const [piiNotice, setPiiNotice] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) signInDemo();
  }, [authLoading, user, signInDemo]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    loadCases(activeOrg.id).then((list) => {
      if (mounted) {
        setCases(list);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [activeOrg.id]);

  useEffect(() => {
    if (!showNew) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShowNew(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showNew]);

  const openNew = () => {
    setPiiNotice(null);
    setCaseTitle("");
    setCaseSummary("");
    setRealName("");
    setPupilAlias(`Pupil ${String.fromCharCode(65 + (cases.length % 26))}`);
    setShowNew(true);
  };

  const handleRedact = () => {
    const res = redactPII(caseSummary, realName, pupilAlias);
    setCaseSummary(res.redactedText);
    setPiiNotice(
      res.replacementsCount > 0
        ? `Removed: ${res.detectedItems.join(", ")}.`
        : "Nothing identifying found."
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseTitle.trim() || !caseSummary.trim() || !user) return;
    setCreating(true);
    const cleaned = redactPII(caseSummary, realName, pupilAlias);
    const now = new Date().toISOString();
    const newCase: PupilCase = {
      id: `case-${Date.now()}`,
      orgId: activeOrg.id,
      pupilAlias: pupilAlias.trim() || "Pupil X",
      yearGroup: yearGroup.trim() || "—",
      title: caseTitle.trim(),
      summary: cleaned.redactedText,
      status: "in_analysis",
      createdBy: user.uid,
      createdByName: user.displayName,
      attachments: [],
      messages: [
        { id: `msg-${Date.now()}`, role: "user", content: cleaned.redactedText, createdAt: now },
      ],
      createdAt: now,
      updatedAt: now,
    };
    await saveCase(newCase);
    await appendAuditLog({
      orgId: activeOrg.id,
      actorUid: user.uid,
      actorName: user.displayName,
      action: "CASE_CREATED",
      targetType: "case",
      targetId: newCase.id,
      details: `Opened case for ${newCase.pupilAlias} (${newCase.yearGroup})`,
    });
    setCreating(false);
    setShowNew(false);
    router.push(`/cases/${newCase.id}`);
  };

  const q = search.trim().toLowerCase();
  const filtered = cases.filter(
    (c) =>
      (statusFilter === "all" || c.status === statusFilter) &&
      (!q ||
        c.pupilAlias.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.yearGroup.toLowerCase().includes(q))
  );

  const counts = {
    all: cases.length,
    in_analysis: cases.filter((c) => c.status === "in_analysis").length,
    report_ready: cases.filter((c) => c.status === "report_ready").length,
    archived: cases.filter((c) => c.status === "archived").length,
  };

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  })();
  const firstName = user?.displayName.replace(/^(Dr|Mr|Mrs|Ms|Miss)\.?\s+/i, "").split(" ")[0];

  return (
    <AppShell>
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
        <div>
          <p className="text-[14px] text-ink-3 mb-2">
            {greeting}{firstName ? `, ${firstName}` : ""}.
          </p>
          <h1 className="display text-[40px]">Cases</h1>
          <p className="mt-2 text-[14.5px] text-ink-2">
            {counts.in_analysis > 0
              ? `${counts.in_analysis} ${counts.in_analysis === 1 ? "case is" : "cases are"} waiting for supervision.`
              : "Everything is up to date."}
          </p>
        </div>
        <button type="button" onClick={openNew} className="btn btn-primary self-start sm:self-auto">
          <Plus className="w-4 h-4" strokeWidth={1.8} />
          New case
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rule">
        <div className="flex items-center gap-6 -mb-px overflow-x-auto">
          {(
            [
              ["all", "All"],
              ["in_analysis", "Awaiting supervision"],
              ["report_ready", "Report ready"],
              ["archived", "Archived"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={`pb-3 text-[14px] whitespace-nowrap border-b-2 cursor-pointer transition-colors ${
                statusFilter === id
                  ? "border-ink text-ink"
                  : "border-transparent text-ink-3 hover:text-ink"
              }`}
            >
              {label}
              <span className="ml-1.5 font-mono text-[11px] text-ink-3">{counts[id]}</span>
            </button>
          ))}
        </div>

        <div className="relative pb-3 md:pb-2">
          <Search
            className="w-4 h-4 text-ink-3 absolute left-0 top-[9px]"
            strokeWidth={1.6}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alias, year or concern"
            className="w-full md:w-[260px] bg-transparent pl-6 py-1.5 text-[14px] placeholder:text-ink-3 focus:outline-none"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="divide-y divide-rule">
          {[0, 1, 2].map((i) => (
            <div key={i} className="py-6 grid grid-cols-12 gap-6">
              <div className="col-span-2 skeleton h-3" />
              <div className="col-span-6 space-y-2">
                <div className="skeleton h-3 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-serif text-[22px] mb-2">
            {cases.length === 0 ? "No cases yet." : "Nothing matches that."}
          </p>
          <p className="text-[14px] text-ink-2 mb-6">
            {cases.length === 0
              ? "Open a case to start your first supervision."
              : "Try a different filter or search term."}
          </p>
          {cases.length === 0 && (
            <button type="button" onClick={openNew} className="btn btn-outline">
              New case
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="hidden md:grid grid-cols-12 gap-6 py-3 eyebrow border-b border-rule">
            <span className="col-span-2">Pupil</span>
            <span className="col-span-5">Presenting concern</span>
            <span className="col-span-2">Materials</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-1 text-right">Updated</span>
          </div>
          <ul className="divide-y divide-rule border-b border-rule">
            {filtered.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/cases/${c.id}`}
                  className="group grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 py-5 -mx-3 px-3 rounded-[3px] hover:bg-surface transition-colors"
                >
                  <div className="md:col-span-2">
                    <span className="block font-medium text-[14.5px] text-ink">{c.pupilAlias}</span>
                    <span className="block text-[13px] text-ink-3">{c.yearGroup}</span>
                  </div>
                  <div className="md:col-span-5 min-w-0">
                    <span className="block text-[15px] text-ink group-hover:underline decoration-rule-strong underline-offset-[3px]">
                      {c.title}
                    </span>
                    <span className="block mt-1 text-[13.5px] text-ink-3 line-clamp-1">{c.summary}</span>
                  </div>
                  <div className="md:col-span-2 font-mono text-[12px] text-ink-2 md:pt-0.5">
                    {materialsOf(c)}
                  </div>
                  <div className="md:col-span-2 md:pt-0.5">
                    <StatusLabel status={c.status} />
                  </div>
                  <div className="md:col-span-1 md:text-right text-[13px] text-ink-3 md:pt-0.5">
                    {formatDate(c.updatedAt)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* New case drawer */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setShowNew(false)}
            className="absolute inset-0 bg-ink/30 cursor-default"
          />
          <div className="relative w-full max-w-[520px] h-full bg-paper border-l border-rule flex flex-col shadow-2xl">
            <div className="flex items-start justify-between px-8 pt-8 pb-6 border-b border-rule">
              <div>
                <h2 className="display text-[28px]">New case</h2>
                <p className="mt-1.5 text-[13.5px] text-ink-2">
                  Use an alias. Names and contact details are removed before
                  anything is analysed.
                </p>
              </div>
              <button type="button" onClick={() => setShowNew(false)} className="btn btn-ghost h-8 px-1.5 -mr-2" aria-label="Close">
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto px-8 py-7 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium mb-1.5">Alias</label>
                  <input className="field" required value={pupilAlias} onChange={(e) => setPupilAlias(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1.5">Year group</label>
                  <input className="field" required value={yearGroup} onChange={(e) => setYearGroup(e.target.value)} placeholder="Year 6" />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium mb-1.5">Presenting concern</label>
                <input
                  className="field"
                  required
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  placeholder="e.g. Withdrawal after transition to Year 6"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium mb-1.5">Your notes</label>
                <textarea
                  rows={9}
                  required
                  className="field leading-relaxed"
                  value={caseSummary}
                  onChange={(e) => setCaseSummary(e.target.value)}
                  placeholder="What's been happening, what you've tried, and what feels difficult about this case for you."
                />
              </div>

              <div className="border border-rule rounded-[3px] bg-surface p-4">
                <p className="text-[13px] font-medium mb-1">Remove identifying details</p>
                <p className="text-[12.5px] text-ink-3 mb-3">
                  If you typed the pupil&apos;s real name, enter it here and it will
                  be replaced with the alias. Emails, phone numbers, postcodes and
                  dates are removed automatically.
                </p>
                <div className="flex gap-2">
                  <input
                    className="field"
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    placeholder="Real name (not stored)"
                  />
                  <button type="button" onClick={handleRedact} className="btn btn-outline shrink-0">
                    Check now
                  </button>
                </div>
                {piiNotice && <p className="mt-2 text-[12.5px] text-moss">{piiNotice}</p>}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNew(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="btn btn-primary">
                  {creating ? "Opening…" : "Open case"}
                  {!creating && <ArrowRight className="w-4 h-4" strokeWidth={1.8} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
