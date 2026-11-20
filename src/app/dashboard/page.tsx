"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  FolderLock,
  FileText,
  Image as ImageIcon,
  Mic,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/components/AppProvider";
import { loadCases, saveCase, appendAuditLog } from "@/lib/store";
import { redactPII } from "@/lib/pii";
import type { PupilCase, CaseStatus } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, authLoading, activeOrg, signInDemo } = useApp();

  const [cases, setCases] = useState<PupilCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CaseStatus>("all");

  // New Case Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [pupilAlias, setPupilAlias] = useState("Pupil C");
  const [pupilRealNameToStrip, setPupilRealNameToStrip] = useState("");
  const [yearGroup, setYearGroup] = useState("Year 6 (Age 10)");
  const [caseTitle, setCaseTitle] = useState("");
  const [caseSummary, setCaseSummary] = useState("");
  const [piiNotice, setPiiNotice] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Auto-enter demo if visiting dashboard directly without auth
  useEffect(() => {
    if (!authLoading && !user) {
      signInDemo();
    }
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

  const handleAnonymiseDraft = () => {
    const res = redactPII(caseSummary, pupilRealNameToStrip, pupilAlias);
    setCaseSummary(res.redactedText);
    if (res.replacementsCount > 0) {
      setPiiNotice(
        `Redacted ${res.replacementsCount} identifier(s): ${res.detectedItems.join(", ")}`
      );
    } else {
      setPiiNotice("No obvious personal identifiers detected in the text.");
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseTitle.trim() || !caseSummary.trim() || !user) return;

    setCreating(true);
    // Always run automatic PII stripping before persisting
    const cleaned = redactPII(caseSummary, pupilRealNameToStrip, pupilAlias);
    const now = new Date().toISOString();
    const newCase: PupilCase = {
      id: `case-${Date.now()}`,
      orgId: activeOrg.id,
      pupilAlias: pupilAlias.trim() || "Pupil X",
      yearGroup: yearGroup.trim() || "Not specified",
      title: caseTitle.trim(),
      summary: cleaned.redactedText,
      status: "in_analysis",
      createdBy: user.uid,
      createdByName: user.displayName,
      attachments: [],
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: "user",
          content: cleaned.redactedText,
          createdAt: now,
        },
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
      details: `Created confidential case for ${newCase.pupilAlias} (${newCase.yearGroup})`,
    });

    setCases((prev) => [newCase, ...prev]);
    setShowNewModal(false);
    setCreating(false);
    router.push(`/cases/${newCase.id}`);
  };

  const filtered = cases.filter((c) => {
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      c.pupilAlias.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.yearGroup.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: cases.length,
    inAnalysis: cases.filter((c) => c.status === "in_analysis").length,
    reportReady: cases.filter((c) => c.status === "report_ready").length,
  };

  return (
    <AppShell>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>
              Confidential Case Vault • {activeOrg.name} ({activeOrg.dataRegion})
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Pupil Cases</h1>
        </div>

        <button
          type="button"
          onClick={() => {
            setPiiNotice(null);
            setCaseTitle("");
            setCaseSummary("");
            setPupilRealNameToStrip("");
            setPupilAlias(`Pupil ${String.fromCharCode(65 + cases.length)}`);
            setShowNewModal(true);
          }}
          style={{ backgroundColor: activeOrg.accentColor }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Pupil Case
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">
              Total Confidential Cases
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {stats.total}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <FolderLock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">
              In 4-Step Supervision
            </div>
            <div className="text-2xl font-bold text-amber-700 mt-0.5">
              {stats.inAnalysis}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">
              Portfolio / Report Ready
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-0.5">
              {stats.reportReady}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by pupil alias, year group, or presenting concern..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
          {(
            [
              { id: "all", label: "All" },
              { id: "in_analysis", label: "In Analysis" },
              { id: "report_ready", label: "Report Ready" },
              { id: "archived", label: "Archived" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cases List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
          Loading confidential case vault...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-sm text-slate-600 mb-3">
            No cases match your current filter.
          </p>
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="text-sm font-semibold text-indigo-800 hover:underline cursor-pointer"
          >
            Create a new anonymised pupil case
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/cases/${c.id}`}
              className="group bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 text-xs font-bold">
                      {c.pupilAlias}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {c.yearGroup}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      c.status === "report_ready"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : c.status === "archived"
                        ? "bg-slate-100 text-slate-600"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {c.status === "report_ready"
                      ? "Portfolio Ready"
                      : c.status === "archived"
                      ? "Archived"
                      : "Ready for Supervision"}
                  </span>
                </div>

                <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-900 transition-colors mb-2">
                  {c.title}
                </h2>
                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
                  {c.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {c.attachments.some((a) => a.kind === "image") && (
                    <span className="inline-flex items-center gap-1 text-indigo-700 font-medium">
                      <ImageIcon className="w-3.5 h-3.5" /> Drawing
                    </span>
                  )}
                  {c.attachments.some(
                    (a) => a.kind === "text" || a.kind === "pdf"
                  ) && (
                    <span className="inline-flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Notes/PDF
                    </span>
                  )}
                  {c.attachments.some((a) => a.kind === "audio") && (
                    <span className="inline-flex items-center gap-1">
                      <Mic className="w-3.5 h-3.5" /> Audio
                    </span>
                  )}
                  {c.latestSupervision && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                      <Sparkles className="w-3.5 h-3.5" /> 4-Step Done
                    </span>
                  )}
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-900 group-hover:translate-x-0.5 transition-transform">
                  Open Workspace
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Case Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  New Confidential Pupil Case
                </h2>
                <p className="text-xs text-slate-500">
                  Use a pseudonym — personal identifiers are redacted before AI
                  supervision.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pupil Alias (Pseudonym)
                  </label>
                  <input
                    type="text"
                    required
                    value={pupilAlias}
                    onChange={(e) => setPupilAlias(e.target.value)}
                    placeholder="e.g. Pupil C"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Year Group / Age
                  </label>
                  <input
                    type="text"
                    required
                    value={yearGroup}
                    onChange={(e) => setYearGroup(e.target.value)}
                    placeholder="e.g. Year 6 (Age 10)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Case Title / Presenting Theme
                </label>
                <input
                  type="text"
                  required
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  placeholder="e.g. Transition anxiety and peer withdrawal after move to Year 6"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Case Description & Psychologist Reflections
                  </label>
                  <button
                    type="button"
                    onClick={handleAnonymiseDraft}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Auto-Redact PII
                  </button>
                </div>
                <textarea
                  rows={5}
                  required
                  value={caseSummary}
                  onChange={(e) => setCaseSummary(e.target.value)}
                  placeholder="Describe the pupil's context, observations, and what feels challenging for you as the psychologist..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={pupilRealNameToStrip}
                    onChange={(e) => setPupilRealNameToStrip(e.target.value)}
                    placeholder="Optional: real name to automatically replace with alias"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                {piiNotice && (
                  <p className="mt-1.5 text-xs text-emerald-700 font-medium">
                    {piiNotice}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{ backgroundColor: activeOrg.accentColor }}
                  className="px-5 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-95 disabled:opacity-50 cursor-pointer"
                >
                  {creating ? "Creating..." : "Create & Open Case"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
