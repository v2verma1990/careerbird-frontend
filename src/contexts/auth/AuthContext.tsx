
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import api from "@/utils/apiClient";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionStatus {
  active: boolean;
  type: string;
  endDate: Date | null;
}

interface User {
  id: string;
  email: string;
}

interface Session {
  user: User;
  accessToken: string;
}
  interface UserProfile {
  userType: string;
  subscriptionType: string; }

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userType: string | null;
  profile: UserProfile | null;
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionLoading: boolean;
  restoringSession: boolean;
  signUp: (email: string, password: string, type: 'candidate' | 'recruiter') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateSubscription: (type: string, active: boolean, endDate?: Date) => Promise<void>;
  incrementUsageCount: (featureType: string) => Promise<number>;
  resetUsageCount: (featureType: string) => Promise<void>;
}


const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [user, setUser] = useState<User | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [restoringSession, setRestoringSession] = useState(true);

  // Initialize authentication state
const initializeAuth = async () => {
    const storedSession = api.auth.getCurrentUser();
    if (storedSession) {
      console.log("Found existing session:", storedSession.userId);
      setSession({
      user: { 
          id: storedSession.userId,
          email: storedSession.email || ''
        },
        accessToken: storedSession.accessToken || ''
      });
      setUser({
        id: storedSession.userId,
        email: storedSession.email || ''
      });
      setUserType(storedSession.userType || null);
      // Do NOT set profile.subscriptionType from local/session storage. Only userType is relevant.
      setProfile({
        userType: storedSession.userType || 'candidate',
        subscriptionType: 'free' // Always set to 'free' as a placeholder; not used for plan logic
      });
      fetchSubscriptionStatus()// will be called in useEffect when user is set
    }
  };

  useEffect(() => {
     // Check for existing session in localStorage
    initializeAuth();
  }, []);
  //On mount or login, always fetch the latest subscription status from backend
  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
    }
  }, [user]);

   // Robust session restoration: listen for Supabase auth state changes
  useEffect(() => {
    setRestoringSession(true);
    setSubscriptionLoading(true);
//     Restore session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSession({
          user: { id: session.user.id, email: session.user.email || "" },
          accessToken: session.access_token || ""
        });
        setUser({ id: session.user.id, email: session.user.email || "" });
      } else {
        setSession(null);
        setUser(null);
      }
      setRestoringSession(false);
      setSubscriptionLoading(false);
    });
    //  Listen for auth state changes (login, logout, token refresh)
const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSession({
          user: { id: session.user.id, email: session.user.email || "" },
          accessToken: session.access_token || ""
        });
        setUser({ id: session.user.id, email: session.user.email || "" });
      } else {
        setSession(null);
        setUser(null);
      }
      setRestoringSession(false);
      setSubscriptionLoading(false);
    });
    return () => {
      data?.subscription?.unsubscribe();
    };
  }, []);
  // ✅ Fix 1: Prevent Subscription Refetching on Tab Switch
const fetchSubscriptionStatus = async () => {
    console.log("Checking subscription status for user:", user?.email);
    if (!user || subscriptionStatus) return; // 🚀 Prevent unnecessary calls
    setSubscriptionLoading(true);

    try {
        console.log("Fetching user subscription...");
        const { data, error } = await api.subscription.getUserSubscription();
        if (error) {
            console.error("Error fetching subscription:", error);
            setSubscriptionStatus(null);
        } else {
            console.log("Fetched Subscription Data:", data); // ✅ Debug log
            setSubscriptionStatus({
                active: data.subscription_type !== "free",
                type: data.subscription_type,
                endDate: data.end_date ? new Date(data.end_date) : null,
            });

            // ✅ Verify React state update
            setTimeout(() => {
                console.log("Updated subscription status after setting:", subscriptionStatus);
            }, 100);
        }
    } catch (error) {
        console.error("Error in fetchSubscriptionStatus:", error);
        setSubscriptionStatus(null);
    } finally {
        setSubscriptionLoading(false);
    }
};

  // ✅ Fix 2: Prevent Excessive Session Restoration Calls
  useEffect(() => {
    if (session) return; // 🚀 Avoid unnecessary session re-fetch

    setRestoringSession(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSession({
          user: { id: session.user.id, email: session.user.email || "" },
          accessToken: session.access_token || "",
        });
        setUser({ id: session.user.id, email: session.user.email || "" });
      } else {
        setSession(null);
        setUser(null);
      }
      setRestoringSession(false);
    });

    // ✅ Fix 4: Refresh Session & Subscription Only When Tab Gains Focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !subscriptionStatus) {
        fetchSubscriptionStatus(); // 🚀 Refresh subscription ONLY if missing
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [session, subscriptionStatus]); // ✅ Prevents redundant API calls

const incrementUsageCount = async (featureType: string): Promise<number> => {
    if (!user) return 0;
    try {
      console.log(`Incrementing usage count for feature: ${featureType}`);
      const { data, error } = await api.usage.incrementUsage(user.id, featureType);
      if (error) {
        console.error("Error incrementing usage count:", error);
      }
      if (data) {
        console.log("Increment usage response:", data);
        // No longer update usageCount/usageLimit in subscriptionStatus; dashboards will refetch per-feature usage as needed
        return data.newCount;
      }
      // Fallback: just increment by 1
      return 1;
    } catch (error) {
      console.error("Error incrementing usage count:", error);
      return 1;
    }
  };


// Function to reset usage count
const resetUsageCount = async (featureType: string): Promise<void> => {
  if (!user) return;
    try {
      console.log(`Resetting usage count for feature: ${featureType}`);
      // Call backend API to reset usage count
        const { error } = await api.usage.resetUsageCount(user.id, featureType);
        if (error) {
        throw error;
      }
       // No longer update usageCount in subscriptionStatus; dashboards will refetch per-feature usage as needed
      await api.usage.logActivity({
        actionType: 'usage_reset',
        description: `Reset usage count for ${featureType}`
      });
      console.log(`Usage count for ${featureType} has been reset to 0`);
    } catch (error) {
    console.error("Error resetting usage count:", error);
    }
  };


  // Function to update subscription status
  const updateSubscription = async (type: string, active: boolean, endDate?: Date) => {
    if (!user) {
      console.error("Cannot update subscription: No user logged in");
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to upgrade your subscription.",
      });
      return;
    }
    try {
      console.log("Updating subscription status:", { type, active });
      const { data, error } = await api.subscription.upgradeSubscription(type);
      if (error) throw new Error(error);

      await fetchSubscriptionStatus(); // ✅ Ensure updated subscription is fetched immediately

      toast({
        title: "Subscription updated",
        description: `Your subscription has been updated to ${type}.`,
      });

      navigate(type === "free" ? "/free-plan-dashboard" : "/candidate-dashboard");
    } catch (error: any) {
      console.error("Error updating subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update subscription: " + error.message,
      });
    }
  };

  const signUp = async (email: string, password: string, type: "candidate" | "recruiter") => {
    try {
      const { data, error } = await api.auth.signup(email, password, type);
      if (error) throw new Error(error);

      toast({ title: "Account created successfully!", description: "You can now sign in." });
      navigate("/login");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      throw error;
    }
  };

const signIn = async (email: string, password: string) => {
    try {
        console.log("Signing in user:", email);
        const { data, error } = await api.auth.login(email, password);
        console.log("inside signIn:");
        if (error) throw new Error(error);
        if (data) {
            setSession({
            user: { 
            id: data.userId,
            email: data.email 
          },
          accessToken: data.accessToken || ''
        });
        setUser({
          id: data.userId,
          email: data.email
        });
        setUserType(data.profile?.userType || 'candidate');
        setProfile({
          userType: data.profile?.userType || 'candidate',
          subscriptionType: 'free'  //Always set to 'free' as a placeholder
        });
            console.log("before fetxh subscription :", email);

            await fetchSubscriptionStatus(); // ✅ Ensure subscription is fetched before routing
            console.log("Updated subscription status:", subscriptionStatus);
            // 🚀 Redirect candidate or recruiter to the right dashboard
            console.log("Full user data:", data); // ✅ Print full response for debugging
            console.log("UserType inside profile:", data.profile?.userType); // ✅ Ensure userType is correctly defined
            if(!data.profile) {
                console.error("No profile found for user:", data.userId);}
            if (data.profile?.userType === "recruiter") {
                console.log("Navigating recruiter to /dashboard");
                navigate("/dashboard"); // ✅ Recruiters go to recruiter dashboard
            } else {
                console.log("Navigating candidate to:", subscriptionStatus?.type === "free" ? "/free-plan-dashboard" : "/candidate-dashboard");
                navigate(subscriptionStatus?.type === "free" ? "/free-plan-dashboard" : "/candidate-dashboard");
            }

            toast({ title: "Signed in successfully!" });
        }
    } catch (error: any) {
        console.error("Sign in error:", error);
        toast({ variant: "destructive", title: "Error", description: error.message });
        throw error;
    }
};
const signOut = async () => {
    try {
 //      Log sign out activity
      if (user) {
        await api.usage.logActivity({
          actionType: 'signed_out',
          description: 'User signed out'
        });
      }
      
   //     Clear auth state locally
      setSession(null);
      setUser(null);
      setUserType(null);
      setProfile(null);
      setSubscriptionStatus({ active: false, type: 'free', endDate: null });
      
     //   Clear authentication data in storage
      await api.auth.logout();
      
      toast({
        title: "Signed out successfully",
      });
      
      navigate('/');
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      userType, 
      profile, 
      subscriptionStatus, 
      subscriptionLoading,
      restoringSession,
      signUp, 
      signIn, 
      signOut, 
      updateSubscription, 
      incrementUsageCount, 
      resetUsageCount 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  return useContext(AuthContext);
};