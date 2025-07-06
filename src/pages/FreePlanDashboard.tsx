
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
  BarChart3, 
  Shield,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  Crown,
  FileText,
  MessageSquare,
  HelpCircle,
  Award,
  Globe,
  Activity,
  Star,
  Lock,
  Unlock,
  Zap,
  Upload,
  ArrowRight,
  Rocket
} from "lucide-react";

// Available features for free users (very limited)
const availableFeatures = [
  { 
    key: "ats_scan", 
    title: "ATS Scanner", 
    icon: "🤖", 
    description: "Scan your resume for ATS compatibility and get detailed feedback.", 
    route: "/ats-scanner",
    category: "analysis",
    premium: false,
    gradient: "from-orange-500 to-red-500"
  }
];

// Features that require upgrade
const upgradeFeatures = [
  { 
    key: "resume_customization", 
    title: "Resume Customization", 
    icon: "📝", 
    description: "Tailor your resume for each job application with AI-powered suggestions.", 
    route: "/resume-customizer",
    category: "optimization",
    premium: true,
    gradient: "from-blue-500 to-cyan-500"
  },
  { 
    key: "resume_optimization", 
    title: "Resume Optimization", 
    icon: "🚀", 
    description: "Optimize your resume for ATS systems and better results.", 
    route: "/resume-optimizer",
    category: "optimization", 
    premium: true,
    gradient: "from-green-500 to-emerald-500"
  },
  { 
    key: "resume_builder", 
    title: "Resume Builder", 
    icon: "📄", 
    description: "Create professional resumes with our template library.", 
    route: "/resume-builder-app",
    category: "creation",
    premium: true,
    gradient: "from-purple-500 to-pink-500"
  },
  { 
    key: "cover_letter", 
    title: "Cover Letter Generator", 
    icon: "💼", 
    description: "Generate personalized cover letters for your job applications.", 
    route: "/cover-letter-generator",
    category: "creation",
    premium: true,
    gradient: "from-indigo-500 to-purple-500"
  },
  { 
    key: "salary_insights", 
    title: "Salary Insights", 
    icon: "💰", 
    description: "Get market salary data and negotiation insights.", 
    route: "/salary-insights",
    category: "insights",
    premium: true,
    gradient: "from-pink-500 to-rose-500"
  }
];

const quickActions = [
  { title: "Account Settings", icon: Settings, route: "/settings", color: "text-slate-600", description: "Manage your profile" },
  { title: "Profile & Resume", icon: User, route: "/account", color: "text-blue-600", description: "Update your information" },
  { title: "Billing & Plans", icon: CreditCard, route: "/upgrade", color: "text-green-600", description: "Upgrade your plan" },
  { title: "Help Center", icon: HelpCircle, route: "/help", color: "text-purple-600", description: "Get support" }
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
        
        // Default limits for free plan features only - THE LIMIT OF 3 IS SET HERE
        const defaultUsage: Record<string, { usageCount: number; usageLimit: number }> = {};
        availableFeatures.forEach(feature => {
          if (!feature.premium) {
            defaultUsage[feature.key] = { usageCount: 0, usageLimit: 3 }; // This is where the limit of 3 is set
          }
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
            
            // Provide fallback data for free plan only
            const defaultUsage: Record<string, { usageCount: number; usageLimit: number }> = {};
            availableFeatures.forEach(feature => {
              if (!feature.premium) {
                defaultUsage[feature.key] = { usageCount: 0, usageLimit: 3 }; // Fallback limit of 3
              }
            });
            setFeatureUsage(defaultUsage);
          } else {
            // Filter out premium features for free users
            const filteredData: Record<string, { usageCount: number; usageLimit: number }> = {};
            if (data) {
              Object.keys(data).forEach(key => {
                const feature = availableFeatures.find(f => f.key === key);
                if (feature && !feature.premium) {
                  filteredData[key] = data[key];
                }
              });
            }
            setFeatureUsage(filteredData || {});
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

  // Handler for available feature button click  
  const handleAvailableFeatureClick = async (feature: any) => {
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

  // Handler for upgrade feature button click
  const handleUpgradeFeatureClick = (feature: any) => {
    setUpgradePrompt(`${feature.title} is only available on Basic and Premium plans. Please upgrade to access this feature.`);
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
      
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Enhanced Hero Section */}
        <div className="mb-12">
          <Card className="border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
            
            <CardContent className="p-8 relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold mb-2">Welcome Back!</h1>
                      <p className="text-blue-100 text-lg">{user?.email}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                          <Unlock className="w-3 h-3 mr-1" />
                          Free Plan
                        </Badge>
                        <Badge className="bg-green-500/20 text-green-100 border-green-300/30 backdrop-blur-sm">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5" />
                        <span className="font-medium">Resume Scans</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {featureUsage.ats_scan ? `${featureUsage.ats_scan.usageCount}/${featureUsage.ats_scan.usageLimit}` : "0/3"}
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-5 h-5" />
                        <span className="font-medium">Premium Features</span>
                      </div>
                      <div className="text-2xl font-bold">5 Locked</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5" />
                        <span className="font-medium">Upgrade Savings</span>
                      </div>
                      <div className="text-2xl font-bold">50% Off</div>
                    </div>
                  </div>
                </div>
                
                <div className="lg:w-80">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center gap-3 mb-4">
                      <Crown className="w-8 h-8 text-yellow-300" />
                      <div>
                        <h3 className="text-xl font-bold">Upgrade to Premium</h3>
                        <p className="text-blue-100 text-sm">Unlock your career potential</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-300" />
                        <span>Unlimited resume scans</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-300" />
                        <span>AI-powered optimization</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-300" />
                        <span>Premium templates</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-white text-blue-600 hover:bg-blue-50 shadow-lg font-medium"
                      onClick={() => navigate("/upgrade")}
                    >
                      <Rocket className="w-4 h-4 mr-2" />
                      Upgrade Now - 50% Off
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Your Free Feature */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                Your Free Feature
              </h2>
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <Unlock className="w-3 h-3 mr-1" />
                Available Now
              </Badge>
            </div>
            
            {availableFeatures.map((feature, index) => {
              const usage = featureUsage[feature.key] || { usageCount: 0, usageLimit: 0 };
              const isBlocked = usage.usageCount >= usage.usageLimit;
              const usagePercentage = usage.usageLimit > 0 ? (usage.usageCount / usage.usageLimit) * 100 : 0;
              
              return (
                <Card key={index} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white shadow-lg hover:bg-white overflow-hidden relative h-full">
                  <div className={`h-2 bg-gradient-to-r ${feature.gradient}`}></div>
                  
                  {isBlocked && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-orange-500 text-white text-xs">
                        <Lock className="w-3 h-3 mr-1" />
                        Upgrade
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-5xl">{feature.icon}</div>
                        <div className="flex-1">
                          <CardTitle className="text-2xl text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                            {feature.title}
                          </CardTitle>
                          <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="py-0">
                    <div className="bg-slate-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-slate-600 font-medium">Monthly Usage</span>
                        <span className={`font-bold text-lg ${isBlocked ? 'text-red-600' : 'text-slate-700'}`}>
                          {usage.usageCount}/{usage.usageLimit}
                        </span>
                      </div>
                      
                      <Progress 
                        value={usagePercentage} 
                        className={`h-3 ${isBlocked ? '[&>div]:bg-red-500' : `[&>div]:bg-gradient-to-r [&>div]:${feature.gradient}`}`}
                      />
                      
                      {!isBlocked && (
                        <p className="text-xs text-slate-500 mt-2">
                          {usage.usageLimit - usage.usageCount} scans remaining this month
                        </p>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-4">
                    <Button 
                      className={`w-full transition-all duration-200 ${
                        isBlocked 
                          ? 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600' 
                          : `bg-gradient-to-r ${feature.gradient} hover:shadow-lg group-hover:scale-105`
                      }`}
                      onClick={() => handleAvailableFeatureClick(feature)} 
                      disabled={loadingUsage}
                      size="lg"
                    >
                      {isBlocked ? (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Upgrade to Continue
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Start {feature.title}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Premium Features */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Crown className="w-6 h-6 text-orange-600" />
                Premium Features
              </h2>
              <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                <Lock className="w-3 h-3 mr-1" />
                Upgrade Required
              </Badge>
            </div>
            
            <div className="grid gap-4">
              {upgradeFeatures.map((feature, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 border border-orange-200 bg-gradient-to-r from-orange-50/30 to-amber-50/30 hover:from-orange-50 hover:to-amber-50 overflow-hidden relative">
                  <div className={`h-1 bg-gradient-to-r ${feature.gradient} opacity-50`}></div>
                  
                  <div className="absolute top-2 right-2 z-10">
                    <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-2xl opacity-70">{feature.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800 group-hover:text-orange-700 transition-colors mb-1">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-slate-600 opacity-80 leading-relaxed">{feature.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full mt-3 bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white transition-all duration-200"
                      onClick={() => handleUpgradeFeatureClick(feature)}
                      size="sm"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Upgrade to Unlock
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white border-0 shadow-md group hover:-translate-y-1"
                  onClick={() => navigate(action.route)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-slate-50 group-hover:scale-110 transition-transform`}>
                        <action.icon className={`w-6 h-6 ${action.color}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1">{action.title}</h4>
                        <p className="text-sm text-slate-600">{action.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Resume Upload */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-600" />
              Upload Resume
            </h3>
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-md">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <Upload className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-slate-900 mb-2">Upload Your Resume</h4>
                  <p className="text-sm text-slate-600">Get started with our ATS scanner</p>
                </div>
                <DefaultResumeUploader />
              </CardContent>
            </Card>
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
