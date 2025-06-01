
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, FileText, Star, Zap, Users, Download, Eye } from "lucide-react";
import { useAuth } from "@/contexts/auth/AuthContext";
import { useEffect, useState } from "react";

const Index = () => {
  const { user, userType, subscriptionStatus, restoringSession } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Redirect authenticated users to their dashboard
  useEffect(() => {
    console.log("Index page - Auth state:", { 
      user: !!user, 
      userType, 
      subscriptionType: subscriptionStatus?.type,
      restoringSession 
    });
    
    // Only redirect after session restoration is complete
    if (restoringSession) {
      console.log("Session is still being restored, waiting...");
      return;
    }
    
    // Only redirect if we have a user and all required data
    if (user && userType && subscriptionStatus && !isRedirecting) {
      console.log("User is authenticated, redirecting to dashboard");
      setIsRedirecting(true);
      
      // User is authenticated, redirect to appropriate dashboard
      if (userType === 'recruiter') {
        console.log("Redirecting recruiter to /dashboard");
        navigate('/dashboard', { replace: true });
      } else if (userType === 'candidate') {
        if (subscriptionStatus?.type === 'free') {
          console.log("Redirecting free candidate to /free-plan-dashboard");
          navigate('/free-plan-dashboard', { replace: true });
        } else {
          console.log("Redirecting paid candidate to /candidate-dashboard");
          navigate('/candidate-dashboard', { replace: true });
        }
      } else {
        console.log("User type unknown, defaulting to candidate dashboard");
        navigate('/candidate-dashboard', { replace: true });
      }
    }
  }, [user, userType, subscriptionStatus, restoringSession, navigate, isRedirecting]);
  
  // Show loading indicator while checking auth state
  if (restoringSession) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Show loading indicator while redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative pt-24 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
          <div className="absolute top-40 left-1/2 w-60 h-60 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse delay-500"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-8 border border-blue-200">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Resume Builder
            </div>

            <h1 className="text-6xl md:text-7xl font-black text-gray-900 tracking-tight mb-6">
              Build Your Perfect{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Resume
              </span>
            </h1>
            
            <p className="mt-6 text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Create stunning, ATS-friendly resumes in minutes with our AI-powered templates and smart suggestions.
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-6">
              <Link to="/resume-optimizer">
                <Button size="lg" className="px-10 py-6 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl rounded-full transition-all duration-300 transform hover:scale-105">
                  Start Building
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="px-10 py-6 text-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full transition-all duration-300">
                <Eye className="mr-2 w-5 h-5" />
                View Templates
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">50K+</div>
                <div className="text-gray-600 mt-1">Resumes Created</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">95%</div>
                <div className="text-gray-600 mt-1">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">4.9★</div>
                <div className="text-gray-600 mt-1">User Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to{" "}
              <span className="text-blue-600">Succeed</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive suite of tools helps you create, optimize, and perfect your resume for any job application.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <div key={index} className="relative group">
                <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Preview */}
      <div className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Professional{" "}
              <span className="text-blue-600">Templates</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from our collection of beautifully designed, ATS-optimized resume templates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {templates.map((template, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 p-6 relative overflow-hidden">
                    <div className="w-full h-full bg-white rounded-lg shadow-sm p-4 transform group-hover:scale-105 transition-transform duration-300">
                      <div className="h-6 bg-blue-200 rounded mb-3"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{template.name}</h3>
                    <p className="text-gray-600">{template.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/resume-optimizer">
              <Button size="lg" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full">
                Explore All Templates
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Land Your Dream Job?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Join thousands of professionals who have successfully transformed their careers with our resume builder.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link to="/resume-optimizer">
              <Button size="lg" className="px-10 py-6 text-lg bg-white text-blue-600 hover:bg-gray-100 rounded-full font-semibold transition-all duration-300 transform hover:scale-105">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-10 py-6 text-lg border-2 border-white text-white hover:bg-white hover:text-blue-600 rounded-full transition-all duration-300">
              <Download className="mr-2 w-5 h-5" />
              Download Sample
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const features = [
  {
    icon: FileText,
    title: "Smart Templates",
    description: "Choose from professionally designed templates that are optimized for ATS systems and tailored for different industries."
  },
  {
    icon: Zap,
    title: "AI-Powered Suggestions",
    description: "Get intelligent recommendations for content, keywords, and formatting to make your resume stand out to employers."
  },
  {
    icon: Users,
    title: "Expert Review",
    description: "Access feedback from career experts and industry professionals to ensure your resume meets current standards."
  }
];

const templates = [
  {
    name: "Modern Professional",
    description: "Clean and contemporary design perfect for tech and creative roles."
  },
  {
    name: "Executive Classic",
    description: "Traditional layout ideal for senior positions and corporate environments."
  },
  {
    name: "Creative Designer",
    description: "Bold and artistic template for creative professionals and designers."
  }
];

export default Index;
