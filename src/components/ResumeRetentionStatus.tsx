import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Crown,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';

interface RetentionStatus {
  uploadDate: string;
  deletionDate: string;
  daysUntilDeletion: number;
  isVisibleToRecruiters: boolean;
  hasResumeData: boolean;
}

const ResumeRetentionStatus: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [retentionStatus, setRetentionStatus] = useState<RetentionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [enabling, setEnabling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRetentionStatus = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/ProfileMetadata/retention-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRetentionStatus(data);
      } else if (response.status === 404) {
        setRetentionStatus(null);
      }
    } catch (error) {
      console.error('Error fetching retention status:', error);
    } finally {
      setLoading(false);
    }
  };

  const enableVisibility = async () => {
    setEnabling(true);
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/ProfileMetadata/enable-visibility', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Resume Visibility Enabled!",
          description: data.message,
          duration: 8000,
        });
        await fetchRetentionStatus();
      } else {
        toast({
          title: "Unable to Enable Visibility",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enable resume visibility",
        variant: "destructive",
      });
    } finally {
      setEnabling(false);
    }
  };

  const refreshRetention = async () => {
    setRefreshing(true);
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/ProfileMetadata/refresh-retention', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Retention Period Extended!",
          description: data.message,
          duration: 6000,
        });
        await fetchRetentionStatus();
      } else {
        toast({
          title: "Unable to Refresh Retention",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh retention period",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRetentionStatus();
    }
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading resume status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!retentionStatus || !retentionStatus.hasResumeData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Resume Visibility</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Upload a resume to enable visibility to recruiters.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = () => {
    if (retentionStatus.daysUntilDeletion <= 7) return 'text-red-600';
    if (retentionStatus.daysUntilDeletion <= 30) return 'text-orange-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (retentionStatus.daysUntilDeletion <= 7) return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (retentionStatus.daysUntilDeletion <= 30) return <Clock className="w-5 h-5 text-orange-600" />;
    return <CheckCircle2 className="w-5 h-5 text-green-600" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Resume Visibility Status</span>
          </div>
          <Badge variant={retentionStatus.isVisibleToRecruiters ? "default" : "secondary"}>
            {retentionStatus.isVisibleToRecruiters ? (
              <><Eye className="w-3 h-3 mr-1" /> Visible</>
            ) : (
              <><EyeOff className="w-3 h-3 mr-1" /> Hidden</>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          {getStatusIcon()}
          <div className="flex-1">
            <p className={`font-medium ${getStatusColor()}`}>
              {retentionStatus.daysUntilDeletion > 0 
                ? `${retentionStatus.daysUntilDeletion} days remaining`
                : 'Resume data expired'
              }
            </p>
            <p className="text-sm text-gray-600">
              Data deletion: {new Date(retentionStatus.deletionDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Upload Date */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Uploaded: {new Date(retentionStatus.uploadDate).toLocaleDateString()}</span>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {!retentionStatus.isVisibleToRecruiters && (
            <Button 
              onClick={enableVisibility} 
              disabled={enabling}
              className="w-full"
              variant="default"
            >
              {enabling ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Enabling...</>
              ) : (
                <><Crown className="w-4 h-4 mr-2" /> Enable Visibility (Premium Required)</>
              )}
            </Button>
          )}
          
          <Button 
            onClick={refreshRetention} 
            disabled={refreshing}
            variant="outline"
            className="w-full"
          >
            {refreshing ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Refreshing...</>
            ) : (
              <><RefreshCw className="w-4 h-4 mr-2" /> Extend for 6 More Months</>
            )}
          </Button>
        </div>

        {/* Info Note */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>💡 Pro Tip:</strong> Update your resume anytime to automatically extend the retention period for another 6 months, 
            regardless of your subscription status!
          </p>
        </div>

        {retentionStatus.daysUntilDeletion <= 30 && (
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800">
              <strong>⚠️ Reminder:</strong> Your resume data will be automatically deleted in {retentionStatus.daysUntilDeletion} days. 
              Click "Extend for 6 More Months" to keep your resume visible to recruiters.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResumeRetentionStatus;