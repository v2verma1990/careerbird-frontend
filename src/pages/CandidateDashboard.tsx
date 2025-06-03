
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import api from "@/utils/apiClient";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText,
  Search,
  DollarSign,
  MessageSquare,
  Trophy,
  TrendingUp,
  Clock,
  CheckCircle,
  Star,
  Target,
  BarChart3,
  FileCheck,
  Edit3,
  Award,
  User,
  Settings,
  Crown,
  Zap,
  Shield,
  Calendar,
  Brain,
  Sparkles,
  Users,
  BookOpen,
  Briefcase,
  Bot,
  Mail,
  Key,
  Eye,
  EyeOff
} from "lucide-react";

interface QuickAction {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  bgColor: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  earned: boolean;
  earnedDate?: string;
  progress?: number;
  maxProgress?: number;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  status: 'completed' | 'in-progress' | 'pending';
}

interface UserStats {
  resumesOptimized: number;
  atsScore: number | null;
  coverLetters: number;
  practiceSessions: number;
}

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
  const { user, subscriptionStatus, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'account'>('overview');
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    resumesOptimized: 0,
    atsScore: null,
    coverLetters: 0,
    practiceSessions: 0
  });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
      fetchRecentActivity();
      fetchAchievements();
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user?.id) return;

    try {
      // Fetch usage data for different features
      const features = ['resume_optimization', 'ats_scan', 'cover_letter', 'interview_questions'];
      const stats = { resumesOptimized: 0, atsScore: null, coverLetters: 0, practiceSessions: 0 };

      for (const feature of features) {
        const { data } = await api.usage.getFeatureUsage(user.id, feature);
        if (data) {
          switch (feature) {
            case 'resume_optimization':
              stats.resumesOptimized = data.usageCount;
              break;
            case 'cover_letter':
              stats.coverLetters = data.usageCount;
              break;
            case 'interview_questions':
              stats.practiceSessions = data.usageCount;
              break;
          }
        }
      }

      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    if (!user?.id) return;

    try {
      // Fetch from activity_logs table
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching activity:', error);
        return;
      }

      if (data && data.length > 0) {
        const formattedActivity = data.map((item: any) => ({
          id: item.id,
          type: item.action_type,
          title: item.description,
          timestamp: new Date(item.created_at).toLocaleDateString(),
          status: 'completed' as const
        }));
        setRecentActivity(formattedActivity);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const fetchAchievements = async () => {
    // Initialize achievements based on actual usage data
    const initAchievements: Achievement[] = [
      {
        id: '1',
        title: 'Resume Optimizer',
        description: 'Optimize your first resume',
        icon: FileCheck,
        earned: userStats.resumesOptimized > 0,
        progress: Math.min(userStats.resumesOptimized, 1),
        maxProgress: 1
      },
      {
        id: '2',
        title: 'Interview Ready',
        description: 'Generate 10 interview questions',
        icon: MessageSquare,
        earned: userStats.practiceSessions >= 10,
        progress: Math.min(userStats.practiceSessions, 10),
        maxProgress: 10
      },
      {
        id: '3',
        title: 'Cover Letter Pro',
        description: 'Create 5 cover letters',
        icon: Edit3,
        earned: userStats.coverLetters >= 5,
        progress: Math.min(userStats.coverLetters, 5),
        maxProgress: 5
      }
    ];
    setAchievements(initAchievements);
  };

  const fetchUserProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New passwords don't match"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 6 characters long"
      });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Password updated successfully"
      });

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowChangePassword(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update password"
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      title: "Resume Optimizer",
      description: "Improve your resume with AI suggestions",
      icon: FileCheck,
      href: "/resume-optimizer",
      color: "text-blue-700",
      bgColor: "bg-blue-50 border-blue-200"
    },
    {
      title: "Resume Customizer", 
      description: "Tailor your resume for specific jobs",
      icon: Target,
      href: "/resume-customizer",
      color: "text-purple-700",
      bgColor: "bg-purple-50 border-purple-200"
    },
    {
      title: "ATS Scanner",
      description: "Check if your resume passes ATS systems",
      icon: Search,
      href: "/ats-scanner",
      color: "text-green-700",
      bgColor: "bg-green-50 border-green-200"
    },
    {
      title: "Salary Insights",
      description: "Get market salary data and trends",
      icon: DollarSign,
      href: "/salary-insights",
      color: "text-emerald-700",
      bgColor: "bg-emerald-50 border-emerald-200"
    },
    {
      title: "Cover Letter Generator",
      description: "Create professional cover letters",
      icon: Edit3,
      href: "/cover-letter-generator",
      color: "text-orange-700",
      bgColor: "bg-orange-50 border-orange-200"
    },
    {
      title: "Interview Questions",
      description: "Practice with AI-generated questions",
      icon: MessageSquare,
      href: "/interview-questions",
      color: "text-pink-700",
      bgColor: "bg-pink-50 border-pink-200"
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please log in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {user.email?.split('@')[0] || 'User'}!
                </h1>
                <p className="text-gray-600">Ready to accelerate your career journey?</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge 
                variant="outline" 
                className={`${
                  subscriptionStatus?.type === 'premium' 
                    ? 'border-yellow-300 text-yellow-700 bg-yellow-50' 
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                {subscriptionStatus?.type === 'premium' && <Crown className="w-3 h-3 mr-1" />}
                {subscriptionStatus?.type?.charAt(0).toUpperCase() + subscriptionStatus?.type?.slice(1) || 'Free'} Plan
              </Badge>
              
              <div className="flex border rounded-lg bg-white/50">
                <Button
                  variant={activeTab === 'overview' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('overview')}
                  className="rounded-r-none"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Overview
                </Button>
                <Button
                  variant={activeTab === 'account' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('account')}
                  className="rounded-l-none"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  My Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {activeTab === 'overview' ? (
          <div className="space-y-8">
            {/* Stats Cards - Only show if we have data */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Resumes Optimized</p>
                      <p className="text-3xl font-bold">{userStats.resumesOptimized}</p>
                    </div>
                    <FileCheck className="w-8 h-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">ATS Score</p>
                      <p className="text-3xl font-bold">
                        {userStats.atsScore ? `${userStats.atsScore}%` : 'N/A'}
                      </p>
                    </div>
                    <Shield className="w-8 h-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Cover Letters</p>
                      <p className="text-3xl font-bold">{userStats.coverLetters}</p>
                    </div>
                    <Edit3 className="w-8 h-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Practice Sessions</p>
                      <p className="text-3xl font-bold">{userStats.practiceSessions}</p>
                    </div>
                    <Brain className="w-8 h-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Zap className="w-7 h-7 text-yellow-500" />
                  Quick Actions
                </CardTitle>
                <p className="text-gray-600">Jump into your most-used career tools</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {quickActions.map((action, index) => {
                    const IconComponent = action.icon;
                    return (
                      <Link key={index} to={action.href} className="group">
                        <Card className={`${action.bgColor} border-2 hover:shadow-lg transition-all duration-200 transform group-hover:scale-105 group-hover:border-opacity-100`}>
                          <CardContent className="p-6">
                            <div className="flex items-start space-x-4">
                              <div className={`p-3 rounded-xl ${action.bgColor} border ${action.color.replace('text-', 'border-').replace('-700', '-300')}`}>
                                <IconComponent className={`w-6 h-6 ${action.color}`} />
                              </div>
                              <div className="flex-1">
                                <h3 className={`font-semibold ${action.color} group-hover:underline`}>
                                  {action.title}
                                </h3>
                                <p className="text-gray-600 text-sm mt-1">
                                  {action.description}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
                <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-green-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((item) => (
                        <div key={item.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className={`w-2 h-2 rounded-full ${
                            item.status === 'completed' ? 'bg-green-500' : 
                            item.status === 'in-progress' ? 'bg-yellow-500' : 'bg-gray-400'
                          }`}></div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.title}</p>
                            <p className="text-sm text-gray-500">{item.timestamp}</p>
                          </div>
                          <CheckCircle className={`w-4 h-4 ${
                            item.status === 'completed' ? 'text-green-500' : 'text-gray-300'
                          }`} />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No recent activity</p>
                        <p className="text-sm">Start using our tools to see your activity here!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
                <div className="h-2 bg-gradient-to-r from-yellow-500 to-orange-500"></div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {achievements.slice(0, 4).map((achievement) => {
                      const IconComponent = achievement.icon;
                      const progressPercentage = achievement.maxProgress ? 
                        (achievement.progress! / achievement.maxProgress) * 100 : 0;
                      
                      return (
                        <div key={achievement.id} className={`p-4 rounded-lg border-2 transition-all ${
                          achievement.earned 
                            ? 'bg-yellow-50 border-yellow-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              achievement.earned ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <h4 className={`font-semibold ${
                                achievement.earned ? 'text-yellow-900' : 'text-gray-700'
                              }`}>
                                {achievement.title}
                              </h4>
                              <p className="text-sm text-gray-600">{achievement.description}</p>
                              {achievement.maxProgress && (
                                <div className="mt-2">
                                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>{achievement.progress} / {achievement.maxProgress}</span>
                                    <span>{Math.round(progressPercentage)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full transition-all ${
                                        achievement.earned ? 'bg-yellow-500' : 'bg-blue-500'
                                      }`}
                                      style={{ width: `${progressPercentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </div>
                            {achievement.earned && (
                              <CheckCircle className="w-6 h-6 text-yellow-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Account Tab */
          <div className="space-y-8">
            {/* Account Overview */}
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <User className="w-7 h-7 text-indigo-600" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-medium text-gray-700">Email Address</Label>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-900">{user.email}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-base font-medium text-gray-700">User ID</Label>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-600 font-mono text-sm">{user.id}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-base font-medium text-gray-700">Account Type</Label>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-900">Candidate</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-medium text-gray-700">Subscription Plan</Label>
                      <div className="mt-2 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {subscriptionStatus?.type === 'premium' && <Crown className="w-5 h-5 text-yellow-600" />}
                            <span className="font-semibold text-gray-900">
                              {subscriptionStatus?.type?.charAt(0).toUpperCase() + subscriptionStatus?.type?.slice(1) || 'Free'} Plan
                            </span>
                          </div>
                          {subscriptionStatus?.type !== 'premium' && (
                            <Link to="/upgrade">
                              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
                                <Sparkles className="w-4 h-4 mr-1" />
                                Upgrade
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-base font-medium text-gray-700">Member Since</Label>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-900">
                          {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Loading...'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-base font-medium text-gray-700">Last Updated</Label>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-900">
                          {userProfile?.updated_at ? new Date(userProfile.updated_at).toLocaleDateString() : 'Loading...'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="shadow-xl bg-blue-50 border-blue-200 hover:shadow-2xl transition-all">
                <CardContent className="p-6 text-center">
                  <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-blue-900 mb-2">Security Settings</h3>
                  <p className="text-blue-700 text-sm mb-4">Manage your password and security preferences</p>
                  <Button 
                    variant="outline" 
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    onClick={() => setShowChangePassword(!showChangePassword)}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-xl bg-green-50 border-green-200 hover:shadow-2xl transition-all">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-green-900 mb-2">Usage Analytics</h3>
                  <p className="text-green-700 text-sm mb-4">View your feature usage and statistics</p>
                  <Button 
                    variant="outline" 
                    className="border-green-300 text-green-700 hover:bg-green-100"
                    onClick={() => setActiveTab('overview')}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-xl bg-purple-50 border-purple-200 hover:shadow-2xl transition-all">
                <CardContent className="p-6 text-center">
                  <Crown className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-purple-900 mb-2">Subscription</h3>
                  <p className="text-purple-700 text-sm mb-4">Upgrade your plan or manage billing</p>
                  <Link to="/upgrade">
                    <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-100">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Manage Plan
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Change Password Section */}
            {showChangePassword && (
              <Card className="shadow-xl border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-blue-900">
                    <Key className="w-6 h-6" />
                    Change Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">New Password</Label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Confirm New Password</Label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button 
                      onClick={handleChangePassword}
                      disabled={changingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {changingPassword ? "Updating..." : "Update Password"}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setShowChangePassword(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Floating Upgrade Button for Free Users */}
      {subscriptionStatus?.type !== 'premium' && activeTab === 'overview' && (
        <div className="fixed bottom-6 right-6 z-50">
          <Link to="/upgrade">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-2xl animate-pulse"
            >
              <Crown className="w-5 h-5 mr-2" />
              Upgrade to Premium
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default CandidateDashboard;
