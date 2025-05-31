import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user, userType, subscriptionStatus, restoringSession } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if user is already authenticated
  useEffect(() => {
    // Don't do anything while session is being restored
    if (restoringSession) {
      return;
    }
    
    // Only redirect if we have a user and all required data
    if (user && userType && subscriptionStatus) {
      console.log("Login: User authenticated, redirecting", { userType, subscriptionType: subscriptionStatus?.type });
      
      // User is already logged in, redirect to appropriate dashboard
      if (userType === 'recruiter') {
        navigate('/dashboard', { replace: true });
      } else if (userType === 'candidate') {
        if (subscriptionStatus?.type === 'free') {
          navigate('/free-plan-dashboard', { replace: true });
        } else {
          navigate('/candidate-dashboard', { replace: true });
        }
      } else {
        // Default fallback
        navigate('/', { replace: true });
      }
    }
  }, [user, userType, subscriptionStatus, restoringSession, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signIn(email, password);
      // Success toast is shown in AuthContext
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Could not sign you in. Please check your credentials and try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row w-full max-w-4xl shadow-lg rounded-lg overflow-hidden bg-white">
        {/* Sidebar with plan info */}
        <div className="hidden md:flex flex-col justify-center bg-blue-50 p-8 w-1/2 border-r">
          <h2 className="text-2xl font-bold mb-4 text-blue-700">Why Upgrade?</h2>
          <ul className="space-y-3 text-blue-900">
            <li>✓ More resume scans per month</li>
            <li>✓ Advanced ATS feedback</li>
            <li>✓ AI-powered customization</li>
            <li>✓ Cover letter & interview tools</li>
            <li>✓ Priority support</li>
          </ul>
          <div className="mt-8">
            <Button asChild variant="outline" className="w-full border-blue-600 text-blue-600">
              <Link to="/upgrade">See Plans</Link>
            </Button>
          </div>
        </div>
        {/* Login form */}
        <div className="flex-1 p-8">
          <Card className="max-w-md w-full mx-auto space-y-8 p-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Sign in to your account
              </h2>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="rounded-md shadow-sm space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <Link to="/forgot-password" className="text-blue-600 hover:underline text-sm">Forgot password?</Link>
                <Link to="/signup" className="text-blue-600 hover:underline text-sm">Sign up</Link>
              </div>
              <div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
