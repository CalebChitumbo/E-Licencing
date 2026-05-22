import {
  User as FirebaseUserSdk,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";

import { auth } from "./firebase";
import { post } from "./api";
import type { Role, User } from "./types";

interface AuthContextValue {
  firebaseUser: FirebaseUserSdk | null;
  profile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (params: { email: string; password: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUserSdk | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      if (u) {
        try {
          const p = await post<User>("/auth/exchange");
          setProfile(p);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value: AuthContextValue = {
    firebaseUser,
    profile,
    loading,
    signIn: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password);
    },
    register: async ({ email, password, displayName }) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) await updateProfile(cred.user, { displayName });
    },
    logout: async () => {
      await signOut(auth);
    },
    resetPassword: async (email) => {
      await sendPasswordResetEmail(auth, email);
    },
    refreshProfile: async () => {
      try {
        const p = await post<User>("/auth/exchange");
        setProfile(p);
      } catch {
        // ignore
      }
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside <AuthProvider>");
  return ctx;
}

export function useRole(): Role | null {
  const { profile } = useAuth();
  return profile?.role ?? null;
}
