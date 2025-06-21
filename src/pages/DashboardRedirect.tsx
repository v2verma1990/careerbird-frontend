
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
      console.log("DashboardRedirect: Waiting for session restoration...");
      return;
    }
    
    console.log("DashboardRedirect - Current state:", {
      user: !!user,
      userType,
      subscriptionType: subscriptionStatus?.type,
      active: subscriptionStatus?.active,
      cancelled: subscriptionStatus?.cancelled,
      endDate: subscriptionStatus?.endDate ? subscriptionStatus.endDate.toString() : null
    });
    
    // Determine the correct dashboard path
    let dashboardPath = '/';
    
    if (!user) {
      console.log("DashboardRedirect: No user found, redirecting to login");
      dashboardPath = '/login';
    } else if (userType === 'recruiter') {
      console.log("DashboardRedirect: User is a recruiter, redirecting to recruiter dashboard");
      dashboardPath = '/dashboard';
    } else if (userType === 'candidate') {
      if (subscriptionStatus === null) {
        console.log("DashboardRedirect: Subscription status is null - showing error instead of redirecting");
        // Don't redirect, let the component handle the null state
        return;
      } else {
        // Check if user has an active non-free subscription
        const hasActivePaidSubscription = subscriptionStatus && 
          subscriptionStatus.type !== 'free' && 
          subscriptionStatus.active && 
          (!subscriptionStatus.cancelled || (subscriptionStatus.endDate && new Date() < subscriptionStatus.endDate));
        
        console.log("DashboardRedirect: Subscription analysis:", {
          hasActivePaidSubscription,
          type: subscriptionStatus?.type,
          active: subscriptionStatus?.active,
          cancelled: subscriptionStatus?.cancelled,
          endDateInFuture: subscriptionStatus?.endDate ? new Date() < subscriptionStatus.endDate : false
        });
        
        if (hasActivePaidSubscription) {
          console.log("DashboardRedirect: User is a candidate with active paid plan, redirecting to candidate dashboard");
          dashboardPath = '/candidate-dashboard';
        } else {
          console.log("DashboardRedirect: User is a candidate with free plan or inactive subscription, redirecting to free dashboard");
          dashboardPath = '/free-plan-dashboard';
        }
      }
    }
    
    console.log(`DashboardRedirect: Redirecting to: ${dashboardPath}`);
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
