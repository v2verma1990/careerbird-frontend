
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth/AuthContext';

const Navbar = () => {
  const { user, userType, signOut, restoringSession } = useAuth();
  const [authState, setAuthState] = useState<'loading' | 'logged-in' | 'logged-out'>('loading');
  const location = useLocation();

  // Simplified auth state management
  useEffect(() => {
    // Always show loading while restoring session
    if (restoringSession) {
      console.log("Session being restored");
      setAuthState('loading');
      return;
    }

    console.log("Auth state updated in Navbar:", {
      user: !!user,
      userType,
      restoringSession
    });

    // Only consider user fully logged in when we have both user AND userType
    if (user && userType) {
      console.log("User fully authenticated, showing logged in state");
      setAuthState('logged-in');
    } else {
      console.log("User not authenticated or incomplete auth, showing logged out state");
      setAuthState('logged-out');
    }
  }, [user, userType, restoringSession]);

  // Handle logout with immediate state change
  const handleLogout = async () => {
    console.log("Logging out user");
    // Immediately set to loading state to prevent any flashing
    setAuthState('loading');
    
    try {
      await signOut();
      // The signOut function should handle navigation, but we can ensure it here
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Even on error, redirect to login
      window.location.href = '/login';
    }
  };

  // Don't show navbar on dashboard pages (they have TopNavigation)
  const isDashboardPage = location.pathname.includes('/candidate-dashboard') || 
                          location.pathname.includes('/dashboard') || 
                          location.pathname.includes('/free-plan-dashboard');

  if (isDashboardPage && authState === 'logged-in') {
    return null;
  }

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">ResumeAI</Link>
        <div className="flex items-center space-x-4">
          {authState === 'loading' ? (
            <div className="flex items-center">
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
              <span>Loading...</span>
            </div>
          ) : authState === 'logged-in' ? (
            <>
              <Link to={userType === 'candidate' ? '/candidate-dashboard' : '/dashboard'}>
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
