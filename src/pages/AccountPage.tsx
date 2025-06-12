import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth/AuthContext";
import { useResume } from "@/contexts/resume/ResumeContext";
import { useNavigate, useLocation } from "react-router-dom";
import TopNavigation from "@/components/TopNavigation";
import DefaultResumeUploader from "@/components/DefaultResumeUploader";
import ProfileMetadataEditor from "@/components/ProfileMetadataEditor";
import ProfileCompletionSteps from "@/components/ProfileCompletionSteps";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  FileText, 
  Settings, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  Info,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Clock,
  Award,
  Briefcase,
  MapPin,
  Phone,
  Lock
} from "lucide-react";

const AccountPage: React.FC = () => {
  const { user, userType, subscriptionStatus, restoringSession } = useAuth();
  const { defaultResume, profileStatus, isLoading, refreshDefaultResume } = useResume();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("resume");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Check if we have a return path in the location state
  const returnTo = location.state?.returnTo;
  
  // Use the profile status from context or calculate it
  const completionPercentage = profileStatus?.completionPercentage || 0;
  
  // Handle manual refresh of profile data
  const handleRefresh = async () => {
    if (!user) return;
    
    setIsRefreshing(true);
    try {
      await refreshDefaultResume();
      toast({
        title: "Profile Refreshed",
        description: "Your profile information has been updated."
      });
    } catch (error) {
      console.error("Error refreshing profile:", error);
      toast({
        variant: "destructive",
        title: "Refresh Failed",
        description: "Unable to refresh your profile. Please try again later."
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Log authentication state for debugging
  useEffect(() => {
    if (!restoringSession) {
      console.log("AccountPage - Auth state:", {
        user: !!user,
        userType,
        subscriptionType: subscriptionStatus?.type,
        active: subscriptionStatus?.active,
        restoringSession,
        returnTo
      });
    }
  }, [user, userType, subscriptionStatus, restoringSession, returnTo]);

  // Determine which tab to show first based on profile status
  useEffect(() => {
    if (profileStatus) {
      if (!profileStatus.hasResume) {
        setActiveTab("resume");
      } else if (!profileStatus.hasBasicInfo) {
        setActiveTab("profile");
      }
    }
  }, [profileStatus]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation />
        
        <main className="container mx-auto px-4 py-8">
          {returnTo && user && userType && (
            <div className="mb-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 -ml-2"
                onClick={() => {
                  // Prevent navigation while session is restoring
                  if (restoringSession) {
                    console.log("Skipping navigation - session is restoring");
                    return;
                  }
                  
                  console.log("Back to Dashboard - Current state:", {
                    user: !!user,
                    userType,
                    subscriptionType: subscriptionStatus?.type,
                    active: subscriptionStatus?.active,
                    returnTo
                  });
                  
                  // Determine the correct dashboard path
                  let dashboardPath = '/';
                  
                  if (returnTo) {
                    dashboardPath = returnTo;
                  } else if (userType === 'recruiter') {
                    dashboardPath = '/dashboard';
                  } else if (userType === 'candidate') {
                    dashboardPath = subscriptionStatus?.type === 'free' ? '/free-plan-dashboard' : '/candidate-dashboard';
                  }
                  
                  console.log(`Navigating to: ${dashboardPath}`);
                  
                  // Instead of trying to navigate directly to the dashboard,
                  // we'll navigate to our special redirect page that will handle the logic
                  console.log("Navigating to dashboard redirect page");
                  navigate('/dashboard-redirect', { replace: true });
                }}
              >
                <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
                Back to Dashboard
              </Button>
            </div>
          )}
          
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Account & Profile</h1>
          </div>
          
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading your profile information...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Authentication check
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation />
        
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center text-red-500">
              <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Authentication required. Please sign in to continue.</p>
              <Button 
                className="mt-4"
                onClick={() => navigate('/login', { state: { returnTo: '/account' } })}
              >
                Sign In
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back button - only show if we have a return path, session is NOT restoring, and user is authenticated */}
        {(returnTo && !restoringSession && user && userType) && (
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 -ml-2"
              onClick={() => {
                // Log the current state for debugging
                console.log("Back to Dashboard button clicked - Current state:", {
                  user: !!user,
                  userType,
                  subscriptionType: subscriptionStatus?.type,
                  active: subscriptionStatus?.active,
                  returnTo
                });
                
                // Determine the correct dashboard path
                let dashboardPath = '/';
                
                if (returnTo) {
                  dashboardPath = returnTo;
                } else if (userType === 'recruiter') {
                  dashboardPath = '/dashboard';
                } else if (userType === 'candidate') {
                  dashboardPath = subscriptionStatus?.type === 'free' ? '/free-plan-dashboard' : '/candidate-dashboard';
                }
                
                console.log(`Navigating to: ${dashboardPath}`);
                
                // Instead of trying to navigate directly to the dashboard,
                // we'll navigate to our special redirect page that will handle the logic
                console.log("Navigating to dashboard redirect page");
                navigate('/dashboard-redirect', { replace: true });
              }}
            >
              <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
              Back to Dashboard
            </Button>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Account & Profile</h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>
        
        {/* Profile Completion Card */}
        <Card className="mb-8 shadow-md border border-gray-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Profile Completion
            </CardTitle>
            <CardDescription>
              Complete your profile to get the most out of CareerBird
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profileStatus ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {completionPercentage}% Complete
                  </span>
                  <span className="text-sm text-gray-500">
                    {completionPercentage === 100 ? (
                      <span className="text-green-600 flex items-center">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Complete
                      </span>
                    ) : (
                      `${completionPercentage}/100`
                    )}
                  </span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className={`p-3 rounded-lg border ${profileStatus.hasResume ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${profileStatus.hasResume ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${profileStatus.hasResume ? 'text-green-800' : 'text-gray-700'}`}>
                          Resume
                        </p>
                        <p className={`text-xs ${profileStatus.hasResume ? 'text-green-600' : 'text-gray-500'}`}>
                          {profileStatus.hasResume ? 'Uploaded' : 'Not uploaded'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg border ${profileStatus.hasBasicInfo ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${profileStatus.hasBasicInfo ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${profileStatus.hasBasicInfo ? 'text-green-800' : 'text-gray-700'}`}>
                          Basic Info
                        </p>
                        <p className={`text-xs ${profileStatus.hasBasicInfo ? 'text-green-600' : 'text-gray-500'}`}>
                          {profileStatus.hasBasicInfo ? 'Completed' : 'Not completed'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg border ${profileStatus.hasDetailedInfo ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${profileStatus.hasDetailedInfo ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${profileStatus.hasDetailedInfo ? 'text-green-800' : 'text-gray-700'}`}>
                          Detailed Info
                        </p>
                        <p className={`text-xs ${profileStatus.hasDetailedInfo ? 'text-green-600' : 'text-gray-500'}`}>
                          {profileStatus.hasDetailedInfo ? 'Completed' : 'Not completed'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-4 text-gray-500">
                <p>Profile status information is not available.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Account Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="resume">Resume</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <ProfileMetadataEditor />
            
            {!profileStatus?.hasResume && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-amber-100 p-2 rounded-full">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-amber-800">Resume Required</h3>
                      <p className="text-amber-700 mt-1 text-sm">
                        Please upload your resume first before completing your profile
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3 bg-white border-amber-200 text-amber-700 hover:bg-amber-100"
                        onClick={() => setActiveTab("resume")}
                      >
                        Go to Resume Upload
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Resume Tab */}
          <TabsContent value="resume" className="space-y-6">
            <DefaultResumeUploader />
            
            {defaultResume && defaultResume.fileName && !profileStatus?.hasBasicInfo && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="flex items-center text-green-800">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
                  Your resume is ready to use with all CareerBird tools
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 bg-white border-green-200 text-green-700 hover:bg-green-100"
                  onClick={() => setActiveTab("profile")}
                >
                  Continue to Profile Setup
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Account Settings
                </CardTitle>
                <CardDescription>Manage your account preferences and subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Account Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="font-medium text-gray-900">{user.email}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-500">Account Created</p>
                      <p className="font-medium text-gray-900">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Subscription Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Subscription</h3>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">Current Plan</p>
                        <p className="font-medium text-gray-900 capitalize">
                          {subscriptionStatus?.type || 'Free'} Plan
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/upgrade')}
                      >
                        {subscriptionStatus?.type === 'premium' ? 'Manage' : 'Upgrade'}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Security Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Security</h3>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">Password</p>
                          <p className="text-sm text-gray-500">Change your account password</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Coming Soon",
                            description: "Password change functionality will be available soon."
                          });
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AccountPage;