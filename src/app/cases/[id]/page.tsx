"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Brain,
  FileText,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Send,
  Sparkles,
  HeartHandshake,
  HelpCircle,
  Lightbulb,
  Compass,
  Download,
  Save,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Trash2,
  Users,
  GraduationCap,
  ClipboardList,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/components/AppProvider";
import {
  loadCases,
  saveCase,
  loadReports,
  saveReport,
  appendAuditLog,
  uploadAttachmentToStorage,
} from "@/lib/store";
import { redactPII } from "@/lib/pii";
import { exportReportToPdf } from "@/lib/pdf-export";
import type {
  PupilCase,
  CaseAttachment,
  PlainLanguageReport,
  ReportAudience,
  SupervisionSteps,
} from "@/types";

function detectFileKind(file: File): CaseAttachment["kind"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))
    return "pdf";
  return "text";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export default function CaseWorkspacePage() {
  const params = useParams();
  const caseId = String(params?.id || "");
  const { user, authLoading, activeOrg, language, signInDemo } = useApp();

  const [pupilCase, setPupilCase] = useState<PupilCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"supervision" | "report">(
    "supervision"
  );

  // Supervision state
  const [promptInput, setPromptInput] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [aiModeBadge, setAiModeBadge] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Report state
  const [audience, setAudience] = useState<ReportAudience>("parent");
  const [reports, setReports] = useState<PlainLanguageReport[]>([]);
  const [activeReport, setActiveReport] = useState<PlainLanguageReport | null>(
    null
  );
  const [generatingReport, setGeneratingReport] = useState(false);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      signInDemo();
    }
  }, [authLoading, user, signInDemo]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      loadCases(activeOrg.id),
      loadReports(activeOrg.id, caseId),
    ]).then(([allCases, caseReports]) => {
      if (!mounted) return;
      const found = allCases.find((c) => c.id === caseId) || null;
      setPupilCase(found);
      setReports(caseReports);
      if (caseReports.length > 0) {
        setActiveReport(caseReports[0]);
        setAudience(caseReports[0].audience);
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [activeOrg.id, caseId]);

  const showToast = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 3200);
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !pupilCase || !user) return;

    const added: CaseAttachment[] = [];
    for (const file of Array.from(files)) {
      const kind = detectFileKind(file);
      const dataUrl = await readFileAsDataUrl(file);
      const base64Data = dataUrl.includes(",") ? dataUrl.split(",")[1] : "";
      let textContent: string | undefined;
      if (kind === "text") {
        textContent = await readFileAsText(file);
      }

      let att: CaseAttachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        kind,
        textContent,
        base64Data,
        previewUrl: dataUrl,
      };

      att = await uploadAttachmentToStorage(activeOrg.id, pupilCase.id, att);
      added.push(att);
    }

    const updated: PupilCase = {
      ...pupilCase,
      attachments: [...pupilCase.attachments, ...added],
    };
    setPupilCase(updated);
    await saveCase(updated);
    await appendAuditLog({
      orgId: activeOrg.id,
      actorUid: user.uid,
      actorName: user.displayName,
      action: "FILE_UPLOADED",
      targetType: "case",
      targetId: pupilCase.id,
      details: `Attached ${added.map((a) => a.name).join(", ")} to ${pupilCase.pupilAlias}`,
    });
    showToast(`Attached ${added.length} file(s) securely`);
    e.target.value = "";
  };

  const handleRemoveAttachment = async (attId: string) => {
    if (!pupilCase) return;
    const updated: PupilCase = {
      ...pupilCase,
      attachments: pupilCase.attachments.filter((a) => a.id !== attId),
    };
    setPupilCase(updated);
    await saveCase(updated);
  };

  const handleRunSupervision = async (customMessage?: string) => {
    if (!pupilCase || !user) return;
    setErrorMsg(null);
    setAnalysing(true);

    const rawText =
      customMessage?.trim() ||
      promptInput.trim() ||
      pupilCase.summary;

    const cleaned = redactPII(rawText, undefined, pupilCase.pupilAlias);

    try {
      const res = await fetch("/api/supervise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseText: cleaned.redactedText,
          pupilAlias: pupilCase.pupilAlias,
          yearGroup: pupilCase.yearGroup,
          conversationHistory: pupilCase.messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          attachments: pupilCase.attachments.map((a) => ({
            name: a.name,
            mimeType: a.mimeType,
            kind: a.kind,
            textContent: a.textContent,
            base64Data: a.base64Data,
          })),
          language,
          customOrgNote: activeOrg.customPromptNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Supervision request failed");
      }

      const supervision: SupervisionSteps = data.supervision;
      setAiModeBadge(
        data.mode === "live"
          ? "Live Gemini 2.5 Multimodal Analysis"
          : "Interactive Demo Supervision Mode"
      );

      const now = new Date().toISOString();
      const newMessages = [...pupilCase.messages];
      if (promptInput.trim()) {
        newMessages.push({
          id: `msg-u-${Date.now()}`,
          role: "user",
          content: cleaned.redactedText,
          createdAt: now,
        });
      }
      newMessages.push({
        id: `msg-a-${Date.now() + 1}`,
        role: "assistant",
        content: `Completed 4-step clinical supervision (${supervision.step1Questions.length} reflective questions, strengths, hypotheses & recommendations).`,
        createdAt: now,
        supervisionSteps: supervision,
      });

      const updated: PupilCase = {
        ...pupilCase,
        messages: newMessages,
        latestSupervision: supervision,
        updatedAt: now,
      };

      setPupilCase(updated);
      setPromptInput("");
      await saveCase(updated);
      await appendAuditLog({
        orgId: activeOrg.id,
        actorUid: user.uid,
        actorName: user.displayName,
        action: "CASE_ANALYSED",
        targetType: "case",
        targetId: pupilCase.id,
        details: `Completed 4-step supervision analysis for ${pupilCase.pupilAlias} (${pupilCase.attachments.length} file(s) included)`,
      });
      showToast("4-step supervision saved to confidential vault");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to run analysis"
      );
    } finally {
      setAnalysing(false);
    }
  };

  const handleGenerateReport = async (selectedAudience: ReportAudience) => {
    if (!pupilCase || !pupilCase.latestSupervision || !user) return;
    setAudience(selectedAudience);
    setGeneratingReport(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pupilAlias: pupilCase.pupilAlias,
          yearGroup: pupilCase.yearGroup,
          caseTitle: pupilCase.title,
          caseSummary: pupilCase.summary,
          supervision: pupilCase.latestSupervision,
          audience: selectedAudience,
          organisationName: activeOrg.name,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Report generation failed");
      }

      const now = new Date().toISOString();
      const newRep: PlainLanguageReport = {
        id: `rep-${pupilCase.id}-${selectedAudience}`,
        orgId: activeOrg.id,
        caseId: pupilCase.id,
        pupilAlias: pupilCase.pupilAlias,
        yearGroup: pupilCase.yearGroup,
        audience: selectedAudience,
        title: data.report.title,
        plainSummary: data.report.plainSummary,
        keyTakeaways: data.report.keyTakeaways || [],
        sections: data.report.sections || [],
        nextSteps: data.report.nextSteps || [],
        createdBy: user.uid,
        createdByName: user.displayName,
        createdAt: now,
        updatedAt: now,
      };

      await saveReport(newRep);
      setActiveReport(newRep);
      setReports((prev) => [
        newRep,
        ...prev.filter((r) => r.id !== newRep.id),
      ]);

      // Mark case as report_ready
      const updatedCase: PupilCase = {
        ...pupilCase,
        status: "report_ready",
      };
      setPupilCase(updatedCase);
      await saveCase(updatedCase);

      await appendAuditLog({
        orgId: activeOrg.id,
        actorUid: user.uid,
        actorName: user.displayName,
        action: "REPORT_GENERATED",
        targetType: "report",
        targetId: newRep.id,
        details: `Generated ${selectedAudience} plain-language report for ${pupilCase.pupilAlias}`,
      });
      showToast("Plain-language portfolio generated & saved");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Could not generate report"
      );
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleSaveReportEdits = async () => {
    if (!activeReport) return;
    await saveReport(activeReport);
    setReports((prev) =>
      prev.map((r) => (r.id === activeReport.id ? activeReport : r))
    );
    showToast("Report edits saved securely");
  };

  const handleExportPdf = async () => {
    if (!activeReport || !user) return;
    exportReportToPdf(activeReport, activeOrg);
    await appendAuditLog({
      orgId: activeOrg.id,
      actorUid: user.uid,
      actorName: user.displayName,
      action: "REPORT_EXPORTED_PDF",
      targetType: "report",
      targetId: activeReport.id,
      details: `Exported branded PDF (${activeReport.audience}) for ${activeReport.pupilAlias}`,
    });
    showToast("Branded PDF downloaded");
  };

  if (loading) {
    return (
      <AppShell>
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-500">
          Loading case workspace...
        </div>
      </AppShell>
    );
  }

  if (!pupilCase) {
    return (
      <AppShell>
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-slate-700 font-medium mb-3">Case not found.</p>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-indigo-800 hover:underline"
          >
            Back to Case Vault
          </Link>
        </div>
      </AppShell>
    );
  }

  const sup = pupilCase.latestSupervision;

  return (
    <AppShell>
      {/* Toast Notification */}
      {savedToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {savedToast}
        </div>
      )}

      {/* Breadcrumb & Header */}
      <div className="mb-5">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Case Vault
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span
                className="px-2.5 py-0.5 rounded-md text-xs font-bold text-white"
                style={{ backgroundColor: activeOrg.accentColor }}
              >
                {pupilCase.pupilAlias}
              </span>
              <span className="text-xs font-semibold text-slate-600">
                {pupilCase.yearGroup}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                Anonymised • Confidential
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              {pupilCase.title}
            </h1>
          </div>

          {/* Workspace Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("supervision")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "supervision"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Brain className="w-4 h-4" />
              1. 4-Step Supervision
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("report")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "report"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-4 h-4" />
              2. Plain-Language Report
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Case Context & Attached Files (Drawings, PDF, Audio, Text) */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Presenting Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Case Context & Reflections
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {pupilCase.summary}
            </p>
          </div>

          {/* Multimodal Attachments */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Attached Case Files ({pupilCase.attachments.length})
                </h2>
                <p className="text-[11px] text-slate-500">
                  Drawings, PDFs, notes & audio analysed automatically
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Paperclip className="w-3.5 h-3.5" />
                Attach
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelected}
                accept=".txt,.md,.pdf,.png,.jpg,.jpeg,.webp,.svg,.mp3,.wav,.m4a,.webm"
                className="hidden"
              />
            </div>

            {pupilCase.attachments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-500">
                No files attached yet. Upload a pupil drawing, PDF report, text
                notes, or audio recording.
              </div>
            ) : (
              <div className="space-y-3">
                {pupilCase.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {att.kind === "image" && (
                          <ImageIcon className="w-4 h-4 text-indigo-700 shrink-0" />
                        )}
                        {att.kind === "audio" && (
                          <Mic className="w-4 h-4 text-amber-700 shrink-0" />
                        )}
                        {(att.kind === "text" || att.kind === "pdf") && (
                          <FileText className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {att.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {att.kind === "image" && att.previewUrl && (
                      <div className="rounded-lg overflow-hidden border border-slate-200 bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={att.previewUrl}
                          alt={att.name}
                          className="w-full h-auto max-h-56 object-contain"
                        />
                      </div>
                    )}

                    {att.kind === "audio" && att.previewUrl && (
                      <audio
                        controls
                        src={att.previewUrl}
                        className="w-full h-9 mt-1"
                      />
                    )}

                    {att.kind === "text" && att.textContent && (
                      <p className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg p-2.5 leading-relaxed max-h-36 overflow-y-auto">
                        {att.textContent}
                      </p>
                    )}

                    {att.kind === "pdf" && (
                      <p className="text-[11px] text-slate-500">
                        PDF attached — text will be extracted automatically
                        during AI supervision.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT COLUMN: Tab 1 (4-Step Supervision) OR Tab 2 (Plain-Language Report) */}
        <section className="lg:col-span-8 space-y-5">
          {activeTab === "supervision" ? (
            <>
              {/* Action Banner when no supervision run yet */}
              {!sup ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                  <div
                    className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: activeOrg.accentColor }}
                  >
                    <Brain className="w-7 h-7" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mb-2">
                    Ready for 4-Step Clinical Supervision
                  </h2>
                  <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6">
                    SupervizAI will review the case notes and{" "}
                    <strong>{pupilCase.attachments.length} attached file(s)</strong>{" "}
                    (including projective drawing analysis) to produce 5
                    reflective questions, practitioner support, hypotheses, and
                    actionable recommendations.
                  </p>
                  <button
                    type="button"
                    disabled={analysing}
                    onClick={() => handleRunSupervision()}
                    style={{ backgroundColor: activeOrg.accentColor }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-sm hover:opacity-95 disabled:opacity-60 cursor-pointer"
                  >
                    {analysing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analysing Case & Attached Files...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Run 4-Step Supervision Analysis
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Top Bar of Completed Supervision */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 px-5 py-3.5">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Sparkles className="w-4 h-4 text-indigo-700" />
                      <span className="font-semibold text-slate-900">
                        4-Step Supervision Complete
                      </span>
                      {aiModeBadge && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px]">
                          {aiModeBadge}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("report");
                        if (!activeReport) {
                          handleGenerateReport("parent");
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Create Plain-Language Report →
                    </button>
                  </div>

                  {/* Multimodal File / Drawing Analysis Callout */}
                  {sup.fileAnalysisNotes && (
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900 mb-2">
                        <ImageIcon className="w-4 h-4" />
                        Attached File & Projective Drawing Insights
                      </div>
                      <p className="text-sm text-indigo-950/90 leading-relaxed whitespace-pre-line">
                        {sup.fileAnalysisNotes}
                      </p>
                    </div>
                  )}

                  {/* STEP 1: 5 Reflective Questions */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                          Step 1
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          5 Reflective Questions for Case Exploration
                        </h3>
                      </div>
                    </div>
                    <ol className="space-y-2.5 list-decimal list-inside text-sm text-slate-700 leading-relaxed">
                      {sup.step1Questions.map((q, idx) => (
                        <li key={idx} className="pl-1">
                          {q}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* STEP 2: Professional Strengths & Support */}
                  <div className="bg-emerald-50/60 rounded-2xl border border-emerald-200 p-5">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <HeartHandshake className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                          Step 2
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          Your Professional Strengths & Supportive Reflection
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                      {sup.step2StrengthsAndSupport}
                    </p>
                  </div>

                  {/* STEP 3: Clinical Hypotheses */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center">
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
                          Step 3
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          Working Hypotheses & Sources of Difficulty
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {sup.step3Hypotheses}
                    </p>
                  </div>

                  {/* STEP 4: Recommendations & Allied Referrals */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
                          Step 4
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          Actionable Recommendations & Allied Specialists
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mb-4">
                      {sup.step4Recommendations}
                    </p>

                    {sup.referralsNeeded && sup.referralsNeeded.length > 0 && (
                      <div className="pt-3 border-t border-slate-100">
                        <div className="text-xs font-bold text-slate-600 mb-2">
                          Suggested Allied Specialists / Liaison:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {sup.referralsNeeded.map((refName, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
                            >
                              {refName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Follow-up Reflection Input */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Continue Supervision (answer Step 1 questions or add new
                  observations)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && promptInput.trim()) {
                        e.preventDefault();
                        handleRunSupervision(promptInput);
                      }
                    }}
                    placeholder="e.g. Pupil A told me the fence keeps the noisy classroom out and the sun is Lego club..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={analysing}
                  />
                  <button
                    type="button"
                    disabled={analysing}
                    onClick={() => handleRunSupervision()}
                    style={{ backgroundColor: activeOrg.accentColor }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-95 disabled:opacity-50 cursor-pointer"
                  >
                    {analysing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">
                      {sup ? "Update Analysis" : "Analyse"}
                    </span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* TAB 2: PLAIN-LANGUAGE REPORT & PORTFOLIO */
            <div className="space-y-4">
              {!sup ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                  <p className="text-sm text-slate-600 mb-4">
                    Complete the 4-Step Supervision first so SupervizAI can
                    build an accurate plain-language portfolio from the
                    analysis.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("supervision")}
                    className="px-4 py-2 rounded-lg bg-indigo-900 text-white text-xs font-semibold cursor-pointer"
                  >
                    Go to 4-Step Supervision
                  </button>
                </div>
              ) : (
                <>
                  {/* Audience Selector Bar */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          Plain-Language Portfolio & Report Generator
                        </h2>
                        <p className="text-xs text-slate-500">
                          Choose the reader — SupervizAI translates the analysis
                          into clear, accessible language with key takeaways.
                        </p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-2.5">
                      {(
                        [
                          {
                            id: "parent" as const,
                            label: "Parent / Carer",
                            desc: "Warm, jargon-free summary",
                            icon: Users,
                          },
                          {
                            id: "teacher" as const,
                            label: "Teacher / SENCO",
                            desc: "Classroom adjustments & plan",
                            icon: GraduationCap,
                          },
                          {
                            id: "supervision" as const,
                            label: "Supervision Portfolio",
                            desc: "Structured clinical record",
                            icon: ClipboardList,
                          },
                        ] as const
                      ).map((opt) => {
                        const Icon = opt.icon;
                        const selected = audience === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={generatingReport}
                            onClick={() => handleGenerateReport(opt.id)}
                            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                              selected
                                ? "border-indigo-700 bg-indigo-50/70 ring-1 ring-indigo-700"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-2 font-semibold text-sm text-slate-900">
                              <Icon className="w-4 h-4 text-indigo-800" />
                              {opt.label}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {opt.desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Report Editor & Export */}
                  {generatingReport ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-800 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-700">
                        Drafting plain-language report for{" "}
                        {audience === "parent"
                          ? "Parents / Carers"
                          : audience === "teacher"
                          ? "Teachers & SENCO"
                          : "Clinical Portfolio"}
                        ...
                      </p>
                    </div>
                  ) : activeReport ? (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                      {/* Branded Preview Header */}
                      <div
                        className="px-6 py-4 text-white flex flex-wrap items-center justify-between gap-3"
                        style={{ backgroundColor: activeOrg.accentColor }}
                      >
                        <div>
                          <div className="text-xs opacity-85 font-medium">
                            {activeOrg.name} • {activeOrg.type}
                          </div>
                          <div className="text-base font-bold mt-0.5">
                            {activeReport.title}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSaveReportEdits}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={handleExportPdf}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-xs font-semibold shadow-xs cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Export Branded PDF
                          </button>
                        </div>
                      </div>

                      {/* Editable Body */}
                      <div className="p-6 space-y-5">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Plain-Language Overview
                          </label>
                          <textarea
                            rows={4}
                            value={activeReport.plainSummary}
                            onChange={(e) =>
                              setActiveReport({
                                ...activeReport,
                                plainSummary: e.target.value,
                              })
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Key Takeaways */}
                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                            Key Takeaways (Main Points)
                          </div>
                          <ul className="space-y-2">
                            {activeReport.keyTakeaways.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => {
                                    const copy = [...activeReport.keyTakeaways];
                                    copy[idx] = e.target.value;
                                    setActiveReport({
                                      ...activeReport,
                                      keyTakeaways: copy,
                                    });
                                  }}
                                  className="flex-1 bg-transparent text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded px-1.5 py-0.5"
                                />
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Sections */}
                        <div className="space-y-4">
                          {activeReport.sections.map((sec, idx) => (
                            <div key={idx}>
                              <input
                                type="text"
                                value={sec.heading}
                                onChange={(e) => {
                                  const secs = [...activeReport.sections];
                                  secs[idx] = { ...sec, heading: e.target.value };
                                  setActiveReport({
                                    ...activeReport,
                                    sections: secs,
                                  });
                                }}
                                className="w-full font-bold text-sm text-slate-900 mb-1.5 focus:outline-none focus:underline"
                              />
                              <textarea
                                rows={3}
                                value={sec.body}
                                onChange={(e) => {
                                  const secs = [...activeReport.sections];
                                  secs[idx] = { ...sec, body: e.target.value };
                                  setActiveReport({
                                    ...activeReport,
                                    sections: secs,
                                  });
                                }}
                                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Next Steps */}
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Agreed Next Steps
                          </div>
                          <ol className="space-y-2 list-decimal list-inside">
                            {activeReport.nextSteps.map((step, idx) => (
                              <li key={idx} className="text-sm text-slate-800">
                                <input
                                  type="text"
                                  value={step}
                                  onChange={(e) => {
                                    const copy = [...activeReport.nextSteps];
                                    copy[idx] = e.target.value;
                                    setActiveReport({
                                      ...activeReport,
                                      nextSteps: copy,
                                    });
                                  }}
                                  className="w-[92%] ml-1 px-2 py-1 rounded border border-transparent hover:border-slate-200 focus:border-indigo-400 focus:outline-none"
                                />
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* Org Confidentiality Footer Preview */}
                        <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between gap-2">
                          <span>{activeOrg.reportFooter}</span>
                          {reports.length > 1 && (
                            <span className="shrink-0 font-semibold text-slate-600">
                              {reports.length} versions saved
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                      <button
                        type="button"
                        onClick={() => handleGenerateReport("parent")}
                        style={{ backgroundColor: activeOrg.accentColor }}
                        className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold cursor-pointer"
                      >
                        Generate Parent / Carer Plain-Language Summary
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
