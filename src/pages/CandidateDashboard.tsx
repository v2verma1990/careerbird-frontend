
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Target, 
  MessageSquare, 
  Award, 
  TrendingUp, 
  User,
  Mail,
  Lock,
  Calendar,
  BarChart3,
  BookOpen,
  Zap,
  Sparkles,
  Clock,
  CheckCircle,
  ArrowRight,
  Settings,
  DollarSign,
  Edit3,
  Search,
  PlusCircle,
  Users,
  Brain,
  Hammer
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { apiClient } from '@/utils/apiClient';

interface UserStats {
  resumesOptimized: { usageCount: number; usageLimit: number };
  atsScore: { usageCount: number; usageLimit: number };
  coverLetters: { usageCount: number; usageLimit: number };
  practiceSessions: { usageCount: number; usageLimit: number };
  resumeBuilder: { usageCount: number; usageLimit: number };
  resumeCustomization: { usageCount: number; usageLimit: number };
  salaryInsights: { usageCount: number; usageLimit: number };
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
}

interface Activity {
  id: string;
  action_type: string;
  created_at: string;
  description: string;
}

const CandidateDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    resumesOptimized: { usageCount: 0, usageLimit: 0 },
    atsScore: { usageCount: 0, usageLimit: 0 },
    coverLetters: { usageCount: 0, usageLimit: 0 },
    practiceSessions: { usageCount: 0, usageLimit: 0 },
    resumeBuilder: { usageCount: 0, usageLimit: 0 },
    resumeCustomization: { usageCount: 0, usageLimit: 0 },
    salaryInsights: { usageCount: 0, usageLimit: 0 }
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch all feature usage data
      const usageResponse = await apiClient.get(`/usage/all/${user.id}`);
      if (usageResponse.data) {
        const usageData = usageResponse.data;
        setStats({
          resumesOptimized: usageData.resume_optimization || { usageCount: 0, usageLimit: 3 },
          atsScore: usageData.ats_scan || { usageCount: 0, usageLimit: 3 },
          coverLetters: usageData.cover_letter || { usageCount: 0, usageLimit: 3 },
          practiceSessions: usageData.interview_questions || { usageCount: 0, usageLimit: 3 },
          resumeBuilder: usageData.resume_builder || { usageCount: 0, usageLimit: 3 },
          resumeCustomization: usageData.resume_customization || { usageCount: 0, usageLimit: 3 },
          salaryInsights: usageData.salary_insights || { usageCount: 0, usageLimit: 3 }
        });
      }

      // Fetch user activities
      const activitiesResponse = await apiClient.get(`/usage/${user.id}`);
      if (activitiesResponse.data) {
        setActivities(activitiesResponse.data.slice(0, 5)); // Show last 5 activities
      }

      // Generate achievements based on actual usage
      const generatedAchievements = generateAchievements(stats);
      setAchievements(generatedAchievements);
      
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAchievements = (userStats: UserStats): Achievement[] => {
    return [
      {
        id: '1',
        title: 'First Resume',
        description: 'Optimize your first resume',
        icon: FileText,
        progress: userStats.resumesOptimized.usageCount,
        maxProgress: 1,
        unlocked: userStats.resumesOptimized.usageCount >= 1
      },
      {
        id: '2',
        title: 'ATS Master',
        description: 'Scan 3 resumes with ATS',
        icon: Target,
        progress: userStats.atsScore.usageCount,
        maxProgress: 3,
        unlocked: userStats.atsScore.usageCount >= 3
      },
      {
        id: '3',
        title: 'Cover Letter Pro',
        description: 'Generate 3 cover letters',
        icon: MessageSquare,
        progress: userStats.coverLetters.usageCount,
        maxProgress: 3,
        unlocked: userStats.coverLetters.usageCount >= 3
      },
      {
        id: '4',
        title: 'Interview Ready',
        description: 'Complete 3 practice sessions',
        icon: Award,
        progress: userStats.practiceSessions.usageCount,
        maxProgress: 3,
        unlocked: userStats.practiceSessions.usageCount >= 3
      }
    ];
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    
    setIsChangingPassword(true);
    try {
      // TODO: Implement password change with Supabase
      console.log('Changing password...');
      alert('Password change functionality will be implemented with Supabase integration');
      setNewPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Error changing password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const formatMemberSince = () => {
    if (!user?.created_at) return 'Unknown';
    return format(new Date(user.created_at), 'MMMM yyyy');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.email?.split('@')[0] || 'Candidate'}!
              </h1>
              <p className="text-xl text-gray-600">Let's continue building your career success.</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowAccountSettings(!showAccountSettings)}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Account Settings
              </Button>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Account Settings Modal */}
        {showAccountSettings && (
          <Card className="mb-8 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <User className="w-5 h-5 mr-2 text-indigo-600" />
                  Account Settings
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAccountSettings(false)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input id="email" value={user?.email || ''} disabled className="bg-gray-50" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="member-since" className="text-sm font-medium">Member Since</Label>
                  <Input id="member-since" value={formatMemberSince()} disabled className="bg-gray-50" />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-medium">Change Password</Label>
                <div className="flex gap-2">
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handlePasswordChange}
                    disabled={isChangingPassword || !newPassword}
                    variant="outline"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {isChangingPassword ? 'Changing...' : 'Change'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Resume Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.resumesOptimized.usageCount}/{stats.resumesOptimized.usageLimit}
              </div>
              <p className="text-xs opacity-80">remaining</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">ATS Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.atsScore.usageCount}/{stats.atsScore.usageLimit}
              </div>
              <p className="text-xs opacity-80">remaining</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Cover Letters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.coverLetters.usageCount}/{stats.coverLetters.usageLimit}
              </div>
              <p className="text-xs opacity-80">remaining</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Interview Prep</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.practiceSessions.usageCount}/{stats.practiceSessions.usageLimit}
              </div>
              <p className="text-xs opacity-80">remaining</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* All Tools & Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-blue-600" />
                  Career Tools & Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Link to="/resume-optimizer">
                    <Button variant="outline" className="w-full h-20 flex flex-col">
                      <FileText className="w-6 h-6 mb-2" />
                      <span className="text-sm">Resume Optimizer</span>
                    </Button>
                  </Link>
                  <Link to="/resume-customizer">
                    <Button variant="outline" className="w-full h-20 flex flex-col">
                      <Edit3 className="w-6 h-6 mb-2" />
                      <span className="text-sm">Resume Customizer</span>
                    </Button>
                  </Link>
                  <Link to="/services/resume-builder">
                    <Button variant="outline" className="w-full h-20 flex flex-col">
                      <Hammer className="w-6 h-6 mb-2" />
                      <span className="text-sm">Resume Builder</span>
                    </Button>
                  </Link>
                  <Link to="/ats-scanner">
                    <Button variant="outline" className="w-full h-20 flex flex-col">
                      <Target className="w-6 h-6 mb-2" />
                      <span className="text-sm">ATS Scanner</span>
                    </Button>
                  </Link>
                  <Link to="/cover-letter-generator">
                    <Button variant="outline" className="w-full h-20 flex flex-col">
                      <MessageSquare className="w-6 h-6 mb-2" />
                      <span className="text-sm">Cover Letter</span>
                    </Button>
                  </Link>
                  <Link to="/interview-questions">
                    <Button variant="outline" className="w-full h-20 flex flex-col">
                      <BookOpen className="w-6 h-6 mb-2" />
                      <span className="text-sm">Interview Prep</span>
                    </Button>
                  </Link>
                  <Link to="/salary-insights">
                    <Button variant="outline" className="w-full h-20 flex flex-col">
                      <DollarSign className="w-6 h-6 mb-2" />
                      <span className="text-sm">Salary Insights</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-purple-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity</p>
                    <p className="text-sm">Start using our tools to see your activity here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{activity.action_type}</p>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(activity.created_at), 'MMM d, yyyy at h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2 text-yellow-600" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        achievement.unlocked
                          ? 'border-yellow-300 bg-yellow-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center mb-3">
                        <achievement.icon 
                          className={`w-6 h-6 mr-2 ${
                            achievement.unlocked ? 'text-yellow-600' : 'text-gray-400'
                          }`} 
                        />
                        <h3 className={`font-semibold ${
                          achievement.unlocked ? 'text-yellow-800' : 'text-gray-600'
                        }`}>
                          {achievement.title}
                        </h3>
                        {achievement.unlocked && (
                          <Badge variant="secondary" className="ml-auto bg-yellow-100 text-yellow-800">
                            Unlocked!
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.maxProgress}</span>
                        </div>
                        <Progress 
                          value={(achievement.progress / achievement.maxProgress) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Resume Optimization</span>
                      <span>{Math.round((stats.resumesOptimized.usageCount / stats.resumesOptimized.usageLimit) * 100)}%</span>
                    </div>
                    <Progress value={(stats.resumesOptimized.usageCount / stats.resumesOptimized.usageLimit) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>ATS Optimization</span>
                      <span>{Math.round((stats.atsScore.usageCount / stats.atsScore.usageLimit) * 100)}%</span>
                    </div>
                    <Progress value={(stats.atsScore.usageCount / stats.atsScore.usageLimit) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Interview Readiness</span>
                      <span>{Math.round((stats.practiceSessions.usageCount / stats.practiceSessions.usageLimit) * 100)}%</span>
                    </div>
                    <Progress value={(stats.practiceSessions.usageCount / stats.practiceSessions.usageLimit) * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Help & Support */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-purple-600" />
                  Help & Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/help-center" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Help Center
                  </Button>
                </Link>
                <Link to="/contact-us" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Upcoming Features */}
            <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Upcoming Features!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4 opacity-90">
                  Exciting new features are coming soon to boost your career!
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Brain className="w-4 h-4 mr-2" />
                    <span>AI Career Coach</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Target className="w-4 h-4 mr-2" />
                    <span>Job Match Algorithm</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    <span>Career Progress Tracking</span>
                  </div>
                </div>
                <Link to="/upcoming-features">
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 bg-white text-purple-600 hover:bg-gray-100"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    View All Features
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;
