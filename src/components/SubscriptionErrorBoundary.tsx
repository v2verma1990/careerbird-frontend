import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Mail, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SubscriptionErrorBoundaryProps {
  children: React.ReactNode;
  subscriptionStatus: any;
  subscriptionLoading: boolean;
  onRetry?: () => void;
}

export const SubscriptionErrorBoundary: React.FC<SubscriptionErrorBoundaryProps> = ({
  children,
  subscriptionStatus,
  subscriptionLoading,
  onRetry
}) => {
  const navigate = useNavigate();

  // Show loading state
  if (subscriptionLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription information...</p>
        </div>
      </div>
    );
  }

  // Show error state when subscription status is null (backend error)
  if (subscriptionStatus === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Subscription Service Unavailable</CardTitle>
            <CardDescription>
              We're unable to load your subscription information at the moment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Service Temporarily Unavailable</AlertTitle>
              <AlertDescription>
                Our subscription service is experiencing issues. This may be due to:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Temporary server maintenance</li>
                  <li>Network connectivity issues</li>
                  <li>Service overload</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
                variant="default"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Loading
              </Button>
              
              {onRetry && (
                <Button 
                  onClick={onRetry} 
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Subscription
                </Button>
              )}
              
              <Button 
                onClick={() => navigate('/')} 
                className="w-full"
                variant="outline"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
              
              <Button 
                onClick={() => window.open('mailto:support@careerbird.ai?subject=Subscription Service Error', '_blank')} 
                className="w-full"
                variant="ghost"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 text-center">
              If this issue persists, please contact our support team with the error details.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If subscription status is valid, render children
  return <>{children}</>;
};

export default SubscriptionErrorBoundary;