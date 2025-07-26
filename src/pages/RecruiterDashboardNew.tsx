import React, { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth/AuthContext";
import { 
  UserPlus, FileText, FileSearch, Upload, MessageSquare, PieChart, 
  Settings, User, Crown, Zap, TrendingUp, Award, Star, LogOut,
  BarChart3, Users, Brain, Target, Sparkles, Clock, CheckCircle,
  AlertCircle, XCircle, Download, Filter, Search, Plus, Trash2,
  Eye, Edit, MoreHorizontal, RefreshCw, ArrowRight, Activity,
  Database, Cloud, Server, Cpu, Shield, Headphones
} from "lucide-react";
import api from "@/utils/apiClient";
import ProgressBar from "@/components/ProgressBar";
import { getConfigForPlan, recruiterFeatures, planFeatureMatrix } from "@/config/recruiterConfig";
import "@/styles/Dashboard.css";

interface DashboardStats {
  totalResumes: number;
  totalAnalyses: number;
  totalComparisons: number;
  totalReports: number;
  averageMatchScore: number;
  topSkillGaps: string[];
  recentActivity: any[];
}

interface FeatureUsage {
  [key: string]: {
    usageCount: number;
    usageLimit: number;
  };
}

const RecruiterDashboardNew = () => {
  const navigate = useNavigate();
  const { user, userType, subscriptionStatus, incrementUsageCount, subscriptionLoading, restoringSession, cancelSubscription, signOut } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage>({});
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [processingQueue, setProcessingQueue] = useState([]);
  const [showAccount, setShowAccount] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [planLimits, setPlanLimits] = useState<any>({});

  // Redirect non-recruiters
  useEffect(() => {
    if (userType !== 'recruiter') {
      if (userType === 'candidate') {
        if (subscriptionStatus?.type === 'free') {
          navigate('/free-plan-dashboard', { replace: true });
        } else {
          navigate('/candidate-dashboard', { replace: true });
        }
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [userType, subscriptionStatus, navigate]);

  // Calculate remaining days in subscription
  const getRemainingDays = () => {
    if (!subscriptionStatus?.endDate) return null;
    
    const endDate = new Date(subscriptionStatus.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  // Fetch dashboard data
  useEffect(() => {
    if (!user || !subscriptionStatus) return;
    
    const fetchDashboardData = async () => {
      setLoadingUsage(true);
      
      try {
        // Fetch usage data for recruiter features (database-driven like candidate dashboard)
        const { data: usageData, error: usageError } = await api.usage.getAllFeatureUsage(user.id);
        
        if (!usageError && usageData) {
          setFeatureUsage(usageData);
        } else {
          console.warn('Usage data fetch failed, using defaults:', usageError);
          // Set default usage data for recruiter features
          setFeatureUsage({
            resume_analysis: { usageCount: 0, usageLimit: 3 },
            bulk_resume_processing: { usageCount: 0, usageLimit: 1 },
            candidate_comparison: { usageCount: 0, usageLimit: 3 },
            skill_gap_analysis: { usageCount: 0, usageLimit: 3 },
            ai_report_generation: { usageCount: 0, usageLimit: 3 },
            find_candidates: { usageCount: 0, usageLimit: 3 },
            optimize_job: { usageCount: 0, usageLimit: 3 },
            candidate_analysis: { usageCount: 0, usageLimit: 3 },
          });
        }

        // Fetch plan limits from database (like candidate dashboard)
        const { data: limitsData } = await api.recruiter.getPlanLimits(subscriptionStatus.type);
        if (limitsData) {
          setPlanLimits(limitsData);
        }

        // Fetch dashboard statistics
        const { data: statsData } = await api.recruiter.getDashboardStats(user.id);
        if (statsData) {
          setDashboardStats(statsData);
        } else {
          // Set default stats if API fails
          setDashboardStats({
            totalResumes: 0,
            totalAnalyses: 0,
            totalComparisons: 0,
            totalReports: 0,
            averageMatchScore: 0,
            topSkillGaps: [],
            recentActivity: []
          });
        }

        // Fetch recent jobs
        const { data: jobsData } = await api.recruiter.getJobDescriptions(user.id);
        if (jobsData) {
          setRecentJobs(jobsData.slice(0, 5)); // Show only recent 5
        }

        // Fetch processing queue status
        const { data: queueData } = await api.recruiter.getQueueStatus(user.id);
        if (queueData) {
          setProcessingQueue(queueData);
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Set fallback data
        setFeatureUsage({
          resume_analysis: { usageCount: 0, usageLimit: 3 },
          bulk_resume_processing: { usageCount: 0, usageLimit: 1 },
          candidate_comparison: { usageCount: 0, usageLimit: 3 },
          skill_gap_analysis: { usageCount: 0, usageLimit: 3 },
          ai_report_generation: { usageCount: 0, usageLimit: 3 },
          find_candidates: { usageCount: 0, usageLimit: 3 },
          optimize_job: { usageCount: 0, usageLimit: 3 },
          candidate_analysis: { usageCount: 0, usageLimit: 3 },
        });
        setDashboardStats({
          totalResumes: 0,
          totalAnalyses: 0,
          totalComparisons: 0,
          totalReports: 0,
          averageMatchScore: 0,
          topSkillGaps: [],
          recentActivity: []
        });
      } finally {
        setLoadingUsage(false);
      }
    };

    fetchDashboardData();
  }, [user, subscriptionStatus]);

  // Handle feature click with usage tracking
  const handleFeatureClick = async (featureKey: string, action: () => void) => {
    if (!user) return;
    
    const usage = featureUsage[featureKey] || { usageCount: 0, usageLimit: 0 };
    
    if (usage.usageCount >= usage.usageLimit) {
      alert(
        subscriptionStatus?.type === "free"
          ? "You have reached your free usage limit. Please upgrade to access more features."
          : subscriptionStatus?.type === "basic"
          ? "You have reached your monthly usage limit. Upgrade to premium for unlimited access."
          : "Usage limit reached."
      );
      return;
    }
    
    try {
      setIsLoading(true);
      const newCount = await incrementUsageCount(featureKey);
      
      // Update local usage state
      setFeatureUsage(prev => ({
        ...prev,
        [featureKey]: { ...usage, usageCount: newCount }
      }));
      
      action();
    } catch (error) {
      console.error("Error tracking usage:", error);
      // Still allow the action if usage tracking fails
      action();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error("Error during logout:", error);
      window.location.href = '/';
    }
  };

  // Handle cancel subscription
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

  // Enhanced feature definitions for recruiters
  const enhancedRecruiterFeatures = [
    {
      key: "resume_analysis",
      title: "AI Resume Analysis",
      description: "Advanced AI-powered analysis of resumes against job descriptions with detailed scoring",
      icon: <Brain className="w-10 h-10 text-blue-500" />,
      action: () => navigate('/recruiter/resume-analysis'),
      buttonText: "Analyze Resumes",
      gradient: "from-blue-500 to-cyan-500",
      category: "analysis",
      premium: false
    },
    {
      key: "bulk_resume_processing",
      title: "Bulk Resume Processing",
      description: "Upload and process multiple resumes simultaneously with queue management",
      icon: <Upload className="w-10 h-10 text-purple-500" />,
      action: () => navigate('/recruiter/bulk-processing'),
      buttonText: "Bulk Process",
      gradient: "from-purple-500 to-pink-500",
      category: "processing",
      premium: subscriptionStatus?.type === 'free'
    },
    {
      key: "candidate_comparison",
      title: "Candidate Comparison",
      description: "Side-by-side comparison of candidates with AI-powered insights and rankings",
      icon: <Users className="w-10 h-10 text-green-500" />,
      action: () => navigate('/recruiter/candidate-comparison'),
      buttonText: "Compare Candidates",
      gradient: "from-green-500 to-emerald-500",
      category: "analysis",
      premium: false
    },
    {
      key: "skill_gap_analysis",
      title: "Skill Gap Analysis",
      description: "Identify missing skills and competency gaps with actionable recommendations",
      icon: <Target className="w-10 h-10 text-orange-500" />,
      action: () => navigate('/recruiter/skill-gaps'),
      buttonText: "Analyze Skills",
      gradient: "from-orange-500 to-red-500",
      category: "analysis",
      premium: false
    },
    {
      key: "ai_report_generation",
      title: "AI Report Generation",
      description: "Generate comprehensive PDF reports with AI insights and recommendations",
      icon: <FileText className="w-10 h-10 text-indigo-500" />,
      action: () => navigate('/recruiter/reports'),
      buttonText: "Generate Reports",
      gradient: "from-indigo-500 to-purple-500",
      category: "reporting",
      premium: false
    },
    {
      key: "find_candidates",
      title: "Find Best Candidates",
      description: "Use AI to find the best candidates based on job description",
      icon: <UserPlus className="w-10 h-10 text-teal-500" />,
      action: () => navigate('/best-candidates'),
      buttonText: "Find Candidates",
      gradient: "from-teal-500 to-cyan-500",
      category: "sourcing",
      premium: false
    },
    {
      key: "optimize_job",
      title: "Optimize Job Description",
      description: "Create an optimized job description using AI",
      icon: <Sparkles className="w-10 h-10 text-yellow-500" />,
      action: () => navigate('/optimize-job'),
      buttonText: "Optimize Job",
      gradient: "from-yellow-500 to-orange-500",
      category: "optimization",
      premium: false
    },
    {
      key: "candidate_analysis",
      title: "Advanced Analytics",
      description: "Deep insights and hiring trends analysis with custom scoring",
      icon: <BarChart3 className="w-10 h-10 text-rose-500" />,
      action: () => navigate('/recruiter/analytics'),
      buttonText: "View Analytics",
      gradient: "from-rose-500 to-pink-500",
      category: "analytics",
      premium: subscriptionStatus?.type !== 'premium'
    }
  ];

  // Get current plan configuration
  const currentPlanConfig = getConfigForPlan(subscriptionStatus?.type || 'free');
  const currentPlanFeatures = planFeatureMatrix[subscriptionStatus?.type as keyof typeof planFeatureMatrix] || planFeatureMatrix.free;

  // Loading state
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

  // Authentication check
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Enhanced Header */}
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

                  {/* Plan Configuration Display */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Current Plan Configuration</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-600">Vector DB:</span>
                        <span className="font-medium">{currentPlanFeatures.vectorDB}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-green-500" />
                        <span className="text-gray-600">Processing:</span>
                        <span className="font-medium">{currentPlanFeatures.processing}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-500" />
                        <span className="text-gray-600">Reports:</span>
                        <span className="font-medium">{currentPlanFeatures.reports}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Headphones className="w-4 h-4 text-orange-500" />
                        <span className="text-gray-600">Support:</span>
                        <span className="font-medium">{currentPlanFeatures.support}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {subscriptionStatus.type !== "free" && !subscriptionStatus.cancelled && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCancelSubscription}
                      disabled={cancelLoading}
                      className="border-red-300 hover:border-red-500 hover:text-red-600"
                    >
                      {cancelLoading ? "Cancelling..." : "Cancel Subscription"}
                    </Button>
                  )}
                  
                  {(subscriptionStatus.type === "free" || subscriptionStatus.type === "basic") && (
                    <Button 
                      onClick={() => navigate('/upgrade')}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade Plan
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Dashboard with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="analytics" className="hidden lg:block">Analytics</TabsTrigger>
            <TabsTrigger value="settings" className="hidden lg:block">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            {dashboardStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100">Total Resumes</p>
                        <p className="text-3xl font-bold">{dashboardStats.totalResumes}</p>
                      </div>
                      <FileText className="w-8 h-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100">Analyses Done</p>
                        <p className="text-3xl font-bold">{dashboardStats.totalAnalyses}</p>
                      </div>
                      <Brain className="w-8 h-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100">Comparisons</p>
                        <p className="text-3xl font-bold">{dashboardStats.totalComparisons}</p>
                      </div>
                      <Users className="w-8 h-8 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100">Avg Match Score</p>
                        <p className="text-3xl font-bold">{dashboardStats.averageMatchScore}%</p>
                      </div>
                      <Target className="w-8 h-8 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enhancedRecruiterFeatures.map((feature) => {
                const usage = featureUsage[feature.key] || { usageCount: 0, usageLimit: 0 };
                const usagePercentage = usage.usageLimit > 0 ? (usage.usageCount / usage.usageLimit) * 100 : 0;
                const isLimitReached = usage.usageCount >= usage.usageLimit;

                return (
                  <Card key={feature.key} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
                    <div className={`h-2 bg-gradient-to-r ${feature.gradient}`}></div>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {feature.icon}
                          <div>
                            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              {feature.title}
                              {feature.premium && (
                                <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                                  <Crown className="w-3 h-3 mr-1" />
                                  Premium
                                </Badge>
                              )}
                            </CardTitle>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {feature.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pb-4">
                      <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
                      
                      {/* Usage Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Usage</span>
                          <span className={`font-medium ${isLimitReached ? 'text-red-500' : 'text-gray-700'}`}>
                            {usage.usageCount} / {usage.usageLimit === 999 ? '∞' : usage.usageLimit}
                          </span>
                        </div>
                        <Progress 
                          value={usage.usageLimit === 999 ? 0 : usagePercentage} 
                          className={`h-2 ${isLimitReached ? 'bg-red-100' : 'bg-gray-100'}`}
                        />
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-0">
                      {feature.premium ? (
                        <Button 
                          onClick={() => navigate('/upgrade')}
                          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 transition-opacity"
                        >
                          <Crown className="w-4 h-4 mr-2" />
                          Upgrade to Access
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleFeatureClick(feature.key, feature.action)}
                          disabled={isLoading || isLimitReached}
                          className={`w-full bg-gradient-to-r ${feature.gradient} hover:opacity-90 transition-opacity ${
                            isLimitReached ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {isLoading ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <ArrowRight className="w-4 h-4 mr-2" />
                          )}
                          {isLimitReached ? 'Limit Reached' : feature.buttonText}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Jobs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSearch className="w-5 h-5" />
                    Recent Job Descriptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentJobs.length > 0 ? (
                    <div className="space-y-3">
                      {recentJobs.map((job: any) => (
                        <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium">{job.title}</h4>
                            <p className="text-sm text-gray-500">{job.company_name}</p>
                          </div>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileSearch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No job descriptions yet</p>
                      <Button 
                        onClick={() => navigate('/recruiter/job-descriptions')} 
                        className="mt-4"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Job Description
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Processing Queue */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Processing Queue
                    <Badge variant="outline" className="ml-auto">
                      {currentPlanFeatures.processing}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {processingQueue.length > 0 ? (
                    <div className="space-y-3">
                      {processingQueue.map((job: any) => (
                        <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {job.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {job.status === 'processing' && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
                            {job.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                            {job.status === 'pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                            <div>
                              <h4 className="font-medium">{job.job_type}</h4>
                              <p className="text-sm text-gray-500">Status: {job.status}</p>
                            </div>
                          </div>
                          {job.status === 'processing' && (
                            <Button size="sm" variant="outline" onClick={() => api.recruiter.cancelQueueJob(job.id)}>
                              Cancel
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No jobs in queue</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Using {currentPlanFeatures.processing} for processing
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Processing Tab */}
          <TabsContent value="processing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Bulk Processing Center
                  <Badge className="ml-auto bg-blue-500">
                    {currentPlanFeatures.processing}
                  </Badge>
                </CardTitle>
                <p className="text-gray-600">Upload and process multiple resumes simultaneously</p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Ready to Process Resumes</h3>
                  <p className="text-gray-600 mb-4">Upload multiple resumes and let AI analyze them against your job descriptions</p>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-6">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      <span>Vector DB: {currentPlanFeatures.vectorDB}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4" />
                      <span>Processing: {currentPlanFeatures.processing}</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleFeatureClick('bulk_resume_processing', () => navigate('/recruiter/bulk-processing'))}
                    className="bg-gradient-to-r from-purple-500 to-pink-500"
                    disabled={subscriptionStatus?.type === 'free' && featureUsage.bulk_resume_processing?.usageCount >= featureUsage.bulk_resume_processing?.usageLimit}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Start Bulk Processing
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Report Generation
                  <Badge className="ml-auto bg-indigo-500">
                    {currentPlanFeatures.reports}
                  </Badge>
                </CardTitle>
                <p className="text-gray-600">Generate comprehensive AI-powered reports</p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Generate Detailed Reports</h3>
                  <p className="text-gray-600 mb-4">Create comprehensive PDF reports with AI insights and recommendations</p>
                  <div className="text-sm text-gray-500 mb-6">
                    Report Type: {currentPlanFeatures.reports}
                  </div>
                  <Button 
                    onClick={() => handleFeatureClick('ai_report_generation', () => navigate('/recruiter/reports'))}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Advanced Analytics
                  {subscriptionStatus?.type === 'premium' ? (
                    <Badge className="ml-auto bg-green-500">Available</Badge>
                  ) : (
                    <Badge variant="outline" className="ml-auto border-yellow-500 text-yellow-600">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium Only
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-gray-600">Deep insights and hiring trends analysis</p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BarChart3 className="w-10 h-10 text-white" />
                  </div>
                  {subscriptionStatus?.type === 'premium' ? (
                    <>
                      <h3 className="text-lg font-medium mb-2">Advanced Analytics Available</h3>
                      <p className="text-gray-600 mb-6">Access detailed hiring insights and trends</p>
                      <Button 
                        onClick={() => navigate('/recruiter/analytics')}
                        className="bg-gradient-to-r from-rose-500 to-pink-500"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Analytics
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-medium mb-2">Upgrade for Advanced Analytics</h3>
                      <p className="text-gray-600 mb-6">Get detailed hiring insights, trends analysis, and custom scoring</p>
                      <Button 
                        onClick={() => navigate('/upgrade')} 
                        className="bg-gradient-to-r from-yellow-500 to-orange-500"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Premium
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Dashboard Settings
                </CardTitle>
                <p className="text-gray-600">Customize your dashboard experience</p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Settings className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Settings Coming Soon</h3>
                  <p className="text-gray-600">Dashboard customization options will be available soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RecruiterDashboardNew;