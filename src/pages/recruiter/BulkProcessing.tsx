import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth/AuthContext";
import { Upload, ArrowLeft, Server, Database, Clock, Zap } from "lucide-react";
import { getConfigForPlan, planFeatureMatrix } from "@/config/recruiterConfig";

const BulkProcessing = () => {
  const navigate = useNavigate();
  const { subscriptionStatus } = useAuth();
  
  const currentPlanFeatures = planFeatureMatrix[subscriptionStatus?.type as keyof typeof planFeatureMatrix] || planFeatureMatrix.free;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/recruiter-dashboard-new')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bulk Resume Processing</h1>
              <p className="text-gray-600 mt-1">Upload and process multiple resumes simultaneously with queue management</p>
            </div>
          </div>
        </div>

        {/* Configuration Display */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Current Configuration
              <Badge className="ml-auto bg-purple-500">
                {subscriptionStatus?.type?.toUpperCase() || 'FREE'} Plan
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Database className="w-8 h-8 text-blue-500" />
                <div>
                  <h4 className="font-medium">Vector Database</h4>
                  <p className="text-sm text-gray-600">{currentPlanFeatures.vectorDB}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Server className="w-8 h-8 text-green-500" />
                <div>
                  <h4 className="font-medium">Processing Method</h4>
                  <p className="text-sm text-gray-600">{currentPlanFeatures.processing}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Clock className="w-8 h-8 text-orange-500" />
                <div>
                  <h4 className="font-medium">Max Concurrent</h4>
                  <p className="text-sm text-gray-600">
                    {subscriptionStatus?.type === 'free' ? '1 resume' : 
                     subscriptionStatus?.type === 'basic' ? '10 resumes' : 
                     'Unlimited'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Card */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Coming Soon</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Upload className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Bulk Resume Processing</h3>
            <p className="text-gray-600 mb-6">
              This feature will enable you to upload and process multiple resumes simultaneously with:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <Upload className="w-8 h-8 text-purple-500 mb-2" />
                <h4 className="font-medium">Batch Upload</h4>
                <p className="text-sm text-gray-600 text-center">Upload multiple resumes at once</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <Zap className="w-8 h-8 text-yellow-500 mb-2" />
                <h4 className="font-medium">Queue Management</h4>
                <p className="text-sm text-gray-600 text-center">Track processing status in real-time</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <Server className="w-8 h-8 text-green-500 mb-2" />
                <h4 className="font-medium">Scalable Processing</h4>
                <p className="text-sm text-gray-600 text-center">
                  {subscriptionStatus?.type === 'free' ? 'Redis (Local)' : 'Azure Functions'}
                </p>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <Database className="w-8 h-8 text-blue-500 mb-2" />
                <h4 className="font-medium">Vector Storage</h4>
                <p className="text-sm text-gray-600 text-center">{currentPlanFeatures.vectorDB}</p>
              </div>
            </div>
            
            {subscriptionStatus?.type === 'free' && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Free Plan Limitation:</strong> Process 1 resume at a time with Redis (Local). 
                  Upgrade to Basic or Premium for bulk processing with Azure Functions.
                </p>
              </div>
            )}
            
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/recruiter-dashboard-new')}>
                Return to Dashboard
              </Button>
              {subscriptionStatus?.type === 'free' && (
                <Button 
                  onClick={() => navigate('/upgrade')}
                  className="bg-gradient-to-r from-green-500 to-emerald-500"
                >
                  Upgrade Plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BulkProcessing;