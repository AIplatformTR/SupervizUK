"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ChevronDown } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Logo } from "@/components/Logo";

function initials(name: string) {
  return name
    .replace(/^(Dr|Mr|Mrs|Ms|Miss)\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    activeOrg,
    organisations,
    switchOrganisation,
    firebaseReady,
    isDemoSession,
    language,
    setLanguage,
    signOut,
  } = useApp();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const nav = [
    { href: "/dashboard", label: "Cases", match: ["/dashboard", "/cases"] },
    { href: "/settings", label: "Organisation", match: ["/settings"] },
  ];

  const cloudSynced = firebaseReady && !isDemoSession;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur-sm border-b border-rule">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 h-[60px] flex items-center justify-between gap-6">
          <div className="flex items-center gap-8 min-w-0">
            <Link href="/dashboard" className="shrink-0">
              <Logo accent={activeOrg.accentColor} size="sm" />
            </Link>

            <nav className="hidden md:flex items-center gap-6 h-[60px]">
              {nav.map((item) => {
                const active = item.match.some((m) => pathname.startsWith(m));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative h-full inline-flex items-center text-[14px] transition-colors ${
                      active ? "text-ink" : "text-ink-3 hover:text-ink"
                    }`}
                  >
                    {item.label}
                    {active && (
                      <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-ink" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-5">
            {/* Organisation */}
            <label className="hidden lg:flex items-center gap-1.5 text-[13px] text-ink-2 cursor-pointer">
              <span className="relative">
                <select
                  aria-label="Organisation"
                  value={activeOrg.id}
                  onChange={(e) => switchOrganisation(e.target.value)}
                  className="select-plain bg-transparent pr-5 focus:outline-none cursor-pointer"
                >
                  {organisations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-ink-3" />
              </span>
            </label>

            {/* Output language */}
            <div
              className="hidden sm:flex items-center font-mono text-[11px] border border-rule-strong rounded-[3px] overflow-hidden"
              title="Language used for supervision notes and reports"
            >
              {(["en", "ru"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={`px-2 py-1 uppercase tracking-wider cursor-pointer transition-colors ${
                    language === l
                      ? "bg-ink text-paper"
                      : "text-ink-3 hover:text-ink"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Storage status */}
            <span
              className="hidden md:inline-flex items-center gap-1.5 text-[12px] text-ink-3"
              title={
                cloudSynced
                  ? "Stored in Firestore (europe-west2)"
                  : "Demo session — data is kept in this browser only"
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  cloudSynced ? "bg-moss" : "bg-ochre"
                }`}
              />
              {cloudSynced ? "Synced" : "Demo session"}
            </span>

            {user && (
              <div className="flex items-center gap-2 pl-5 border-l border-rule">
                <span
                  className="w-7 h-7 rounded-full bg-surface border border-rule-strong inline-flex items-center justify-center text-[11px] font-medium text-ink-2"
                  title={`${user.displayName} · ${user.title || ""}`}
                >
                  {initials(user.displayName)}
                </span>
                <span className="hidden xl:block text-[13px] text-ink-2">
                  {user.displayName}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="btn btn-ghost h-8 px-2"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-[15px] h-[15px]" strokeWidth={1.6} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1180px] mx-auto px-5 sm:px-8 py-10">
        {children}
      </main>

      <footer className="border-t border-rule">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-5 flex flex-wrap items-center justify-between gap-3 text-[12px] text-ink-3">
          <span>{activeOrg.name}</span>
          <span className="font-mono text-[11px]">
            Data region · {activeOrg.dataRegion}
          </span>
        </div>
      </footer>
    </div>
  );
}
