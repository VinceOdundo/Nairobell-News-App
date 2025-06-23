import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code === "PGRST116") {
        // Profile doesn't exist, create one
        const { data: userData } = await supabase.auth.getUser();
        const currentUser = userData?.user;

        // Ensure we have all required fields with fallbacks
        let username =
          currentUser?.email?.split("@")[0] || `user_${userId.slice(0, 8)}`;
        const displayName =
          currentUser?.user_metadata?.full_name ||
          currentUser?.user_metadata?.firstName ||
          currentUser?.user_metadata?.name ||
          "New User";
        const email = currentUser?.email || "";

        // Validate required fields before inserting
        if (!email) {
          console.error("Cannot create profile: email is required");
          toast.error("Unable to create profile: missing email");
          return;
        }

        // Handle potential username conflicts
        let attempts = 0;
        let finalUsername = username;

        while (attempts < 5) {
          try {
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert([
                {
                  id: userId,
                  username: finalUsername,
                  display_name: displayName,
                  email: email,
                  preferred_language:
                    currentUser?.user_metadata?.preferred_language || "en",
                  country: currentUser?.user_metadata?.country || "",
                  region: currentUser?.user_metadata?.region || "",
                  first_name: currentUser?.user_metadata?.firstName || "",
                  last_name: currentUser?.user_metadata?.lastName || "",
                },
              ])
              .select()
              .single();

            if (createError) {
              // If it's a unique constraint violation on username, try with a suffix
              if (
                createError.code === "23505" &&
                createError.message.includes("username")
              ) {
                attempts++;
                finalUsername = `${username}${attempts}`;
                continue;
              }

              console.error("Error creating profile:", createError);
              toast.error(
                "Failed to create user profile. Please contact support if this persists."
              );
              break;
            } else {
              setProfile(newProfile);
              toast.success("Profile created successfully!");
              break;
            }
          } catch (insertError) {
            console.error("Profile insertion failed:", insertError);
            if (attempts >= 4) {
              toast.error(
                "Profile creation failed. Please try refreshing the page."
              );
            }
            attempts++;
            finalUsername = `${username}${attempts}`;
          }
        }
      } else if (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load user profile");
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error in fetchProfile:", error);
      toast.error("An unexpected error occurred while loading your profile");
    }
  };
  const signUp = async (email, password, userData) => {
    try {
      // Ensure we have the required metadata
      const userMetadata = {
        full_name:
          userData?.firstName && userData?.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : userData?.firstName || userData?.lastName || "New User",
        firstName: userData?.firstName || "",
        lastName: userData?.lastName || "",
        username: userData?.username || email.split("@")[0],
        country: userData?.country || "",
        region: userData?.region || "",
        preferred_language: userData?.preferredLanguage || "en",
        ...userData,
      };

      console.log("Attempting signup with metadata:", userMetadata);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userMetadata,
        },
      });

      if (error) {
        console.error("Supabase auth signup error:", error);
        throw error;
      }

      console.log("Signup successful:", data);

      toast.success(
        "Account created successfully! Please check your email to verify your account."
      );
      return { data, error: null };
    } catch (error) {
      console.error("Sign up error:", error);
      toast.error(error.message || "An error occurred during signup");
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Welcome back!");
      return { data, error: null };
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error(error.message);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setProfile(null);
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error(error.message);
    }
  };

  const updateProfile = async (updates) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      toast.success("Profile updated successfully");
      return { data, error: null };
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error(error.message);
      return { data: null, error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
