
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Play } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user, userType, subscriptionStatus, restoringSession } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if user is already authenticated
  useEffect(() => {
    if (restoringSession) {
      return;
    }
    
    if (user && userType && subscriptionStatus) {
      console.log("Login: User authenticated, redirecting", { userType, subscriptionType: subscriptionStatus?.type });
      
      if (userType === 'recruiter') {
        navigate('/dashboard', { replace: true });
      } else if (userType === 'candidate') {
        if (subscriptionStatus?.type === 'free') {
          navigate('/free-plan-dashboard', { replace: true });
        } else {
          navigate('/candidate-dashboard', { replace: true });
        }
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, userType, subscriptionStatus, restoringSession, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signIn(email, password);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row w-full max-w-6xl shadow-2xl rounded-2xl overflow-hidden bg-white">
        {/* Video Demo Section */}
        <div className="lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 flex flex-col justify-center">
          <div className="text-white mb-8">
            <h2 className="text-3xl font-bold mb-4">See ResumeAI in Action</h2>
            <p className="text-blue-100 mb-6">
              Watch how our AI-powered platform can transform your career journey or streamline your hiring process.
            </p>
          </div>
          
          {/* Video Placeholder */}
          <div className="relative bg-black/20 rounded-lg overflow-hidden aspect-video mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/20 rounded-full p-4 backdrop-blur-sm">
                <Play className="w-12 h-12 text-white" />
              </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-white text-sm">
                Video placeholder - Upload your demo video here
              </p>
            </div>
          </div>

          <div className="space-y-3 text-blue-100">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
              <span>AI-powered resume optimization</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
              <span>Intelligent candidate matching</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
              <span>Real-time ATS compatibility scoring</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
              <span>Interview preparation tools</span>
            </div>
          </div>
        </div>

        {/* Login Form Section */}
        <div className="lg:w-1/2 p-8 flex items-center justify-center">
          <Card className="w-full max-w-md border-0 shadow-none">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl font-bold text-gray-900">
                Welcome Back
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Sign in to access your dashboard
              </p>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="h-12"
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
                    className="h-12"
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <Link to="/forgot-password" className="text-blue-600 hover:underline text-sm">
                    Forgot password?
                  </Link>
                  <Link to="/signup" className="text-blue-600 hover:underline text-sm">
                    Create account
                  </Link>
                </div>
                
                <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
