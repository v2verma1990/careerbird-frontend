import React from 'react';
import { useAuth } from "@/contexts/auth/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

export default function CandidateProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, userType, subscriptionStatus, subscriptionLoading, restoringSession } = useAuth();
  const location = useLocation();
  
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
  if (restoringSession || subscriptionLoading) {
    console.log("Showing loading indicator while session is being restored");
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></span>
        <span className="ml-3">Loading...</span>
      </div>
    );
  }
  
  // Redirect to login if user is not authenticated or not a candidate
  if (!user || userType !== 'candidate') {
    console.log("User not authenticated or not a candidate, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  // Handle subscription-specific routing
  const currentPath = location.pathname;
  
  console.log("CandidateProtectedRoute - Current state:", {
    path: currentPath,
    subscriptionType: subscriptionStatus?.type,
    userType
  });
  
  // If user is on free-plan-dashboard but has an active paid subscription, redirect to candidate-dashboard
  // If subscription is cancelled but still active (end date not reached), also redirect to candidate-dashboard
  if (currentPath === '/free-plan-dashboard' && 
      subscriptionStatus?.type !== 'free' && 
      subscriptionStatus?.active && 
      (!subscriptionStatus?.cancelled || (subscriptionStatus?.endDate && new Date() < subscriptionStatus.endDate))) {
    console.log(`Redirecting from free-plan-dashboard to candidate-dashboard (subscription: ${subscriptionStatus?.type}, active: ${subscriptionStatus?.active}, cancelled: ${subscriptionStatus?.cancelled}, endDate: ${subscriptionStatus?.endDate})`);
    return <Navigate to="/candidate-dashboard" replace />;
  }
  
  // If user is on candidate-dashboard but has a free subscription or their subscription has ended, redirect to free-plan-dashboard
  if (currentPath === '/candidate-dashboard' && 
      (subscriptionStatus?.type === 'free' || !subscriptionStatus?.active || 
       (subscriptionStatus?.cancelled && subscriptionStatus?.endDate && new Date() >= subscriptionStatus.endDate))) {
    console.log(`Redirecting from candidate-dashboard to free-plan-dashboard (subscription: ${subscriptionStatus?.type}, active: ${subscriptionStatus?.active}, cancelled: ${subscriptionStatus?.cancelled}, endDate: ${subscriptionStatus?.endDate})`);
    return <Navigate to="/free-plan-dashboard" replace />;
  }
  
  // If subscription is cancelled but still active (end date not reached), stay on candidate dashboard
  // This is handled implicitly by the above conditions
  
  return children;
}
