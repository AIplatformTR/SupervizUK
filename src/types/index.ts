export type OrgType =
  | "Multi-Academy Trust (MAT)"
  | "Local Authority (LA)"
  | "Independent School"
  | "Educational Psychology Practice";

export interface OrganisationSettings {
  id: string;
  name: string;
  shortCode: string;
  type: OrgType;
  accentColor: string;
  logoText: string;
  logoUrl?: string;
  reportFooter: string;
  customPromptNote: string;
  dataRegion: string;
  updatedAt: string;
}

export type MemberRole = "admin" | "senior_ep" | "psychologist";

export interface OrgMember {
  uid: string;
  email: string;
  displayName: string;
  role: MemberRole;
  title?: string;
}

export interface CaseAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  kind: "text" | "pdf" | "image" | "audio";
  storagePath?: string;
  textContent?: string;
  base64Data?: string; // base64 payload without data: prefix for AI API
  previewUrl?: string; // data URL or Firebase download URL for UI preview
}

export interface SupervisionSteps {
  step1Questions: string[];
  step2StrengthsAndSupport: string;
  step3Hypotheses: string;
  step4Recommendations: string;
  referralsNeeded: string[];
  fileAnalysisNotes?: string;
  rawText: string;
  analyzedAt: string;
}

export interface CaseMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  attachmentNames?: string[];
  supervisionSteps?: SupervisionSteps;
}

export type CaseStatus = "in_analysis" | "report_ready" | "archived";

export interface PupilCase {
  id: string;
  orgId: string;
  pupilAlias: string;
  yearGroup: string;
  title: string;
  summary: string;
  status: CaseStatus;
  createdBy: string;
  createdByName: string;
  attachments: CaseAttachment[];
  messages: CaseMessage[];
  latestSupervision?: SupervisionSteps;
  createdAt: string;
  updatedAt: string;
}

export type ReportAudience = "parent" | "teacher" | "supervision";

export interface ReportSection {
  heading: string;
  body: string;
}

export interface PlainLanguageReport {
  id: string;
  orgId: string;
  caseId: string;
  pupilAlias: string;
  yearGroup: string;
  audience: ReportAudience;
  title: string;
  plainSummary: string;
  keyTakeaways: string[];
  sections: ReportSection[];
  nextSteps: string[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  orgId: string;
  actorUid: string;
  actorName: string;
  action:
    | "CASE_CREATED"
    | "CASE_ANALYSED"
    | "FILE_UPLOADED"
    | "PII_REDACTED"
    | "REPORT_GENERATED"
    | "REPORT_EXPORTED_PDF"
    | "ORG_SETTINGS_UPDATED";
  targetType: "case" | "report" | "organisation";
  targetId: string;
  details: string;
  createdAt: string;
}
