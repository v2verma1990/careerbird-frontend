import React, { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth/AuthContext";
import { UserPlus, FileText, FileSearch, Upload, MessageSquare, PieChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import api from "@/utils/apiClient";
import "@/styles/Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userType, subscriptionStatus, incrementUsageCount, subscriptionLoading, restoringSession, cancelSubscription } = useAuth();
  const [cancelLoading, setCancelLoading] = useState(false);
  
  // Calculate remaining days in subscription
  const getRemainingDays = () => {
    if (!subscriptionStatus?.endDate) return null;
    
    const endDate = new Date(subscriptionStatus.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };
  
  // Only allow recruiters to view this dashboard
  useEffect(() => {
    if (userType !== 'recruiter') {
      // Redirect candidates to their dashboard
      if (userType === 'candidate') {
        if (subscriptionStatus?.type === 'free') {
          navigate('/free-plan-dashboard', { replace: true });
        } else {
          navigate('/candidate-dashboard', { replace: true });
        }
      } else {
        // Unknown userType, go to home
        navigate('/', { replace: true });
      }
    }
  }, [userType, subscriptionStatus, navigate]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [featureUsage, setFeatureUsage] = useState<Record<string, { usageCount: number; usageLimit: number }>>({});
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user has reached usage limit (legacy, now always use per-feature usage)
  // const hasReachedLimit = subscriptionStatus.usageCount >= subscriptionStatus.usageLimit 
  //   && subscriptionStatus.type === 'free';
  // Remove above: handled per-feature below

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
      buttonText: isLoading ? "Loading..." : "Find Candidates"
    },
    {
      key: "optimize_job",
      title: "Optimize Job Description",
      description: "Create an optimized job description using AI",
      icon: <FileText className="w-10 h-10 text-purple-500" />,
      route: "/optimize-job",
      buttonText: "Create Job Description"
    },
    {
      key: "candidate_analysis",
      title: "Candidate Analysis",
      description: "Analyze candidate applications and generate reports",
      icon: <PieChart className="w-10 h-10 text-green-500" />,
      route: "/candidate-analysis",
      buttonText: "View Analysis",
      comingSoon: true
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
          setError('Failed to fetch usage data.');
          setFeatureUsage({});
        } else if (data) {
          setFeatureUsage(data);
        } else {
          setFeatureUsage({});
        }
        setLoadingUsage(false);
      })
      .catch(() => {
        setError('An unexpected error occurred while loading usage data.');
        setFeatureUsage({});
        setLoadingUsage(false);
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
    return <div className="flex justify-center items-center h-64"><span className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></span> Loading dashboard...</div>;
  }
  if (!user || !subscriptionStatus) {
    return <div className="flex justify-center items-center h-64 text-red-500">You are not logged in. Please log in again.</div>;
  }
  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row md:justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Recruiter Dashboard</h1>
          <p className="text-gray-600">Welcome, {user.email}! Manage your hiring process with AI-powered tools.</p>
        </div>
        <div className="flex flex-col items-end gap-2 mt-4 md:mt-0">
          <div className="flex items-center gap-4">
            <Badge className={`px-3 py-1 ${subscriptionStatus.type === 'premium' ? 'bg-green-500' : subscriptionStatus.type === 'basic' ? 'bg-blue-500' : 'bg-gray-500'}`}>
              {subscriptionStatus.type.charAt(0).toUpperCase() + subscriptionStatus.type.slice(1)} Plan
            </Badge>
            
            {/* Show upgrade button if not on premium or if subscription is cancelled */}
            {(subscriptionStatus.type !== "premium" || subscriptionStatus.cancelled) && (
              <Button variant="outline" onClick={() => navigate("/upgrade")}>
                {subscriptionStatus.cancelled ? "Renew Subscription" : "Upgrade"}
              </Button>
            )}
            
            {/* Only show cancel button if subscription is active and not already cancelled */}
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
          
          {/* Show subscription status message */}
          {subscriptionStatus.endDate && subscriptionStatus.type !== "free" && (
            <p className="text-sm text-gray-500">
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
          
          {/* Show cancelled badge if subscription is cancelled */}
          {subscriptionStatus.cancelled && (
            <Badge className="px-3 py-1 bg-red-500 mt-2">Cancelled</Badge>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {recruiterFeatures.map((feature, index) => {
          const usage = featureUsage[feature.key] || { usageCount: 0, usageLimit: 0 };
          const isBlocked = (subscriptionStatus.type === "free" && usage.usageCount >= usage.usageLimit) || (subscriptionStatus.type === "basic" && usage.usageCount >= usage.usageLimit);
          return (
            <Card key={index} className="overflow-hidden border border-gray-200 transition-shadow hover:shadow-lg">
              <CardHeader className="pb-3 flex flex-col items-center">
                <div className="flex justify-center mb-2">{feature.icon}</div>
                <CardTitle className="text-center mt-2">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full ${subscriptionStatus.type === 'premium' ? 'bg-green-400' : 'bg-blue-400'} dashboard-progress-bar`}
                    data-progress={Math.min(100, (usage.usageCount / (usage.usageLimit || 1)) * 100)}
                  ></div>
                </div>
                <div className="text-xs text-center mb-2">
                  {subscriptionStatus.type === "premium" ? "Unlimited usage" : `${usage.usageCount}/${usage.usageLimit} uses this month`}
                </div>
                {isBlocked && !feature.comingSoon && (
                  <div className="text-xs text-red-500 text-center mb-2">{subscriptionStatus.type === "free" ? "Free plan limit reached. Upgrade for more." : "Monthly limit reached. Upgrade for unlimited access."}</div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col">
                <Button className="w-full" onClick={() => handleFeatureClick(feature)} disabled={isBlocked || loadingUsage || feature.comingSoon || (feature.action === handleFindCandidates && isLoading)}>
                  {feature.buttonText}
                </Button>
                {feature.comingSoon && (
                  <p className="text-xs text-amber-500 font-medium mt-2 text-center">Coming Soon</p>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
