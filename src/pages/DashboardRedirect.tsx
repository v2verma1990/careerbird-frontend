import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';

/**
 * This component serves as a direct redirect to the appropriate dashboard
 * It's designed to be used as a fallback when normal navigation fails
 */
export default function DashboardRedirect() {
  const { user, userType, subscriptionStatus, restoringSession } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Wait for auth to be ready
    if (restoringSession) {
      console.log("Waiting for session restoration...");
      return;
    }
    
    console.log("DashboardRedirect - Current state:", {
      user: !!user,
      userType,
      subscriptionType: subscriptionStatus?.type,
      active: subscriptionStatus?.active
    });
    
    // Determine the correct dashboard path
    let dashboardPath = '/';
    
    if (!user) {
      console.log("No user found, redirecting to login");
      dashboardPath = '/login';
    } else if (userType === 'recruiter') {
      console.log("User is a recruiter, redirecting to recruiter dashboard");
      dashboardPath = '/dashboard';
    } else if (userType === 'candidate') {
      if (subscriptionStatus === null) {
        console.log("Subscription status is null - showing error instead of redirecting");
        // Don't redirect, let the component handle the null state
        return;
      } else if (subscriptionStatus?.type === 'free' || !subscriptionStatus?.active) {
        console.log("User is a candidate with free plan, redirecting to free dashboard");
        dashboardPath = '/free-plan-dashboard';
      } else {
        console.log("User is a candidate with paid plan, redirecting to candidate dashboard");
        dashboardPath = '/candidate-dashboard';
      }
    }
    
    console.log(`Redirecting to: ${dashboardPath}`);
    navigate(dashboardPath, { replace: true });
  }, [user, userType, subscriptionStatus, restoringSession, navigate]);
  
  // Show error if subscription status is null for candidates
  if (user && userType === 'candidate' && subscriptionStatus === null && !restoringSession) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl font-semibold mb-4">
            Subscription Service Unavailable
          </div>
          <p className="text-gray-600 mb-4">
            Unable to load your subscription information. Please contact support or try again later.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}