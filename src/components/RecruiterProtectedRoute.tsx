import { useAuth } from "@/contexts/auth/AuthContext";
import { Navigate } from "react-router-dom";

export default function RecruiterProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, userType, subscriptionLoading } = useAuth();
  // Block rendering/redirect until session restoration is complete
  if (subscriptionLoading) return null; // or a spinner if you prefer
  if (!user || userType !== 'recruiter') return <Navigate to="/login" replace />;
  return children;
}
