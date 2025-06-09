
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth/AuthContext';

const Navbar = () => {
  const { user, userType, signOut, restoringSession } = useAuth();
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

  // Clear auth state completely on logout
  const handleLogout = async () => {
    console.log("Logging out user");
    await signOut();
    // Force a page reload to ensure all state is cleared
    window.location.href = '/';
  };

  // Don't show navbar on dashboard pages (they have TopNavigation)
  const isDashboardPage = location.pathname.includes('/candidate-dashboard') || 
                          location.pathname.includes('/dashboard') || 
                          location.pathname.includes('/free-plan-dashboard');

  if (isDashboardPage && isLoggedIn) {
    return null;
  }

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
