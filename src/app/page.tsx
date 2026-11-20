"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Logo } from "@/components/Logo";

const STEPS = [
  {
    n: "01",
    title: "Questions worth asking",
    body: "Five questions drawn from your notes and any attached material — the things a good supervisor would want to understand before offering a view.",
  },
  {
    n: "02",
    title: "What you are doing well",
    body: "An honest account of the professional judgement already visible in the case, and acknowledgement of how the work is landing on you.",
  },
  {
    n: "03",
    title: "A working hypothesis",
    body: "A formulation of what may be driving the pupil's difficulties — and, where relevant, what is making the case feel stuck for you.",
  },
  {
    n: "04",
    title: "Next steps and referrals",
    body: "Concrete options for you, the pupil and the family, with a clear note when SENCO, CAMHS, SaLT, OT or the DSL should be involved.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { signInDemo } = useApp();

  const openDemo = () => {
    signInDemo();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Masthead */}
      <header className="border-b border-rule">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 h-[64px] flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-2 sm:gap-6 text-[14px]">
            <a href="#how" className="hidden md:inline text-ink-2 hover:text-ink">
              How it works
            </a>
            <a href="#reports" className="hidden md:inline text-ink-2 hover:text-ink">
              Reports
            </a>
            <a href="#privacy" className="hidden md:inline text-ink-2 hover:text-ink">
              Data protection
            </a>
            <Link href="/login" className="btn btn-ghost">
              Sign in
            </Link>
            <button type="button" onClick={openDemo} className="btn btn-primary">
              Open the demo
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-[1180px] w-full mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-20 grid lg:grid-cols-12 gap-12 lg:gap-10 items-start">
        <div className="lg:col-span-6 lg:pt-6">
          <p className="eyebrow mb-6">For educational psychologists in UK schools</p>
          <h1 className="display text-[44px] sm:text-[58px] lg:text-[64px] text-ink">
            A second pair of eyes on{" "}
            <em className="text-accent">every&nbsp;case</em>.
          </h1>
          <p className="mt-7 text-[17px] leading-[1.65] text-ink-2 max-w-[520px]">
            Bring a pupil case — your notes, a teacher&apos;s observations, a
            drawing, a recorded reflection — and work through it in four
            structured steps. Then turn what you&apos;ve concluded into a report
            parents and teachers can actually read.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <button type="button" onClick={openDemo} className="btn btn-accent h-11 px-5 text-[15px]">
              Walk through a sample case
              <ArrowRight className="w-4 h-4" strokeWidth={1.8} />
            </button>
            <Link href="/login" className="btn btn-outline h-11 px-5 text-[15px]">
              Sign in to your organisation
            </Link>
          </div>

          <dl className="mt-14 grid grid-cols-3 max-w-[520px] border-t border-rule">
            {[
              ["4", "step supervision framework"],
              ["3", "report formats per case"],
              ["UK", "hosted, per-organisation storage"],
            ].map(([k, v]) => (
              <div key={v} className="pt-4 pr-4">
                <dt className="font-serif text-[28px] leading-none text-ink">{k}</dt>
                <dd className="mt-2 text-[12.5px] leading-snug text-ink-3">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Product preview: an actual supervision note, not an illustration */}
        <div className="lg:col-span-6">
          <div className="sheet rounded-[4px] relative">
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-rule">
              <span className="font-mono text-[11px] text-ink-3">
                PUPIL A · YEAR 5 · SUPERVISION NOTE
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11.5px] text-moss">
                <span className="w-1.5 h-1.5 rounded-full bg-moss" />
                Saved
              </span>
            </div>

            <div className="px-6 sm:px-8 py-7 space-y-7">
              <div className="grid grid-cols-[38px_1fr] gap-x-3">
                <span className="font-serif text-[22px] leading-none text-ink-3">01</span>
                <div>
                  <h3 className="font-serif text-[19px] leading-tight mb-2.5">
                    Questions worth asking
                  </h3>
                  <ol className="space-y-2 text-[14px] text-ink-2 leading-relaxed list-none">
                    <li>
                      — When you reflect the drawing back without interpreting
                      it, what does Pupil A say about the fence?
                    </li>
                    <li>
                      — What happens in the five minutes before whole-class
                      reading?
                    </li>
                    <li className="text-ink-3">— …three more</li>
                  </ol>
                </div>
              </div>

              <div className="grid grid-cols-[38px_1fr] gap-x-3">
                <span className="font-serif text-[22px] leading-none text-ink-3">02</span>
                <div>
                  <h3 className="font-serif text-[19px] leading-tight mb-2.5">
                    What you are doing well
                  </h3>
                  <p className="text-[14px] text-ink-2 leading-relaxed">
                    You noticed the silence was a boundary and changed approach
                    rather than pushing for disclosure. Feeling deskilled when a
                    child stops talking is common — bringing it here is good
                    practice.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-[38px_1fr] gap-x-3 opacity-60">
                <span className="font-serif text-[22px] leading-none text-ink-3">03</span>
                <div className="space-y-2 pt-1">
                  <div className="h-2 rounded-[1px] bg-rule w-[85%]" />
                  <div className="h-2 rounded-[1px] bg-rule w-[70%]" />
                </div>
              </div>
            </div>

            {/* marginal note */}
            <div className="hidden sm:block absolute right-5 lg:-right-6 -bottom-12 w-[230px] bg-ochre-bg border border-[#e8d6b4] px-4 py-3 rotate-[1.5deg] shadow-[0_8px_20px_-12px_rgba(26,25,21,0.35)]">
              <p className="eyebrow !text-ochre mb-1">On the drawing</p>
              <p className="text-[12.5px] leading-snug text-[#5b3d0c]">
                Small self-figure, far left, behind a heavy fence. Dense
                shading over the school; a sun kept in the far corner.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-rule bg-surface">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-20 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <p className="eyebrow mb-4">How a session runs</p>
            <h2 className="display text-[34px] sm:text-[40px]">
              The structure of good supervision, every time.
            </h2>
            <p className="mt-5 text-[15px] text-ink-2 leading-relaxed max-w-[360px]">
              Attach whatever you have. Typed notes and PDFs are read in full;
              drawings are considered for their central element, composition,
              colour, symbolism and line pressure; audio is transcribed first.
            </p>
          </div>

          <ol className="lg:col-span-8 grid sm:grid-cols-2 border-t border-l border-rule">
            {STEPS.map((s) => (
              <li key={s.n} className="border-r border-b border-rule p-7 bg-paper/40">
                <span className="font-mono text-[12px] text-ink-3">{s.n}</span>
                <h3 className="font-serif text-[22px] leading-tight mt-3 mb-3">
                  {s.title}
                </h3>
                <p className="text-[14.5px] text-ink-2 leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Reports */}
      <section id="reports" className="border-t border-rule">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-20">
          <div className="max-w-[640px] mb-12">
            <p className="eyebrow mb-4">After the analysis</p>
            <h2 className="display text-[34px] sm:text-[40px]">
              One case, written three ways.
            </h2>
            <p className="mt-5 text-[15px] text-ink-2 leading-relaxed">
              The same conclusions, rewritten for whoever needs to act on them.
              Every line is editable before it leaves your hands, and exports
              to PDF on your organisation&apos;s letterhead.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-rule border border-rule">
            {[
              {
                who: "Parents & carers",
                what: "Warm, plain English. Starts with the child's strengths, explains what's been noticed in everyday words, and suggests a few things to try at home.",
                sample: "“Going quiet is how she keeps herself safe when things feel too big.”",
              },
              {
                who: "Class teacher & SENCO",
                what: "Practical and specific. Triggers, reasonable adjustments, and steps that fit inside a normal school day, with a review point.",
                sample: "“Pause reading aloud for four weeks; offer paired reading instead.”",
              },
              {
                who: "Supervision record",
                what: "A structured professional summary — formulation, reflective points, agreed actions and referrals — for your own CPD and case file.",
                sample: "“Working formulation: anxiety-based school avoidance; review in four weeks.”",
              },
            ].map((r) => (
              <div key={r.who} className="bg-paper p-7 flex flex-col">
                <h3 className="font-serif text-[22px] mb-3">{r.who}</h3>
                <p className="text-[14.5px] text-ink-2 leading-relaxed flex-1">{r.what}</p>
                <p className="mt-6 pt-4 border-t border-rule font-serif italic text-[15px] text-ink-2">
                  {r.sample}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" className="border-t border-rule bg-ink text-paper">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-20 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <p className="eyebrow !text-[#a39d90] mb-4">Data protection</p>
            <h2 className="display text-[34px] sm:text-[40px]">
              Built for the way schools have to handle pupil data.
            </h2>
            <p className="mt-5 text-[15px] text-[#c9c3b6] leading-relaxed max-w-[420px]">
              Each organisation gets its own isolated workspace. Names and
              contact details are stripped before anything is analysed, and
              every access is written to an audit log that can&apos;t be edited.
            </p>
          </div>

          <dl className="lg:col-span-7 divide-y divide-[#36342e] border-y border-[#36342e]">
            {[
              ["Hosting", "Google Cloud, London (europe-west2)"],
              ["Isolation", "Separate data space per school, trust or local authority"],
              ["Identifiers", "Pupil aliases; names, postcodes, DOBs and phone numbers redacted"],
              ["Audit", "Append-only log of every case, report and export action"],
              ["Model training", "Processed on the paid Gemini API tier, which excludes use for model training"],
              ["Framework", "Designed around UK GDPR and the Data Protection Act 2018"],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[140px_1fr] gap-6 py-4">
                <dt className="font-mono text-[12px] uppercase tracking-wider text-[#a39d90] pt-0.5">
                  {k}
                </dt>
                <dd className="text-[15px] text-paper">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-rule">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h2 className="display text-[30px] sm:text-[36px] max-w-[560px]">
              See it on a real case before you decide.
            </h2>
            <p className="mt-3 text-[15px] text-ink-2">
              The demo opens on an anonymised Year 5 case with a drawing and
              teacher notes attached.
            </p>
          </div>
          <button type="button" onClick={openDemo} className="btn btn-primary h-11 px-5 text-[15px] self-start md:self-auto">
            Open the demo
            <ArrowUpRight className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
      </section>

      <footer className="border-t border-rule mt-auto">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-6 flex flex-wrap items-center justify-between gap-3 text-[12.5px] text-ink-3">
          <span>© {new Date().getFullYear()} Superviz</span>
          <span>Supervision support for practitioners. Not a substitute for clinical judgement.</span>
        </div>
      </footer>
    </div>
  );
}
