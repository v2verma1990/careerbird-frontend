
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth/AuthContext";
import { UserPlus, FileText, FileSearch, Upload, MessageSquare, PieChart, Settings, User, Crown, Zap, TrendingUp, Award, Star, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import api from "@/utils/apiClient";
import ProgressBar from "@/components/ProgressBar";
import "@/styles/Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userType, subscriptionStatus, incrementUsageCount, subscriptionLoading, restoringSession, cancelSubscription, signOut } = useAuth();
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  
  // Calculate remaining days in subscription
  const getRemainingDays = () => {
    if (!subscriptionStatus?.endDate) return null;
    
    const endDate = new Date(subscriptionStatus.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    console.log(`RecruiterDashboard - Calculating remaining days: endDate=${endDate}, today=${today}, diffDays=${diffDays}`);
    
    return diffDays > 0 ? diffDays : 0;
  };
  
  // Redirect to appropriate dashboard based on user type
  useEffect(() => {
    if (userType === 'recruiter') {
      // Redirect recruiters to the new enhanced dashboard
      navigate('/recruiter-dashboard-new', { replace: true });
    } else if (userType === 'candidate') {
      // Redirect candidates to their dashboard
      if (subscriptionStatus?.type === 'free') {
        navigate('/free-plan-dashboard', { replace: true });
      } else {
        navigate('/candidate-dashboard', { replace: true });
      }
    } else if (userType) {
      // Unknown userType, go to home
      navigate('/', { replace: true });
    }
  }, [userType, subscriptionStatus, navigate]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [featureUsage, setFeatureUsage] = useState<Record<string, { usageCount: number; usageLimit: number }>>({});
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleFindCandidates = async () => {
    // Increment usage and navigate
    try {
      setIsLoading(true);
      // Always use per-feature usage/limit from featureUsage
      const usage = featureUsage['find_candidates'] || { usageCount: 0, usageLimit: 0 };
      const newCount = await incrementUsageCount("find_candidates");
      // Check if user has reached usage limit
      if (
        (subscriptionStatus?.type === 'free' && newCount > usage.usageLimit) ||
        (subscriptionStatus?.type === 'basic' && newCount > usage.usageLimit)
      ) {
        alert("You've reached your usage limit. Please upgrade your subscription to continue.");
        return;
      }
      navigate('/best-candidates');
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Features specific to recruiters
  const recruiterFeatures = [
    {
      key: "find_candidates",
      title: "Find Best Candidates",
      description: "Use AI to find the best candidates based on job description",
      icon: <UserPlus className="w-10 h-10 text-blue-500" />,
      action: handleFindCandidates,
      buttonText: isLoading ? "Loading..." : "Find Candidates",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      key: "optimize_job",
      title: "Optimize Job Description",
      description: "Create an optimized job description using AI",
      icon: <FileText className="w-10 h-10 text-purple-500" />,
      route: "/optimize-job",
      buttonText: "Create Job Description",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      key: "candidate_analysis",
      title: "Candidate Analysis",
      description: "Analyze candidate applications and generate reports",
      icon: <PieChart className="w-10 h-10 text-green-500" />,
      route: "/candidate-analysis",
      buttonText: "View Analysis",
      comingSoon: true,
      gradient: "from-green-500 to-emerald-500"
    }
  ];

  // Fetch usage for all recruiter features after subscription is loaded
  useEffect(() => {
    if (!user || !subscriptionStatus) return;
    setLoadingUsage(true);
    setError(null);
    
    api.usage.getAllFeatureUsage(user.id)
      .then(({ data, error }) => {
        if (error) {
          console.warn('Usage data fetch failed, but continuing with default limits:', error);
          // Don't set error state - just use default limits
          setFeatureUsage({
            find_candidates: { usageCount: 0, usageLimit: 10 },
            optimize_job: { usageCount: 0, usageLimit: 10 },
            candidate_analysis: { usageCount: 0, usageLimit: 10 }
          });
        } else if (data) {
          setFeatureUsage(data);
        } else {
          setFeatureUsage({
            find_candidates: { usageCount: 0, usageLimit: 10 },
            optimize_job: { usageCount: 0, usageLimit: 10 },
            candidate_analysis: { usageCount: 0, usageLimit: 10 }
          });
        }
        setLoadingUsage(false);
      })
      .catch((catchError) => {
        console.warn('Usage API call completely failed, using default limits:', catchError);
        // Don't block the UI - provide default limits
        setFeatureUsage({
          find_candidates: { usageCount: 0, usageLimit: 10 },
          optimize_job: { usageCount: 0, usageLimit: 10 },
          candidate_analysis: { usageCount: 0, usageLimit: 10 }
        });
        setLoadingUsage(false);
        // Don't set error state to avoid blocking the UI
      });
  }, [user, subscriptionStatus]);

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

  // Handler for logout
  const handleLogout = async () => {
    try {
      await signOut();
      // After signOut, explicitly navigate to home page and force a page reload
      // This ensures all React state is cleared and prevents stale auth state
      window.location.href = '/';
    } catch (error) {
      console.error("Error during logout:", error);
      // If there's an error during logout, still try to navigate home with a reload
      window.location.href = '/';
    }
  };
  
  // Handler for feature button click
  const handleFeatureClick = async (feature: any) => {
    if (!user) return;
    const usage = featureUsage[feature.key] || { usageCount: 0, usageLimit: 0 };
    if (
      (subscriptionStatus?.type === "free" && usage.usageCount >= usage.usageLimit) ||
      (subscriptionStatus?.type === "basic" && usage.usageCount >= usage.usageLimit)
    ) {
      alert(
        subscriptionStatus.type === "free"
          ? "You have reached your free usage limit. Please upgrade to access more features."
          : "You have reached your monthly usage limit. Upgrade to premium for unlimited access."
      );
      return;
    }
    if (feature.route) {
      navigate(feature.route);
    } else if (feature.action) {
      await feature.action();
    }
  };

  if (subscriptionLoading || loadingUsage || restoringSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex justify-center items-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (!user || !subscriptionStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex justify-center items-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-red-500 text-lg">You are not logged in. Please log in again.</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex justify-center items-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileSearch className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-red-500 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  Recruiter Dashboard
                  <Zap className="w-6 h-6 text-yellow-500" />
                </h1>
                <p className="text-gray-600 mt-1">Welcome back, {user.email}! Ready to find your next hire?</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAccount(!showAccount)}
                className="border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                My Account
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="border-red-300 hover:border-red-500 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Account Section */}
        {showAccount && (
          <Card className="mb-8 shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3">
                <User className="w-6 h-6" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Badge className={`px-3 py-1 ${
                        subscriptionStatus.type === "premium" || subscriptionStatus.type === "recruiter" 
                          ? "bg-green-500" 
                          : subscriptionStatus.type === "basic" 
                            ? "bg-blue-500" 
                            : "bg-gray-500"
                      }`}>
                        <Crown className="w-3 h-3 mr-1" />
                        {subscriptionStatus.type.charAt(0).toUpperCase() + subscriptionStatus.type.slice(1)} Plan
                      </Badge>
                      
                      {subscriptionStatus.cancelled && subscriptionStatus.type !== "free" && (
                        <Badge variant="outline" className="border-red-500 text-red-500">
                          Cancelled
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {subscriptionStatus.endDate && subscriptionStatus.type !== "free" && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      {subscriptionStatus.cancelled 
                        ? getRemainingDays() > 0 
                          ? `Your subscription will end in ${getRemainingDays()} days` 
                          : "Your subscription will end today"
                        : getRemainingDays() > 0 
                          ? `Your subscription will renew in ${getRemainingDays()} days` 
                          : "Your subscription will renew today"
                      }
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col gap-3">
                  {(subscriptionStatus.type !== "recruiter" || subscriptionStatus.cancelled) && (
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/upgrade")}
                      className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      {subscriptionStatus.cancelled ? 
                        (subscriptionStatus.type === "recruiter" ? "Renew Recruiter" : "Renew Subscription") : 
                        "Upgrade"}
                    </Button>
                  )}
                  
                  {(subscriptionStatus.type === "basic" || subscriptionStatus.type === "premium" || subscriptionStatus.type === "recruiter") && 
                   !subscriptionStatus.cancelled && (
                    <Button 
                      variant="outline" 
                      className="text-red-500 border-red-500 hover:bg-red-50"
                      onClick={handleCancelSubscription}
                      disabled={cancelLoading}
                    >
                      {cancelLoading ? "Cancelling..." : "Cancel Subscription"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recruiterFeatures.map((feature, index) => {
            const usage = featureUsage[feature.key] || { usageCount: 0, usageLimit: 0 };
            const isBlocked = (subscriptionStatus.type === "free" && usage.usageCount >= usage.usageLimit) || (subscriptionStatus.type === "basic" && usage.usageCount >= usage.usageLimit);
            const progressPercentage = Math.min(100, (usage.usageCount / (usage.usageLimit || 1)) * 100);
            
            return (
              <Card key={index} className="group overflow-hidden border-0 shadow-2xl bg-white/90 backdrop-blur-sm transition-all duration-300 hover:shadow-3xl hover:scale-105">
                <div className={`h-2 bg-gradient-to-r ${feature.gradient}`}></div>
                <CardHeader className="pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={`w-20 h-20 bg-gradient-to-r ${feature.gradient} rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-center text-xl font-bold text-gray-900">{feature.title}</CardTitle>
                  <p className="text-center text-gray-600 text-sm">{feature.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ProgressBar 
                    percentage={progressPercentage} 
                    gradientClasses={feature.gradient} 
                  />
                  
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {/* Show actual usage limit for all plans */}
                      {usage.usageLimit > 0 ? (
                        `${usage.usageCount}/${usage.usageLimit} uses this month`
                      ) : (
                        <span className="text-green-600 flex items-center justify-center gap-1">
                          <Star className="w-4 h-4" />
                          Unlimited usage
                        </span>
                      )}
                    </div>
                    {isBlocked && !feature.comingSoon && (
                      <div className="text-xs text-red-500 mt-1 font-medium">
                        {subscriptionStatus.type === "free" ? "Free plan limit reached" : "Monthly limit reached"}
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="pt-0">
                  <Button 
                    className={`w-full py-3 font-medium transition-all duration-300 ${
                      feature.comingSoon 
                        ? 'bg-gray-400 hover:bg-gray-500 cursor-not-allowed' 
                        : isBlocked 
                          ? 'bg-red-500 hover:bg-red-600' 
                          : `bg-gradient-to-r ${feature.gradient} hover:shadow-lg hover:scale-105`
                    }`}
                    onClick={() => handleFeatureClick(feature)} 
                    disabled={isBlocked || loadingUsage || feature.comingSoon || (feature.action === handleFindCandidates && isLoading)}
                  >
                    {feature.comingSoon ? (
                      <>
                        <Award className="w-4 h-4 mr-2" />
                        Coming Soon
                      </>
                    ) : (
                      <>
                        {feature.action === handleFindCandidates && isLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : null}
                        {feature.buttonText}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Stats Card */}
        <Card className="mt-8 shadow-2xl border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold">50K+</div>
                <p className="text-blue-100">Candidates Found</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold">95%</div>
                <p className="text-blue-100">Success Rate</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold">24/7</div>
                <p className="text-blue-100">AI Support</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
