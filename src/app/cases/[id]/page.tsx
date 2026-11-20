"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Paperclip,
  ArrowUp,
  Download,
  X,
  FileText,
  Image as ImageIcon,
  Mic,
  Check,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/components/AppProvider";
import { StatusLabel, formatDate } from "@/components/ui";
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
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "pdf";
  return "text";
}

function readFile(file: File, as: "dataUrl" | "text"): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    if (as === "dataUrl") reader.readAsDataURL(file);
    else reader.readAsText(file);
  });
}

/**
 * Resize large raster images (photos/scans of drawings) to max 1280px JPEG
 * so uploads stay well within Vercel's 4.5 MB serverless payload limit.
 */
async function prepareImageDataUrl(
  file: File
): Promise<{ dataUrl: string; mimeType: string }> {
  const rawDataUrl = await readFile(file, "dataUrl");
  if (file.type === "image/svg+xml" || file.size < 250 * 1024) {
    return { dataUrl: rawDataUrl, mimeType: file.type || "image/png" };
  }
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const maxDim = 1280;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ dataUrl: rawDataUrl, mimeType: file.type || "image/jpeg" });
        return;
      }
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL("image/jpeg", 0.84);
      resolve({ dataUrl: compressed, mimeType: "image/jpeg" });
    };
    img.onerror = () =>
      resolve({ dataUrl: rawDataUrl, mimeType: file.type || "image/jpeg" });
    img.src = rawDataUrl;
  });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const AUDIENCES: { id: ReportAudience; label: string; hint: string }[] = [
  { id: "parent", label: "Parents & carers", hint: "Plain, warm, no jargon" },
  { id: "teacher", label: "Teacher & SENCO", hint: "Classroom actions" },
  { id: "supervision", label: "Supervision record", hint: "For your case file" },
];

function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-[44px_1fr] sm:grid-cols-[64px_1fr] gap-x-2 py-8 border-t border-rule first:border-t-0 first:pt-0">
      <span className="font-serif text-[26px] sm:text-[30px] leading-none text-ink-3 tabular-nums">
        {n}
      </span>
      <div className="min-w-0">
        <h3 className="font-serif text-[22px] leading-tight mb-4">{title}</h3>
        {children}
      </div>
    </section>
  );
}

function Prose({ text }: { text: string }) {
  const paras = text.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className="space-y-3 text-[15px] leading-[1.7] text-ink-2 max-w-[640px]">
      {paras.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

export default function CaseWorkspacePage() {
  const params = useParams();
  const caseId = String(params?.id || "");
  const { user, authLoading, activeOrg, language, signInDemo } = useApp();

  const [pupilCase, setPupilCase] = useState<PupilCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"supervision" | "report">("supervision");

  const [promptInput, setPromptInput] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [liveModel, setLiveModel] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [audience, setAudience] = useState<ReportAudience>("parent");
  const [reports, setReports] = useState<PlainLanguageReport[]>([]);
  const [activeReport, setActiveReport] = useState<PlainLanguageReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) signInDemo();
  }, [authLoading, user, signInDemo]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([loadCases(activeOrg.id), loadReports(activeOrg.id, caseId)]).then(
      ([allCases, caseReports]) => {
        if (!mounted) return;
        setPupilCase(allCases.find((c) => c.id === caseId) || null);
        setReports(caseReports);
        if (caseReports.length > 0) {
          setActiveReport(caseReports[0]);
          setAudience(caseReports[0].audience);
        }
        setLoading(false);
      }
    );
    return () => {
      mounted = false;
    };
  }, [activeOrg.id, caseId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  // Grow inline-editable textareas to fit their content (works in every browser)
  useLayoutEffect(() => {
    document.querySelectorAll<HTMLTextAreaElement>("textarea.inline-edit").forEach((t) => {
      t.style.height = "auto";
      t.style.height = `${t.scrollHeight}px`;
    });
  });

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !pupilCase || !user) return;
    const added: CaseAttachment[] = [];
    for (const file of Array.from(files)) {
      const kind = detectFileKind(file);
      let dataUrl = "";
      let mimeType = file.type || "application/octet-stream";
      if (kind === "image") {
        const prepared = await prepareImageDataUrl(file);
        dataUrl = prepared.dataUrl;
        mimeType = prepared.mimeType;
      } else {
        dataUrl = await readFile(file, "dataUrl");
      }
      let att: CaseAttachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        mimeType,
        size: file.size,
        kind,
        textContent: kind === "text" ? await readFile(file, "text") : undefined,
        base64Data: dataUrl.includes(",") ? dataUrl.split(",")[1] : "",
        previewUrl: dataUrl,
      };
      att = await uploadAttachmentToStorage(activeOrg.id, pupilCase.id, att);
      added.push(att);
    }
    const updated = { ...pupilCase, attachments: [...pupilCase.attachments, ...added] };
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
    showToast(added.length === 1 ? "File attached" : `${added.length} files attached`);
    e.target.value = "";
  };

  const handleRemoveAttachment = async (attId: string) => {
    if (!pupilCase) return;
    const updated = { ...pupilCase, attachments: pupilCase.attachments.filter((a) => a.id !== attId) };
    setPupilCase(updated);
    await saveCase(updated);
  };

  const handleRunSupervision = async () => {
    if (!pupilCase || !user) return;
    setErrorMsg(null);
    setAnalysing(true);
    const raw = promptInput.trim() || pupilCase.summary;
    const cleaned = redactPII(raw, undefined, pupilCase.pupilAlias);

    try {
      const res = await fetch("/api/supervise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseText: cleaned.redactedText,
          pupilAlias: pupilCase.pupilAlias,
          yearGroup: pupilCase.yearGroup,
          conversationHistory: pupilCase.messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          attachments: pupilCase.attachments.map((a) => ({
            name: a.name,
            mimeType: a.mimeType,
            kind: a.kind,
            textContent: a.textContent,
            base64Data:
              a.base64Data ||
              (a.previewUrl?.startsWith("data:") && a.previewUrl.includes(",")
                ? a.previewUrl.split(",")[1]
                : undefined),
          })),
          language,
          customOrgNote: activeOrg.customPromptNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Supervision request failed");

      const supervision: SupervisionSteps = data.supervision;
      setLiveModel(data.mode === "live");

      const now = new Date().toISOString();
      const messages = [...pupilCase.messages];
      if (promptInput.trim()) {
        messages.push({ id: `msg-u-${Date.now()}`, role: "user", content: cleaned.redactedText, createdAt: now });
      }
      messages.push({
        id: `msg-a-${Date.now() + 1}`,
        role: "assistant",
        content: "Supervision note updated.",
        createdAt: now,
        supervisionSteps: supervision,
      });

      const updated: PupilCase = { ...pupilCase, messages, latestSupervision: supervision, updatedAt: now };
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
        details: `Supervision run for ${pupilCase.pupilAlias} (${pupilCase.attachments.length} attachment(s))`,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setAnalysing(false);
    }
  };

  const handleGenerateReport = async (selected: ReportAudience) => {
    if (!pupilCase?.latestSupervision || !user) return;
    setAudience(selected);

    const existing = reports.find((r) => r.audience === selected);
    if (existing) {
      setActiveReport(existing);
      setDirty(false);
      return;
    }
    await generate(selected);
  };

  const generate = async (selected: ReportAudience) => {
    if (!pupilCase?.latestSupervision || !user) return;
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
          audience: selected,
          organisationName: activeOrg.name,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Report generation failed");

      const now = new Date().toISOString();
      const rep: PlainLanguageReport = {
        id: `rep-${pupilCase.id}-${selected}`,
        orgId: activeOrg.id,
        caseId: pupilCase.id,
        pupilAlias: pupilCase.pupilAlias,
        yearGroup: pupilCase.yearGroup,
        audience: selected,
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
      await saveReport(rep);
      setActiveReport(rep);
      setDirty(false);
      setReports((prev) => [rep, ...prev.filter((r) => r.id !== rep.id)]);

      const updatedCase: PupilCase = { ...pupilCase, status: "report_ready" };
      setPupilCase(updatedCase);
      await saveCase(updatedCase);
      await appendAuditLog({
        orgId: activeOrg.id,
        actorUid: user.uid,
        actorName: user.displayName,
        action: "REPORT_GENERATED",
        targetType: "report",
        targetId: rep.id,
        details: `Drafted ${selected} report for ${pupilCase.pupilAlias}`,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Could not draft the report.");
    } finally {
      setGeneratingReport(false);
    }
  };

  const editReport = (patch: Partial<PlainLanguageReport>) => {
    if (!activeReport) return;
    setActiveReport({ ...activeReport, ...patch });
    setDirty(true);
  };

  const handleSaveReport = async () => {
    if (!activeReport) return;
    const saved = await saveReport(activeReport);
    setReports((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
    setDirty(false);
    showToast("Changes saved");
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
      details: `Exported ${activeReport.audience} report for ${activeReport.pupilAlias} as PDF`,
    });
  };

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-4 max-w-[640px]">
          <div className="skeleton h-3 w-32" />
          <div className="skeleton h-8 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      </AppShell>
    );
  }

  if (!pupilCase) {
    return (
      <AppShell>
        <div className="py-20 text-center">
          <p className="font-serif text-[24px] mb-3">This case could not be found.</p>
          <Link href="/dashboard" className="link text-[14px]">
            Back to cases
          </Link>
        </div>
      </AppShell>
    );
  }

  const sup = pupilCase.latestSupervision;

  return (
    <AppShell>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-2 px-4 py-2 rounded-[3px] bg-ink text-paper text-[13px] shadow-lg">
          <Check className="w-4 h-4" strokeWidth={2} />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <nav className="text-[13px] text-ink-3 mb-5">
          <Link href="/dashboard" className="hover:text-ink">
            Cases
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink-2">{pupilCase.pupilAlias}</span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-[760px]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-[13px] text-ink-3">
              <span className="text-ink font-medium">{pupilCase.pupilAlias}</span>
              <span>{pupilCase.yearGroup}</span>
              <StatusLabel status={pupilCase.status} />
              <span>Updated {formatDate(pupilCase.updatedAt)}</span>
            </div>
            <h1 className="display text-[32px] sm:text-[38px]">{pupilCase.title}</h1>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-7 border-b border-rule">
          {(
            [
              ["supervision", "Supervision"],
              ["report", "Reports"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                setErrorMsg(null);
              }}
              className={`pb-3 -mb-px text-[14.5px] border-b-2 cursor-pointer transition-colors ${
                tab === id ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink"
              }`}
            >
              {label}
              {id === "report" && reports.length > 0 && (
                <span className="ml-1.5 font-mono text-[11px] text-ink-3">{reports.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 text-[13.5px] text-brick bg-brick-bg border border-[#ecc9bf] rounded-[3px] px-4 py-3 flex items-start justify-between gap-4">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Case file */}
        <aside className="lg:col-span-4 lg:sticky lg:top-[92px] space-y-9 order-2 lg:order-1">
          <div>
            <p className="eyebrow mb-3">Practitioner&apos;s notes</p>
            <p className="text-[14.5px] leading-[1.7] text-ink-2 whitespace-pre-line border-l-2 border-rule-strong pl-4">
              {pupilCase.summary}
            </p>
            <p className="mt-3 pl-4 text-[12.5px] text-ink-3">
              {pupilCase.createdByName} · {new Date(pupilCase.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="eyebrow">Attachments · {pupilCase.attachments.length}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[13px] text-ink-2 hover:text-ink inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Paperclip className="w-3.5 h-3.5" strokeWidth={1.6} />
                Add file
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
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-left border border-dashed border-rule-strong rounded-[3px] px-4 py-5 text-[13px] text-ink-3 hover:border-ink-3 hover:text-ink-2 transition-colors cursor-pointer"
              >
                Drawings, PDFs, typed notes or audio. Everything attached here
                is read as part of the case.
              </button>
            ) : (
              <ul className="space-y-4">
                {pupilCase.attachments.map((att) => {
                  const Icon = att.kind === "image" ? ImageIcon : att.kind === "audio" ? Mic : FileText;
                  return (
                    <li key={att.id} className="group">
                      {att.kind === "image" && att.previewUrl && (
                        <div className="mb-2 border border-rule bg-sheet rounded-[2px] overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={att.previewUrl} alt={att.name} className="w-full h-auto max-h-60 object-contain" />
                        </div>
                      )}
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-ink-3 shrink-0" strokeWidth={1.5} />
                        <span className="text-[13.5px] text-ink truncate flex-1">{att.name}</span>
                        <span className="font-mono text-[11px] text-ink-3 shrink-0">{formatSize(att.size)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-ink-3 hover:text-brick transition-opacity cursor-pointer"
                          aria-label={`Remove ${att.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {att.kind === "audio" && att.previewUrl && (
                        <audio controls src={att.previewUrl} className="w-full h-8 mt-2" />
                      )}
                      {att.kind === "text" && att.textContent && (
                        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-3 line-clamp-4">
                          {att.textContent}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Main column */}
        <div className="lg:col-span-8 order-1 lg:order-2">
          {tab === "supervision" ? (
            <>
              {analysing ? (
                <div className="space-y-10">
                  <p className="text-[14px] text-ink-3">
                    Reading the notes{pupilCase.attachments.length > 0 ? ` and ${pupilCase.attachments.length} attachment${pupilCase.attachments.length > 1 ? "s" : ""}` : ""}…
                  </p>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="grid grid-cols-[64px_1fr] gap-x-2">
                      <div className="skeleton h-6 w-8" />
                      <div className="space-y-2.5">
                        <div className="skeleton h-5 w-1/3 mb-4" />
                        <div className="skeleton h-3 w-full" />
                        <div className="skeleton h-3 w-[92%]" />
                        <div className="skeleton h-3 w-[78%]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !sup ? (
                <div className="border border-rule bg-surface rounded-[3px] px-8 py-12 sm:px-12">
                  <h2 className="display text-[28px] mb-3">Ready when you are.</h2>
                  <p className="text-[15px] leading-relaxed text-ink-2 max-w-[520px]">
                    Supervision will work from your notes
                    {pupilCase.attachments.length > 0
                      ? ` and the ${pupilCase.attachments.length} attached file${pupilCase.attachments.length > 1 ? "s" : ""}`
                      : ""}
                    , and produce a four-part note: questions to explore, what
                    you&apos;re doing well, a working hypothesis, and next steps.
                  </p>
                  <button type="button" onClick={handleRunSupervision} className="btn btn-accent mt-8 h-10 px-5">
                    Begin supervision
                  </button>
                </div>
              ) : (
                <article>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-10 text-[13px] text-ink-3">
                    <span>
                      Supervision note ·{" "}
                      {new Date(sup.analyzedAt).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {liveModel === false && " · sample output"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTab("report");
                        if (!activeReport) handleGenerateReport("parent");
                      }}
                      className="link text-ink text-[13.5px] cursor-pointer"
                    >
                      Write this up as a report →
                    </button>
                  </div>

                  {sup.fileAnalysisNotes && (
                    <aside className="mb-10 bg-ochre-bg border-l-2 border-ochre px-5 py-4">
                      <p className="eyebrow !text-ochre mb-1.5">From the attachments</p>
                      <p className="text-[14.5px] leading-[1.7] text-[#4f360c]">{sup.fileAnalysisNotes}</p>
                    </aside>
                  )}

                  <Step n="01" title="Questions worth asking">
                    <ol className="space-y-3.5 max-w-[640px]">
                      {sup.step1Questions.map((q, i) => (
                        <li key={i} className="grid grid-cols-[22px_1fr] text-[15px] leading-[1.65] text-ink-2">
                          <span className="font-mono text-[12px] text-ink-3 pt-[3px]">{i + 1}.</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ol>
                  </Step>

                  <Step n="02" title="What you are doing well">
                    <Prose text={sup.step2StrengthsAndSupport} />
                  </Step>

                  <Step n="03" title="Working hypothesis">
                    <Prose text={sup.step3Hypotheses} />
                  </Step>

                  <Step n="04" title="Next steps">
                    <Prose text={sup.step4Recommendations} />
                    {sup.referralsNeeded?.length > 0 && (
                      <div className="mt-7 max-w-[640px]">
                        <p className="eyebrow mb-3">Consider involving</p>
                        <ul className="divide-y divide-rule border-y border-rule">
                          {sup.referralsNeeded.map((r, i) => (
                            <li key={i} className="py-2.5 text-[14px] text-ink">
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Step>
                </article>
              )}

              {/* Composer */}
              {!analysing && (
                <div className="mt-12 border border-rule-strong bg-sheet rounded-[4px] focus-within:border-ink transition-colors">
                  <textarea
                    rows={3}
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && promptInput.trim()) {
                        e.preventDefault();
                        handleRunSupervision();
                      }
                    }}
                    placeholder={
                      sup
                        ? "Answer one of the questions, or add something new you've noticed…"
                        : "Anything to add before you begin? (optional)"
                    }
                    className="w-full resize-none bg-transparent px-4 pt-3.5 text-[14.5px] leading-relaxed placeholder:text-ink-3 focus:outline-none"
                  />
                  <div className="flex items-center justify-between px-3 pb-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-ghost h-8 text-[13px]"
                    >
                      <Paperclip className="w-3.5 h-3.5" strokeWidth={1.6} />
                      Attach
                    </button>
                    <div className="flex items-center gap-3">
                      <span className="hidden sm:inline font-mono text-[11px] text-ink-3">Ctrl ↵</span>
                      <button
                        type="button"
                        onClick={handleRunSupervision}
                        disabled={sup ? !promptInput.trim() : false}
                        className="btn btn-primary h-8 px-3 text-[13px]"
                      >
                        {sup ? "Update note" : "Begin"}
                        <ArrowUp className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : !sup ? (
            <div className="border border-rule bg-surface rounded-[3px] px-8 py-12">
              <h2 className="display text-[26px] mb-3">Supervision comes first.</h2>
              <p className="text-[15px] text-ink-2 mb-6 max-w-[480px]">
                Reports are written from the supervision note, so run that before
                drafting anything for parents or staff.
              </p>
              <button type="button" onClick={() => setTab("supervision")} className="btn btn-outline">
                Go to supervision
              </button>
            </div>
          ) : (
            <div>
              {/* Audience switch */}
              <div className="grid grid-cols-3 border border-rule-strong rounded-[4px] overflow-hidden mb-8">
                {AUDIENCES.map((a, i) => {
                  const selected = audience === a.id;
                  const exists = reports.some((r) => r.audience === a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      disabled={generatingReport}
                      onClick={() => handleGenerateReport(a.id)}
                      className={`text-left px-4 py-3 cursor-pointer transition-colors ${i > 0 ? "border-l border-rule-strong" : ""} ${
                        selected ? "bg-ink text-paper" : "bg-transparent hover:bg-surface"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2 text-[14px] font-medium">
                        {a.label}
                        {exists && !selected && <span className="w-1.5 h-1.5 rounded-full bg-moss shrink-0" title="Drafted" />}
                      </span>
                      <span className={`hidden sm:block text-[12px] mt-0.5 ${selected ? "text-[#bdb7aa]" : "text-ink-3"}`}>
                        {a.hint}
                      </span>
                    </button>
                  );
                })}
              </div>

              {generatingReport ? (
                <div className="sheet rounded-[2px] px-10 py-12 space-y-4">
                  <p className="text-[13.5px] text-ink-3 mb-6">
                    Drafting for {AUDIENCES.find((a) => a.id === audience)?.label.toLowerCase()}…
                  </p>
                  <div className="skeleton h-7 w-2/3" />
                  <div className="skeleton h-3 w-full mt-6" />
                  <div className="skeleton h-3 w-[94%]" />
                  <div className="skeleton h-3 w-[81%]" />
                </div>
              ) : activeReport && activeReport.audience === audience ? (
                <>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="text-[13px] text-ink-3">
                      {dirty ? "Unsaved changes" : "Click any text to edit it."}
                    </span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => generate(audience)} className="btn btn-ghost h-8 text-[13px]">
                        Redraft
                      </button>
                      <button type="button" onClick={handleSaveReport} disabled={!dirty} className="btn btn-outline h-8 text-[13px]">
                        Save
                      </button>
                      <button type="button" onClick={handleExportPdf} className="btn btn-primary h-8 text-[13px]">
                        <Download className="w-3.5 h-3.5" strokeWidth={1.8} />
                        PDF
                      </button>
                    </div>
                  </div>

                  {/* The sheet */}
                  <div className="sheet rounded-[2px]">
                    <div className="h-[5px]" style={{ backgroundColor: activeOrg.accentColor }} />
                    <div className="px-7 sm:px-12 pt-9 pb-12">
                      <div className="flex items-start justify-between gap-6 pb-6 border-b border-rule">
                        <div>
                          <p className="font-serif text-[17px] text-ink">{activeOrg.name}</p>
                          <p className="text-[12px] text-ink-3 mt-0.5">{activeOrg.type}</p>
                        </div>
                        <div className="text-right font-mono text-[11px] text-ink-3 leading-relaxed">
                          <div>CONFIDENTIAL</div>
                          <div>{new Date(activeReport.updatedAt).toLocaleDateString("en-GB")}</div>
                        </div>
                      </div>

                      <textarea
                        rows={2}
                        value={activeReport.title}
                        onChange={(e) => editReport({ title: e.target.value })}
                        className="inline-edit display text-[28px] sm:text-[32px] mt-8 field-sizing-content"
                      />
                      <p className="mt-2 text-[13px] text-ink-3">
                        {activeReport.pupilAlias} · {activeReport.yearGroup} · Prepared by {activeReport.createdByName}
                      </p>

                      <textarea
                        value={activeReport.plainSummary}
                        onChange={(e) => editReport({ plainSummary: e.target.value })}
                        className="inline-edit mt-8 text-[16px] leading-[1.75] text-ink field-sizing-content min-h-[4lh]"
                      />

                      {activeReport.keyTakeaways.length > 0 && (
                        <div className="mt-9">
                          <p className="eyebrow mb-3">In brief</p>
                          <ul className="space-y-2.5">
                            {activeReport.keyTakeaways.map((item, idx) => (
                              <li key={idx} className="grid grid-cols-[18px_1fr] text-[15px] leading-[1.65] text-ink-2">
                                <span className="text-ink-3 pt-[1px]">—</span>
                                <textarea
                                  value={item}
                                  onChange={(e) => {
                                    const copy = [...activeReport.keyTakeaways];
                                    copy[idx] = e.target.value;
                                    editReport({ keyTakeaways: copy });
                                  }}
                                  className="inline-edit field-sizing-content"
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {activeReport.sections.map((sec, idx) => (
                        <div key={idx} className="mt-9">
                          <input
                            value={sec.heading}
                            onChange={(e) => {
                              const secs = [...activeReport.sections];
                              secs[idx] = { ...sec, heading: e.target.value };
                              editReport({ sections: secs });
                            }}
                            className="inline-edit font-serif text-[20px] text-ink"
                          />
                          <textarea
                            value={sec.body}
                            onChange={(e) => {
                              const secs = [...activeReport.sections];
                              secs[idx] = { ...sec, body: e.target.value };
                              editReport({ sections: secs });
                            }}
                            className="inline-edit mt-2 text-[15px] leading-[1.75] text-ink-2 field-sizing-content"
                          />
                        </div>
                      ))}

                      {activeReport.nextSteps.length > 0 && (
                        <div className="mt-10 pt-7 border-t border-rule">
                          <p className="font-serif text-[20px] mb-4">Agreed next steps</p>
                          <ol className="space-y-3">
                            {activeReport.nextSteps.map((step, idx) => (
                              <li key={idx} className="grid grid-cols-[26px_1fr] text-[15px] leading-[1.65] text-ink-2">
                                <span className="font-mono text-[12px] text-ink-3 pt-[3px]">{idx + 1}.</span>
                                <textarea
                                  value={step}
                                  onChange={(e) => {
                                    const copy = [...activeReport.nextSteps];
                                    copy[idx] = e.target.value;
                                    editReport({ nextSteps: copy });
                                  }}
                                  className="inline-edit field-sizing-content"
                                />
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      <p className="mt-12 pt-5 border-t border-rule text-[11.5px] leading-relaxed text-ink-3">
                        {activeOrg.reportFooter}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="border border-rule bg-surface rounded-[3px] px-8 py-10">
                  <p className="text-[15px] text-ink-2 mb-5">
                    No {AUDIENCES.find((a) => a.id === audience)?.label.toLowerCase()} report yet.
                  </p>
                  <button type="button" onClick={() => generate(audience)} className="btn btn-accent">
                    Draft it now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
