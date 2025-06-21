import { useAuth } from "@/contexts/auth/AuthContext";
import { Navigate } from "react-router-dom";
import SubscriptionErrorBoundary from "./SubscriptionErrorBoundary";

export default function RecruiterProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, userType, subscriptionStatus, subscriptionLoading, restoringSession, fetchSubscriptionStatus } = useAuth();
  
  // Show loading indicator while session is being restored or subscription is loading
  if (restoringSession || subscriptionLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></span>
        <span className="ml-3">Loading...</span>
      </div>
    );
  }
  
  // Redirect to login if user is not authenticated or not a recruiter
  if (!user || userType !== 'recruiter') {
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
        // If subscription is free, inactive, or cancelled and expired, redirect to free plan dashboard
        if (subscriptionStatus?.type === 'free' || 
            !subscriptionStatus?.active || 
            (subscriptionStatus?.cancelled && subscriptionStatus?.endDate && new Date() >= subscriptionStatus.endDate)) {
          console.log(`Redirecting recruiter to free-plan-dashboard (subscription: ${subscriptionStatus?.type}, active: ${subscriptionStatus?.active}, cancelled: ${subscriptionStatus?.cancelled}, endDate: ${subscriptionStatus?.endDate})`);
          return <Navigate to="/free-plan-dashboard" replace />;
        }
        
        return children;
      })()}
    </SubscriptionErrorBoundary>
  );
}
