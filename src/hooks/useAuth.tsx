import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  mockSignIn: (email?: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockUserStr = localStorage.getItem("bluechain_mock_user");
    if (mockUserStr) {
      try {
        const u = JSON.parse(mockUserStr);
        setUser(u);
        setSession({
          access_token: "mock-token",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "mock-refresh-token",
          user: u,
        });
        setLoading(false);
        return;
      } catch (e) {
        console.error("Failed to parse mock user:", e);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!localStorage.getItem("bluechain_mock_user")) {
        setSession(s);
        setUser(s?.user ?? null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!localStorage.getItem("bluechain_mock_user")) {
        setSession(s);
        setUser(s?.user ?? null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const mockSignIn = (email = "demo@bluechain.mrv") => {
    // Generate a simple readable display name from the email prefix
    const namePrefix = email.split("@")[0];
    const fullName = namePrefix.charAt(0).toUpperCase() + namePrefix.slice(1);

    const mockUser: any = {
      id: "00000000-0000-0000-0000-000000000000",
      email: email,
      role: "authenticated",
      aud: "authenticated",
      app_metadata: {},
      user_metadata: { full_name: fullName },
      created_at: new Date().toISOString(),
    };
    const mockSession: any = {
      access_token: "mock-token",
      token_type: "bearer",
      expires_in: 3600,
      refresh_token: "mock-refresh-token",
      user: mockUser,
    };
    setSession(mockSession);
    setUser(mockUser);
    localStorage.setItem("bluechain_mock_user", JSON.stringify(mockUser));
  };

  const signOut = async () => {
    localStorage.removeItem("bluechain_mock_user");
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, mockSignIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};