import React, { useContext, useState, useEffect, createContext } from 'react';
import { useNavigate } from 'react-router-dom';

import { toast } from "@/components/ui/use-toast";
import api from "@/utils/apiClient";
import { supabase } from "@/integrations/supabase/client";



const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // Local state declarations
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [restoringSession, setRestoringSession] = useState(false);

  /**
   * Fetch the user's subscription data.
   * An optional user parameter may be provided to bypass stale state.
   */
  const fetchSubscriptionStatus = async (userDataParam?:any) => {
    // Use the provided user data if given, otherwise fall back to state.
    const effectiveUser = userDataParam || user;
    if (!effectiveUser) {
      console.warn("Cannot fetch subscription status: user is null.");
      return;
    }
    console.log("Checking subscription status for user:", effectiveUser.email);

    // If we already have a subscription, skip
    if (subscriptionStatus) return;

    setSubscriptionLoading(true);

    try {
      console.log("Fetching user subscription...");
      const { data, error } = await api.subscription.getUserSubscription();
      if (error) {
        console.error("Error fetching subscription:", error);
        setSubscriptionStatus(null);
      } else {
        console.log("Fetched Subscription Data:", data);
        setSubscriptionStatus({
          active: data.subscription_type, // adjust if needed
          type: data.subscription_type,
          endDate: data.end_date ? new Date(data.end_date) : null,
        });
        // Verify state update (for debug)
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

  // Avoid redundant session restoration calls
  useEffect(() => {
    if (session) return;

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

    // Refresh subscription only when the tab gains focus (and if missing).
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !subscriptionStatus) {
        fetchSubscriptionStatus();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [session, subscriptionStatus]);

  // --- SIGN IN ---
  const signIn = async (email, password) => {
    try {
      console.log("Signing in user:", email);
      const { data, error } = await api.auth.login(email, password);

      if (error) throw new Error(error);

      if (data && data.userId) {
        const userData = {
          id: data.userId,
          email: data.email || '',
        };

        console.log("User data before setting:", userData);

        // Update session and user state
        setSession({
          user: userData,
          accessToken: data.accessToken || '',
        });

        setUser(userData);
        setUserType(data.profile?.userType || null);

        setProfile({
          userType: data.profile?.userType || null,
          subscriptionType: data.profile?.subscriptionType || 'free',
        });

        console.log("Waiting for state updates...");
        // Allow time for state updates (if needed)
        await new Promise(resolve => setTimeout(resolve, 100));

        if (userData.email) {
          console.log("Fetching subscription status...");
          // Pass the freshly obtained user data
          await fetchSubscriptionStatus(userData);
        } else {
          console.error("Skipping subscription fetch—email is missing.");
        }

        console.log("Updated subscription status:", subscriptionStatus);

        // Navigate based on user type and subscription
        if (data.profile?.userType === "recruiter") {
          navigate("/dashboard");
        } else if (data.profile?.userType === "candidate") {
          navigate(
            subscriptionStatus?.type === "free" ? "/free-plan-dashboard" : "/candidate-dashboard"
          );
        } else {
          console.error("Unexpected userType:", data.profile?.userType);
          toast({
            variant: "destructive",
            title: "Error",
            description: `Unknown userType: ${data.profile?.userType}`
          });
          return;
        }

        toast({ title: "Signed in successfully!" });
      } else {
        throw new Error("Invalid login response: Missing user data.");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  // --- SIGN UP ---
  const signUp = async (email, password, type) => {
    try {
      const { data, error } = await api.auth.signup(email, password, type);
      if (error) throw new Error(error);

      toast({
        title: "Account created successfully!",
        description: "You can now sign in."
      });
      navigate("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
      throw error;
    }
  };

  // --- SIGN OUT ---
  const signOut = async () => {
    try {
      if (user) {
        await api.usage.logActivity({
          actionType: 'signed_out',
          description: 'User signed out'
        });
      }
      // Clear all auth-related state
      setSession(null);
      setUser(null);
      setUserType(null);
      setProfile(null);
      setSubscriptionStatus(null);
      await api.auth.logout();
      toast({ title: "Signed out successfully" });
      navigate('/');
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // --- USAGE COUNT FUNCTIONS ---
  const incrementUsageCount = async (featureType) => {
    if (!user) return 0;
    try {
      console.log(`Incrementing usage count for feature: ${featureType}`);
      const { data, error } = await api.usage.incrementUsage(user.id, featureType);
      if (error) {
        console.error("Error incrementing usage count:", error);
      }
      if (data) {
        console.log("Increment usage response:", data);
        return data.newCount;
      }
      return 1; // fallback increment
    } catch (error) {
      console.error("Error incrementing usage count:", error);
      return 1;
    }
  };

  const resetUsageCount = async (featureType) => {
    if (!user) return;
    try {
      console.log(`Resetting usage count for feature: ${featureType}`);
      const { error } = await api.usage.resetUsageCount(user.id, featureType);
      if (error) throw error;
      await api.usage.logActivity({
        actionType: 'usage_reset',
        description: `Reset usage count for ${featureType}`
      });
      console.log(`Usage count for ${featureType} has been reset to 0`);
    } catch (error) {
      console.error("Error resetting usage count:", error);
    }
  };

  // --- UPDATE SUBSCRIPTION ---
  const updateSubscription = async (type, active, endDate) => {
    if (!user) {
      console.error("Cannot update subscription: No user logged in");
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to upgrade your subscription."
      });
      return;
    }
    try {
      console.log("Updating subscription status:", { type, active });
      const { data, error } = await api.subscription.upgradeSubscription(type);
      if (error) throw new Error(error);

      // Fetch updated subscription status using current user data
      await fetchSubscriptionStatus(user);
      toast({
        title: "Subscription updated",
        description: `Your subscription has been updated to ${type}.`
      });
      navigate(type === "free" ? "/free-plan-dashboard" : "/candidate-dashboard");
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update subscription: " + error.message
      });
    }
  };

  // Expose context values and functions
  return (
    <AuthContext.Provider
      value={{ 
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};