import React, { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth/AuthContext";
import { useResume } from "@/contexts/resume/ResumeContext";
import { Badge } from "@/components/ui/badge";
import { api } from "@/utils/apiClient";
import TopNavigation from "@/components/TopNavigation";
import DefaultResumeUploader from "@/components/DefaultResumeUploader";
import ProfileMetadataEditor from "@/components/ProfileMetadataEditor";
// Make sure the file exists at src/components/ProfileCompletionSteps.tsx
// If the file is named differently or in another folder, update the path accordingly.
import ProfileCompletionSteps from "../components/ProfileCompletionSteps";
import "../styles/CandidateDashboard.css";
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
  ChevronRight,
  Activity,
  Calendar,
  Download,
  Plus,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Helper function to convert Tailwind gradient classes to CSS class names
const getProgressColorClass = (colorClass: string): string => {
  // Check if colorClass is undefined or not a gradient class
  if (!colorClass || !colorClass.includes('from-')) {
    return 'progress-blue-cyan'; // Default fallback
  }
  
  try {
    const colors = colorClass.split(' ');
    // Find the 'from-' and 'to-' parts
    const fromPart = colors.find(c => c.startsWith('from-'));
    const toPart = colors.find(c => c.startsWith('to-'));
    
    if (!fromPart || !toPart) {
      return 'progress-blue-cyan'; // Default fallback if parts not found
    }
    
    const fromColor = fromPart.replace('from-', '');
    const toColor = toPart.replace('to-', '');
    
    // Map color combinations to the corresponding CSS classes
    const colorMap: Record<string, string> = {
      'blue-500 cyan-500': 'progress-blue-cyan',
      'green-500 emerald-500': 'progress-green-emerald',
      'purple-500 pink-500': 'progress-purple-pink',
      'orange-500 red-500': 'progress-orange-red',
      'indigo-500 purple-500': 'progress-indigo-purple',
      'cyan-500 blue-500': 'progress-cyan-blue',
      'pink-500 rose-500': 'progress-pink-rose'
    };
    
    return colorMap[`${fromColor} ${toColor}`] || 'progress-blue-cyan'; // Default fallback
  } catch (error) {
    console.error('Error parsing color class:', error);
    return 'progress-blue-cyan'; // Default fallback on error
  }
};

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
  const { user, subscriptionStatus, subscriptionLoading } = useAuth();
  const { defaultResume, profileStatus, updateResumeVisibility } = useResume();
  const { toast } = useToast();
  const [featureUsage, setFeatureUsage] = useState<Record<string, { usageCount: number; usageLimit: number }>>({});
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgradePrompt, setUpgradePrompt] = useState<string | null>(null);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

  // Handle subscription changes and resume visibility
  useEffect(() => {
    if (!user || !defaultResume || subscriptionLoading) return;
    
    // If user is on free or basic plan but resume is visible to recruiters, update visibility to false
    if ((subscriptionStatus?.type === 'free' || subscriptionStatus?.type === 'basic') && defaultResume.isVisibleToRecruiters) {
      // Automatically turn off visibility for non-premium users
      updateResumeVisibility(false).then(success => {
        if (success) {
          toast({
            title: "Recruiter visibility has been turned off",
            description: subscriptionStatus?.type === 'basic' 
              ? "Recruiter visibility is a premium feature. Please upgrade to premium to make your resume visible to recruiters."
              : "Resume visibility to recruiters is a premium feature. Please upgrade to make your resume visible to recruiters.",
            variant: "default"
          });
        }
      });
    }
  }, [user, defaultResume, subscriptionStatus, subscriptionLoading]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <TopNavigation />
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !subscriptionStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <TopNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Visibility Notification Banners */}
        {/* Removed redundant banner for free users */}
        
        {/* Removed redundant banner for basic users */}
        
        {/* For premium users with visibility off */}
        {(subscriptionStatus?.type === 'premium' || subscriptionStatus?.type === 'recruiter') && defaultResume && !defaultResume.isVisibleToRecruiters && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Eye className="h-5 w-5 text-amber-600" aria-hidden="true" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-amber-800">Your resume is not visible to recruiters</h3>
                <div className="mt-1 text-sm text-amber-700">
                  <p>Make your resume visible to recruiters to increase your chances of being discovered for job opportunities.</p>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => updateResumeVisibility(true)}
                  >
                    Make Resume Visible
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={() => navigate('/profile', { state: { openVisibilitySettings: true } })}
                  >
                    View Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome back, <span className="text-blue-600">{user?.email?.split('@')[0] || 'User'}</span>! 👋
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ready to accelerate your career? Choose from our AI-powered tools to create outstanding applications.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => navigate('/resume-builder-app')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Quick Start</h3>
                  <p className="text-blue-100">Build a new resume</p>
                </div>
                <Plus className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => navigate('/ats-scanner')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Scan Resume</h3>
                  <p className="text-green-100">Check ATS compatibility</p>
                </div>
                <Activity className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => navigate('/upgrade')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Go Premium</h3>
                  <p className="text-purple-100">Unlock all features</p>
                </div>
                <Crown className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Resume Reminder - Show for all users, with different content based on resume status */}
        <div className="mb-8">
          <Card className={`shadow-md ${
            profileStatus && !profileStatus.hasResume 
              ? "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50" 
              : "border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50"
          }`}>
            <CardContent className="p-6">
              {profileStatus && !profileStatus.hasResume ? (
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-amber-800 mb-1">Get Started: Upload Your Resume</h3>
                      <p className="text-amber-700">
                        Upload your resume once to unlock all features and get personalized recommendations.
                        Your resume will be available across all tools without having to upload it each time.
                      </p>
                    </div>
                  </div>
                  <Button 
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={(e) => {
                      e.preventDefault();
                      // Open a modal or drawer instead of navigating away
                      // For now, we'll just navigate but we should implement a modal in the future
                      navigate('/account', { state: { returnTo: '/dashboard' } });
                    }}
                  >
                    Upload Resume
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800 mb-1">Resume Ready</h3>
                      <p className="text-blue-700">
                        Your default resume is set and ready to use with all our tools.
                        {(subscriptionStatus?.type === 'premium' || subscriptionStatus?.type === 'recruiter') && (
                          <span className="ml-1">
                            {defaultResume?.isVisibleToRecruiters ? (
                              <span className="text-green-600 font-medium">Your resume is visible to recruiters.</span>
                            ) : (
                              <span className="text-amber-600 font-medium">Your resume is not visible to recruiters.</span>
                            )}
                          </span>
                        )}
                      </p>
                      
                      {/* Visibility status for premium users only */}
                      {(subscriptionStatus?.type === 'premium' || subscriptionStatus?.type === 'recruiter') && (
                        <div className="mt-2 flex items-center">
                          <div className={`h-2 w-2 rounded-full mr-2 ${defaultResume?.isVisibleToRecruiters ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                          <div className="flex items-center justify-between w-full">
                            <p className={`text-sm ${defaultResume?.isVisibleToRecruiters ? 'text-green-600' : 'text-amber-600'}`}> 
                              {defaultResume?.isVisibleToRecruiters 
                                ? "Recruiter visibility: ON - You can be discovered for job opportunities" 
                                : "Recruiter visibility: OFF - Enable to be discovered for job opportunities"}
                            </p>
                            <Button
                              variant={defaultResume?.isVisibleToRecruiters ? "default" : "outline"}
                              size="sm"
                              className={`ml-2 h-6 ${defaultResume?.isVisibleToRecruiters ? "bg-green-600 hover:bg-green-700 text-white" : "border-amber-300 text-amber-700 hover:bg-amber-50"}`}
                              disabled={isUpdatingVisibility}
                              aria-label={defaultResume?.isVisibleToRecruiters ? "Hide resume from recruiters" : "Show resume to recruiters"}
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsUpdatingVisibility(true);
                                try {
                                  const success = await updateResumeVisibility(!defaultResume?.isVisibleToRecruiters);
                                  if (success) {
                                    toast({
                                      title: defaultResume?.isVisibleToRecruiters
                                        ? "Your resume is now hidden from recruiters."
                                        : "Your resume is now visible to recruiters.",
                                      variant: "default"
                                    });
                                  } else {
                                    toast({
                                      title: "Failed to update recruiter visibility.",
                                      variant: "destructive"
                                    });
                                  }
                                } catch (err) {
                                  toast({
                                    title: "Error updating recruiter visibility.",
                                    description: err?.message || String(err),
                                    variant: "destructive"
                                  });
                                } finally {
                                  setIsUpdatingVisibility(false);
                                }
                              }}
                            >
                              {isUpdatingVisibility ? (
                                <span className="flex items-center">
                                  <span className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mr-2"></span>
                                  Updating...
                                </span>
                              ) : (
                                <span>
                                  {defaultResume?.isVisibleToRecruiters ? "Hide from recruiters" : "Show to recruiters"}
                                </span>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Message for free users - more compelling */}
                      {subscriptionStatus?.type === 'free' && (
                        <div className="mt-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-100 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full p-1.5 shadow-md">
                                <Briefcase className="w-4 h-4 text-white" />
                              </div>
                              <div className="ml-3">
                                <h4 className="text-sm font-medium text-amber-900">Let job opportunities find you</h4>
                                <p className="text-xs text-amber-700 mt-0.5">
                                  Upgrade to make your resume visible to recruiters and receive personalized job offers
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-2 h-8 border-amber-300 text-amber-700 hover:bg-amber-50 shadow-sm"
                              onClick={() => navigate('/upgrade')}
                            >
                              <span className="flex items-center">
                                <Star className="w-3.5 h-3.5 mr-1.5 text-amber-500 fill-amber-500" />
                                Compare Plans
                              </span>
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Message for basic subscription users - more compelling */}
                      {subscriptionStatus?.type === 'basic' && (
                        <div className="mt-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full p-1.5 shadow-md">
                                <Users className="w-4 h-4 text-white" />
                              </div>
                              <div className="ml-3">
                                <h4 className="text-sm font-medium text-indigo-900">Get discovered by top recruiters</h4>
                                <p className="text-xs text-indigo-700 mt-0.5">
                                  Make your resume visible to recruiters and receive job offers directly in your inbox
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-2 h-8 border-indigo-300 text-indigo-700 hover:bg-indigo-50 shadow-sm"
                              onClick={() => navigate('/upgrade')}
                            >
                              <span className="flex items-center">
                                <Crown className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                                Upgrade to Premium
                              </span>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">AI-Powered Tools</h2>
            {upgradePrompt && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-2 text-amber-800 text-sm">
                {upgradePrompt}
                <Button 
                  variant="link" 
                  className="text-blue-600 hover:text-blue-800 p-0 h-auto ml-2"
                  onClick={() => navigate('/upgrade')}
                >
                  Upgrade Now
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureTypes.map((feature) => {
              const usage = featureUsage[feature.key] || { usageCount: 0, usageLimit: 0 };
              const isLimited = (subscriptionStatus?.type === "free" && feature.premium) || 
                               ((subscriptionStatus?.type === "free" || subscriptionStatus?.type === "basic") && 
                                usage.usageCount >= usage.usageLimit);
              
              return (
                <Card 
                  key={feature.key}
                  className={`overflow-hidden hover:shadow-lg transition-all duration-300 ${
                    isLimited ? "opacity-80" : ""
                  }`}
                  onClick={() => handleFeatureClick(feature)}
                >
                  <div className={`h-2 bg-gradient-to-r ${feature.color}`}></div>
                  <CardContent className="p-6">
                    <div className="flex items-start mb-4">
                      <div className={`p-2 rounded-md bg-gradient-to-br ${feature.color} text-white mr-4`}>
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg mb-1 flex items-center">
                          {feature.title}
                          {feature.premium && (
                            <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                              <Crown className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-gray-600 text-sm">{feature.description}</p>
                      </div>
                    </div>
                    
                    {/* Usage meter for limited features */}
                    {usage.usageLimit > 0 && (subscriptionStatus?.type === "free" || subscriptionStatus?.type === "basic") && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Usage: {usage.usageCount}/{usage.usageLimit}</span>
                          <span className={usage.usageCount >= usage.usageLimit ? "text-red-500" : "text-green-600"}>
                            {usage.usageCount >= usage.usageLimit ? "Limit reached" : `${usage.usageLimit - usage.usageCount} remaining`}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getProgressColorClass(feature.color)} progress-bar-width`}
                            data-progress={Math.min(100, (usage.usageCount / usage.usageLimit) * 100)}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                      >
                        <span className="flex items-center">
                          {isLimited ? "Upgrade to Access" : "Get Started"}
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div> 
    </div> 
  );
};

export default CandidateDashboard;
