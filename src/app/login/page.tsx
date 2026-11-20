"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const { signInDemo, signInWithEmail, signUpWithEmail } = useApp();

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
        await signUpWithEmail(email, password, displayName || "Educational Psychologist");
      }
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("auth/invalid-credential") || msg.includes("auth/wrong-password")) {
        setError("That email and password don't match an account.");
      } else if (msg.includes("auth/email-already-in-use")) {
        setError("An account with this email already exists. Try signing in.");
      } else if (msg.includes("auth/operation-not-allowed") || msg.includes("auth/configuration-not-found")) {
        setError("Email sign-in isn't enabled for this organisation yet.");
      } else {
        setError("We couldn't sign you in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex flex-col px-6 sm:px-12 py-8">
        <Link href="/" className="self-start">
          <Logo />
        </Link>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-[380px] py-14">
            <h1 className="display text-[36px] mb-2">
              {mode === "signin" ? "Sign in" : "Create your account"}
            </h1>
            <p className="text-[14.5px] text-ink-2 mb-9">
              {mode === "signin"
                ? "Use the email your organisation registered you with."
                : "You'll be added to your organisation's workspace."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === "signup" && (
                <div>
                  <label htmlFor="name" className="block text-[13px] font-medium text-ink mb-1.5">
                    Full name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Dr Sarah Patel"
                    className="field"
                    autoComplete="name"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-[13px] font-medium text-ink mb-1.5">
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@trust.org.uk"
                  className="field"
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <label htmlFor="password" className="block text-[13px] font-medium text-ink">
                    Password
                  </label>
                  {mode === "signup" && (
                    <span className="text-[12px] text-ink-3">At least 6 characters</span>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
              </div>

              {error && (
                <p className="text-[13px] text-brick bg-brick-bg border border-[#ecc9bf] rounded-[3px] px-3 py-2">
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary w-full h-10">
                {loading ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-[13.5px] text-ink-2">
              {mode === "signin" ? "New here? " : "Already registered? "}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode(mode === "signin" ? "signup" : "signin");
                }}
                className="link cursor-pointer"
              >
                {mode === "signin" ? "Create an account" : "Sign in instead"}
              </button>
            </p>

            <div className="mt-12 pt-6 border-t border-rule">
              <p className="text-[13.5px] text-ink-2 mb-3">
                Just looking? The demo workspace has sample cases ready to open.
              </p>
              <button type="button" onClick={handleDemo} className="btn btn-outline">
                Open the demo workspace
                <ArrowRight className="w-4 h-4" strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </div>

        <p className="text-[12px] text-ink-3">
          Hosted in London · Each organisation&apos;s data is held separately
        </p>
      </div>

      {/* Right: quiet editorial panel */}
      <aside className="hidden lg:flex flex-col justify-between bg-surface border-l border-rule p-14">
        <span className="eyebrow">From a supervision note</span>
        <blockquote className="max-w-[460px]">
          <p className="font-serif text-[30px] leading-[1.3] text-ink">
            “The pupil&apos;s silence is best understood as a protective freeze
            rather than reluctance to engage with you.”
          </p>
          <footer className="mt-6 text-[13.5px] text-ink-3">
            Step 03 · Working hypothesis · Year 5 case
          </footer>
        </blockquote>
        <div className="grid grid-cols-4 gap-px bg-rule border border-rule">
          {["Questions", "Strengths", "Hypothesis", "Next steps"].map((s, i) => (
            <div key={s} className={`px-3 py-3 ${i === 2 ? "bg-sheet" : "bg-surface"}`}>
              <span className="font-mono text-[11px] text-ink-3">0{i + 1}</span>
              <span className={`block text-[12.5px] mt-1 ${i === 2 ? "text-ink" : "text-ink-3"}`}>
                {s}
              </span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
