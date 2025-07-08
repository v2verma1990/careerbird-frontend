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
        // Free plan recruiters should go to free plan dashboard
        if (subscriptionStatus?.type === 'free') {
          console.log(`Redirecting free plan recruiter to free-plan-dashboard`);
          return <Navigate to="/free-plan-dashboard" replace />;
        }
        
        // Paid plan recruiters with inactive/cancelled subscriptions
        if (!subscriptionStatus?.active || 
            (subscriptionStatus?.cancelled && subscriptionStatus?.endDate && new Date() >= subscriptionStatus.endDate)) {
          console.log(`Redirecting recruiter with inactive subscription to free-plan-dashboard`);
          return <Navigate to="/free-plan-dashboard" replace />;
        }
        
        // Active paid subscription recruiters can access recruiter dashboard
        return children;
      })()}
    </SubscriptionErrorBoundary>
  );
}
