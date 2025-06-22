import { createContext, useContext } from "react";
import { useAuth } from "./AuthContext";

// Use the new AuthContext instead of the old one
export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={{ 
      currentUser: auth.user, 
      setCurrentUser: () => {}, // Handled by Supabase auth
      profile: auth.profile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuthContext() {
  return useContext(AuthContext);
}
