# SupervizAI — UK Educational Psychology Clinical Supervision Demo

A Next.js (App Router) + Firebase platform built for UK School & Educational Psychologists, Multi-Academy Trusts (MATs), and Local Authorities.

## Core Capabilities

1. **4-Step Multimodal Case Supervision (`/cases/[id]`)**
   - Supports text notes, PDF documents, pupil projective drawings/images (analysed for central element, emotional state, symbols, composition, colours, and shading intensity), and audio recordings.
   - Structured 4-step supervisor framework:
     1. 5 reflective/clarifying questions (incorporating attached files)
     2. Practitioner strengths & supportive validation
     3. Clinical hypotheses & exploration of difficulties
     4. Actionable recommendations & allied specialist referrals (SENCO, CAMHS, GP, etc.)
   - Client-side PII Redaction helper (`Pupil Alias`) before sending text to AI.

2. **Plain-Language Portfolios & Branded PDF Reports**
   - Generates accessible, jargon-free summaries tailored to **Parents / Carers**, **Teachers / SENCOs**, or **Clinical Supervision Records**.
   - Inline editing and one-click branded PDF export.

3. **Confidential Firebase Storage & Organisation Adaptability (`/settings`)**
   - Multi-tenant Firestore data model (`organisations/{orgId}/cases`, `reports`, `auditLogs`) protected by `firestore.rules` and `storage.rules`.
   - White-label branding (organisation name, type, accent colour, report confidentiality footer, and organisation-specific supervision guidance).
   - Immutable UK GDPR compliance audit log.

---

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Zero-config Demo Mode**: Even before filling in `.env.local`, clicking **Launch Live Demo** lets you walk through the entire UK demo with pre-loaded cases, a sample projective pupil drawing, 4-step supervision, plain-language reports, branded PDF export, and white-label settings.

---

## Connecting Firebase Project `Superviz`

1. Open [Firebase Console](https://console.firebase.google.com/) → select project **Superviz**.
2. Enable **Authentication** (Email/Password), **Cloud Firestore** (recommended region: `europe-west2` London), and **Storage**.
3. Go to **Project Settings → General → Your apps → Web app** and copy the config values into `.env.local` (and into **Vercel → Project Settings → Environment Variables**).
4. Deploy the security rules:
   ```bash
   npx firebase-tools@latest login
   npx firebase-tools@latest use <your-superviz-project-id>
   npx firebase-tools@latest deploy --only firestore:rules,storage
   ```

---

## Deploying to Vercel

1. Push this `superviz-uk` directory to your new GitHub repository:
   ```bash
   git add .
   git commit -m "Initial SupervizAI UK Education demo"
   git remote add origin https://github.com/<your-org>/<new-repo>.git
   git push -u origin main
   ```
2. Import the repository in [Vercel](https://vercel.com/new).
3. Add environment variables from `.env.example` (`GEMINI_API_KEY` + `NEXT_PUBLIC_FIREBASE_*`).
4. Click **Deploy**.
