import { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "../api/index.js";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }
    authAPI
      .me()
      .then((r) => setUser(r.data.data))
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem("accessToken", data.data.accessToken);
    localStorage.setItem("refreshToken", data.data.refreshToken);
    setUser(data.data.user);
    return data.data.user;
  };

  const register = async (name, email, password, role) => {
    const { data } = await authAPI.register({ name, email, password, role });
    localStorage.setItem("accessToken", data.data.accessToken);
    localStorage.setItem("refreshToken", data.data.refreshToken);
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = async () => {
    const rt = localStorage.getItem("refreshToken");
    try {
      await authAPI.logout(rt);
    } catch {}
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  return (
    <AuthCtx.Provider
      value={{ user, setUser, loading, login, register, logout }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
