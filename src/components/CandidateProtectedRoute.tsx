
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
  
  // Memoize subscription status to prevent unnecessary re-renders due to Date object recreation
  const stableSubscriptionStatus = React.useMemo(() => {
    if (!subscriptionStatus) return null;
    return {
      type: subscriptionStatus.type,
      active: subscriptionStatus.active,
      cancelled: subscriptionStatus.cancelled,
      endDate: subscriptionStatus.endDate ? subscriptionStatus.endDate.getTime() : null // Use timestamp instead of Date object
    };
  }, [subscriptionStatus?.type, subscriptionStatus?.active, subscriptionStatus?.cancelled, subscriptionStatus?.endDate?.getTime()]);

  // Debug effect to track auth state changes (reduced logging)
  React.useEffect(() => {
    // Only log when there are significant state changes, not on every render
    if (restoringSession || subscriptionLoading || componentTimeout) {
      console.log("CandidateProtectedRoute auth state change:", {
        user: !!user,
        userType,
        subscriptionType: stableSubscriptionStatus?.type,
        subscriptionLoading,
        restoringSession,
        componentTimeout,
        path: location.pathname
      });
    }
  }, [user, userType, stableSubscriptionStatus, subscriptionLoading, restoringSession, componentTimeout, location.pathname]);
  
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
        
        // Check if user has an active non-free subscription using stable subscription status
        const hasActivePaidSubscription = stableSubscriptionStatus && 
          stableSubscriptionStatus.type !== 'free' && 
          stableSubscriptionStatus.active && 
          (!stableSubscriptionStatus.cancelled || (stableSubscriptionStatus.endDate && Date.now() < stableSubscriptionStatus.endDate));
        
        // Only log when there's a potential redirect or on specific paths
        const shouldLog = currentPath === '/free-plan-dashboard' || currentPath === '/candidate-dashboard';
        
        if (shouldLog) {
          console.log("CandidateProtectedRoute - Routing decision for:", currentPath, {
            subscriptionType: stableSubscriptionStatus?.type,
            hasActivePaidSubscription,
            willRedirect: (currentPath === '/free-plan-dashboard' && hasActivePaidSubscription) || 
                         (currentPath === '/candidate-dashboard' && !hasActivePaidSubscription)
          });
        }
        
        // If user is on free-plan-dashboard but has an active paid subscription, redirect to candidate-dashboard
        if (currentPath === '/free-plan-dashboard' && hasActivePaidSubscription) {
          console.log(`REDIRECT: From free-plan-dashboard to candidate-dashboard (${stableSubscriptionStatus?.type} subscription)`);
          return <Navigate to="/candidate-dashboard" replace />;
        }
        
        // If user is on candidate-dashboard but doesn't have an active paid subscription, redirect to free-plan-dashboard
        if (currentPath === '/candidate-dashboard' && !hasActivePaidSubscription) {
          console.log(`REDIRECT: From candidate-dashboard to free-plan-dashboard (subscription: ${stableSubscriptionStatus?.type})`);
          return <Navigate to="/free-plan-dashboard" replace />;
        }
        return children;
      })()}
    </SubscriptionErrorBoundary>
  );
}
