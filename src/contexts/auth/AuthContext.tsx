import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import api from '@/utils/apiClient';
import { logActivity } from '@/utils/exportUtils';
import { UserProfile as UserProfileType } from '@/types/auth';
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

interface UserProfile {
  userType: string;
  subscriptionType: string;
}

interface Session {
  user: User;
  accessToken: string;
}

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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [restoringSession, setRestoringSession] = useState(true);
  const navigate = useNavigate();

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
      // fetchSubscriptionStatus() will be called in useEffect when user is set
    }
  };

  useEffect(() => {
    // Check for existing session in localStorage
    initializeAuth();
  }, []);

  // On mount or login, always fetch the latest subscription status from backend
  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
    }
  }, [user]);

  // Robust session restoration: listen for Supabase auth state changes
  useEffect(() => {
    setRestoringSession(true);
    setSubscriptionLoading(true);
    // Restore session on mount
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
    // Listen for auth state changes (login, logout, token refresh)
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

  // Function to fetch subscription status (single source of truth for plan/limit/usage)
  const fetchSubscriptionStatus = async () => {
    setSubscriptionLoading(true);
    try {
      console.log("Fetching user subscription");
      // Get subscription info from backend API (not profile)
      const { data: subscriptionData, error: subscriptionError } = await api.subscription.getUserSubscription();
      if (subscriptionError) {
        console.error("Error fetching subscription:", subscriptionError);
        setSubscriptionStatus(null);
        setSubscriptionLoading(false);
        return;
      }
      if (subscriptionData) {
        setSubscriptionStatus({
          active: subscriptionData.subscription_type !== 'free',
          type: subscriptionData.subscription_type,
          endDate: subscriptionData.end_date ? new Date(subscriptionData.end_date) : null,
          // Remove usageCount/usageLimit from here: always use per-feature usage from batch endpoint in dashboards
        });
      } else {
        setSubscriptionStatus(null);
      }
    } catch (error) {
      console.error("Error in fetchSubscriptionStatus:", error);
      setSubscriptionStatus(null);
    } finally {
      setSubscriptionLoading(false);
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
      // Make backend API call to upgrade subscription
      const { data, error } = await api.subscription.upgradeSubscription(type);
      if (error) {
        throw new Error(error);
      }
      // Log subscription change activity via backend
      await api.usage.logActivity({
        actionType: 'subscription_changed',
        description: `Changed subscription to ${type}`
      });
      // Always fetch latest subscription status from backend before updating UI
      await fetchSubscriptionStatus();
      // Update profile (only userType, never plan)
      if (profile) {
        setProfile({
          ...profile,
          // Do NOT update subscriptionType here; plan logic is only in subscriptionStatus
        });
      } else {
        setProfile({
          userType: userType || 'candidate',
          subscriptionType: 'free' // Always set to 'free' as a placeholder
        });
      }
      toast({
        title: "Subscription updated",
        description: `Your subscription has been updated to ${type}.`,
      });
      // Force reload the relevant page based on user type
      if (userType === 'candidate') {
        if (type === 'free') {
          navigate('/free-plan-dashboard');
        } else {
          navigate('/candidate-dashboard');
        }
      } else if (userType === 'recruiter') {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error("Error updating subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update subscription: " + error.message,
      });
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
  
  // Function to increment usage count
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

  const signUp = async (email: string, password: string, type: 'candidate' | 'recruiter') => {
    try {
      const { data, error } = await api.auth.signup(email, password, type);

      if (error) throw new Error(error);
      
      toast({
        title: "Account created successfully!",
        description: "You can now sign in with your credentials.",
      });
      
      // Navigate to login page after successful signup
      navigate('/login');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Signing in user:", email);
      const { data, error } = await api.auth.login(email, password);

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
          subscriptionType: 'free' // Always set to 'free' as a placeholder
        });
        toast({
          title: "Signed in successfully!",
        });

        // Always fetch latest subscription from backend and redirect based on that
        await fetchSubscriptionStatus();
        // Use the latest subscriptionStatus for redirect
        setTimeout(() => {
          if (data.profile?.userType === 'candidate') {
            if (subscriptionStatus && subscriptionStatus.type === 'free') {
              navigate('/free-plan-dashboard');
            } else if (subscriptionStatus && subscriptionStatus.type) {
              navigate('/candidate-dashboard');
            } else {
              navigate('/candidate-dashboard'); // fallback
            }
          } else if (data.profile?.userType === 'recruiter') {
            navigate('/dashboard');
          } else {
            navigate('/');
          }
        }, 0);
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Log sign out activity
      if (user) {
        await api.usage.logActivity({
          actionType: 'signed_out',
          description: 'User signed out'
        });
      }
      
      // Clear auth state locally
      setSession(null);
      setUser(null);
      setUserType(null);
      setProfile(null);
      setSubscriptionStatus({ active: false, type: 'free', endDate: null });
      
      // Clear authentication data in storage
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
