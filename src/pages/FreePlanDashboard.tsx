
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import api, { checkBackendStatus } from "@/utils/apiClient";
import DefaultResumeUploader from "@/components/DefaultResumeUploader";
import TopNavigation from "@/components/TopNavigation";
import "@/styles/FreePlanDashboard.css";
import { 
  User, 
  Settings, 
  CreditCard, 
  Calendar, 
  BarChart3, 
  Shield,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  Crown,
  Zap,
  FileText,
  Search,
  MessageSquare,
  DollarSign,
  HelpCircle,
  Target,
  Award,
  Brain,
  Globe,
  Activity,
  Star,
  Lock,
  Unlock
} from "lucide-react";

const allFeatures = [
  { 
    key: "resume_customization", 
    title: "Resume Customization", 
    icon: "📝", 
    description: "Tailor your resume for each job application with AI-powered suggestions.", 
    route: "/resume-customizer",
    category: "optimization",
    premium: false,
    gradient: "from-blue-500 to-cyan-500"
  },
  { 
    key: "resume_optimization", 
    title: "Resume Optimization", 
    icon: "🚀", 
    description: "Optimize your resume for ATS systems and better results.", 
    route: "/resume-optimizer",
    category: "optimization", 
    premium: false,
    gradient: "from-green-500 to-emerald-500"
  },
  { 
    key: "resume_builder", 
    title: "Resume Builder", 
    icon: "📄", 
    description: "Create professional resumes with our template library.", 
    route: "/resume-builder-app",
    category: "creation",
    premium: false,
    gradient: "from-purple-500 to-pink-500"
  },
  { 
    key: "ats_scan", 
    title: "ATS Scanner", 
    icon: "🤖", 
    description: "Scan your resume for ATS compatibility and get detailed feedback.", 
    route: "/ats-scanner",
    category: "analysis",
    premium: false,
    gradient: "from-orange-500 to-red-500"
  },
  { 
    key: "cover_letter", 
    title: "Cover Letter Generator", 
    icon: "💼", 
    description: "Generate personalized cover letters for your job applications.", 
    route: "/cover-letter-generator",
    category: "creation",
    premium: false,
    gradient: "from-indigo-500 to-purple-500"
  },
  { 
    key: "interview_prep", 
    title: "Interview Questions", 
    icon: "🎯", 
    description: "Practice with AI-generated interview questions for your field.", 
    route: "/interview-questions",
    category: "preparation",
    premium: false,
    gradient: "from-cyan-500 to-blue-500"
  },
  { 
    key: "salary_insights", 
    title: "Salary Insights", 
    icon: "💰", 
    description: "Get market salary data and negotiation insights.", 
    route: "/salary-insights",
    category: "insights",
    premium: false,
    gradient: "from-pink-500 to-rose-500"
  }
];

const quickActions = [
  { title: "Account Settings", icon: Settings, route: "/settings", color: "text-slate-600" },
  { title: "Profile & Resume", icon: User, route: "/account", color: "text-blue-600" },
  { title: "Billing", icon: CreditCard, route: "/upgrade", color: "text-green-600" },
  { title: "Help Center", icon: HelpCircle, route: "/help", color: "text-purple-600" }
];

const FreePlanDashboard = () => {
  const navigate = useNavigate();
  const { user, subscriptionStatus, subscriptionLoading } = useAuth();
  const [featureUsage, setFeatureUsage] = useState<Record<string, { usageCount: number; usageLimit: number }>>({});
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgradePrompt, setUpgradePrompt] = useState<string | null>(null);

  // Fetch feature usage
  useEffect(() => {
    if (!user || !subscriptionStatus || subscriptionLoading) return;
    if (Object.keys(featureUsage).length > 0) return;

    setLoadingUsage(true);
    setError(null);
    
    let timeoutId: NodeJS.Timeout | undefined;
    
    // First check if the backend is available
    checkBackendStatus().then(isRunning => {
      if (!isRunning) {
        console.log("Backend is not available, using fallback data");
        setError("Backend server is currently unavailable. Using offline mode with default limits.");
        
        // Default limits for all features
        const defaultUsage: Record<string, { usageCount: number; usageLimit: number }> = {};
        allFeatures.forEach(feature => {
          defaultUsage[feature.key] = { usageCount: 0, usageLimit: 5 };
        });
        
        setFeatureUsage(defaultUsage);
        setLoadingUsage(false);
        return;
      }
      
      // If backend is running, proceed with the API call
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 10000);
      
      api.usage.getAllFeatureUsage(user.id)
        .then(({ data, error }) => {
          if (timeoutId) clearTimeout(timeoutId);
          if (error) {
            console.warn("Error fetching usage data:", error);
            setError("Unable to fetch your usage data. Using default limits for now.");
            
            // Provide fallback data
            const defaultUsage: Record<string, { usageCount: number; usageLimit: number }> = {};
            allFeatures.forEach(feature => {
              defaultUsage[feature.key] = { usageCount: 0, usageLimit: 5 };
            });
            setFeatureUsage(defaultUsage);
          } else {
            setFeatureUsage(data || {});
          }
          setLoadingUsage(false);
        })
        .catch((err) => {
          if (timeoutId) clearTimeout(timeoutId);
          console.error("Exception in usage data fetch:", err);
          if (err.name === "AbortError") {
            setError("Usage data is taking too long to load. Using default limits for now.");
          } else {
            setError("An unexpected error occurred while loading usage data.");
          }
          setFeatureUsage({});
          setLoadingUsage(false);
        });
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, subscriptionStatus, subscriptionLoading, featureUsage]);

  // Handler for feature button click  
  const handleFeatureClick = async (feature: any) => {
    if (!user) return;
    const usage = featureUsage[feature.key] || { usageCount: 0, usageLimit: 0 };
    if (usage.usageCount >= usage.usageLimit) {
      setUpgradePrompt("You have reached your free usage limit. Please upgrade to access more features.");
      return;
    }
    setUpgradePrompt(null);
    
    // Handle ATS scan specifically
    if (feature.key === "ats_scan") {
      try {
        const testFile = new File(["test"], "test.pdf", { type: "application/pdf" });
        await api.resume.atsScan(testFile, "free");
      } catch (error) {
        console.error("ATS scan error:", error);
      }
    }
    
    navigate(feature.route);
  };

  // Calculate overall usage percentage
  const calculateOverallUsage = () => {
    const totalUsed = Object.values(featureUsage).reduce((sum, usage) => sum + usage.usageCount, 0);
    const totalLimit = Object.values(featureUsage).reduce((sum, usage) => sum + usage.usageLimit, 0);
    return totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;
  };

  // Loading and error states
  if (subscriptionLoading || loadingUsage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <TopNavigation />
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !subscriptionStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <TopNavigation />
        <div className="flex justify-center items-center h-96">
          <div className="text-center text-red-500">
            <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Authentication required. Please sign in to continue.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <TopNavigation />
      
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            {/* Welcome Section */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-1">Welcome Back!</h1>
                  <p className="text-slate-600 text-lg">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0">
                      <Unlock className="w-3 h-3 mr-1" />
                      Free Plan
                    </Badge>
                    <Badge variant="outline" className="border-green-300 text-green-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Usage Overview */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Overall Usage</span>
                    <span className="text-sm text-slate-500">{Math.round(calculateOverallUsage())}% used</span>
                  </div>
                  <Progress value={calculateOverallUsage()} className="h-2" />
                  <p className="text-xs text-slate-500 mt-1">Upgrade to unlock unlimited access</p>
                </CardContent>
              </Card>
            </div>

            {/* Upgrade CTA */}
            <Card className="w-full lg:w-80 shadow-xl border-0 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-200 to-amber-200 rounded-full -translate-y-12 translate-x-12 opacity-20"></div>
              <CardHeader className="pb-3 relative">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Crown className="w-6 h-6 text-orange-600" />
                  Upgrade to Premium
                </CardTitle>
                <p className="text-orange-800 text-sm">Unlock unlimited access to all features</p>
              </CardHeader>
              <CardContent className="space-y-4 relative">
                <div className="flex items-center gap-2 text-sm text-orange-700">
                  <Star className="w-4 h-4" />
                  <span>Unlimited usage across all tools</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-orange-700">
                  <Globe className="w-4 h-4" />
                  <span>Priority support & advanced features</span>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg"
                  onClick={() => navigate("/upgrade")}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Upgrade Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white/80 backdrop-blur-sm border-0 group"
                onClick={() => navigate(action.route)}
              >
                <CardContent className="p-4 text-center">
                  <action.icon className={`w-6 h-6 mx-auto mb-2 ${action.color} group-hover:scale-110 transition-transform`} />
                  <p className="text-sm font-medium text-slate-700">{action.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Default Resume Uploader */}
        <div className="mb-8">
          <DefaultResumeUploader />
        </div>

        {/* Upgrade Prompt */}
        {upgradePrompt && (
          <Card className="mb-8 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg">
            <CardContent className="flex items-center gap-4 p-6">
              <AlertTriangle className="w-8 h-8 text-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-orange-800 font-medium">{upgradePrompt}</p>
              </div>
              <Button 
                onClick={() => navigate("/upgrade")}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Features Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Available Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allFeatures.map((feature, index) => {
              const usage = featureUsage[feature.key] || { usageCount: 0, usageLimit: 5 };
              const isBlocked = usage.usageCount >= usage.usageLimit;
              const usagePercentage = usage.usageLimit > 0 ? (usage.usageCount / usage.usageLimit) * 100 : 0;
              
              return (
                <Card key={index} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm hover:bg-white overflow-hidden relative">
                  <div className={`h-1 bg-gradient-to-r ${feature.gradient}`}></div>
                  
                  {/* Premium badge for blocked features */}
                  {isBlocked && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-orange-500 text-white text-xs">
                        <Lock className="w-3 h-3 mr-1" />
                        Upgrade
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{feature.icon}</div>
                        <div className="flex-1">
                          <CardTitle className="text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                            {feature.title}
                          </CardTitle>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{feature.description}</p>
                  </CardHeader>
                  
                  <CardContent className="py-0">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-500">Usage</span>
                      <span className={`font-medium ${isBlocked ? 'text-red-600' : 'text-slate-700'}`}>
                        {usage.usageCount}/{usage.usageLimit}
                      </span>
                    </div>
                    
                    <Progress 
                      value={usagePercentage} 
                      className={`h-2 ${isBlocked ? '[&>div]:bg-red-500' : `[&>div]:bg-gradient-to-r [&>div]:${feature.gradient}`}`}
                    />
                  </CardContent>
                  
                  <CardFooter className="pt-4">
                    <Button 
                      className={`w-full transition-all duration-200 ${
                        isBlocked 
                          ? 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600' 
                          : `bg-gradient-to-r ${feature.gradient} hover:shadow-lg group-hover:scale-105`
                      }`}
                      onClick={() => handleFeatureClick(feature)} 
                      disabled={loadingUsage}
                    >
                      {isBlocked ? (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Upgrade to Use
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          {feature.title}
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Footer CTA */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <Crown className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h3 className="text-2xl font-bold mb-2">Ready to Unlock Your Full Potential?</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Join thousands of professionals who have accelerated their careers with our premium features. 
              Get unlimited access to all tools, priority support, and advanced AI capabilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
                onClick={() => navigate("/upgrade")}
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                View Pricing Plans
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600"
                onClick={() => navigate("/help")}
              >
                <HelpCircle className="w-5 h-5 mr-2" />
                Learn More
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FreePlanDashboard;
