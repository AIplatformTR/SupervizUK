"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Brain,
  FolderLock,
  Settings,
  ShieldCheck,
  LogOut,
  Building2,
  Globe,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";

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

  const navItems = [
    { href: "/dashboard", label: "Case Vault", icon: FolderLock },
    { href: "/settings", label: "Organisation & Privacy", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand + Active Org */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: activeOrg.accentColor }}
              >
                <Brain className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <div className="font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span>SupervizAI</span>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    UK Edu
                  </span>
                </div>
                <div className="text-xs text-slate-500 truncate max-w-[180px] sm:max-w-[240px]">
                  {activeOrg.name}
                </div>
              </div>
            </Link>

            {/* Primary Nav */}
            <nav className="hidden md:flex items-center gap-1 ml-4 pl-4 border-l border-slate-200">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            {/* Org Switcher for Live Demo */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1 text-xs text-slate-700">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <select
                aria-label="Switch organisation"
                value={activeOrg.id}
                onChange={(e) => switchOrganisation(e.target.value)}
                className="bg-transparent font-medium focus:outline-none cursor-pointer"
              >
                {organisations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.logoText}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Output Language Switch */}
            <button
              type="button"
              onClick={() => setLanguage(language === "en" ? "ru" : "en")}
              title="Toggle AI Supervision & Report Output Language"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>AI: {language === "en" ? "UK EN" : "RU"}</span>
            </button>

            {/* Storage Status Pill */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                firebaseReady && !isDemoSession
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
              title={
                firebaseReady && !isDemoSession
                  ? "Connected to Firebase Superviz (UK GDPR encrypted)"
                  : "Demo Vault Mode (connect Firebase keys in .env.local for live cloud sync)"
              }
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {firebaseReady && !isDemoSession
                  ? "Firebase: Superviz"
                  : "Demo Vault"}
              </span>
            </div>

            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="hidden sm:block text-right leading-tight">
                  <div className="text-xs font-semibold text-slate-800">
                    {user.displayName}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {user.role === "admin" ? "Senior EP / Admin" : "Psychologist"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
