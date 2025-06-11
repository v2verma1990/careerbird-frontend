
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth/AuthContext";
import { useResume } from "@/contexts/resume/ResumeContext";
import { Badge } from "@/components/ui/badge";
import api from "@/utils/apiClient";
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
  Plus
} from "lucide-react";

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
  const { defaultResume, profileStatus } = useResume();
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
                        You can manage or update your resume in the Account section.
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    onClick={(e) => {
                      e.preventDefault();
                      // Open a modal or drawer instead of navigating away
                      // For now, we'll just navigate but we should implement a modal in the future
                      navigate('/account', { state: { returnTo: '/dashboard' } });
                    }}
                  >
                    Manage Resume
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Total Tools", value: featureTypes.length, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Premium Features", value: featureTypes.filter(f => f.premium).length, icon: Crown, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Current Plan", value: subscriptionStatus?.type?.charAt(0).toUpperCase() + subscriptionStatus?.type?.slice(1), icon: Star, color: "text-green-600", bg: "bg-green-50" },
            { label: "Monthly Usage", value: Object.values(featureUsage).reduce((sum, usage) => sum + usage.usageCount, 0), icon: BarChart3, color: "text-orange-600", bg: "bg-orange-50" }
          ].map((stat, index) => (
            <Card key={index} className="bg-white shadow-sm border-0 hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upgrade Prompt */}
        {upgradePrompt && (
          <Card className="mb-8 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-1">Usage Limit Reached</h3>
                <p className="text-amber-800">{upgradePrompt}</p>
              </div>
              <Button 
                onClick={() => navigate("/upgrade")}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shrink-0"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tools Grid */}
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Professional Career Tools</h2>
            <p className="text-gray-600 max-w-3xl">
              Powerful AI-driven tools designed to help you stand out in today's competitive job market
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureTypes.map((feature, index) => {
              const usage = featureUsage[feature.key] || { usageCount: 0, usageLimit: 0 };
              const isBlocked = (subscriptionStatus.type === "free" && usage.usageCount >= usage.usageLimit) || (subscriptionStatus.type === "basic" && usage.usageCount >= usage.usageLimit);
              const isUnlimited = usage.usageLimit === 0 || subscriptionStatus.type === "premium";
              const IconComponent = feature.icon;
              
              return (
                <Card key={index} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white overflow-hidden relative transform hover:-translate-y-1">
                  {/* Status Indicators */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    {feature.premium && subscriptionStatus.type === "free" && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                    {isBlocked && (
                      <Badge variant="outline" className="border-red-300 text-red-600 bg-red-50 text-xs">
                        Limit Reached
                      </Badge>
                    )}
                  </div>
                  
                  <CardHeader className="pb-4 pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                          {feature.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="py-0">
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600 font-medium">Usage Status</span>
                        <div className="flex items-center gap-2">
                          {isUnlimited ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
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
                        <div className="usage-progress-bar">
                          <div 
                            className={`usage-progress-indicator ${isBlocked ? 'blocked' : getProgressColorClass(feature.color)} progress-width-${Math.min(Math.floor((usage.usageCount / usage.usageLimit) * 10) * 10, 100)}`}
                          ></div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-4 pb-6">
                    <Button 
                      className={`w-full transition-all duration-200 h-12 text-base font-medium ${
                        isBlocked 
                          ? 'bg-gray-300 hover:bg-gray-400 text-gray-600' 
                          : `bg-gradient-to-r ${feature.color} hover:shadow-lg transform hover:scale-[1.02] text-white`
                      }`}
                      onClick={() => handleFeatureClick(feature)} 
                      disabled={isBlocked || loadingUsage}
                    >
                      {isBlocked ? (
                        <>
                          <Clock className="w-5 h-5 mr-2" />
                          Upgrade Required
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Launch Tool
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* AI Disclaimer */}
        <Card className="mt-16 border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Brain className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">AI-Powered Career Tools</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Our advanced AI technology provides intelligent suggestions and automated content generation to enhance your professional profile. 
                  While our algorithms are continuously refined using extensive industry data, we recommend reviewing all AI-generated content 
                  to ensure it accurately reflects your unique experience and career goals.
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Please note:</strong> AI-generated content should serve as a foundation for your professional materials. 
                  We encourage personalizing and verifying all suggestions to best represent your individual qualifications and achievements.
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
