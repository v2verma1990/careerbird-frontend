
import React from 'react';
import { useAuth } from "@/contexts/auth/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import SubscriptionErrorBoundary from "./SubscriptionErrorBoundary";

export default function CandidateProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, userType, subscriptionStatus, subscriptionLoading, restoringSession, fetchSubscriptionStatus } = useAuth();
  const location = useLocation();
  
  // Add a timeout to prevent infinite loading in the component itself
  const [componentTimeout, setComponentTimeout] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (restoringSession) {
        console.log("CandidateProtectedRoute: Timeout reached, forcing navigation to login");
        setComponentTimeout(true);
      }
    }, 8000); // 8 second timeout
    
    return () => clearTimeout(timer);
  }, [restoringSession]);
  
  // Debug effect to track auth state changes
  React.useEffect(() => {
    console.log("CandidateProtectedRoute auth state:", {
      user: !!user,
      userType,
      subscriptionStatus: subscriptionStatus ? { 
        type: subscriptionStatus.type, 
        active: subscriptionStatus.active,
        cancelled: subscriptionStatus.cancelled,
        endDate: subscriptionStatus.endDate ? subscriptionStatus.endDate.toString() : null
      } : null,
      subscriptionLoading,
      restoringSession,
      componentTimeout,
      path: location.pathname
    });
  }, [user, userType, subscriptionStatus, subscriptionLoading, restoringSession, componentTimeout, location.pathname]);
  
  // Check if we're coming from the account page
  const isFromAccountPage = React.useMemo(() => {
    // Check if the referrer is the account page
    if (typeof document !== 'undefined') {
      const referrer = document.referrer;
      if (referrer && referrer.includes('/account')) {
        console.log("Detected navigation from account page");
        return true;
      }
    }
    
    // Also check for a special flag in sessionStorage
    try {
      const fromAccountPage = sessionStorage.getItem('from_account_page');
      if (fromAccountPage === 'true') {
        console.log("Found from_account_page flag in sessionStorage");
        // Clear the flag after using it
        sessionStorage.removeItem('from_account_page');
        return true;
      }
    } catch (error) {
      console.error("Error checking sessionStorage:", error);
    }
    
    return false;
  }, []);
  
  // If we're coming from the account page, render the children immediately
  // This bypasses the auth check temporarily to prevent the login redirect
  if (isFromAccountPage) {
    console.log("Bypassing auth check because we're coming from account page");
    return children;
  }
  
  // Show loading indicator while session is being restored or subscription is loading
  // But not if we've hit the component timeout
  if ((restoringSession || subscriptionLoading) && !componentTimeout) {
    console.log("Showing loading indicator:", { restoringSession, subscriptionLoading, user: !!user, userType, componentTimeout });
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4 block"></span>
          <span className="text-gray-600">
            {restoringSession ? "Checking your session..." : "Loading subscription..."}
          </span>
        </div>
      </div>
    );
  }
  
  // Redirect to login if user is not authenticated or not a candidate, or if we hit timeout
  if (!user || userType !== 'candidate' || componentTimeout) {
    console.log("User not authenticated, not a candidate, or timeout reached - redirecting to login", {
      hasUser: !!user,
      userType,
      componentTimeout
    });
    return <Navigate to="/login" replace />;
  }

  // Use the subscription error boundary to handle null subscription status
  return (
    <SubscriptionErrorBoundary 
      subscriptionStatus={subscriptionStatus}
      subscriptionLoading={subscriptionLoading}
      onRetry={() => fetchSubscriptionStatus && fetchSubscriptionStatus()}
    >
      {(() => {
        // Handle subscription-specific routing
        const currentPath = location.pathname;
        
        // Enhanced logging for subscription routing decisions
        console.log("CandidateProtectedRoute - Making routing decision:", {
          currentPath,
          subscriptionType: subscriptionStatus?.type,
          subscriptionActive: subscriptionStatus?.active,
          subscriptionCancelled: subscriptionStatus?.cancelled,
          subscriptionEndDate: subscriptionStatus?.endDate ? subscriptionStatus.endDate.toString() : null,
          userType,
          decision: "analyzing..."
        });
        
        // Check if user has an active non-free subscription
        const hasActivePaidSubscription = subscriptionStatus && 
          subscriptionStatus.type !== 'free' && 
          subscriptionStatus.active && 
          (!subscriptionStatus.cancelled || (subscriptionStatus.endDate && new Date() < subscriptionStatus.endDate));
        
        console.log("CandidateProtectedRoute - Subscription analysis:", {
          hasActivePaidSubscription,
          type: subscriptionStatus?.type,
          active: subscriptionStatus?.active,
          cancelled: subscriptionStatus?.cancelled,
          endDateInFuture: subscriptionStatus?.endDate ? new Date() < subscriptionStatus.endDate : false,
          currentDate: new Date().toString(),
          endDate: subscriptionStatus?.endDate ? subscriptionStatus.endDate.toString() : null
        });
        
        // If user is on free-plan-dashboard but has an active paid subscription, redirect to candidate-dashboard
        if (currentPath === '/free-plan-dashboard' && hasActivePaidSubscription) {
          console.log(`REDIRECT: From free-plan-dashboard to candidate-dashboard because user has active ${subscriptionStatus?.type} subscription`);
          return <Navigate to="/candidate-dashboard" replace />;
        }
        
        // If user is on candidate-dashboard but doesn't have an active paid subscription, redirect to free-plan-dashboard
        if (currentPath === '/candidate-dashboard' && !hasActivePaidSubscription) {
          console.log(`REDIRECT: From candidate-dashboard to free-plan-dashboard because user subscription is not active paid (type: ${subscriptionStatus?.type}, active: ${subscriptionStatus?.active}, cancelled: ${subscriptionStatus?.cancelled})`);
          return <Navigate to="/free-plan-dashboard" replace />;
        }
        
        console.log("CandidateProtectedRoute - No redirect needed, rendering children");
        return children;
      })()}
    </SubscriptionErrorBoundary>
  );
}
