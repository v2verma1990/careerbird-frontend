import { useAuth } from "@/contexts/auth/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, subscriptionStatus, subscriptionLoading, restoringSession } = useAuth();
  
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
  
  return children;
}
