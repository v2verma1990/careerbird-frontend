
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
  Brain
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface UserStats {
  resumesOptimized: number;
  atsScore: number | null;
  coverLetters: number;
  practiceSessions: number;
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
  action: string;
  timestamp: Date;
  description: string;
}

const CandidateDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    resumesOptimized: 0,
    atsScore: null,
    coverLetters: 0,
    practiceSessions: 0
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
      // TODO: Replace with actual API calls when backend is ready
      // For now, we'll leave the values as 0/null to show no data rather than fake data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set actual values when we have real data
      setStats({
        resumesOptimized: 0, // Will be fetched from backend
        atsScore: null, // Will be fetched from backend
        coverLetters: 0, // Will be fetched from backend
        practiceSessions: 0 // Will be fetched from backend
      });

      // Generate achievements based on actual progress
      const generatedAchievements = generateAchievements(stats);
      setAchievements(generatedAchievements);

      // Set empty activities until we have real data
      setActivities([]);
      
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
        progress: userStats.resumesOptimized,
        maxProgress: 1,
        unlocked: userStats.resumesOptimized >= 1
      },
      {
        id: '2',
        title: 'ATS Master',
        description: 'Achieve 90%+ ATS score',
        icon: Target,
        progress: userStats.atsScore || 0,
        maxProgress: 90,
        unlocked: (userStats.atsScore || 0) >= 90
      },
      {
        id: '3',
        title: 'Cover Letter Pro',
        description: 'Generate 5 cover letters',
        icon: MessageSquare,
        progress: userStats.coverLetters,
        maxProgress: 5,
        unlocked: userStats.coverLetters >= 5
      },
      {
        id: '4',
        title: 'Interview Ready',
        description: 'Complete 10 practice sessions',
        icon: Award,
        progress: userStats.practiceSessions,
        maxProgress: 10,
        unlocked: userStats.practiceSessions >= 10
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Resumes Optimized</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.resumesOptimized}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">ATS Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.atsScore !== null ? `${stats.atsScore}%` : 'No data'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Cover Letters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.coverLetters}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Practice Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.practiceSessions}</div>
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
                          <p className="font-medium text-gray-900">{activity.action}</p>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(activity.timestamp, 'MMM d, yyyy at h:mm a')}
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
                      <span>Profile Completion</span>
                      <span>60%</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Resume Optimization</span>
                      <span>{stats.resumesOptimized > 0 ? '100%' : '0%'}</span>
                    </div>
                    <Progress value={stats.resumesOptimized > 0 ? 100 : 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Interview Readiness</span>
                      <span>{stats.practiceSessions > 0 ? Math.min((stats.practiceSessions / 5) * 100, 100) : 0}%</span>
                    </div>
                    <Progress value={stats.practiceSessions > 0 ? Math.min((stats.practiceSessions / 5) * 100, 100) : 0} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PlusCircle className="w-5 h-5 mr-2 text-blue-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/resume-optimizer" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Optimize Resume
                  </Button>
                </Link>
                <Link to="/salary-insights" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Check Salary Range
                  </Button>
                </Link>
                <Link to="/cover-letter-generator" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Generate Cover Letter
                  </Button>
                </Link>
                <Link to="/interview-questions" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Practice Interview
                  </Button>
                </Link>
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

            {/* New Features Alert */}
            <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  AI-Powered Features!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4 opacity-90">
                  Discover new AI features that can boost your career success!
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Brain className="w-4 h-4 mr-2" />
                    <span>Smart Resume Analysis</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Target className="w-4 h-4 mr-2" />
                    <span>ATS Optimization</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <DollarSign className="w-4 h-4 mr-2" />
                    <span>Market Salary Insights</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4 bg-white text-purple-600 hover:bg-gray-100"
                  onClick={() => {
                    window.location.href = '/#features';
                  }}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Explore Features
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;
