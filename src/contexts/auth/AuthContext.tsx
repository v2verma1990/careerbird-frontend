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
          active: true,
          type: 'free',
          endDate: null,
          cancelled: false,
        });
      } else {
        console.log("Fetched Subscription Data:", data);
        setSubscriptionStatus({
          active: data.is_active !== undefined ? data.is_active : true,
          type: data.subscription_type || 'free',
          endDate: data.end_date ? new Date(data.end_date) : null,
          cancelled: data.is_cancelled || false,
        });
      }
    } catch (error) {
      console.error("Error in fetchSubscriptionStatus:", error);
      // Set a default free subscription if there's an exception
      setSubscriptionStatus({
        active: true,
        type: 'free',
        endDate: null,
        cancelled: false,
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
              active: true,
              type: 'free',
              endDate: null,
              cancelled: false,
            });
          } else {
            console.log("Subscription data received:", subscriptionData);
            // Set the actual subscription data
            setSubscriptionStatus({
              active: subscriptionData.is_active !== undefined ? subscriptionData.is_active : true,
              type: subscriptionData.subscription_type || 'free',
              endDate: subscriptionData.end_date ? new Date(subscriptionData.end_date) : null,
              cancelled: subscriptionData.is_cancelled || false,
            });
          }
          
          // Navigate based on user type and subscription after fetching subscription data
          if (data.profile?.userType === "recruiter") {
            console.log("Navigating to recruiter dashboard");
            navigate("/dashboard", { replace: true });
          } else if (data.profile?.userType === "candidate") {
            const subType = subscriptionData?.subscription_type || 'free';
            const isActive = subscriptionData?.is_active !== undefined ? subscriptionData.is_active : true;
            
            console.log("Navigating based on subscription:", {
              type: subType,
              active: isActive,
              cancelled: subscriptionData?.is_cancelled
            });
            
            // If subscription is active and not free, go to candidate dashboard
            // Otherwise go to free plan dashboard
            if (subType !== 'free' && isActive) {
              console.log("Navigating to premium candidate dashboard");
              navigate("/candidate-dashboard", { replace: true });
            } else {
              console.log("Navigating to free plan dashboard");
              navigate("/free-plan-dashboard", { replace: true });
            }
          } else {
            console.error("Unexpected userType:", data.profile?.userType);
            // Default to free plan dashboard for security
            console.log("Unknown user type, defaulting to free plan dashboard");
            navigate("/free-plan-dashboard", { replace: true });
            toast({
              variant: "destructive",
              title: "Warning",
              description: `Unknown user type detected. Please contact support if this issue persists.`
            });
          }
        } catch (error) {
          console.error("Error in subscription fetch:", error);
          // Set default subscription if there's an exception
          setSubscriptionStatus({
            active: true,
            type: 'free',
            endDate: null,
            cancelled: false,
          });
          
          // Navigate to a safe default
          if (data.profile?.userType === "recruiter") {
            console.log("Error occurred, but still navigating to recruiter dashboard");
            navigate("/dashboard", { replace: true });
          } else {
            console.log("Error occurred, navigating to free plan dashboard");
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

  // --- CANCEL SUBSCRIPTION ---
  const cancelSubscription = async () => {
    if (!user) {
      console.error("Cannot cancel subscription: No user logged in");
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to cancel your subscription."
      });
      return;
    }
    
    try {
      console.log("Cancelling subscription");
      setSubscriptionLoading(true);
      
      // Call the API to cancel the subscription but maintain access until end date
      const { data, error } = await api.subscription.cancelSubscription();
      
      if (error) {
        console.error("API error cancelling subscription:", error);
        throw new Error(error);
      }
      
      console.log("Subscription cancellation API response:", data);
      
      // Fetch the updated subscription status from the backend
      const { data: subscriptionData, error: subscriptionError } = await api.subscription.getUserSubscription();
      
      if (subscriptionError) {
        console.error("Error fetching updated subscription:", subscriptionError);
        throw new Error("Failed to verify subscription update");
      }
      
      console.log("Updated subscription data after cancellation:", subscriptionData);
      
      // Calculate and log the remaining days
      let daysRemaining = 0;
      if (subscriptionData.end_date) {
        const endDate = new Date(subscriptionData.end_date);
        const today = new Date();
        const diffTime = endDate.getTime() - today.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        console.log(`Remaining days in subscription: ${daysRemaining > 0 ? daysRemaining : 0}`);
      }
      
      // Check if the current subscription status has a different number of days remaining
      if (subscriptionStatus?.endDate) {
        const currentEndDate = new Date(subscriptionStatus.endDate);
        const today = new Date();
        const currentDiffTime = currentEndDate.getTime() - today.getTime();
        const currentDaysRemaining = Math.ceil(currentDiffTime / (1000 * 60 * 60 * 24));
        
        console.log(`Current days remaining before update: ${currentDaysRemaining > 0 ? currentDaysRemaining : 0}`);
        console.log(`New days remaining after cancellation: ${daysRemaining > 0 ? daysRemaining : 0}`);
        
        // If there's a significant difference and we're not extending the subscription
        if (Math.abs(currentDaysRemaining - daysRemaining) > 1 && currentDaysRemaining < daysRemaining) {
          console.warn(`Days remaining changed unexpectedly after cancellation. Using original days remaining.`);
          // Use the original end date to preserve the days remaining
          subscriptionData.end_date = subscriptionStatus.endDate.toISOString();
        }
      }
      
      // Calculate the original days remaining before cancellation
      let originalDaysRemaining = null;
      if (subscriptionStatus?.endDate) {
        const currentEndDate = new Date(subscriptionStatus.endDate);
        const today = new Date();
        const currentDiffTime = currentEndDate.getTime() - today.getTime();
        originalDaysRemaining = Math.ceil(currentDiffTime / (1000 * 60 * 60 * 24));
        originalDaysRemaining = originalDaysRemaining > 0 ? originalDaysRemaining : 0;
        console.log(`Original days remaining before cancellation: ${originalDaysRemaining}`);
      }
      
      // Directly use the subscription data from the backend
      // This ensures we get the correct end date and status
      // Important: We must preserve the original subscription type when cancelling
      const newStatus = {
        active: subscriptionData.is_active !== undefined ? subscriptionData.is_active : true,
        // Keep the original subscription type (premium, basic, recruiter) even when cancelled
        type: subscriptionData.subscription_type,
        cancelled: subscriptionData.is_cancelled !== undefined ? subscriptionData.is_cancelled : true,
        endDate: subscriptionData.end_date ? new Date(subscriptionData.end_date) : null,
        originalDaysRemaining: originalDaysRemaining // Store the original days remaining
      };
      
      console.log("New subscription status after cancellation:", newStatus);
      console.log(`User cancelled ${newStatus.type} plan. Will maintain access until ${newStatus.endDate} and then revert to free plan.`);
      
      console.log("Setting subscription status in frontend to:", newStatus);
      setSubscriptionStatus(newStatus);
      
      // Show success toast
      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled. You will continue to have access until the end of your billing period."
      });
      
      // Stay on the current dashboard since the user still has access
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel subscription: " + (error.message || "Unknown error")
      });
    } finally {
      setSubscriptionLoading(false);
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
    
    // Don't do anything if user is already on this plan AND it's not cancelled
    if (subscriptionStatus?.type === type && !subscriptionStatus?.cancelled) {
      console.log(`User is already on active ${type} plan, no need to upgrade`);
      toast({
        title: "Already subscribed",
        description: `You are already on the ${type} plan.`
      });
      return;
    }
    
    // If the subscription is cancelled, allow renewal even to the same plan type
    if (subscriptionStatus?.type === type && subscriptionStatus?.cancelled) {
      console.log(`User has a cancelled ${type} plan, allowing renewal`);
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
      const newSubscriptionStatus = {
        active: subscriptionData.is_active !== undefined ? subscriptionData.is_active : true,
        type: subscriptionData.subscription_type || type,
        endDate: subscriptionData.end_date ? new Date(subscriptionData.end_date) : null,
        cancelled: false, // Reset cancelled flag when upgrading
      };
      
      console.log("Setting new subscription status after upgrade:", newSubscriptionStatus);
      console.log(`User upgraded to ${newSubscriptionStatus.type} plan with end date ${newSubscriptionStatus.endDate}`);
      
      setSubscriptionStatus(newSubscriptionStatus);
      
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
        cancelSubscription, 
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