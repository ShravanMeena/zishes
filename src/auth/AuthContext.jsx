import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext({
  token: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore token on app launch
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("auth_token");
        setToken(saved);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (t) => {
    await AsyncStorage.setItem("auth_token", t);
    setToken(t);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem("auth_token");
    setToken(null);
  }, []);

  const value = useMemo(() => ({ token, loading, signIn, signOut }), [token, loading, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
