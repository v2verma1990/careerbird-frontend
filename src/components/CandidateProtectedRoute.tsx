import { useAuth } from "@/contexts/auth/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

export default function CandidateProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, userType, subscriptionStatus, subscriptionLoading, restoringSession } = useAuth();
  const location = useLocation();
  
  // Show loading indicator while session is being restored or subscription is loading
  if (restoringSession || subscriptionLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></span>
        <span className="ml-3">Loading...</span>
      </div>
    );
  }
  
  // Redirect to login if user is not authenticated or not a candidate
  if (!user || userType !== 'candidate') {
    return <Navigate to="/login" replace />;
  }
  
  // Handle subscription-specific routing
  const currentPath = location.pathname;
  
  console.log("CandidateProtectedRoute - Current state:", {
    path: currentPath,
    subscriptionType: subscriptionStatus?.type,
    userType
  });
  
  // If user is on free-plan-dashboard but has a paid subscription, redirect to candidate-dashboard
  if (currentPath === '/free-plan-dashboard' && subscriptionStatus?.type !== 'free') {
    console.log(`Redirecting from free-plan-dashboard to candidate-dashboard (subscription: ${subscriptionStatus?.type})`);
    return <Navigate to="/candidate-dashboard" replace />;
  }
  
  // If user is on candidate-dashboard but has a free subscription, redirect to free-plan-dashboard
  if (currentPath === '/candidate-dashboard' && subscriptionStatus?.type === 'free') {
    console.log(`Redirecting from candidate-dashboard to free-plan-dashboard (subscription: ${subscriptionStatus?.type})`);
    return <Navigate to="/free-plan-dashboard" replace />;
  }
  
  return children;
}
