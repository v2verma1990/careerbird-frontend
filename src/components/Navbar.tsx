
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth/AuthContext';

const Navbar = () => {
  const { user, userType, signOut, restoringSession } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthButtons, setShowAuthButtons] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const location = useLocation();

  // Check auth state on mount and when user changes
  useEffect(() => {
    // Don't update anything while restoring session
    if (restoringSession) {
      console.log("Session being restored, hiding buttons");
      setShowAuthButtons(false);
      setIsLoggingIn(true);
      return;
    }

    console.log("Auth state updated in Navbar:", {
      user: !!user,
      userType,
      restoringSession
    });

    // If we have a user but no userType yet, we're in the process of logging in
    if (user && !userType) {
      console.log("User exists but userType not set yet, still logging in");
      setIsLoggingIn(true);
      setShowAuthButtons(false);
      return;
    }

    // If we have both user and userType, login is complete
    if (user && userType) {
      console.log("Login complete, showing logged in state");
      setIsLoggedIn(true);
      setIsLoggingIn(false);
      // Small delay to ensure smooth transition
      setTimeout(() => {
        setShowAuthButtons(true);
      }, 150);
      return;
    }

    // No user means logged out
    if (!user) {
      console.log("No user, showing logged out state");
      setIsLoggedIn(false);
      setIsLoggingIn(false);
      setTimeout(() => {
        setShowAuthButtons(true);
      }, 100);
    }
  }, [user, userType, restoringSession]);

  // Clear auth state completely on logout
  const handleLogout = async () => {
    console.log("Logging out user");
    setShowAuthButtons(false);
    setIsLoggingIn(false);
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
          {/* Show loading indicator while restoring session or logging in */}
          {restoringSession || isLoggingIn || !showAuthButtons ? (
            <div className="flex items-center">
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
              <span>Loading...</span>
            </div>
          ) : isLoggedIn && user && userType ? (
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
