"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  ShieldCheck,
  Palette,
  Save,
  CheckCircle2,
  Lock,
  History,
  Server,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/components/AppProvider";
import { loadAuditLogs, appendAuditLog } from "@/lib/store";
import type { AuditLogEntry, OrgType } from "@/types";

const ACCENT_PRESETS = [
  { label: "Oxford Navy", value: "#1E3A8A" },
  { label: "Camden Teal", value: "#0F766E" },
  { label: "Royal Indigo", value: "#3730A3" },
  { label: "Forest Green", value: "#166534" },
  { label: "Slate Charcoal", value: "#1E293B" },
];

const ORG_TYPES: OrgType[] = [
  "Multi-Academy Trust (MAT)",
  "Local Authority (LA)",
  "Independent School",
  "Educational Psychology Practice",
];

export default function SettingsPage() {
  const {
    user,
    authLoading,
    activeOrg,
    organisations,
    switchOrganisation,
    updateActiveOrganisation,
    firebaseReady,
    signInDemo,
  } = useApp();

  const [name, setName] = useState(activeOrg.name);
  const [logoText, setLogoText] = useState(activeOrg.logoText);
  const [type, setType] = useState<OrgType>(activeOrg.type);
  const [accentColor, setAccentColor] = useState(activeOrg.accentColor);
  const [reportFooter, setReportFooter] = useState(activeOrg.reportFooter);
  const [customPromptNote, setCustomPromptNote] = useState(
    activeOrg.customPromptNote
  );
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      signInDemo();
    }
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await updateActiveOrganisation({
      name,
      logoText,
      type,
      accentColor,
      reportFooter,
      customPromptNote,
    });
    const log = await appendAuditLog({
      orgId: activeOrg.id,
      actorUid: user.uid,
      actorName: user.displayName,
      action: "ORG_SETTINGS_UPDATED",
      targetType: "organisation",
      targetId: activeOrg.id,
      details: `Updated branding, footer, and supervision guidelines for ${name}`,
    });
    setAuditLogs((prev) => [log, ...prev]);
    setSaving(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Organisation Adaptability & Privacy Governance
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Configure white-label branding, custom report templates, and review
          your organisation&apos;s UK GDPR security controls and audit trail.
        </p>
      </div>

      {/* Quick Org Switcher Banner for Live Demos */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">
              Multi-Tenant Organisation Switcher
            </div>
            <div className="text-xs text-slate-500">
              Each school, MAT, or Local Authority has strictly isolated
              Firestore collections and custom branding.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {organisations.map((org) => (
            <button
              key={org.id}
              type="button"
              onClick={() => switchOrganisation(org.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                org.id === activeOrg.id
                  ? "text-white border-transparent shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
              style={
                org.id === activeOrg.id
                  ? { backgroundColor: org.accentColor }
                  : undefined
              }
            >
              {org.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* White-Label Form */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-slate-700" />
              <h2 className="text-base font-bold text-slate-900">
                White-Label Branding & Report Adaptation
              </h2>
            </div>
            {savedNotice && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" /> Saved
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organisation Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organisation Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as OrgType)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ORG_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Short Header Label
              </label>
              <input
                type="text"
                value={logoText}
                onChange={(e) => setLogoText(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brand Accent Colour (UI & PDF Headers)
              </label>
              <div className="flex items-center gap-2">
                {ACCENT_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    title={p.label}
                    onClick={() => setAccentColor(p.value)}
                    className={`w-7 h-7 rounded-full border-2 cursor-pointer ${
                      accentColor === p.value
                        ? "border-slate-900 scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: p.value }}
                  />
                ))}
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-slate-200"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              PDF Report Confidentiality Footer
            </label>
            <textarea
              rows={2}
              value={reportFooter}
              onChange={(e) => setReportFooter(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Organisation-Specific Supervision Policy / Guidance
            </label>
            <textarea
              rows={3}
              value={customPromptNote}
              onChange={(e) => setCustomPromptNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Automatically appended to the 4-step supervisor instructions for
              this organisation.
            </p>
          </div>

          {/* Live PDF Header Preview */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div
              className="px-4 py-3 text-white"
              style={{ backgroundColor: accentColor }}
            >
              <div className="text-xs font-bold">{name || "Organisation"}</div>
              <div className="text-[10px] opacity-85">
                CONFIDENTIAL CASE PORTFOLIO • {type} • UK GDPR Protected
              </div>
            </div>
            <div className="px-4 py-2 bg-slate-50 text-[11px] text-slate-500">
              Live PDF Header Preview — applies immediately on Save
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{ backgroundColor: accentColor }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-95 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Organisation Configuration"}
          </button>
        </form>

        {/* Right Column: Compliance & Audit Log */}
        <div className="lg:col-span-5 space-y-5">
          {/* Privacy & Architecture Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-bold text-slate-900">
                Confidentiality & UK GDPR Controls
              </h2>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <Server className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-950">
                    Firebase Backend: Project &ldquo;Superviz&rdquo;
                  </div>
                  <div className="text-emerald-900/80 mt-0.5">
                    Status:{" "}
                    <strong>
                      {firebaseReady
                        ? "Connected to Cloud Firestore & Storage"
                        : "Ready for .env.local keys (Demo Vault active)"}
                    </strong>{" "}
                    • Target Region: {activeOrg.dataRegion}.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <Lock className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">
                    Strict Tenant Isolation & Zero AI Training
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    Firestore Security Rules isolate every{" "}
                    <code className="text-[11px]">organisations/&#123;orgId&#125;</code>{" "}
                    tenant, enforce RBAC, and make audit logs append-only.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Immutable Audit Log */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-5 h-5 text-slate-700" />
              <h2 className="text-base font-bold text-slate-900">
                Immutable Compliance Audit Log
              </h2>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-indigo-900">
                      {log.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="text-slate-700">{log.details}</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Actor: {log.actorName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
