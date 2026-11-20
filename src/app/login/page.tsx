"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, Lock, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { useApp } from "@/components/AppProvider";

export default function LoginPage() {
  const router = useRouter();
  const { signInDemo, signInWithEmail, signUpWithEmail, firebaseReady } =
    useApp();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDemo = () => {
    signInDemo();
    router.push("/dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(
          email,
          password,
          displayName || "Educational Psychologist"
        );
      }
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Authentication failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-900 flex items-center justify-center text-white shadow-sm">
          <Brain className="w-6 h-6" />
        </div>
        <div className="leading-tight">
          <div className="font-bold text-xl text-slate-900">SupervizAI</div>
          <div className="text-xs text-slate-500">
            UK Educational Psychology Supervision
          </div>
        </div>
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-7">
        {/* Quick Demo Button */}
        <div className="mb-6 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900 mb-1">
            <Sparkles className="w-4 h-4" />
            Instant Presentation Mode
          </div>
          <p className="text-xs text-indigo-800/80 mb-3">
            Enter as <strong>Dr Eleanor Clarke</strong> (Oakwood MAT) with
            pre-loaded UK pupil cases and sample drawing.
          </p>
          <button
            type="button"
            onClick={handleDemo}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-900 text-white text-sm font-semibold hover:bg-indigo-800 transition-colors cursor-pointer"
          >
            Enter UK Demo Workspace
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="relative flex items-center justify-center my-5">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-wider shrink-0">
            or Firebase Auth ({firebaseReady ? "Connected" : "Config pending"})
          </span>
          <div className="border-t border-slate-200 w-full" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Dr Sarah Patel"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Organisation Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@schooltrust.org.uk"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            {loading
              ? "Please wait..."
              : mode === "signin"
              ? "Sign in with Firebase"
              : "Create Psychologist Account"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-slate-600">
          {mode === "signin" ? (
            <>
              New to your organisation&apos;s workspace?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="font-semibold text-indigo-800 hover:underline cursor-pointer"
              >
                Create account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="font-semibold text-indigo-800 hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        Confidential server-side storage in Firebase project &ldquo;Superviz&rdquo;
      </div>
    </div>
  );
}
