import React, { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth/AuthContext";
import { Badge } from "@/components/ui/badge";
import api from "@/utils/apiClient";
import TopNavigation from "@/components/TopNavigation";
import { 
  BarChart3, 
  Shield,
  AlertTriangle,
  Sparkles,
  Clock,
  CheckCircle2,
  Crown,
  Target,
  FileText,
  Zap,
  TrendingUp,
  Brain,
  Gauge,
  ArrowRight,
  Star,
  Award,
  Briefcase,
  Users,
  ChevronRight
} from "lucide-react";

const featureTypes = [
  { 
    key: "resume_customization", 
    title: "Resume Customization", 
    icon: Target, 
    description: "Tailor your resume for each job application with AI-powered suggestions.", 
    route: "/resume-customizer",
    category: "optimization",
    premium: false,
    color: "from-blue-500 to-cyan-500"
  },
  { 
    key: "resume_optimization", 
    title: "Resume Optimization", 
    icon: Zap, 
    description: "Optimize your resume for ATS systems and better results.", 
    route: "/resume-optimizer",
    category: "optimization", 
    premium: false,
    color: "from-green-500 to-emerald-500"
  },
  { 
    key: "resume_builder", 
    title: "Resume Builder", 
    icon: FileText, 
    description: "Create professional resumes with our template library.", 
    route: "/resume-builder-app",
    category: "creation",
    premium: false,
    color: "from-purple-500 to-pink-500"
  },
  { 
    key: "ats_scan", 
    title: "ATS Scanner", 
    icon: Gauge, 
    description: "Scan your resume for ATS compatibility and get detailed feedback.", 
    route: "/ats-scanner",
    category: "analysis",
    premium: false,
    color: "from-orange-500 to-red-500"
  },
  { 
    key: "salary_insights", 
    title: "Salary Insights", 
    icon: BarChart3, 
    description: "Get market salary data and compensation analysis.", 
    route: "/salary-insights",
    category: "insights",
    premium: true,
    color: "from-indigo-500 to-purple-500"
  },
  { 
    key: "cover_letter", 
    title: "Cover Letter Generator", 
    icon: Award, 
    description: "Generate personalized cover letters for your applications.", 
    route: "/cover-letter-generator",
    category: "creation",
    premium: false,
    color: "from-cyan-500 to-blue-500"
  },
  { 
    key: "interview_questions", 
    title: "Interview Questions", 
    icon: Users, 
    description: "Practice with AI-generated interview questions tailored to your role.", 
    route: "/interview-questions",
    category: "preparation",
    premium: true,
    color: "from-pink-500 to-rose-500"
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
      <div className="min-h-screen bg-gray-50">
        <TopNavigation />
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !subscriptionStatus) {
    return (
      <div className="min-h-screen bg-gray-50">
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation />
        <div className="flex justify-center items-center h-96">
          <div className="text-center text-red-500">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
                <p className="text-blue-100 text-lg mb-4">
                  Ready to advance your career with AI-powered tools?
                </p>
                <div className="flex items-center space-x-4">
                  <Badge className="bg-white/20 text-white border-0">
                    <Brain className="w-3 h-3 mr-1" />
                    AI-Powered Platform
                  </Badge>
                  <Badge className="bg-white/20 text-white border-0">
                    <Shield className="w-3 h-3 mr-1" />
                    Enterprise Grade
                  </Badge>
                </div>
              </div>
              
              {subscriptionStatus?.type !== "premium" && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 min-w-80">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Crown className="w-5 h-5 mr-2 text-yellow-300" />
                    Unlock Premium Features
                  </h3>
                  <p className="text-blue-100 text-sm mb-4">
                    Get unlimited access to all AI tools and advanced features.
                  </p>
                  <Button 
                    className="w-full bg-white text-blue-700 hover:bg-gray-100"
                    onClick={() => navigate("/upgrade")}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Tools Available", value: featureTypes.length, icon: Briefcase, color: "text-blue-600" },
            { label: "Premium Features", value: featureTypes.filter(f => f.premium).length, icon: Crown, color: "text-purple-600" },
            { label: "Current Plan", value: subscriptionStatus?.type?.charAt(0).toUpperCase() + subscriptionStatus?.type?.slice(1), icon: Star, color: "text-green-600" },
            { label: "Usage This Month", value: Object.values(featureUsage).reduce((sum, usage) => sum + usage.usageCount, 0), icon: BarChart3, color: "text-orange-600" }
          ].map((stat, index) => (
            <Card key={index} className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
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
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 capitalize">
                    {category.replace('_', ' ')} Tools
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Professional tools to enhance your career journey
                  </p>
                </div>
                <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {features.map((feature, index) => {
                  const usage = featureUsage[feature.key] || { usageCount: 0, usageLimit: 0 };
                  const isBlocked = (subscriptionStatus.type === "free" && usage.usageCount >= usage.usageLimit) || (subscriptionStatus.type === "basic" && usage.usageCount >= usage.usageLimit);
                  const isUnlimited = usage.usageLimit === 0 || subscriptionStatus.type === "premium";
                  const IconComponent = feature.icon;
                  
                  return (
                    <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white hover:bg-white overflow-hidden relative">
                      {/* Gradient Top Border */}
                      <div className={`h-1 bg-gradient-to-r ${feature.color}`}></div>
                      
                      {/* Premium Badge */}
                      {feature.premium && subscriptionStatus.type === "free" && (
                        <div className="absolute top-3 right-3 z-10">
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                            <Crown className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        </div>
                      )}
                      
                      <CardHeader className="pb-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                              {feature.title}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{feature.description}</p>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="py-0">
                        <div className="flex items-center justify-between text-sm mb-3">
                          <span className="text-gray-500 font-medium">Usage</span>
                          <div className="flex items-center gap-2">
                            {isUnlimited ? (
                              <Badge variant="outline" className="border-green-300 text-green-600 bg-green-50">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Unlimited
                              </Badge>
                            ) : (
                              <span className={`font-semibold ${isBlocked ? 'text-red-600' : 'text-gray-700'}`}>
                                {usage.usageCount}/{usage.usageLimit}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {!isUnlimited && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 bg-gradient-to-r ${
                                isBlocked ? 'from-red-400 to-red-500' : feature.color
                              }`}
                              style={{ width: `${Math.min((usage.usageCount / usage.usageLimit) * 100, 100)}%` }}
                            ></div>
                          </div>
                        )}
                      </CardContent>
                      
                      <CardFooter className="pt-6">
                        <Button 
                          className={`w-full transition-all duration-200 ${
                            isBlocked 
                              ? 'bg-gray-400 hover:bg-gray-500' 
                              : `bg-gradient-to-r ${feature.color} hover:shadow-lg transform hover:scale-[1.02]`
                          }`}
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
                              Launch Tool
                              <ArrowRight className="w-4 h-4 ml-2" />
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
        <Card className="mt-12 border-gray-200 bg-gray-50/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">AI-Generated Content Disclaimer</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Our AI-powered tools provide intelligent suggestions and automated content generation to enhance your professional profile. 
                  While our algorithms are continuously improved and trained on extensive data, all AI-generated content should be reviewed 
                  and verified for accuracy, relevance, and appropriateness to your specific situation. We recommend treating AI outputs as 
                  starting points that benefit from human review and customization to ensure they authentically represent your professional profile.
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
