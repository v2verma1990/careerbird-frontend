
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import api from "@/utils/apiClient";
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
  Zap
} from "lucide-react";

const featureTypes = [
  { 
    key: "resume_customization", 
    title: "Resume Customization", 
    icon: "📝", 
    description: "Tailor your resume for each job application with AI-powered suggestions.", 
    route: "/resume-customizer",
    category: "optimization",
    premium: false
  },
  { 
    key: "resume_optimization", 
    title: "Resume Optimization", 
    icon: "🚀", 
    description: "Optimize your resume for ATS systems and better results.", 
    route: "/resume-optimizer",
    category: "optimization", 
    premium: false
  },
  { 
    key: "resume_builder", 
    title: "Resume Builder", 
    icon: "📄", 
    description: "Create professional resumes with our template library.", 
    route: "/resume-builder-app",
    category: "creation",
    premium: false
  },
  { 
    key: "ats_scan", 
    title: "ATS Scanner", 
    icon: "🤖", 
    description: "Scan your resume for ATS compatibility and get detailed feedback.", 
    route: "/ats-scanner",
    category: "analysis",
    premium: false
  }
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    api.usage.getAllFeatureUsage(user.id)
      .then(({ data, error }) => {
        clearTimeout(timeout);
        if (error) {
          setError("Failed to fetch usage data.");
          setFeatureUsage({});
        } else {
          setFeatureUsage(data || {});
        }
        setLoadingUsage(false);
      })
      .catch((err) => {
        clearTimeout(timeout);
        if (err.name === "AbortError") {
          setError("Usage data is taking too long to load. Please try again later.");
        } else {
          setError("An unexpected error occurred while loading usage data.");
        }
        setFeatureUsage({});
        setLoadingUsage(false);
      });

    return () => clearTimeout(timeout);
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

  // Loading and error states
  if (subscriptionLoading || loadingUsage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !subscriptionStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex justify-center items-center">
        <div className="text-center text-red-500">
          <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="font-medium">Authentication required. Please sign in to continue.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex justify-center items-center">
        <div className="text-center text-red-500">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            {/* Welcome Section */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Free Plan Dashboard</h1>
                  <p className="text-slate-600">{user?.email}</p>
                </div>
              </div>
              <p className="text-slate-600 text-lg">Get started with our free resume tools</p>
            </div>

            {/* Upgrade Prompt Card */}
            <Card className="w-full lg:w-96 shadow-xl border-0 bg-gradient-to-r from-orange-50 to-amber-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="w-5 h-5 text-orange-600" />
                  Upgrade Your Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-orange-800">Unlock premium features and unlimited usage</p>
                <Button 
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  onClick={() => navigate("/upgrade")}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Upgrade Now
                </Button>
              </CardContent>
            </Card>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureTypes.map((feature, index) => {
            const usage = featureUsage[feature.key] || { usageCount: 0, usageLimit: 0 };
            const isBlocked = usage.usageCount >= usage.usageLimit;
            
            return (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
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
                  <p className="text-sm text-slate-600 mt-2">{feature.description}</p>
                </CardHeader>
                
                <CardContent className="py-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Usage</span>
                    <span className={`font-medium ${isBlocked ? 'text-red-600' : 'text-slate-700'}`}>
                      {usage.usageCount}/{usage.usageLimit}
                    </span>
                  </div>
                  
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isBlocked ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                      }`}
                      style={{ width: `${Math.min((usage.usageCount / usage.usageLimit) * 100, 100)}%` }}
                    ></div>
                  </div>
                </CardContent>
                
                <CardFooter className="pt-4">
                  <Button 
                    className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 transition-all duration-200 group-hover:from-blue-600 group-hover:to-indigo-600" 
                    onClick={() => handleFeatureClick(feature)} 
                    disabled={isBlocked || loadingUsage}
                  >
                    {isBlocked ? (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        Limit Reached
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
    </div>
  );
};

export default FreePlanDashboard;