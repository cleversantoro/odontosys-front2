//import React, { createContext, useState, useEffect } from 'react';
import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  login: (jwtToken: string, refresh: string) => void;
  logout: () => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    const storedRefresh = localStorage.getItem('refreshToken');
    if (storedToken && storedRefresh) {
      setToken(storedToken);
      setRefreshToken(storedRefresh);
      setIsAuthenticated(true);
    }
  }, [setRefreshToken, setToken, setIsAuthenticated]);


  interface LoginFunction {
    (jwtToken: string, refresh: string): void;
  }

  const login: LoginFunction = (jwtToken, refresh) => {
    setToken(jwtToken);
    setRefreshToken(refresh);
    setIsAuthenticated(true);
    localStorage.setItem('accessToken', jwtToken);
    localStorage.setItem('refreshToken', refresh);
  };

  const logout = () => {
    setToken(null);
    setRefreshToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, refreshToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};






