import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi } from "../lib/api";

export type UserRole = "owner" | "executor" | "beneficiary" | "verifier" | "admin";

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  nationalId?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    phone?: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "legacyvault_token";
const USER_KEY = "legacyvault_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .getMe()
      .then((res: any) => {
        const u = res.user;
        const normalized: User = {
          id: u._id || u.id,
          _id: u._id || u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          phone: u.phone,
          nationalId: u.nationalId,
        };
        setUser(normalized);
        localStorage.setItem(USER_KEY, JSON.stringify(normalized));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res: any = await authApi.login({ email, password });
      const u = res.user;
      const normalized: User = {
        id: u._id || u.id,
        _id: u._id || u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
      };
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(normalized));
      setUser(normalized);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    phone?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res: any = await authApi.register({ name, email, password, role, phone });
      const u = res.user;
      const normalized: User = {
        id: u._id || u.id,
        _id: u._id || u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
      };
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(normalized));
      setUser(normalized);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res: any = await authApi.getMe();
      const u = res.user;
      const normalized: User = {
        id: u._id || u.id,
        _id: u._id || u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        nationalId: u.nationalId,
      };
      setUser(normalized);
      localStorage.setItem(USER_KEY, JSON.stringify(normalized));
    } catch {
      /* ignore */
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
