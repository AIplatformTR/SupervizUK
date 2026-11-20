"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Brain,
  FileText,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Lock,
  Building2,
  Image as ImageIcon,
  Mic,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";

export default function LandingPage() {
  const router = useRouter();
  const { signInDemo } = useApp();

  const handleLaunchDemo = () => {
    signInDemo();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-900 flex items-center justify-center text-white shadow-sm">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900">
                SupervizAI
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-100">
                UK Education
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Sign in
            </Link>
            <button
              type="button"
              onClick={handleLaunchDemo}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-900 text-white text-sm font-semibold hover:bg-indigo-800 transition-colors shadow-sm cursor-pointer"
            >
              Launch Live Demo
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-6">
            <ShieldCheck className="w-4 h-4" />
            Built for UK School & Educational Psychologists • UK GDPR Ready
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6">
            Reflective AI supervision &{" "}
            <span className="text-indigo-900">plain-language portfolios</span>{" "}
            for pupil cases
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-10">
            Analyse pupil cases across notes, PDFs, projective drawings, and
            audio recordings in a structured 4-step supervision framework—then
            turn insights into clear, jargon-free reports stored confidentially
            for your school, MAT, or Local Authority.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleLaunchDemo}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-900 text-white font-semibold text-base hover:bg-indigo-800 transition-colors shadow-md cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              Explore Interactive UK Demo
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-slate-800 font-semibold text-base border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              Organisation Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Core Capabilities */}
      <section className="py-16 px-4 sm:px-6 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              Three core pillars designed for educational psychology practice
            </h2>
            <p className="text-slate-600">
              Every step respects clinical sensitivity, pupil confidentiality,
              and clear communication with families and school teams.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/60 flex flex-col">
              <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-900 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                1. 4-Step Multimodal Case Analysis
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4 flex-1">
                Upload case notes, PDFs, pupil drawings (analysed for central
                elements, symbolism, colour, composition & shading), or audio
                notes. Receive structured supervision:
              </p>
              <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0" />
                  5 reflective case questions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0" />
                  Practitioner strengths & emotional support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0" />
                  Clinical hypotheses & difficulty exploration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0" />
                  Practical actions & specialist referrals
                </li>
              </ul>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/60 flex flex-col">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                2. Plain-Language Portfolios & Reports
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4 flex-1">
                Transform completed supervision sessions into clear, editable
                portfolios written in accessible language—highlighting the main
                takeaways without clinical jargon.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  Parent / Carer plain-language summary
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  Class Teacher & SENCO action plan
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  Clinical supervision case portfolio
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  One-click branded PDF export
                </li>
              </ul>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/60 flex flex-col">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                3. Confidential Storage & Org Adaptability
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4 flex-1">
                Built on isolated multi-tenant Firebase storage with built-in
                PII anonymisation, immutable GDPR audit trails, and instant
                white-label customisation.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                  Pre-analysis PII redaction (Pupil Alias)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                  Strict per-organisation Firestore isolation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                  Custom branding, colours & report footers
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                  Full access & export audit log
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Multimodal Strip */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto rounded-2xl bg-indigo-950 text-white p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2">
              Ready to see a live UK pupil case analysed in 10 seconds?
            </h3>
            <p className="text-indigo-200 text-sm max-w-xl">
              Our demo workspace includes a pre-loaded Year 5 case complete with
              a pupil projective drawing and teacher observation notes.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-indigo-200">
              <span className="inline-flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Text & PDF Notes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" /> Pupil Drawings
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mic className="w-4 h-4" /> Audio Recordings
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLaunchDemo}
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-950 font-semibold hover:bg-indigo-50 transition-colors cursor-pointer"
          >
            Open Demo Vault
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <footer className="mt-auto py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        SupervizAI UK Education Demo • Designed for School & Educational
        Psychologists • UK GDPR & Data Protection Act 2018 Aligned
      </footer>
    </div>
  );
}
