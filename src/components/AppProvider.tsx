"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { DEMO_MEMBER, DEMO_ORGANISATIONS } from "@/lib/demo-data";
import {
  bootstrapOrgMembership,
  getActiveOrgId,
  getOrganisationsLocal,
  saveOrganisationSettings,
  setActiveOrgId as persistActiveOrgId,
} from "@/lib/store";
import type { OrganisationSettings, OrgMember } from "@/types";

interface AppContextValue {
  user: OrgMember | null;
  authLoading: boolean;
  isDemoSession: boolean;
  firebaseReady: boolean;
  organisations: OrganisationSettings[];
  activeOrg: OrganisationSettings;
  language: "en" | "ru";
  setLanguage: (lang: "en" | "ru") => void;
  switchOrganisation: (orgId: string) => void;
  updateActiveOrganisation: (
    patch: Partial<OrganisationSettings>
  ) => Promise<void>;
  signInDemo: () => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEMO_SESSION_KEY = "superviz_uk_demo_session_v1";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<OrgMember | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isDemoSession, setIsDemoSession] = useState(false);
  const [organisations, setOrganisations] =
    useState<OrganisationSettings[]>(DEMO_ORGANISATIONS);
  const [activeOrgId, setActiveOrgIdState] = useState<string>(
    DEMO_ORGANISATIONS[0].id
  );
  const [language, setLanguage] = useState<"en" | "ru">("en");

  const activeOrg =
    organisations.find((o) => o.id === activeOrgId) || organisations[0];

  // Hydrate organisations & demo session on mount
  useEffect(() => {
    const localOrgs = getOrganisationsLocal();
    setOrganisations(localOrgs);
    const savedOrgId = getActiveOrgId();
    if (localOrgs.some((o) => o.id === savedOrgId)) {
      setActiveOrgIdState(savedOrgId);
    }

    const savedDemo =
      typeof window !== "undefined" &&
      window.localStorage.getItem(DEMO_SESSION_KEY) === "true";

    if (isFirebaseConfigured && auth) {
      const unsub = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          setUser({
            uid: fbUser.uid,
            email: fbUser.email || "",
            displayName: fbUser.displayName || fbUser.email || "Psychologist",
            role: "admin",
            title: "Educational Psychologist",
          });
          setIsDemoSession(false);
        } else if (savedDemo) {
          setUser(DEMO_MEMBER);
          setIsDemoSession(true);
        } else {
          setUser(null);
        }
        setAuthLoading(false);
      });
      return () => unsub();
    } else {
      if (savedDemo) {
        setUser(DEMO_MEMBER);
        setIsDemoSession(true);
      }
      setAuthLoading(false);
    }
  }, []);

  // Apply organisation accent colour globally
  useEffect(() => {
    if (typeof document !== "undefined" && activeOrg?.accentColor) {
      document.documentElement.style.setProperty(
        "--org-accent",
        activeOrg.accentColor
      );
    }
  }, [activeOrg?.accentColor]);

  const switchOrganisation = (orgId: string) => {
    setActiveOrgIdState(orgId);
    persistActiveOrgId(orgId);
  };

  const updateActiveOrganisation = async (
    patch: Partial<OrganisationSettings>
  ) => {
    const merged: OrganisationSettings = {
      ...activeOrg,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    const saved = await saveOrganisationSettings(merged);
    setOrganisations((prev) =>
      prev.map((o) => (o.id === saved.id ? saved : o))
    );
  };

  const signInDemo = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DEMO_SESSION_KEY, "true");
    }
    setUser(DEMO_MEMBER);
    setIsDemoSession(true);
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        "Firebase is not configured yet. Use 'Enter Demo Workspace' or add Firebase keys in .env.local."
      );
    }
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (cred.user) {
      await bootstrapOrgMembership(activeOrg);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        "Firebase is not configured yet. Use 'Enter Demo Workspace' or add Firebase keys in .env.local."
      );
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (cred.user) {
      await updateProfile(cred.user, { displayName });
      await bootstrapOrgMembership(activeOrg);
    }
  };

  const signOut = async () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(DEMO_SESSION_KEY);
    }
    if (isFirebaseConfigured && auth && auth.currentUser) {
      await firebaseSignOut(auth);
    }
    setUser(null);
    setIsDemoSession(false);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        isDemoSession,
        firebaseReady: isFirebaseConfigured,
        organisations,
        activeOrg,
        language,
        setLanguage,
        switchOrganisation,
        updateActiveOrganisation,
        signInDemo,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used inside AppProvider");
  }
  return ctx;
}
