"use client";

import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/components/AppProvider";
import { loadAuditLogs, appendAuditLog } from "@/lib/store";
import type { AuditLogEntry, OrgType } from "@/types";

const ACCENTS = [
  { label: "Forest", value: "#1F4D3A" },
  { label: "Oxblood", value: "#6E2A26" },
  { label: "Ink blue", value: "#1E3557" },
  { label: "Slate", value: "#3A4652" },
  { label: "Ochre", value: "#8A5A12" },
];

const ORG_TYPES: OrgType[] = [
  "Multi-Academy Trust (MAT)",
  "Local Authority (LA)",
  "Independent School",
  "Educational Psychology Practice",
];

const ACTION_LABEL: Record<AuditLogEntry["action"], string> = {
  CASE_CREATED: "Case opened",
  CASE_ANALYSED: "Supervision run",
  FILE_UPLOADED: "File attached",
  PII_REDACTED: "Details redacted",
  REPORT_GENERATED: "Report drafted",
  REPORT_EXPORTED_PDF: "PDF exported",
  ORG_SETTINGS_UPDATED: "Settings changed",
};

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid md:grid-cols-[240px_1fr] gap-3 md:gap-10 py-7 border-t border-rule">
      <div>
        <p className="text-[14px] font-medium text-ink">{label}</p>
        {hint && <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{hint}</p>}
      </div>
      <div className="max-w-[680px]">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const {
    user,
    authLoading,
    activeOrg,
    organisations,
    switchOrganisation,
    updateActiveOrganisation,
    firebaseReady,
    isDemoSession,
    signInDemo,
  } = useApp();

  const [name, setName] = useState(activeOrg.name);
  const [logoText, setLogoText] = useState(activeOrg.logoText);
  const [type, setType] = useState<OrgType>(activeOrg.type);
  const [accentColor, setAccentColor] = useState(activeOrg.accentColor);
  const [reportFooter, setReportFooter] = useState(activeOrg.reportFooter);
  const [customPromptNote, setCustomPromptNote] = useState(activeOrg.customPromptNote);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    if (!authLoading && !user) signInDemo();
  }, [authLoading, user, signInDemo]);

  useEffect(() => {
    setName(activeOrg.name);
    setLogoText(activeOrg.logoText);
    setType(activeOrg.type);
    setAccentColor(activeOrg.accentColor);
    setReportFooter(activeOrg.reportFooter);
    setCustomPromptNote(activeOrg.customPromptNote);
    loadAuditLogs(activeOrg.id).then(setAuditLogs);
  }, [activeOrg]);

  const dirty =
    name !== activeOrg.name ||
    logoText !== activeOrg.logoText ||
    type !== activeOrg.type ||
    accentColor !== activeOrg.accentColor ||
    reportFooter !== activeOrg.reportFooter ||
    customPromptNote !== activeOrg.customPromptNote;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await updateActiveOrganisation({ name, logoText, type, accentColor, reportFooter, customPromptNote });
    const log = await appendAuditLog({
      orgId: activeOrg.id,
      actorUid: user.uid,
      actorName: user.displayName,
      action: "ORG_SETTINGS_UPDATED",
      targetType: "organisation",
      targetId: activeOrg.id,
      details: `Updated organisation settings for ${name}`,
    });
    setAuditLogs((prev) => [log, ...prev]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const cloudSynced = firebaseReady && !isDemoSession;

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="display text-[40px]">Organisation</h1>
          <p className="mt-2 text-[14.5px] text-ink-2 max-w-[560px]">
            How Superviz presents itself to your staff and on the reports you
            send out, and a record of who has done what.
          </p>
        </div>
        {organisations.length > 1 && (
          <div className="flex items-center gap-1 text-[13px]">
            <span className="text-ink-3 mr-2">Workspace</span>
            {organisations.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => switchOrganisation(org.id)}
                className={`px-3 py-1.5 rounded-[3px] border cursor-pointer transition-colors ${
                  org.id === activeOrg.id
                    ? "border-ink bg-ink text-paper"
                    : "border-rule-strong text-ink-2 hover:border-ink"
                }`}
              >
                {org.logoText}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Branding & reports */}
      <form onSubmit={handleSave} className="mb-20">
        <h2 className="font-serif text-[24px] mb-1">Identity and reports</h2>
        <p className="text-[13.5px] text-ink-3 mb-6">Changes apply to every member of this workspace.</p>

        <Row label="Organisation name" hint="Shown at the top of every report.">
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
        </Row>

        <Row label="Short name" hint="Used in menus where space is tight.">
          <input className="field max-w-[260px]" value={logoText} onChange={(e) => setLogoText(e.target.value)} />
        </Row>

        <Row label="Type">
          <select className="field max-w-[360px]" value={type} onChange={(e) => setType(e.target.value as OrgType)}>
            {ORG_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Row>

        <Row label="Colour" hint="A single accent used for buttons, the logo mark and report headers.">
          <div className="flex flex-wrap items-center gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => setAccentColor(a.value)}
                className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-[3px] border text-[13px] cursor-pointer transition-colors ${
                  accentColor.toLowerCase() === a.value.toLowerCase()
                    ? "border-ink text-ink"
                    : "border-rule-strong text-ink-2 hover:border-ink-3"
                }`}
              >
                <span className="w-5 h-5 rounded-[2px]" style={{ backgroundColor: a.value }} />
                {a.label}
              </button>
            ))}
            <label className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-[3px] border border-rule-strong text-[13px] text-ink-2 cursor-pointer">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-5 h-5 cursor-pointer bg-transparent"
              />
              Custom
            </label>
          </div>
        </Row>

        <Row label="Report footer" hint="Printed at the bottom of every page of exported PDFs.">
          <textarea rows={3} className="field leading-relaxed" value={reportFooter} onChange={(e) => setReportFooter(e.target.value)} />
        </Row>

        <Row
          label="Supervision guidance"
          hint="Local policy or emphasis the supervisor should take into account — for example your graduated response model or referral pathways."
        >
          <textarea rows={4} className="field leading-relaxed" value={customPromptNote} onChange={(e) => setCustomPromptNote(e.target.value)} />
        </Row>

        <Row label="Preview">
          <div className="sheet rounded-[2px] overflow-hidden">
            <div className="h-[4px]" style={{ backgroundColor: accentColor }} />
            <div className="px-6 py-5 flex items-start justify-between gap-4">
              <div>
                <p className="font-serif text-[17px]">{name || "Organisation name"}</p>
                <p className="text-[12px] text-ink-3 mt-0.5">{type}</p>
              </div>
              <span className="font-mono text-[10.5px] text-ink-3">CONFIDENTIAL</span>
            </div>
            <div className="px-6 pb-5">
              <div className="h-2 w-2/3 bg-rule rounded-[1px]" />
              <div className="h-2 w-1/2 bg-rule rounded-[1px] mt-2" />
              <p className="mt-5 pt-3 border-t border-rule text-[10.5px] leading-relaxed text-ink-3 line-clamp-2">
                {reportFooter}
              </p>
            </div>
          </div>
        </Row>

        <div className="border-t border-rule pt-6 flex items-center justify-end gap-4">
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-[13px] text-moss">
              <Check className="w-4 h-4" strokeWidth={2} />
              Saved
            </span>
          )}
          <button type="submit" disabled={saving || !dirty} className="btn btn-primary">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      {/* Data & governance */}
      <section className="mb-20">
        <h2 className="font-serif text-[24px] mb-6">Data and governance</h2>
        <dl className="divide-y divide-rule border-y border-rule">
          {[
            ["Storage", cloudSynced ? "Cloud Firestore and Cloud Storage, project superviz-de8b3" : "This browser only (demo session). Sign in to store cases in Firestore."],
            ["Region", activeOrg.dataRegion],
            ["Isolation", `All records sit under organisations/${activeOrg.id} and are inaccessible to other workspaces.`],
            ["Identifiers", "Pupils are referred to by alias. Names, emails, phone numbers, postcodes and dates are stripped before analysis."],
            ["Audit", "Every case, report and export action is logged. Entries cannot be edited or deleted."],
          ].map(([k, v]) => (
            <div key={k} className="grid md:grid-cols-[240px_1fr] gap-2 md:gap-10 py-4">
              <dt className="text-[14px] text-ink-3">{k}</dt>
              <dd className="text-[14px] text-ink max-w-[620px]">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Audit log */}
      <section>
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-serif text-[24px]">Activity</h2>
          <span className="font-mono text-[11px] text-ink-3">{auditLogs.length} entries</span>
        </div>
        <div className="border-y border-rule">
          <div className="hidden md:grid grid-cols-[150px_170px_1fr_180px] gap-6 py-3 eyebrow border-b border-rule">
            <span>When</span>
            <span>Action</span>
            <span>Detail</span>
            <span>By</span>
          </div>
          <ul className="divide-y divide-rule max-h-[440px] overflow-y-auto">
            {auditLogs.map((log) => (
              <li key={log.id} className="grid md:grid-cols-[150px_170px_1fr_180px] gap-1 md:gap-6 py-3.5 text-[13.5px]">
                <span className="font-mono text-[12px] text-ink-3 md:pt-[1px]">
                  {new Date(log.createdAt).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-ink">{ACTION_LABEL[log.action] || log.action}</span>
                <span className="text-ink-2">{log.details}</span>
                <span className="text-ink-3">{log.actorName}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </AppShell>
  );
}
