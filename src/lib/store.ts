import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { db, storage, isFirebaseConfigured, auth } from "@/lib/firebase";
import {
  DEMO_ORGANISATIONS,
  DEMO_CASES,
  DEMO_REPORTS,
  DEMO_AUDIT_LOGS,
  DEMO_MEMBER,
} from "@/lib/demo-data";
import type {
  OrganisationSettings,
  PupilCase,
  PlainLanguageReport,
  AuditLogEntry,
  CaseAttachment,
} from "@/types";

const LS_KEYS = {
  orgs: "superviz_uk_orgs_v2",
  activeOrgId: "superviz_uk_active_org_v2",
  cases: "superviz_uk_cases_v2",
  reports: "superviz_uk_reports_v2",
  auditLogs: "superviz_uk_audit_v2",
};

function isBrowser() {
  return typeof window !== "undefined";
}

function canUseFirestore(): boolean {
  return Boolean(isFirebaseConfigured && db && auth?.currentUser);
}

function readLS<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors in demo mode
  }
}

export async function bootstrapOrgMembership(org: OrganisationSettings) {
  if (!canUseFirestore() || !db || !auth?.currentUser) return;
  const user = auth.currentUser;
  try {
    await setDoc(
      doc(db, "organisations", org.id),
      { ...org, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    await setDoc(
      doc(db, "organisations", org.id, "members", user.uid),
      {
        uid: user.uid,
        email: user.email || DEMO_MEMBER.email,
        displayName: user.displayName || DEMO_MEMBER.displayName,
        role: "admin",
        joinedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Firebase bootstrap skipped:", err);
  }
}

export function getOrganisationsLocal(): OrganisationSettings[] {
  const existing = readLS<OrganisationSettings[]>(LS_KEYS.orgs, []);
  if (existing.length === 0) {
    writeLS(LS_KEYS.orgs, DEMO_ORGANISATIONS);
    return DEMO_ORGANISATIONS;
  }
  return existing;
}

export function getActiveOrgId(): string {
  return readLS<string>(LS_KEYS.activeOrgId, DEMO_ORGANISATIONS[0].id);
}

export function setActiveOrgId(orgId: string): void {
  writeLS(LS_KEYS.activeOrgId, orgId);
}

export async function saveOrganisationSettings(
  org: OrganisationSettings
): Promise<OrganisationSettings> {
  const updated: OrganisationSettings = {
    ...org,
    updatedAt: new Date().toISOString(),
  };
  const all = getOrganisationsLocal();
  const idx = all.findIndex((o) => o.id === updated.id);
  if (idx >= 0) {
    all[idx] = updated;
  } else {
    all.push(updated);
  }
  writeLS(LS_KEYS.orgs, all);

  if (canUseFirestore() && db) {
    try {
      await setDoc(doc(db, "organisations", updated.id), updated, {
        merge: true,
      });
    } catch (err) {
      console.warn("Firestore save org failed, kept local:", err);
    }
  }
  return updated;
}

export async function loadCases(orgId: string): Promise<PupilCase[]> {
  let local = readLS<PupilCase[]>(LS_KEYS.cases, []);
  if (local.length === 0) {
    writeLS(LS_KEYS.cases, DEMO_CASES);
    local = DEMO_CASES;
  }

  if (canUseFirestore() && db) {
    try {
      const snap = await getDocs(
        query(
          collection(db, "organisations", orgId, "cases"),
          orderBy("updatedAt", "desc")
        )
      );
      if (!snap.empty) {
        const remote = snap.docs.map((d) => d.data() as PupilCase);
        return remote;
      }
    } catch (err) {
      console.warn("Firestore loadCases fallback to local:", err);
    }
  }

  // Show org's cases (for demo convenience, also show oakwood-mat defaults if org has none yet)
  const filtered = local.filter((c) => c.orgId === orgId);
  return filtered.length > 0 ? filtered : local;
}

export async function saveCase(pupilCase: PupilCase): Promise<PupilCase> {
  const updated: PupilCase = {
    ...pupilCase,
    updatedAt: new Date().toISOString(),
  };

  // Strip raw base64Data before saving to Firestore/localStorage to stay lightweight
  const persistable: PupilCase = {
    ...updated,
    attachments: updated.attachments.map((att) => ({
      ...att,
      base64Data: undefined,
    })),
  };

  const all = readLS<PupilCase[]>(LS_KEYS.cases, DEMO_CASES);
  const idx = all.findIndex((c) => c.id === persistable.id);
  if (idx >= 0) {
    all[idx] = persistable;
  } else {
    all.unshift(persistable);
  }
  writeLS(LS_KEYS.cases, all);

  if (canUseFirestore() && db) {
    try {
      await setDoc(
        doc(db, "organisations", persistable.orgId, "cases", persistable.id),
        persistable,
        { merge: true }
      );
    } catch (err) {
      console.warn("Firestore saveCase failed, saved locally:", err);
    }
  }

  return updated;
}

export async function deleteCase(orgId: string, caseId: string): Promise<void> {
  const all = readLS<PupilCase[]>(LS_KEYS.cases, DEMO_CASES).filter(
    (c) => c.id !== caseId
  );
  writeLS(LS_KEYS.cases, all);

  if (canUseFirestore() && db) {
    try {
      await deleteDoc(doc(db, "organisations", orgId, "cases", caseId));
    } catch (err) {
      console.warn("Firestore deleteCase failed:", err);
    }
  }
}

export async function uploadAttachmentToStorage(
  orgId: string,
  caseId: string,
  attachment: CaseAttachment
): Promise<CaseAttachment> {
  if (!canUseFirestore() || !storage || !attachment.previewUrl) {
    return attachment;
  }
  try {
    const path = `organisations/${orgId}/cases/${caseId}/${attachment.id}-${attachment.name}`;
    const storageRef = ref(storage, path);
    await uploadString(storageRef, attachment.previewUrl, "data_url");
    const downloadUrl = await getDownloadURL(storageRef);
    return {
      ...attachment,
      storagePath: path,
      previewUrl: downloadUrl,
    };
  } catch (err) {
    console.warn("Firebase Storage upload fallback to local preview:", err);
    return attachment;
  }
}

export async function loadReports(
  orgId: string,
  caseId?: string
): Promise<PlainLanguageReport[]> {
  let local = readLS<PlainLanguageReport[]>(LS_KEYS.reports, []);
  if (local.length === 0) {
    writeLS(LS_KEYS.reports, DEMO_REPORTS);
    local = DEMO_REPORTS;
  }

  if (canUseFirestore() && db) {
    try {
      const snap = await getDocs(
        query(
          collection(db, "organisations", orgId, "reports"),
          orderBy("updatedAt", "desc")
        )
      );
      if (!snap.empty) {
        const remote = snap.docs.map((d) => d.data() as PlainLanguageReport);
        return caseId ? remote.filter((r) => r.caseId === caseId) : remote;
      }
    } catch (err) {
      console.warn("Firestore loadReports fallback:", err);
    }
  }

  return caseId ? local.filter((r) => r.caseId === caseId) : local;
}

export async function saveReport(
  report: PlainLanguageReport
): Promise<PlainLanguageReport> {
  const updated: PlainLanguageReport = {
    ...report,
    updatedAt: new Date().toISOString(),
  };
  const all = readLS<PlainLanguageReport[]>(LS_KEYS.reports, DEMO_REPORTS);
  const idx = all.findIndex((r) => r.id === updated.id);
  if (idx >= 0) {
    all[idx] = updated;
  } else {
    all.unshift(updated);
  }
  writeLS(LS_KEYS.reports, all);

  if (canUseFirestore() && db) {
    try {
      await setDoc(
        doc(db, "organisations", updated.orgId, "reports", updated.id),
        updated,
        { merge: true }
      );
    } catch (err) {
      console.warn("Firestore saveReport failed, saved locally:", err);
    }
  }
  return updated;
}

export async function loadAuditLogs(orgId: string): Promise<AuditLogEntry[]> {
  let local = readLS<AuditLogEntry[]>(LS_KEYS.auditLogs, []);
  if (local.length === 0) {
    writeLS(LS_KEYS.auditLogs, DEMO_AUDIT_LOGS);
    local = DEMO_AUDIT_LOGS;
  }

  if (canUseFirestore() && db) {
    try {
      const snap = await getDocs(
        query(
          collection(db, "organisations", orgId, "auditLogs"),
          orderBy("createdAt", "desc")
        )
      );
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as AuditLogEntry);
      }
    } catch (err) {
      console.warn("Firestore loadAuditLogs fallback:", err);
    }
  }

  return local;
}

export async function appendAuditLog(
  entry: Omit<AuditLogEntry, "id" | "createdAt">
): Promise<AuditLogEntry> {
  const full: AuditLogEntry = {
    ...entry,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };

  const all = readLS<AuditLogEntry[]>(LS_KEYS.auditLogs, DEMO_AUDIT_LOGS);
  all.unshift(full);
  writeLS(LS_KEYS.auditLogs, all.slice(0, 100));

  if (canUseFirestore() && db) {
    try {
      await setDoc(
        doc(db, "organisations", full.orgId, "auditLogs", full.id),
        full
      );
    } catch (err) {
      console.warn("Firestore appendAuditLog failed, saved locally:", err);
    }
  }
  return full;
}
