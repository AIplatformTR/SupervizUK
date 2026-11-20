import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { buildReportSystemPrompt } from "@/lib/prompts";
import type { ReportAudience, SupervisionSteps, ReportSection } from "@/types";

export const maxDuration = 60;

interface ReportRequestBody {
  pupilAlias: string;
  yearGroup: string;
  caseTitle: string;
  caseSummary: string;
  supervision: SupervisionSteps;
  audience: ReportAudience;
  organisationName: string;
  language?: "en" | "ru";
}

interface GeneratedReportPayload {
  title: string;
  plainSummary: string;
  keyTakeaways: string[];
  sections: ReportSection[];
  nextSteps: string[];
}

function buildFallbackReport(body: ReportRequestBody): GeneratedReportPayload {
  const { pupilAlias, yearGroup, audience, supervision, language = "en" } = body;

  if (language === "ru") {
    const titles: Record<ReportAudience, string> = {
      parent: `Понятный отчет для родителей — ${pupilAlias} (${yearGroup})`,
      teacher: `План поддержки в классе для учителя и SENCO — ${pupilAlias} (${yearGroup})`,
      supervision: `Портфолио супервизии кейса — ${pupilAlias} (${yearGroup})`,
    };
    return {
      title: titles[audience],
      plainSummary: `${pupilAlias} обладает заметными сильными сторонами в спокойной индивидуальной работе и творчестве. Текущие трудности связаны не с нежеланием учиться, а с высоким уровнем тревоги при переходе в класс и публичных заданиях. При мягких предсказуемых шагах поддержки ребенок сможет постепенно вернуть чувство безопасности в школе.`,
      keyTakeaways: [
        "Сильные стороны: способность к глубокому контакту в спокойной обстановке и творческому самовыражению.",
        "Главная причина трудностей: тревога оценивания и перегрузка в начале учебного дня.",
        "Поддерживающий невербальный подход работает гораздо эффективнее прямых вопросов.",
        "Согласованные действия школы и семьи снижают напряжение в первые 2–4 недели.",
      ],
      sections: [
        {
          heading: "Что мы заметили в ходе анализа",
          body: supervision.step3Hypotheses,
        },
        {
          heading: "Как мы можем поддержать ребенка",
          body: supervision.step4Recommendations,
        },
      ],
      nextSteps: [
        "Внедрить спокойный утренний ритуал входа в школу с доверенным взрослым.",
        "Снять нагрузку публичного чтения вслух на ближайшие 3–4 недели.",
        "Провести повторный обзор прогресса с участием семьи и SENCO через 4 недели.",
      ],
    };
  }

  if (audience === "parent") {
    return {
      title: `Parent & Carer Plain-Language Summary — ${pupilAlias} (${yearGroup})`,
      plainSummary: `${pupilAlias} is a thoughtful, creative young person who thrives in calm one-to-one spaces and expressive activities. Recent worries around entering school and whole-class reading are signs of anxiety and overwhelm—not stubbornness or lack of ability. With gentle, predictable support at home and in school, ${pupilAlias} can steadily rebuild confidence.`,
      keyTakeaways: [
        `${pupilAlias} shows real warmth and curiosity when feeling safe and unhurried.`,
        "Going quiet or asking to leave class is a protective response to feeling overwhelmed.",
        "Removing the pressure of reading aloud in front of the class can quickly lower daily stress.",
        "Small, calm morning routines shared between home and school make transitions much easier.",
      ],
      sections: [
        {
          heading: "Your Child's Strengths",
          body: `In calm, low-pressure settings, ${pupilAlias} engages well, enjoys creative expression, and shows strong potential. Building on these islands of safety is the foundation of our support plan.`,
        },
        {
          heading: "Understanding What Feels Hard Right Now",
          body: `Morning arrivals and whole-class reading currently trigger strong feelings of worry—which can even show up physically as Sunday evening tummy aches. When feelings get too big, ${pupilAlias} naturally goes quiet to stay safe.`,
        },
        {
          heading: "How We Can Help Together",
          body: "We are working closely with school staff to arrange a friendly, quieter morning welcome and pause whole-class reading aloud for now. At home, keeping Sunday evenings calm, validating worries without rushing to fix them, and celebrating small brave steps will make a meaningful difference.",
        },
      ],
      nextSteps: [
        "Agree a calm morning meet-and-greet point with the class teacher and SENCO.",
        "Use a gentle evening wind-down routine on Sundays with no school-work pressure.",
        "Check in together in 3 weeks to review what is helping most.",
      ],
    };
  }

  if (audience === "teacher") {
    return {
      title: `Classroom & SENCO Action Plan — ${pupilAlias} (${yearGroup})`,
      plainSummary: `${pupilAlias} engages positively in structured 1:1 and creative tasks but experiences acute anxiety during morning transitions and whole-class reading. Predictable, low-demand reasonable adjustments will help reduce avoidance, protect attendance, and rebuild classroom confidence.`,
      keyTakeaways: [
        "Silence and medical-room requests reflect an anxiety freeze response rather than disengagement.",
        "Immediate relief from public reading aloud removes a major classroom trigger.",
        "A predictable 5-minute morning check-in with a trusted adult eases handover distress.",
        "Regular home-school communication prevents Sunday-evening escalation.",
      ],
      sections: [
        {
          heading: "Observed Pattern & Triggers",
          body: supervision.step3Hypotheses,
        },
        {
          heading: "Classroom Reasonable Adjustments",
          body: supervision.step4Recommendations,
        },
        {
          heading: "Allied Support & Monitoring",
          body:
            supervision.referralsNeeded.length > 0
              ? `Recommended liaison: ${supervision.referralsNeeded.join("; ")}.`
              : "Monitor weekly attendance and emotional check-in scores with the SENCO.",
        },
      ],
      nextSteps: [
        "Implement quiet morning meet-and-greet and discreet 'Calm Card' this week.",
        "Pause whole-class reading aloud; offer paired or 1:1 reading check-ins instead.",
        "Review attendance and engagement with SENCO and parents in 4 weeks.",
      ],
    };
  }

  return {
    title: `Clinical Supervision Case Portfolio — ${pupilAlias} (${yearGroup})`,
    plainSummary: `Structured supervision portfolio summarising clinical formulation, reflective insights, and graduated intervention steps for ${pupilAlias} (${yearGroup}).`,
    keyTakeaways: [
      "4-step clinical supervision completed including review of attached case artefacts.",
      "Working formulation centres on anxiety-driven school avoidance and performance overwhelm.",
      "Psychologist positioned to shift from direct verbal questioning to creative/relational engagement.",
      "Multi-agency liaison with SENCO, family, and pastoral team prioritised.",
    ],
    sections: [
      {
        heading: "1. Clinical Formulation & Hypotheses",
        body: supervision.step3Hypotheses,
      },
      {
        heading: "2. Practitioner Strengths & Reflective Process",
        body: supervision.step2StrengthsAndSupport,
      },
      {
        heading: "3. Intervention Plan & Specialist Referrals",
        body: `${supervision.step4Recommendations}${
          supervision.referralsNeeded.length > 0
            ? `\n\nSuggested referrals / liaison: ${supervision.referralsNeeded.join(", ")}.`
            : ""
        }`,
      },
    ],
    nextSteps: [
      "Explore key reflective questions in next 1:1 creative session.",
      "Share plain-language summaries with SENCO and parents/carers.",
      "Schedule 4-week review and re-evaluate need for external referral.",
    ],
  };
}

function parseJson(raw: string): GeneratedReportPayload | null {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as GeneratedReportPayload;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as GeneratedReportPayload;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReportRequestBody;
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.SupervizUK ||
      process.env.SUPERVIZUK;
    const language = body.language || "en";

    if (!apiKey) {
      return NextResponse.json({
        mode: "demo",
        report: buildFallbackReport(body),
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = buildReportSystemPrompt(
      body.audience,
      body.organisationName,
      language
    );

    const userPrompt = `Pupil Alias: ${body.pupilAlias} (${body.yearGroup})
Case Title: ${body.caseTitle}
Case Summary: ${body.caseSummary}

Completed 4-Step Supervision Analysis:
- File Analysis: ${body.supervision.fileAnalysisNotes || "None"}
- Step 1 Questions: ${body.supervision.step1Questions.join(" | ")}
- Step 2 Strengths & Support: ${body.supervision.step2StrengthsAndSupport}
- Step 3 Hypotheses: ${body.supervision.step3Hypotheses}
- Step 4 Recommendations: ${body.supervision.step4Recommendations}
- Referrals: ${body.supervision.referralsNeeded.join(", ") || "None specified"}`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction,
        temperature: 0.35,
      },
    });

    const parsed = parseJson(response.text || "");
    if (!parsed || !parsed.plainSummary) {
      return NextResponse.json({
        mode: "live-fallback",
        report: buildFallbackReport(body),
      });
    }

    return NextResponse.json({
      mode: "live",
      report: parsed,
    });
  } catch (error) {
    console.error("Report API error:", error);
    return NextResponse.json(
      { error: "Unable to generate report right now." },
      { status: 500 }
    );
  }
}
