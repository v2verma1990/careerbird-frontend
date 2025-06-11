import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth/AuthContext";
// Resume context import removed to prevent API calls
import { useNavigate, useLocation } from "react-router-dom";
import TopNavigation from "@/components/TopNavigation";
import DefaultResumeUploader from "@/components/DefaultResumeUploader";
import ProfileMetadataEditor from "@/components/ProfileMetadataEditor";
import ProfileCompletionSteps from "@/components/ProfileCompletionSteps";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
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
  Phone
} from "lucide-react";

const AccountPage: React.FC = () => {
  const { user } = useAuth();
  // Resume context removed to prevent API calls
  const defaultResume = null;
  const profileStatus = null;
  const isLoading = false;
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("resume");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Check if we have a return path in the location state
  const returnTo = location.state?.returnTo;
  
  // Use the profile status from context or calculate it
  const completionPercentage = profileStatus?.completionPercentage || 0;
  
  // Handle manual refresh of profile data - disabled
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // refreshDefaultResume removed to prevent API calls
      toast({
        title: "Profile Refresh Disabled",
        description: "This feature is temporarily disabled for maintenance."
      });
    } catch (error) {
      console.error("Error refreshing profile:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
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
  
  // No useEffect needed - all profile functionality is disabled

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back button - only show if we have a return path */}
        {returnTo && (
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 -ml-2"
              onClick={() => navigate(returnTo)}
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
            <ProfileCompletionSteps 
              profileStatus={profileStatus} 
              showActionButton={false}
              className="shadow-none border-0 bg-transparent p-0"
            />
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
            
            {defaultResume && defaultResume.fileName && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="flex items-center text-green-800">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
                  Your resume is ready to use with all CareerBird tools
                </p>
                {!profileStatus?.hasBasicInfo && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 bg-white border-green-200 text-green-700 hover:bg-green-100"
                    onClick={() => setActiveTab("profile")}
                  >
                    Continue to Profile Setup
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Account settings will be available soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AccountPage;