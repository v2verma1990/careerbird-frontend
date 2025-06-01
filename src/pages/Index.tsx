
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, FileText, Star, Zap, Users, Download, Eye, Target, Brain, BarChart3, MessageSquare, CheckCircle, UserCheck, TrendingUp, FileSearch, Award, Briefcase } from "lucide-react";
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
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm font-medium mb-8 border border-blue-200">
              <Brain className="w-4 h-4 mr-2" />
              AI-Powered Career Platform
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight mb-6">
              Your Complete{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Career Toolkit
              </span>
            </h1>
            
            <p className="mt-6 text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              From AI-powered resume optimization to intelligent candidate matching - everything you need to succeed in your career journey.
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-6">
              <Link to="/resume-optimizer">
                <Button size="lg" className="px-10 py-6 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl rounded-full transition-all duration-300 transform hover:scale-105">
                  Start Your Journey
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="px-10 py-6 text-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full transition-all duration-300">
                <Eye className="mr-2 w-5 h-5" />
                Explore Features
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">50K+</div>
                <div className="text-gray-600 mt-1">Resumes Optimized</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">15K+</div>
                <div className="text-gray-600 mt-1">Candidates Matched</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">95%</div>
                <div className="text-gray-600 mt-1">ATS Pass Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">4.9★</div>
                <div className="text-gray-600 mt-1">User Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Platform Section */}
      <div className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Built for{" "}
              <span className="text-blue-600">Everyone</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're advancing your career or finding the perfect talent, our AI-powered platform has you covered.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Candidates Section */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-3xl border border-blue-100">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 ml-4">For Candidates</h3>
                </div>
                <p className="text-gray-600 mb-8">Optimize your career potential with AI-powered tools</p>
                
                <div className="space-y-4">
                  {candidateFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="ml-3">
                        <span className="font-semibold text-gray-900">{feature.title}</span>
                        <p className="text-gray-600 text-sm">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Link to="/resume-optimizer" className="block mt-8">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3">
                    Start Optimizing
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Recruiters Section */}
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-3xl border border-purple-100">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 ml-4">For Recruiters</h3>
                </div>
                <p className="text-gray-600 mb-8">Find and evaluate top talent with intelligent matching</p>
                
                <div className="space-y-4">
                  {recruiterFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="ml-3">
                        <span className="font-semibold text-gray-900">{feature.title}</span>
                        <p className="text-gray-600 text-sm">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Link to="/signup" className="block mt-8">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3">
                    Start Recruiting
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Core Features Section */}
      <div className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powered by{" "}
              <span className="text-indigo-600">AI Intelligence</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our advanced AI algorithms analyze, optimize, and match with precision to give you the competitive edge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
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

      {/* Subscription Plans Preview */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose Your{" "}
              <span className="text-green-600">Plan</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From free essential tools to premium AI-powered features, find the perfect plan for your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div key={index} className={`relative p-8 rounded-2xl border-2 ${plan.popular ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} transition-all duration-300 hover:shadow-xl`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">Most Popular</span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-6">
                    {plan.price}
                    <span className="text-lg text-gray-500">/month</span>
                  </div>
                  <p className="text-gray-600 mb-8">{plan.description}</p>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 hover:bg-gray-900'} text-white rounded-xl py-3`}>
                    Get Started
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Join thousands of professionals who have accelerated their careers with our AI-powered platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link to="/signup">
              <Button size="lg" className="px-10 py-6 text-lg bg-white text-blue-600 hover:bg-gray-100 rounded-full font-semibold transition-all duration-300 transform hover:scale-105">
                Start Free Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/resume-optimizer">
              <Button size="lg" variant="outline" className="px-10 py-6 text-lg border-2 border-white text-white hover:bg-white hover:text-blue-600 rounded-full transition-all duration-300">
                <Eye className="mr-2 w-5 h-5" />
                Try Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const candidateFeatures = [
  {
    title: "ATS Optimization Score",
    description: "Real-time scoring to beat applicant tracking systems"
  },
  {
    title: "Resume Enhancement",
    description: "AI-powered suggestions for content and formatting"
  },
  {
    title: "Job Description Matching",
    description: "Tailor your resume to specific job requirements"
  },
  {
    title: "Cover Letter Generation",
    description: "Create compelling cover letters instantly"
  },
  {
    title: "Interview Preparation",
    description: "Practice with AI-generated questions and feedback"
  },
  {
    title: "Resume Builder",
    description: "Professional templates with smart recommendations"
  }
];

const recruiterFeatures = [
  {
    title: "Multi-Resume Analysis",
    description: "Upload and analyze multiple resumes simultaneously"
  },
  {
    title: "AI-Powered Matching",
    description: "Intelligent candidate-to-job matching algorithms"
  },
  {
    title: "Skill Gap Analysis",
    description: "Identify missing skills and competencies"
  },
  {
    title: "Automated Feedback",
    description: "Generate detailed candidate assessments"
  },
  {
    title: "Detailed Reports",
    description: "Export comprehensive evaluation reports"
  },
  {
    title: "Candidate Comparison",
    description: "Side-by-side candidate comparison tools"
  }
];

const coreFeatures = [
  {
    icon: Target,
    title: "Smart Optimization",
    description: "Our AI analyzes thousands of job postings to optimize your resume for maximum impact and ATS compatibility."
  },
  {
    icon: Brain,
    title: "Intelligent Matching",
    description: "Advanced algorithms match candidates with opportunities based on skills, experience, and cultural fit."
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Track your progress with detailed analytics and insights to continuously improve your career strategy."
  }
];

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Essential tools to get started",
    features: [
      "Basic resume builder",
      "3 ATS scans per month",
      "Basic job matching",
      "Standard templates"
    ],
    popular: false
  },
  {
    name: "Basic",
    price: "$9",
    description: "Enhanced features for job seekers",
    features: [
      "Advanced resume optimization",
      "Unlimited ATS scans",
      "Cover letter generator",
      "Priority support",
      "Premium templates"
    ],
    popular: true
  },
  {
    name: "Premium",
    price: "$29",
    description: "Complete career transformation suite",
    features: [
      "All Basic features",
      "AI interview preparation",
      "Advanced analytics",
      "Recruiter tools access",
      "Custom branding",
      "API access"
    ],
    popular: false
  }
];

export default Index;
