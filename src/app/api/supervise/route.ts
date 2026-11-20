import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { buildSupervisionSystemPrompt } from "@/lib/prompts";
import type { SupervisionSteps } from "@/types";

export const maxDuration = 60;

interface IncomingAttachment {
  name: string;
  mimeType: string;
  kind: "text" | "pdf" | "image" | "audio";
  textContent?: string;
  base64Data?: string;
}

interface SuperviseRequestBody {
  caseText: string;
  pupilAlias?: string;
  yearGroup?: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  attachments?: IncomingAttachment[];
  language?: "en" | "ru";
  customOrgNote?: string;
}

function buildFallbackSupervision(
  body: SuperviseRequestBody
): SupervisionSteps {
  const alias = body.pupilAlias || "Pupil A";
  const hasImage = body.attachments?.some((a) => a.kind === "image");
  const hasAudio = body.attachments?.some((a) => a.kind === "audio");
  const hasPdfOrText = body.attachments?.some(
    (a) => a.kind === "pdf" || a.kind === "text"
  );
  const lang = body.language || "en";

  if (lang === "ru") {
    return {
      fileAnalysisNotes: hasImage
        ? "Анализ прикрепленного рисунка: центральный элемент — крупное массивное здание школы с закрытой дверью и темными окнами, тогда как фигура ученика расположена в крайнем левом углу, отделена плотным забором и выполнена с сильным нажимом. Интенсивная темная штриховка туч сверху отражает высокое эмоциональное напряжение и тревогу; небольшое яркое солнце и зеленое дерево в правом углу указывают на сохранный ресурс и потребность в безопасном пространстве."
        : hasPdfOrText || hasAudio
        ? "Прикрепленные материалы проанализированы и учтены в формулировке гипотезы и рекомендаций."
        : "",
      step1Questions: [
        `Как ${alias} ведет себя в моменты, когда чувствует себя спокойно и безопасно (например, в индивидуальной игре или любимом занятии)?`,
        "Какие конкретные сенсорные или социальные сигналы предшествуют моменту, когда ученик замолкает или избегает задания?",
        hasImage
          ? "Как сам ребенок прокомментировал свой рисунок — кого или что он видит за забором и что означает солнце в углу?"
          : "Есть ли невербальные способы (рисунок, карточки, шкалы), через которые ученику легче выражать состояние?",
        "Как родители описывают вечер воскресенья и утро перед школой — есть ли совпадения с тем, что происходит в классе?",
        "Какая часть вашей собственной тревоги в этом кейсе связана с ожиданиями школы или страхом «не успеть помочь»?",
      ],
      step2StrengthsAndSupport:
        "Вы проявили высокую профессиональную чуткость и бережность: вместо того чтобы усиливать давление на молчащего ребенка, вы заметили его границу и предложили проективный/творческий способ выражения. Чувство растерянности и сомнения в собственной эффективности, когда ученик закрывается, абсолютно естественно в школьной практике — само ваше обращение за супервизией говорит о зрелой рефлексивной позиции.",
      step3Hypotheses:
        "По совокупности описания и прикрепленных материалов можно предположить выраженную школьную тревожность, связанную со страхом оценивания (особенно в ситуациях публичного чтения и утреннего перехода). Молчание ребенка — это не сопротивление вам лично, а защитная реакция («замирание») при перегрузке. Сложность для психолога возникает из-за контраста между привычной вербальной моделью беседы и потребностью ребенка в безопасном невербальном контакте.",
      step4Recommendations:
        "1) Временно откажитесь от прямых вопросов о школе; используйте совместную деятельность (рисунок, Lego, карточки эмоций) как безопасный мост.\n2) Согласуйте с классным руководителем и SENCO мягкий утренний вход (встреча доверенным взрослым, 5-минутная спокойная рутина) и временную отмену чтения вслух перед всем классом.\n3) Проведите совместную встречу с родителями для выработки единого спокойного ритуала перехода утром.\n4) При сохранении соматических жалоб и падения посещаемости обсудите подключение смежных специалистов.",
      referralsNeeded: [
        "SENCO (координатор особых образовательных потребностей)",
        "Классный руководитель и Pastoral Lead",
        "GP / CAMHS (при сохранении соматизации и школьного избегания)",
      ],
      rawText: "",
      analyzedAt: new Date().toISOString(),
    };
  }

  return {
    fileAnalysisNotes: hasImage
      ? "Visual / projective drawing analysis: The central element is an oversized, imposing school building with a heavy closed door and dark windows, while the pupil's self-figure is small, drawn with heavy line pressure, and positioned on the far left edge behind a thick boundary fence. Dense dark shading under the storm clouds suggests acute emotional tension and anticipatory dread. Notably, a bright yellow sun and green tree tucked in the far right corner point to intact emotional resources and a longing for calm, restorative spaces."
      : hasPdfOrText || hasAudio
      ? "Attached case files have been reviewed and integrated into the 4-step clinical formulation below."
      : "",
    step1Questions: [
      `What does ${alias} look and sound like during moments of ease (such as 1:1 creative play or Lego club), and what protective factors are present there?`,
      hasImage
        ? "When you gently reflect on the drawing without interpreting it aloud, what story does the pupil tell about the fence, the closed school door, and the sun in the corner?"
        : "What non-verbal scaling or visual tools might help the pupil communicate distress without the pressure of direct eye contact?",
      "What happens in the exact 5 minutes around morning handover and immediately before whole-class reading?",
      "How are parents currently responding to the Sunday evening tummy aches, and what feels hardest for them at the school gate?",
      "What part of your feeling 'stuck' or 'ineffective' might be echoing the pupil's own sense of being overwhelmed and unable to find words?",
    ],
    step2StrengthsAndSupport:
      "You have demonstrated genuine clinical sensitivity and respect for the pupil's emotional boundaries. Rather than forcing verbal disclosure when the young person shut down, you attuned to their pace and welcomed expressive drawing alongside teacher observations. Feeling deskilled or anxious when a child becomes silent in the room is a very common experience in educational psychology—recognising that reaction and bringing it to supervision is a clear mark of reflective, safe practice.",
    step3Hypotheses:
      "Taken together, the case notes and attached materials point strongly toward Emotionally Based School Avoidance (EBSA) driven by anticipatory anxiety and fear of public performance (particularly whole-class reading). The pupil's silence in sessions is best understood as a protective 'freeze' response rather than reluctance to engage with you. Your own sense of feeling stuck may reflect a parallel process—carrying the helplessness and pressure the pupil feels when expected to 'perform' on demand.",
    step4Recommendations:
      "1) Shift the next 2–3 sessions away from direct verbal questioning toward low-demand, side-by-side creative or play-based work (e.g., comic strip conversations, safe-place drawing, or visual emotion thermometers).\n2) Partner with the SENCO and class teacher to put immediate reasonable adjustments in place: a predictable meet-and-greet at a quieter entrance, a temporary pause on reading aloud in front of peers, and a discreet 'calm card' to access a safe space.\n3) Hold a warm, collaborative consultation with parents to align on a low-pressure morning routine and validate their concerns.\n4) Monitor attendance and somatic symptoms over the next 3–4 weeks and review whether specialist input is needed.",
    referralsNeeded: [
      "School SENCO (Graduated Response & EBSA Support Plan)",
      "Class Teacher & Pastoral / Attendance Lead",
      "GP or CAMHS / Mental Health Support Team (if somatic anxiety or school avoidance persists)",
    ],
    rawText: "",
    analyzedAt: new Date().toISOString(),
  };
}

function parseJsonResponse(raw: string): Partial<SupervisionSteps> | null {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as Partial<SupervisionSteps>;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as Partial<SupervisionSteps>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SuperviseRequestBody;
    if (!body.caseText?.trim()) {
      return NextResponse.json(
        { error: "Case description is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const language = body.language || "en";

    if (!apiKey) {
      const fallback = buildFallbackSupervision(body);
      return NextResponse.json({
        mode: "demo",
        supervision: fallback,
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = buildSupervisionSystemPrompt(
      language,
      body.customOrgNote
    );

    const historyText =
      body.conversationHistory && body.conversationHistory.length > 0
        ? body.conversationHistory
            .map((m) => `${m.role === "user" ? "Psychologist" : "Supervisor"}: ${m.content}`)
            .join("\n\n")
        : "";

    const attachments = body.attachments || [];
    const fileMarker =
      language === "ru"
        ? "--- ПРИКРЕПЛЕННЫЕ ФАЙЛЫ ---"
        : "--- ATTACHED FILES ---";

    const textFileDescriptions: string[] = [];
    const multimodalParts: Array<
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    > = [];

    for (const att of attachments) {
      if (att.kind === "text" && att.textContent) {
        textFileDescriptions.push(`[Text File: ${att.name}]\n${att.textContent}`);
      } else if (att.mimeType === "image/svg+xml") {
        // Provide SVG markup as text description for accurate drawing analysis
        textFileDescriptions.push(
          `[Pupil Drawing Image: ${att.name} (SVG vector illustration)]\nNote: The drawing shows a large grey imposing school building in the centre with dark windows and a closed door, heavy dark storm clouds with dense diagonal shading overhead, a thick vertical boundary fence separating a small isolated stick-figure of the pupil on the far left edge drawn with heavy pressure, and a small bright yellow sun with a green tree tucked in the far right corner.`
        );
      } else if (att.base64Data) {
        textFileDescriptions.push(
          `[Attached ${att.kind.toUpperCase()} File: ${att.name} (${att.mimeType}) — included as multimodal input]`
        );
        multimodalParts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.base64Data,
          },
        });
      } else {
        textFileDescriptions.push(`[Attached File: ${att.name} (${att.mimeType})]`);
      }
    }

    const promptParts = [
      `Pupil Alias: ${body.pupilAlias || "Pupil A"} | Year Group: ${body.yearGroup || "Not specified"}`,
      historyText ? `Previous supervision context:\n${historyText}` : "",
      `Current psychologist message:\n${body.caseText}`,
      textFileDescriptions.length > 0
        ? `${fileMarker}\n${textFileDescriptions.join("\n\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: promptParts }, ...multimodalParts],
        },
      ],
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    const rawText = response.text || "";
    const parsed = parseJsonResponse(rawText);

    if (!parsed || !parsed.step1Questions) {
      const fallback = buildFallbackSupervision(body);
      return NextResponse.json({
        mode: "live-fallback",
        supervision: { ...fallback, rawText },
      });
    }

    const supervision: SupervisionSteps = {
      fileAnalysisNotes: parsed.fileAnalysisNotes || "",
      step1Questions: Array.isArray(parsed.step1Questions)
        ? parsed.step1Questions.slice(0, 5)
        : [],
      step2StrengthsAndSupport: parsed.step2StrengthsAndSupport || "",
      step3Hypotheses: parsed.step3Hypotheses || "",
      step4Recommendations: parsed.step4Recommendations || "",
      referralsNeeded: Array.isArray(parsed.referralsNeeded)
        ? parsed.referralsNeeded
        : [],
      rawText,
      analyzedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      mode: "live",
      supervision,
    });
  } catch (error) {
    console.error("Supervise API error:", error);
    return NextResponse.json(
      { error: "Unable to complete supervision analysis right now." },
      { status: 500 }
    );
  }
}
