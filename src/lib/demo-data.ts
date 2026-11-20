import type {
  OrganisationSettings,
  OrgMember,
  PupilCase,
  PlainLanguageReport,
  AuditLogEntry,
} from "@/types";

/**
 * Sample projective pupil drawing ("My School Day") rendered as an SVG data URL
 * so the demo works immediately out-of-the-box for visual/drawing analysis.
 */
const SAMPLE_DRAWING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
  <rect width="640" height="420" fill="#FAF8F5"/>
  <!-- Heavy dark storm clouds with intense shading at the top -->
  <g stroke="#2C3E50" stroke-width="2.5" fill="#94A3B8" opacity="0.85">
    <ellipse cx="180" cy="70" rx="95" ry="38"/>
    <ellipse cx="300" cy="62" rx="115" ry="42"/>
    <ellipse cx="430" cy="74" rx="90" ry="34"/>
  </g>
  <!-- Dense diagonal shading lines under clouds -->
  <g stroke="#334155" stroke-width="1.8" opacity="0.7">
    <line x1="120" y1="95" x2="105" y2="145"/>
    <line x1="150" y1="98" x2="135" y2="152"/>
    <line x1="180" y1="100" x2="165" y2="150"/>
    <line x1="210" y1="98" x2="195" y2="148"/>
    <line x1="260" y1="98" x2="245" y2="155"/>
    <line x1="290" y1="100" x2="275" y2="158"/>
    <line x1="320" y1="100" x2="305" y2="154"/>
    <line x1="350" y1="98" x2="335" y2="150"/>
    <line x1="400" y1="98" x2="385" y2="142"/>
  </g>
  <!-- Small bright sun tucked in far right corner -->
  <circle cx="575" cy="65" r="24" fill="#FACC15" stroke="#CA8A04" stroke-width="2"/>
  <!-- Ground line -->
  <line x1="20" y1="350" x2="620" y2="350" stroke="#475569" stroke-width="3"/>
  <!-- Large imposing school building in the centre -->
  <rect x="210" y="175" width="230" height="175" fill="#CBD5E1" stroke="#1E293B" stroke-width="3"/>
  <polygon points="195,175 325,115 455,175" fill="#64748B" stroke="#1E293B" stroke-width="3"/>
  <!-- Closed heavy door -->
  <rect x="300" y="275" width="50" height="75" fill="#475569" stroke="#0F172A" stroke-width="2.5"/>
  <!-- Dark windows -->
  <rect x="235" y="205" width="42" height="38" fill="#334155" stroke="#0F172A" stroke-width="2"/>
  <rect x="372" y="205" width="42" height="38" fill="#334155" stroke="#0F172A" stroke-width="2"/>
  <!-- Thick boundary wall / fence between pupil and school -->
  <g stroke="#1E293B" stroke-width="3">
    <line x1="155" y1="260" x2="155" y2="350"/>
    <line x1="175" y1="260" x2="175" y2="350"/>
    <line x1="145" y1="285" x2="185" y2="285"/>
    <line x1="145" y1="320" x2="185" y2="320"/>
  </g>
  <!-- Small isolated figure of the pupil on the far left edge, heavy pencil pressure -->
  <circle cx="82" cy="295" r="14" fill="none" stroke="#0F172A" stroke-width="3"/>
  <line x1="82" y1="309" x2="82" y2="335" stroke="#0F172A" stroke-width="3"/>
  <line x1="82" y1="316" x2="68" y2="328" stroke="#0F172A" stroke-width="2.5"/>
  <line x1="82" y1="316" x2="96" y2="328" stroke="#0F172A" stroke-width="2.5"/>
  <line x1="82" y1="335" x2="72" y2="350" stroke="#0F172A" stroke-width="2.5"/>
  <line x1="82" y1="335" x2="92" y2="350" stroke="#0F172A" stroke-width="2.5"/>
  <!-- Small green tree near the sun on the far right -->
  <rect x="540" y="295" width="14" height="55" fill="#78350F"/>
  <circle cx="547" cy="280" r="28" fill="#22C55E" stroke="#15803D" stroke-width="2"/>
  <text x="24" y="395" font-family="sans-serif" font-size="14" fill="#64748B">Pupil A (Year 5) — "My School Day" (anonymised sample drawing)</text>
</svg>`;

export const SAMPLE_DRAWING_DATA_URL = `data:image/svg+xml;base64,${
  typeof btoa !== "undefined"
    ? btoa(unescape(encodeURIComponent(SAMPLE_DRAWING_SVG)))
    : Buffer.from(SAMPLE_DRAWING_SVG, "utf-8").toString("base64")
}`;

export const DEMO_ORGANISATIONS: OrganisationSettings[] = [
  {
    id: "oakwood-mat",
    name: "Oakwood Multi-Academy Trust",
    shortCode: "OMAT",
    type: "Multi-Academy Trust (MAT)",
    accentColor: "#1F4D3A",
    logoText: "Oakwood MAT",
    reportFooter:
      "Confidential — Oakwood Multi-Academy Trust Educational Psychology Service. Processed under UK GDPR & Data Protection Act 2018.",
    customPromptNote:
      "Align recommendations with UK school pastoral support, SENCO collaboration, and graduated response (Assess-Plan-Do-Review).",
    dataRegion: "europe-west2 (London, UK)",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "camden-eps",
    name: "Camden Educational Psychology Service",
    shortCode: "CEPS",
    type: "Local Authority (LA)",
    accentColor: "#6E2A26",
    logoText: "Camden EPS",
    reportFooter:
      "Confidential — Camden Local Authority Educational Psychology Service. Retain in accordance with LA safeguarding and retention policy.",
    customPromptNote:
      "Highlight evidence relevant for Early Help, EHCP consultation, and multi-agency coordination with CAMHS where appropriate.",
    dataRegion: "europe-west2 (London, UK)",
    updatedAt: new Date().toISOString(),
  },
];

export const DEMO_MEMBER: OrgMember = {
  uid: "demo-ep-001",
  email: "e.clarke@oakwoodmat.org.uk",
  displayName: "Dr Eleanor Clarke",
  role: "admin",
  title: "Senior Educational Psychologist (HCPC Registered)",
};

export const DEMO_CASES: PupilCase[] = [
  {
    id: "case-year5-pupil-a",
    orgId: "oakwood-mat",
    pupilAlias: "Pupil A",
    yearGroup: "Year 5 (Age 9)",
    title: "Classroom withdrawal, reading avoidance & morning transition distress",
    summary:
      "Pupil A has recently begun refusing to enter the classroom after morning drop-off and shuts down during whole-class reading. Teacher notes describe quiet compliance followed by sudden tearfulness. I feel stuck because every time I try to explore their feelings verbally, they become completely silent.",
    status: "in_analysis",
    createdBy: DEMO_MEMBER.uid,
    createdByName: DEMO_MEMBER.displayName,
    attachments: [
      {
        id: "att-drawing-1",
        name: "pupil-a-my-school-day-drawing.svg",
        mimeType: "image/svg+xml",
        size: 2480,
        kind: "image",
        previewUrl: SAMPLE_DRAWING_DATA_URL,
      },
      {
        id: "att-notes-1",
        name: "class-teacher-observation-notes.txt",
        mimeType: "text/plain",
        size: 640,
        kind: "text",
        textContent:
          "Teacher Observation (Year 5): Pupil A is bright and articulate in 1:1 Lego club and loves drawing nature. However, during Literacy and morning registration they freeze, stare at the desk, and ask to go to the medical room. Attendance has dropped to 84% this half-term. Parents report tummy aches every Sunday evening.",
      },
    ],
    messages: [
      {
        id: "msg-init-1",
        role: "user",
        content:
          "Pupil A (Year 5, age 9) was referred by the SENCO due to escalating morning transition distress and shutting down during whole-class reading. In our first two sessions, Pupil A barely spoke when I asked direct questions about school, which left me feeling ineffective and worried I was pushing too hard. They did, however, willingly draw a picture titled 'My School Day'. I have also attached the class teacher's observation notes.",
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        attachmentNames: [
          "pupil-a-my-school-day-drawing.svg",
          "class-teacher-observation-notes.txt",
        ],
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "case-year9-pupil-b",
    orgId: "oakwood-mat",
    pupilAlias: "Pupil B",
    yearGroup: "Year 9 (Age 13)",
    title: "Emotional dysregulation after peer conflict & declining attendance",
    summary:
      "Pupil B has had three sudden walk-outs from Maths and Science over the past two weeks following subtle peer teasing. Pastoral lead reports strong creative writing skills but growing distrust of adults. Looking for supervision on balancing rapport-building with school pressure for quick behavioural fixes.",
    status: "report_ready",
    createdBy: DEMO_MEMBER.uid,
    createdByName: DEMO_MEMBER.displayName,
    attachments: [
      {
        id: "att-notes-2",
        name: "pastoral-summary-pupil-b.txt",
        mimeType: "text/plain",
        size: 510,
        kind: "text",
        textContent:
          "Pastoral Summary (Year 9): Attendance 79%. Excels in English and Art. Walk-outs happen exclusively in noisy double lessons when seated near the back. Responds well to calm, brief check-ins with the Head of Year.",
      },
    ],
    messages: [
      {
        id: "msg-b-1",
        role: "user",
        content:
          "Pupil B (Year 9) has had three classroom walk-outs in Maths and Science. Staff are pushing for a behavioural contract, while I believe the walk-outs are protective responses to sensory overload and peer humiliation. I feel caught between advocating for the pupil and meeting senior leadership's expectations.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        attachmentNames: ["pastoral-summary-pupil-b.txt"],
      },
    ],
    latestSupervision: {
      fileAnalysisNotes:
        "Pastoral notes confirm a clear contextual pattern: walk-outs occur specifically in noisy double lessons with peer exposure, contrasting sharply with Pupil B's strong engagement in English, Art, and calm 1:1 adult check-ins.",
      step1Questions: [
        "What happens in the 2–3 minutes immediately before Pupil B leaves Maths or Science, and what sensory or social cues are present?",
        "How does Pupil B describe the difference between English/Art and the lessons where they feel unsafe?",
        "Who in school does Pupil B currently trust enough to use as a brief safe-base check-in?",
        "What specific pressures is senior leadership expressing, and what shared goal can you align on with them?",
        "Have parents or carers noticed similar overwhelm or fatigue at home after school?",
      ],
      step2StrengthsAndSupport:
        "You have shown strong clinical integrity and systemic awareness by looking beyond surface behaviour to recognise the protective function of Pupil B's walk-outs. Feeling caught between a young person's emotional safety and institutional pressure for quick behavioural compliance is a very real and exhausting tension in school psychology—your instinct to slow down and advocate thoughtfully is a genuine professional strength.",
      step3Hypotheses:
        "Pupil B's walk-outs appear to be an adaptive flight response to acute social-evaluative threat combined with auditory/sensory overload in large, unstructured double lessons. Your own sense of being 'caught in the middle' likely mirrors the pupil's experience of feeling scrutinised and misunderstood by the wider system.",
      step4Recommendations:
        "Co-create a discreet 'Exit & Reset Pass' with Pupil B and the Head of Year so leaving is planned rather than punitive, paired with preferential seating near the exit in Maths and Science. Hold a brief 15-minute reframing consultation with the SENCO and senior lead using attendance and lesson-pattern data to shift from a punitive contract to a graduated support plan. Consider screening for underlying sensory processing or social anxiety needs.",
      referralsNeeded: [
        "SENCO (Graduated Response & Classroom Adjustments)",
        "School Pastoral Lead / Head of Year",
        "Consider CAMHS / Mental Health Support Team (MHST) if anxiety persists",
      ],
      rawText: "",
      analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
  },
];

export const DEMO_REPORTS: PlainLanguageReport[] = [
  {
    id: "rep-pupil-b-teacher",
    orgId: "oakwood-mat",
    caseId: "case-year9-pupil-b",
    pupilAlias: "Pupil B",
    yearGroup: "Year 9 (Age 13)",
    audience: "teacher",
    title: "Classroom Support Summary — Pupil B (Year 9)",
    plainSummary:
      "Pupil B is a capable, creative student who thrives in English and Art and responds positively to calm adult check-ins. Recent lesson walk-outs happen mainly during noisy double lessons when peer tension feels overwhelming, rather than out of defiance. Simple, predictable classroom adjustments can quickly help Pupil B feel safe and stay engaged.",
    keyTakeaways: [
      "Strong engagement in creative subjects and 1:1 calm conversations.",
      "Walk-outs are linked to noisy double lessons and peer teasing near the back of the room.",
      "A pre-agreed Reset Pass reduces escalation much more effectively than punitive sanctions.",
      "Consistent low-key check-ins with a trusted adult rebuild school trust.",
    ],
    sections: [
      {
        heading: "What Is Going Well",
        body: "Pupil B demonstrates strong creative writing skills, enjoys Art, and engages respectfully during quiet, brief check-ins with their Head of Year.",
      },
      {
        heading: "What Triggers Difficulty",
        body: "Extended noisy lessons (Maths and Science double periods) combined with seating near peers who tease create high stress, leading Pupil B to leave the room to regain calm.",
      },
      {
        heading: "Recommended Classroom Adjustments",
        body: "Seat Pupil B near the front or aisle with a supportive peer, introduce a discreet 5-minute Reset Pass to a designated quiet space, and avoid public questioning during moments of visible distress.",
      },
    ],
    nextSteps: [
      "Agree seating plan and discreet Reset Pass with Pupil B and Maths/Science teachers this week.",
      "Schedule two 5-minute check-ins per week with Head of Year.",
      "Review attendance and lesson engagement with SENCO in 4 weeks.",
    ],
    createdBy: DEMO_MEMBER.uid,
    createdByName: DEMO_MEMBER.displayName,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
  },
];

export const DEMO_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "log-1",
    orgId: "oakwood-mat",
    actorUid: DEMO_MEMBER.uid,
    actorName: DEMO_MEMBER.displayName,
    action: "REPORT_GENERATED",
    targetType: "report",
    targetId: "rep-pupil-b-teacher",
    details: "Generated Teacher / SENCO plain-language summary for Pupil B",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
  },
  {
    id: "log-2",
    orgId: "oakwood-mat",
    actorUid: DEMO_MEMBER.uid,
    actorName: DEMO_MEMBER.displayName,
    action: "CASE_ANALYSED",
    targetType: "case",
    targetId: "case-year9-pupil-b",
    details: "Completed 4-step clinical supervision analysis for Pupil B",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
  },
  {
    id: "log-3",
    orgId: "oakwood-mat",
    actorUid: DEMO_MEMBER.uid,
    actorName: DEMO_MEMBER.displayName,
    action: "FILE_UPLOADED",
    targetType: "case",
    targetId: "case-year5-pupil-a",
    details:
      "Uploaded anonymised drawing and teacher observation notes for Pupil A",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
];
