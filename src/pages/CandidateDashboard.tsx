import React, { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/utils/apiClient";
import { 
  FileText, 
  Zap, 
  Bot, 
  BarChart3, 
  Mail, 
  MessageSquare, 
  User, 
  Settings, 
  Crown, 
  Target,
  TrendingUp,
  Calendar,
  Bell,
  Shield,
  CreditCard,
  Download,
  Eye,
  Edit,
  Star,
  Award,
  Briefcase
} from "lucide-react";

const featureTypes = [
  { 
    key: "resume_customization", 
    title: "Resume Customization", 
    icon: FileText, 
    description: "Tailor your resume for each job application.",
    route: "/resume-customizer",
    color: "bg-blue-500"
  },
  { 
    key: "resume_optimization", 
    title: "Resume Optimization", 
    icon: Zap, 
    description: "Optimize your resume for better results.",
    route: "/resume-optimizer",
    color: "bg-green-500"
  },
  { 
    key: "ats_scan", 
    title: "ATS Scanner", 
    icon: Bot, 
    description: "Scan your resume for ATS compatibility.",
    route: "/ats-scanner",
    color: "bg-purple-500"
  },
  { 
    key: "salary_insights", 
    title: "Salary Insights", 
    icon: BarChart3, 
    description: "See salary and market trends.",
    route: "/salary-insights",
    color: "bg-yellow-500"
  },
  { 
    key: "cover_letter", 
    title: "Cover Letter Generator", 
    icon: Mail, 
    description: "Generate a personalized cover letter.",
    route: "/cover-letter-generator",
    color: "bg-pink-500"
  },
  { 
    key: "interview_questions", 
    title: "Interview Questions", 
    icon: MessageSquare, 
    description: "Practice with AI-generated interview questions.",
    route: "/interview-questions",
    color: "bg-indigo-500"
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
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Calculate remaining days in subscription
  const getRemainingDays = () => {
    if (!subscriptionStatus?.endDate) return null;
    
    const endDate = new Date(subscriptionStatus.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    console.log(`CandidateDashboard - Calculating remaining days: endDate=${endDate}, today=${today}, diffDays=${diffDays}`);
    
    if (subscriptionStatus.originalDaysRemaining && subscriptionStatus.cancelled) {
      console.log(`Using original days remaining: ${subscriptionStatus.originalDaysRemaining}`);
      return subscriptionStatus.originalDaysRemaining;
    }
    
    return diffDays > 0 ? diffDays : 0;
  };

  // Calculate usage percentage for progress bars
  const getUsagePercentage = (featureKey: string) => {
    const usage = featureUsage[featureKey] || { usageCount: 0, usageLimit: 0 };
    if (usage.usageLimit === 0) return 0;
    return (usage.usageCount / usage.usageLimit) * 100;
  };

  // Redirection is now handled by CandidateProtectedRoute

  // Fetch feature usage **only if not already stored**
  useEffect(() => {
    if (!user || !subscriptionStatus || subscriptionLoading) return;
    if (Object.keys(featureUsage).length > 0) return; // 🚀 Prevents unnecessary re-fetch

    setLoadingUsage(true);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout
    const start = Date.now();

    api.usage.getAllFeatureUsage(user.id)
      .then(({ data, error }) => {
        clearTimeout(timeout);
        console.log("Usage API call took", Date.now() - start, "ms");
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
  }, [user, subscriptionStatus, subscriptionLoading, featureUsage]); // ✅ Prevent redundant API calls

  // Handler for cancel subscription
  const handleCancelSubscription = async () => {
    if (!user) return;
    
    // Confirm cancellation
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

  // Loading and error states
  if (subscriptionLoading || loadingUsage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  if (!user || !subscriptionStatus) {
    return <div className="flex justify-center items-center h-64 text-red-500">You are not logged in. Please log in again.</div>;
  }
  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto py-8 px-4">
        {upgradePrompt && (
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 rounded-xl shadow-lg">
            <div className="flex items-center">
              <Crown className="w-6 h-6 text-yellow-600 mr-3" />
              <span className="text-yellow-800 font-medium">{upgradePrompt}</span>
              <Button className="ml-auto" variant="outline" onClick={() => setUpgradePrompt(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8">
            <div className="flex flex-col md:flex-row items-center justify-between text-white">
              <div className="flex items-center mb-4 md:mb-0">
                <Avatar className="w-16 h-16 mr-4 border-4 border-white/20">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold">Welcome back!</h1>
                  <p className="text-blue-100 mt-1">{user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <Badge className={`px-4 py-2 text-sm font-semibold ${
                    subscriptionStatus.type === "premium" 
                      ? "bg-yellow-400 text-yellow-900" 
                      : subscriptionStatus.type === "basic" 
                        ? "bg-blue-400 text-blue-900" 
                        : "bg-gray-400 text-gray-900"
                  }`}>
                    <Crown className="w-4 h-4 mr-2" />
                    {subscriptionStatus.type.charAt(0).toUpperCase() + subscriptionStatus.type.slice(1)} Plan
                  </Badge>
                  
                  {subscriptionStatus.cancelled && subscriptionStatus.type !== "free" && (
                    <Badge variant="destructive" className="ml-2">
                      Cancelled
                    </Badge>
                  )}
                </div>
                
                {(subscriptionStatus.type !== "premium" || subscriptionStatus.cancelled) && (
                  <Button 
                    variant="secondary" 
                    onClick={() => navigate("/upgrade")}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    {subscriptionStatus.cancelled ? "Renew" : "Upgrade"}
                  </Button>
                )}
              </div>
            </div>

            {subscriptionStatus.endDate && subscriptionStatus.type !== "free" && (
              <div className="mt-4 text-blue-100">
                <p className="text-sm">
                  {subscriptionStatus.cancelled 
                    ? getRemainingDays() > 0 
                      ? `Your subscription expires in ${getRemainingDays()} days` 
                      : "Your subscription expires today"
                    : getRemainingDays() > 0 
                      ? `Your subscription renews in ${getRemainingDays()} days` 
                      : "Your subscription renews today"
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-white p-1 rounded-xl shadow-lg">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Target className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Zap className="w-4 h-4" />
              AI Tools
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <User className="w-4 h-4" />
              My Account
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Scans</p>
                      <p className="text-3xl font-bold">
                        {Object.values(featureUsage).reduce((acc, usage) => acc + usage.usageCount, 0)}
                      </p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">ATS Score</p>
                      <p className="text-3xl font-bold">85%</p>
                    </div>
                    <Bot className="w-8 h-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Profile Views</p>
                      <p className="text-3xl font-bold">142</p>
                    </div>
                    <Eye className="w-8 h-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm">Applications</p>
                      <p className="text-3xl font-bold">23</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-yellow-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Usage Overview */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Monthly Usage Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {featureTypes.map((feature) => {
                    const usage = featureUsage[feature.key] || { usageCount: 0, usageLimit: 0 };
                    const percentage = getUsagePercentage(feature.key);
                    
                    return (
                      <div key={feature.key} className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg ${feature.color} flex items-center justify-center`}>
                          <feature.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">{feature.title}</span>
                            <span className="text-sm text-gray-500">
                              {subscriptionStatus.type === "premium" ? "Unlimited" : `${usage.usageCount}/${usage.usageLimit}`}
                            </span>
                          </div>
                          <Progress 
                            value={subscriptionStatus.type === "premium" ? 100 : percentage} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featureTypes.map((feature, index) => {
                const usage = featureUsage[feature.key] || { usageCount: 0, usageLimit: 0 };
                const isBlocked = (subscriptionStatus.type === "free" && usage.usageCount >= usage.usageLimit) || (subscriptionStatus.type === "basic" && usage.usageCount >= usage.usageLimit);
                
                return (
                  <Card key={index} className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">{feature.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {subscriptionStatus.type === "premium" ? "Unlimited usage" : `${usage.usageCount}/${usage.usageLimit} uses`}
                        </span>
                        {!isBlocked && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Available
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        onClick={() => handleFeatureClick(feature)} 
                        disabled={isBlocked || loadingUsage}
                        variant={isBlocked ? "outline" : "default"}
                      >
                        {isBlocked ? "Upgrade Required" : `Use ${feature.title}`}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Account Info */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-bold">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{user?.email || 'User'}</h3>
                      <p className="text-gray-600">Member since 2024</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email</span>
                      <span className="font-medium">{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan</span>
                      <Badge className={subscriptionStatus.type === "premium" ? "bg-yellow-100 text-yellow-800" : subscriptionStatus.type === "basic" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                        {subscriptionStatus.type.charAt(0).toUpperCase() + subscriptionStatus.type.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status</span>
                      <Badge variant={subscriptionStatus.cancelled ? "destructive" : "default"}>
                        {subscriptionStatus.cancelled ? "Cancelled" : "Active"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Management */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Subscription Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-blue-900">Current Plan</h4>
                      <Badge className="bg-blue-600 text-white">
                        {subscriptionStatus.type.charAt(0).toUpperCase() + subscriptionStatus.type.slice(1)}
                      </Badge>
                    </div>
                    {subscriptionStatus.endDate && subscriptionStatus.type !== "free" && (
                      <p className="text-sm text-blue-700">
                        {subscriptionStatus.cancelled 
                          ? `Expires in ${getRemainingDays()} days` 
                          : `Renews in ${getRemainingDays()} days`
                        }
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {(subscriptionStatus.type !== "premium" || subscriptionStatus.cancelled) && (
                      <Button 
                        className="w-full" 
                        onClick={() => navigate("/upgrade")}
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        {subscriptionStatus.cancelled ? "Renew Subscription" : "Upgrade Plan"}
                      </Button>
                    )}
                    
                    {(subscriptionStatus.type === "basic" || subscriptionStatus.type === "premium") && 
                     !subscriptionStatus.cancelled && (
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={handleCancelSubscription}
                        disabled={cancelLoading}
                      >
                        {cancelLoading ? "Cancelling..." : "Cancel Subscription"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Download My Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="w-4 h-4 mr-2" />
                    Notification Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-2" />
                    Privacy Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Demo
                  </Button>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">First Resume Scan</p>
                      <p className="text-sm text-gray-600">Completed your first ATS scan</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Target className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Profile Optimizer</p>
                      <p className="text-sm text-gray-600">Optimized your resume 5 times</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 opacity-50">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">Job Hunter</p>
                      <p className="text-sm text-gray-600">Apply to 10 jobs (0/10)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CandidateDashboard;
