
import React, { useEffect, useState } from "react";
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
  },
  { 
    key: "salary_insights", 
    title: "Salary Insights", 
    icon: "📊", 
    description: "Get market salary data and compensation analysis.", 
    route: "/salary-insights",
    category: "insights",
    premium: true
  },
  { 
    key: "cover_letter", 
    title: "Cover Letter Generator", 
    icon: "✉️", 
    description: "Generate personalized cover letters for your applications.", 
    route: "/cover-letter-generator",
    category: "creation",
    premium: false
  },
  { 
    key: "interview_questions", 
    title: "Interview Questions", 
    icon: "💬", 
    description: "Practice with AI-generated interview questions tailored to your role.", 
    route: "/interview-questions",
    category: "preparation",
    premium: true
  },
];

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const { user, subscriptionStatus, subscriptionLoading, cancelSubscription } = useAuth();
  const [featureUsage, setFeatureUsage] = useState<Record<string, { usageCount: number; usageLimit: number }>>({});
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgradePrompt, setUpgradePrompt] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  
  // Calculate remaining days in subscription
  const getRemainingDays = () => {
    if (!subscriptionStatus?.endDate) return null;
    
    const endDate = new Date(subscriptionStatus.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (subscriptionStatus.originalDaysRemaining && subscriptionStatus.cancelled) {
      return subscriptionStatus.originalDaysRemaining;
    }
    
    return diffDays > 0 ? diffDays : 0;
  };

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

  // Handler for cancel subscription
  const handleCancelSubscription = async () => {
    if (!user) return;
    
    if (!window.confirm("Are you sure you want to cancel your subscription? You will be downgraded to the free plan at the end of your billing period.")) {
      return;
    }
    
    setCancelLoading(true);
    try {
      await cancelSubscription();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
    } finally {
      setCancelLoading(false);
    }
  };
  
  // Handler for feature button click
  const handleFeatureClick = (feature: any) => {
    if (!user) return;
    const usage = featureUsage[feature.key] || { usageCount: 0, usageLimit: 0 };
    if ((subscriptionStatus?.type === "free" && usage.usageCount >= usage.usageLimit) || (subscriptionStatus?.type === "basic" && usage.usageCount >= usage.usageLimit)) {
      setUpgradePrompt(subscriptionStatus.type === "free" ? "You have reached your free usage limit. Please upgrade to access more features." : "You have reached your monthly usage limit. Upgrade to premium for unlimited access.");
      return;
    }
    setUpgradePrompt(null);
    navigate(feature.route);
  };

  // Group features by category
  const groupedFeatures = featureTypes.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, typeof featureTypes>);

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
                  <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
                  <p className="text-slate-600">{user?.email}</p>
                </div>
              </div>
              <p className="text-slate-600 text-lg">Enhance your career with our AI-powered professional tools</p>
            </div>

            {/* Account Overview Card */}
            <Card className="w-full lg:w-96 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Account Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subscription Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Plan</span>
                  <div className="flex items-center gap-2">
                    <Badge className={`px-3 py-1 ${
                      subscriptionStatus.type === "premium" 
                        ? "bg-gradient-to-r from-purple-500 to-pink-500" 
                        : subscriptionStatus.type === "basic" 
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500" 
                          : "bg-gradient-to-r from-slate-500 to-slate-600"
                    }`}>
                      {subscriptionStatus.type === "premium" && <Crown className="w-3 h-3 mr-1" />}
                      {subscriptionStatus.type === "basic" && <Zap className="w-3 h-3 mr-1" />}
                      {subscriptionStatus.type.charAt(0).toUpperCase() + subscriptionStatus.type.slice(1)}
                    </Badge>
                    {subscriptionStatus.cancelled && subscriptionStatus.type !== "free" && (
                      <Badge variant="outline" className="border-red-500 text-red-500 text-xs">
                        Cancelled
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Subscription Period */}
                {subscriptionStatus.endDate && subscriptionStatus.type !== "free" && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {subscriptionStatus.cancelled ? "Expires" : "Renews"}
                    </span>
                    <span className="text-sm text-slate-600">
                      {getRemainingDays() > 0 
                        ? `${getRemainingDays()} days` 
                        : "Today"
                      }
                    </span>
                  </div>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  {(subscriptionStatus.type !== "premium" || subscriptionStatus.cancelled) && (
                    <Button 
                      variant="default" 
                      size="sm"
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      onClick={() => navigate("/upgrade")}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {subscriptionStatus.cancelled ? "Renew Plan" : "Upgrade Plan"}
                    </Button>
                  )}
                  
                  {(subscriptionStatus.type === "basic" || subscriptionStatus.type === "premium") && 
                   !subscriptionStatus.cancelled && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      onClick={handleCancelSubscription}
                      disabled={cancelLoading}
                    >
                      {cancelLoading ? "Cancelling..." : "Cancel Subscription"}
                    </Button>
                  )}
                </div>
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
        <div className="space-y-8">
          {Object.entries(groupedFeatures).map(([category, features]) => (
            <div key={category}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 capitalize">
                  {category.replace('_', ' ')} Tools
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => {
                  const usage = featureUsage[feature.key] || { usageCount: 0, usageLimit: 0 };
                  const isBlocked = (subscriptionStatus.type === "free" && usage.usageCount >= usage.usageLimit) || (subscriptionStatus.type === "basic" && usage.usageCount >= usage.usageLimit);
                  const isUnlimited = usage.usageLimit === 0 || subscriptionStatus.type === "premium";
                  
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
                              {feature.premium && subscriptionStatus.type === "free" && (
                                <Badge variant="outline" className="border-purple-300 text-purple-600 text-xs mt-1">
                                  <Crown className="w-3 h-3 mr-1" />
                                  Premium
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mt-2">{feature.description}</p>
                      </CardHeader>
                      
                      <CardContent className="py-0">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Usage</span>
                          <div className="flex items-center gap-2">
                            {isUnlimited ? (
                              <Badge variant="outline" className="border-green-300 text-green-600">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Unlimited
                              </Badge>
                            ) : (
                              <span className={`font-medium ${isBlocked ? 'text-red-600' : 'text-slate-700'}`}>
                                {usage.usageCount}/{usage.usageLimit}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {!isUnlimited && (
                          <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                isBlocked ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                              }`}
                              style={{ width: `${Math.min((usage.usageCount / usage.usageLimit) * 100, 100)}%` }}
                            ></div>
                          </div>
                        )}
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
          ))}
        </div>

        {/* AI Disclaimer */}
        <Card className="mt-12 border-slate-200 bg-slate-50/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-slate-400 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-2">Important Notice About AI-Generated Content</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Our AI-powered tools provide intelligent suggestions and automated content generation to enhance your job search experience. 
                  While our algorithms are continuously improved and trained on extensive data, AI-generated content should be reviewed and 
                  verified for accuracy, relevance, and appropriateness to your specific situation. We recommend treating AI outputs as 
                  starting points that benefit from human review and customization. Always ensure that any content represents your authentic 
                  professional profile and meets the specific requirements of your target positions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CandidateDashboard;
