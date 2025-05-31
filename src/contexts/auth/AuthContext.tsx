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
  const [restoringSession, setRestoringSession] = useState(true); // Start with true to prevent flashing

  /**
   * Fetch the user's subscription data.
   * An optional user parameter may be provided to bypass stale state.
   */
  const fetchSubscriptionStatus = async (userDataParam?:any) => {
    // Use the provided user data if given, otherwise fall back to state.
    const effectiveUser = userDataParam || user;
    if (!effectiveUser) {
      console.warn("Cannot fetch subscription status: user is null.");
      setSubscriptionLoading(false); // Make sure to reset loading state
      return;
    }
    console.log("Checking subscription status for user:", effectiveUser.email);

    // If we already have a subscription, skip
    if (subscriptionStatus) {
      setSubscriptionLoading(false);
      return;
    }

    setSubscriptionLoading(true);

    try {
      console.log("Fetching user subscription...");
      const { data, error } = await api.subscription.getUserSubscription();
      if (error) {
        console.error("Error fetching subscription:", error);
        // Set a default free subscription if there's an error
        setSubscriptionStatus({
          active: 'free',
          type: 'free',
          endDate: null,
        });
      } else {
        console.log("Fetched Subscription Data:", data);
        setSubscriptionStatus({
          active: data.subscription_type || 'free', // Default to free if not specified
          type: data.subscription_type || 'free',
          endDate: data.end_date ? new Date(data.end_date) : null,
        });
      }
    } catch (error) {
      console.error("Error in fetchSubscriptionStatus:", error);
      // Set a default free subscription if there's an exception
      setSubscriptionStatus({
        active: 'free',
        type: 'free',
        endDate: null,
      });
    } finally {
      setSubscriptionLoading(false);
    }
  };

  // Session restoration and auth state management
  useEffect(() => {
    // Skip if we already have a session
    if (session) {
      console.log("Session already exists, skipping restoration");
      setRestoringSession(false);
      return;
    }
    
    console.log("Starting session restoration process");
    
    // Set restoring flag to true at the beginning
    setRestoringSession(true);
    
    const restoreSession = async () => {
      try {
        console.log("Fetching session from Supabase");
        // Get session from Supabase
        const { data: { session: supabaseSession } } = await supabase.auth.getSession();
        
        if (supabaseSession?.user) {
          console.log("Session found, user ID:", supabaseSession.user.id);
          
          // Set session and user state
          const userData = { 
            id: supabaseSession.user.id, 
            email: supabaseSession.user.email || "" 
          };
          
          // Set all user data at once to minimize state updates
          const defaultUserType = supabaseSession.user.user_metadata?.user_type || 'candidate';
          
          // Prepare for batch state update
          let profileData;
          let subscriptionData;
          
          try {
            // Fetch user profile and subscription in parallel
            const [profileResponse, subscriptionResponse] = await Promise.all([
              api.auth.getProfile(),
              api.subscription.getUserSubscription()
            ]);
            
            // Process profile data
            if (!profileResponse.error && profileResponse.data) {
              console.log("Profile data received:", profileResponse.data);
              profileData = {
                userType: profileResponse.data.userType || defaultUserType,
                subscriptionType: profileResponse.data.subscriptionType || 'free',
              };
            } else {
              console.warn("No profile data or error:", profileResponse.error);
              profileData = {
                userType: defaultUserType,
                subscriptionType: 'free',
              };
            }
            
            // Process subscription data
            if (!subscriptionResponse.error && subscriptionResponse.data) {
              console.log("Subscription data received:", subscriptionResponse.data);
              subscriptionData = {
                active: subscriptionResponse.data.subscription_type || 'free',
                type: subscriptionResponse.data.subscription_type || 'free',
                endDate: subscriptionResponse.data.end_date ? new Date(subscriptionResponse.data.end_date) : null,
              };
            } else {
              console.warn("No subscription data or error:", subscriptionResponse.error);
              subscriptionData = {
                active: 'free',
                type: 'free',
                endDate: null,
              };
            }
          } catch (error) {
            console.error("Error fetching profile or subscription:", error);
            profileData = {
              userType: defaultUserType,
              subscriptionType: 'free',
            };
            subscriptionData = {
              active: 'free',
              type: 'free',
              endDate: null,
            };
          }
          
          // Batch update all state at once
          setSession({
            user: userData,
            accessToken: supabaseSession.access_token || "",
          });
          setUser(userData);
          setUserType(profileData.userType);
          setProfile(profileData);
          setSubscriptionStatus(subscriptionData);
          
        } else {
          console.log("No session found, user is not authenticated");
          // No session found - clear all auth state
          setSession(null);
          setUser(null);
          setUserType(null);
          setProfile(null);
          setSubscriptionStatus(null);
        }
      } catch (error) {
        console.error("Error restoring session:", error);
        // Reset all auth state on error
        setSession(null);
        setUser(null);
        setUserType(null);
        setProfile(null);
        setSubscriptionStatus(null);
      } finally {
        console.log("Session restoration complete");
        // Set restoring to false when done - with a small delay to ensure state updates have propagated
        setTimeout(() => {
          setRestoringSession(false);
          console.log("Restoration flag set to false");
        }, 500);
      }
    };
    
    // Execute the session restoration
    restoreSession();

    // Set up event listener for tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !subscriptionStatus && user) {
        console.log("Tab became visible, refreshing subscription status");
        fetchSubscriptionStatus();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [session]);

  // --- SIGN IN ---
  const signIn = async (email, password) => {
    try {
      // Set restoring session to true to prevent flickering during login
      setRestoringSession(true);
      
      console.log("Signing in user:", email);
      const { data, error } = await api.auth.login(email, password);

      if (error) throw new Error(error);

      if (data && data.userId) {
        const userData = {
          id: data.userId,
          email: data.email || '',
        };

        console.log("User data before setting:", userData);
        
        // Prepare subscription data - we need to fetch the actual subscription data
        // from the backend instead of relying on the profile data from login
        let subscriptionData = null;
        
        // Set basic user data first
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
        
        // Show success toast
        toast({ title: "Signed in successfully!" });
        
        // Fetch the actual subscription data from the backend
        try {
          console.log("Fetching subscription data from backend...");
          const { data: subscriptionData, error: subscriptionError } = await api.subscription.getUserSubscription();
          
          if (subscriptionError) {
            console.error("Error fetching subscription:", subscriptionError);
            // Set default subscription if there's an error
            setSubscriptionStatus({
              active: 'free',
              type: 'free',
              endDate: null,
            });
          } else {
            console.log("Subscription data received:", subscriptionData);
            // Set the actual subscription data
            setSubscriptionStatus({
              active: subscriptionData.subscription_type || 'free',
              type: subscriptionData.subscription_type || 'free',
              endDate: subscriptionData.end_date ? new Date(subscriptionData.end_date) : null,
            });
          }
          
          // Navigate based on user type and subscription after fetching subscription data
          if (data.profile?.userType === "recruiter") {
            navigate("/dashboard", { replace: true });
          } else if (data.profile?.userType === "candidate") {
            const subType = subscriptionData?.subscription_type || 'free';
            console.log("Navigating based on subscription type:", subType);
            navigate(
              subType === "free" ? "/free-plan-dashboard" : "/candidate-dashboard",
              { replace: true }
            );
          } else {
            console.error("Unexpected userType:", data.profile?.userType);
            toast({
              variant: "destructive",
              title: "Error",
              description: `Unknown userType: ${data.profile?.userType}`
            });
          }
        } catch (error) {
          console.error("Error in subscription fetch:", error);
          // Set default subscription if there's an exception
          setSubscriptionStatus({
            active: 'free',
            type: 'free',
            endDate: null,
          });
          
          // Navigate to a safe default
          if (data.profile?.userType === "recruiter") {
            navigate("/dashboard", { replace: true });
          } else {
            navigate("/free-plan-dashboard", { replace: true });
          }
        } finally {
          // Set restoring session to false after navigation
          setTimeout(() => {
            setRestoringSession(false);
          }, 300);
        }
        
      } else {
        setRestoringSession(false);
        throw new Error("Invalid login response: Missing user data.");
      }
    } catch (error) {
      setRestoringSession(false);
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
      console.log("Signing out user");
      
      // Log the sign out activity if user exists
      if (user) {
        try {
          await api.usage.logActivity({
            actionType: 'signed_out',
            description: 'User signed out'
          });
        } catch (error) {
          console.error("Error logging sign out activity:", error);
        }
      }
      
      // Clear all auth-related state
      setSession(null);
      setUser(null);
      setUserType(null);
      setProfile(null);
      setSubscriptionStatus(null);
      
      // Call the logout API
      try {
        await api.auth.logout();
      } catch (error) {
        console.error("Error during API logout:", error);
      }
      
      // Clear any local storage items related to auth
      localStorage.removeItem("supabase-auth");
      
      // Show success toast
      toast({ title: "Signed out successfully" });
      
      // Navigate to home page
      navigate('/', { replace: true });
      
      console.log("Sign out complete");
    } catch (error) {
      console.error("Sign out error:", error);
      
      // Force clear state even if there's an error
      setSession(null);
      setUser(null);
      setUserType(null);
      setProfile(null);
      setSubscriptionStatus(null);
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
    
    // Don't do anything if user is already on this plan
    if (subscriptionStatus?.type === type) {
      console.log(`User is already on ${type} plan, no need to upgrade`);
      toast({
        title: "Already subscribed",
        description: `You are already on the ${type} plan.`
      });
      return;
    }
    
    try {
      console.log("Updating subscription status:", { type, active });
      
      // Set loading state in subscription status
      setSubscriptionLoading(true);
      
      // Call the API to upgrade the subscription
      const { data, error } = await api.subscription.upgradeSubscription(type);
      
      if (error) {
        console.error("API error upgrading subscription:", error);
        throw new Error(error);
      }
      
      console.log("Subscription upgrade API response:", data);
      
      // Fetch the updated subscription status from the backend
      const { data: subscriptionData, error: subscriptionError } = await api.subscription.getUserSubscription();
      
      if (subscriptionError) {
        console.error("Error fetching updated subscription:", subscriptionError);
        throw new Error("Failed to verify subscription update");
      }
      
      console.log("Updated subscription data:", subscriptionData);
      
      // Update the subscription status in the context
      setSubscriptionStatus({
        active: subscriptionData.subscription_type || type,
        type: subscriptionData.subscription_type || type,
        endDate: subscriptionData.end_date ? new Date(subscriptionData.end_date) : null,
      });
      
      // Update the profile as well to keep everything in sync
      setProfile(prevProfile => ({
        ...prevProfile,
        subscriptionType: subscriptionData.subscription_type || type
      }));
      
      // Show success toast
      toast({
        title: "Subscription updated",
        description: `Your subscription has been updated to ${type}.`
      });
      
      // Navigate to the appropriate dashboard based on the new subscription type and user type
      if (userType === 'recruiter') {
        navigate("/dashboard", { replace: true });
      } else {
        navigate(type === "free" ? "/free-plan-dashboard" : "/candidate-dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update subscription: " + (error.message || "Unknown error")
      });
    } finally {
      setSubscriptionLoading(false);
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