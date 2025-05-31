import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Badge } from '@/components/ui/badge';

const Navbar = () => {
  const { user, userType, profile, subscriptionStatus, signOut, restoringSession } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();

  // Check auth state on mount and when user changes
  useEffect(() => {
    // Only update login state when we're not restoring the session
    if (!restoringSession) {
      console.log("Auth state updated in Navbar:", !!user);
      setIsLoggedIn(!!user);
    }
  }, [user, restoringSession]);
  
  // Get subscription display name
  const getSubscriptionDisplay = () => {
    if (!subscriptionStatus || !subscriptionStatus.type) return '';
    return subscriptionStatus.type.charAt(0).toUpperCase() + subscriptionStatus.type.slice(1);
  };

  // Clear auth state completely on logout
  const handleLogout = async () => {
    console.log("Logging out user");
    await signOut();
    // Force a page reload to ensure all state is cleared
    window.location.href = '/';
  };

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">ResumeAI</Link>
        <div className="flex items-center space-x-4">
          {/* Show loading indicator while restoring session */}
          {restoringSession ? (
            <div className="flex items-center">
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
              <span>Loading...</span>
            </div>
          ) : isLoggedIn && user ? (
            <>
              <div className="hidden md:flex items-center mr-4">
                <Badge 
                  className={`${
                    subscriptionStatus && subscriptionStatus.type === 'premium' ? 'bg-green-500' : 
                    subscriptionStatus && subscriptionStatus.type === 'basic' ? 'bg-blue-500' : 
                    'bg-gray-500'
                  }`}
                >
                  {subscriptionStatus && subscriptionStatus.type ? getSubscriptionDisplay() + ' Plan' : 'Loading...'}
                </Badge>
              </div>
              <Link to={userType === 'candidate' ? 
                (subscriptionStatus && subscriptionStatus.type === 'free' ? '/free-plan-dashboard' : '/candidate-dashboard') : 
                (userType === 'recruiter' ? '/dashboard' : '/')
              }>
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link to="/upgrade">
                <Button variant="ghost">Subscription</Button>
              </Link>
              <Button variant="destructive" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/signup">
                <Button variant="outline">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
