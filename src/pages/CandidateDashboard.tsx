import React, { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth/AuthContext";
import { Badge } from "@/components/ui/badge";
import api from "@/utils/apiClient";
//import "@styles/CandidateDashboard.css";

const featureTypes = [
  {
    key: "resume_customization",
    title: "Resume Customization",
    icon: "📝",
    description: "Tailor your resume for each job application.",
    route: "/resume-customizer",
  },
  {
    key: "resume_optimization",
    title: "Resume Optimization",
    icon: "🚀",
    description: "Optimize your resume for better results.",
    route: "/resume-optimizer",
  },
  {
    key: "ats_scan",
    title: "ATS Scanner",
    icon: "🤖",
    description: "Scan your resume for ATS compatibility.",
    route: "/ats-scanner",
  },
  {
    key: "resume_benchmarking",
    title: "Resume Benchmarking",
    icon: "📊",
    description: "See how your resume compares to others.",
    route: "/resume-benchmarking",
  },
  {
    key: "cover_letter",
    title: "Cover Letter Generator",
    icon: "✉️",
    description: "Generate a personalized cover letter.",
    route: "/cover-letter-generator",
  },
  {
    key: "interview_questions",
    title: "Interview Questions",
    icon: "💬",
    description: "Practice with AI-generated interview questions.",
    route: "/interview-questions",
  },
];

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const { user, subscriptionStatus, subscriptionLoading } = useAuth();
  const [featureUsage, setFeatureUsage] = useState<Record<string, { usageCount: number; usageLimit: number }>>({});
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgradePrompt, setUpgradePrompt] = useState<string | null>(null);

  // Redirect free users to FreePlanDashboard, but only if not already on that page
  useEffect(() => {
    if (!subscriptionLoading && subscriptionStatus?.type === 'free') {
      if (window.location.pathname !== '/free-plan-dashboard') {
        navigate('/free-plan-dashboard');
      }
    } else if (!subscriptionLoading && subscriptionStatus && subscriptionStatus.type !== 'free') {
      if (window.location.pathname === '/free-plan-dashboard') {
        navigate('/candidate-dashboard');
      }
    }
  }, [subscriptionStatus, subscriptionLoading, navigate]);

  // Fetch usage for all features after subscription is loaded
  useEffect(() => {
    if (!user || !subscriptionStatus || subscriptionLoading) return;
    setLoadingUsage(true);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout
    const start = Date.now();
    api.usage.getAllFeatureUsage(user.id)
      .then(({ data, error }) => {
        clearTimeout(timeout);
        console.log('Usage API call took', Date.now() - start, 'ms');
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
      .catch((err) => {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
          setError('Usage data is taking too long to load. Please try again later.');
        } else {
          setError('An unexpected error occurred while loading usage data.');
        }
        setFeatureUsage({});
        setLoadingUsage(false);
      });
    return () => clearTimeout(timeout);
  }, [user, subscriptionStatus, subscriptionLoading]);

  // Handler for feature button click
  const handleFeatureClick = (feature: any) => {
    if (!user) return;
    const usage = featureUsage[feature.key] || { usageCount: 0, usageLimit: 0 };
    if (
      (subscriptionStatus?.type === "free" && usage.usageCount >= usage.usageLimit) ||
      (subscriptionStatus?.type === "basic" && usage.usageCount >= usage.usageLimit)
    ) {
      setUpgradePrompt(
        subscriptionStatus.type === "free"
          ? "You have reached your free usage limit. Please upgrade to access more features."
          : "You have reached your monthly usage limit. Upgrade to premium for unlimited access."
      );
      return;
    }
    setUpgradePrompt(null);
    navigate(feature.route);
  };

  // Loading and error states
  if (subscriptionLoading || loadingUsage) {
    return <div className="flex justify-center items-center h-64"><span className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></span> Loading dashboard...</div>;
  }
  if (!user || !subscriptionStatus) {
    return <div className="flex justify-center items-center h-64 text-red-500">You are not logged in. Please log in again.</div>;
  }
  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">{error}</div>;
  }

  // Format expiration date
  const formatExpirationDate = () => {
    if (!subscriptionStatus?.endDate) return 'No expiration';
    const endDate = new Date(subscriptionStatus.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Expired';
    if (diffDays === 1) return '1 day remaining';
    return `${diffDays} days remaining`;
  };

  const canUpgrade = subscriptionStatus.type === 'basic';

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row md:justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Candidate Dashboard</h1>
          <p className="text-gray-600">Welcome{user?.email ? `, ${user.email}` : ""}! Enhance your job search with our AI-powered tools.</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <Badge className={`px-3 py-1 ${subscriptionStatus.type === 'premium' ? 'bg-green-500' : subscriptionStatus.type === 'basic' ? 'bg-blue-500' : 'bg-gray-500'}`}>{subscriptionStatus.type.charAt(0).toUpperCase() + subscriptionStatus.type.slice(1)} Plan</Badge>
          <Button variant="outline" onClick={() => navigate('/upgrade')}>Upgrade</Button>
        </div>
      </div>
      {upgradePrompt && (
        <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded flex items-center justify-between">
          <span>{upgradePrompt}</span>
          <Button className="ml-4" variant="outline" onClick={() => navigate("/upgrade")}>Upgrade</Button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {featureTypes.map((feature, index) => {
          const usage = featureUsage[feature.key] || { usageCount: 0, usageLimit: 0 };
          const isBlocked = (subscriptionStatus.type === "free" && usage.usageCount >= usage.usageLimit) || (subscriptionStatus.type === "basic" && usage.usageCount >= usage.usageLimit);
          return (
            <Card key={index} className="overflow-hidden border border-gray-200 transition-shadow hover:shadow-lg">
              <CardHeader className="pb-3 flex flex-col items-center">
                <div className="flex justify-center mb-2 text-3xl">{feature.icon}</div>
                <CardTitle className="text-center mt-2">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full ${subscriptionStatus.type === 'premium' ? 'bg-green-400' : 'bg-blue-400'} progress-bar-width-${Math.round(Math.min(100, (usage.usageCount / (usage.usageLimit || 1)) * 100))}`}
                  ></div>
                </div>
                <div className="text-xs text-center mb-2">
                  {subscriptionStatus.type === "premium" ? "Unlimited usage" : `${usage.usageCount}/${usage.usageLimit} uses this month`}
                </div>
                {isBlocked && (
                  <div className="text-xs text-red-500 text-center mb-2">{subscriptionStatus.type === "free" ? "Free plan limit reached. Upgrade for more." : "Monthly limit reached. Upgrade for unlimited access."}</div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col">
                <Button className="w-full" onClick={() => handleFeatureClick(feature)} disabled={isBlocked || loadingUsage}>
                  {feature.title}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CandidateDashboard;
