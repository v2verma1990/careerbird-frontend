import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Badge } from '@/components/ui/badge';

const Navbar = () => {
  const { user, userType, profile, subscriptionStatus, signOut } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check auth state on mount and when user changes
  useEffect(() => {
    setIsLoggedIn(!!user);
  }, [user]);
  
  // Get subscription display name
  const getSubscriptionDisplay = () => {
    if (!subscriptionStatus || !subscriptionStatus.type) return '';
    return subscriptionStatus.type.charAt(0).toUpperCase() + subscriptionStatus.type.slice(1);
  };

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">ResumeAI</Link>
        <div className="flex items-center space-x-4">
          {isLoggedIn && profile && (
            <div className="hidden md:flex items-center mr-4">
              <Badge 
                className={`$ {
                  subscriptionStatus && subscriptionStatus.type === 'premium' ? 'bg-green-500' : 
                  subscriptionStatus && subscriptionStatus.type === 'basic' ? 'bg-blue-500' : 
                  'bg-gray-500'
                }`}
              >
                {subscriptionStatus && subscriptionStatus.type ? getSubscriptionDisplay() + ' Plan' : 'Loading...'}
              </Badge>
            </div>
          )}
          {isLoggedIn ? (
            <>
              <Link to={userType === 'candidate' ? 
                (subscriptionStatus && subscriptionStatus.type === 'free' ? '/free-plan-dashboard' : '/candidate-dashboard') : 
                (userType === 'recruiter' ? '/dashboard' : '/')
              }>
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link to="/upgrade">
                <Button variant="ghost">Subscription</Button>
              </Link>
              <Button variant="destructive" onClick={signOut}>Logout</Button>
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
