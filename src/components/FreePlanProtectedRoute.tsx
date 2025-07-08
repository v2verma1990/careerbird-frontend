import { useAuth } from "@/contexts/auth/AuthContext";
import { Navigate } from "react-router-dom";
import SubscriptionErrorBoundary from "./SubscriptionErrorBoundary";

export default function FreePlanProtectedRoute({ children }: { children: JSX.Element }) {
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
  
  // Redirect to login if user is not authenticated
  if (!user) {
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
        // Allow both candidates and recruiters on free plan dashboard
        // Redirect only if they have an active paid subscription
        if (subscriptionStatus?.type !== 'free' && 
            subscriptionStatus?.active && 
            !subscriptionStatus?.cancelled) {
          
          console.log(`Redirecting user with paid subscription (${subscriptionStatus.type}) to appropriate dashboard`);
          
          if (userType === 'recruiter') {
            return <Navigate to="/dashboard" replace />;
          } else if (userType === 'candidate') {
            return <Navigate to="/candidate-dashboard" replace />;
          }
        }
        
        return children;
      })()}
    </SubscriptionErrorBoundary>
  );
}