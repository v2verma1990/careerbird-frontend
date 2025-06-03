
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
  Settings
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.email?.split('@')[0] || 'Candidate'}!
          </h1>
          <p className="text-xl text-gray-600">Let's continue building your career success.</p>
        </div>

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
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-blue-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link to="/resume-optimizer">
                    <Button variant="outline" className="w-full h-20 flex flex-col">
                      <FileText className="w-6 h-6 mb-2" />
                      <span className="text-sm">Optimize Resume</span>
                    </Button>
                  </Link>
                  <Link to="/ats-scanner">
                    <Button variant="outline" className="w-full h-20 flex flex-col">
                      <Target className="w-6 h-6 mb-2" />
                      <span className="text-sm">ATS Scan</span>
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
            {/* My Account */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2 text-indigo-600" />
                  My Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input id="email" value={user?.email || ''} disabled className="bg-gray-50" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="member-since" className="text-sm font-medium">Member Since</Label>
                  <Input id="member-since" value={formatMemberSince()} disabled className="bg-gray-50" />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium">Change Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Button 
                    onClick={handlePasswordChange}
                    disabled={isChangingPassword || !newPassword}
                    className="w-full"
                    variant="outline"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>

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

            {/* New Features Alert */}
            <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  New Features!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4 opacity-90">
                  Discover exciting new features that can boost your career!
                </p>
                <Button 
                  variant="outline" 
                  className="w-full bg-white text-purple-600 hover:bg-gray-100"
                  onClick={() => {
                    // Scroll to upcoming features section on homepage
                    window.location.href = '/#upcoming-features';
                  }}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Explore New Features
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
