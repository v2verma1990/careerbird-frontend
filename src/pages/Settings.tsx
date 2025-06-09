
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from '@/hooks/use-toast';
import TopNavigation from '@/components/TopNavigation';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Moon, 
  Globe, 
  Download,
  Trash2,
  AlertTriangle,
  Check,
  Sun
} from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: true,
    darkMode: false,
    language: 'en',
    timezone: 'UTC',
    autoSave: true,
    analytics: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        
        // Apply dark mode if enabled
        if (parsed.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);

    // Apply dark mode immediately
    if (key === 'darkMode') {
      if (value) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    // Show immediate feedback for certain settings
    if (key === 'pushNotifications' && value) {
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            toast({
              title: "Push Notifications Enabled",
              description: "You'll now receive browser notifications."
            });
          } else {
            toast({
              variant: "destructive",
              title: "Permission Denied",
              description: "Please enable notifications in your browser settings."
            });
            setSettings(prev => ({ ...prev, pushNotifications: false }));
          }
        });
      } else {
        toast({
          variant: "destructive",
          title: "Not Supported",
          description: "Push notifications are not supported in this browser."
        });
        setSettings(prev => ({ ...prev, pushNotifications: false }));
      }
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('userSettings', JSON.stringify(settings));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasChanges(false);
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully."
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Failed to save settings. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadData = () => {
    const userData = {
      profile: {
        email: user?.email,
        id: user?.id,
        settings: settings
      },
      exportDate: new Date().toISOString(),
      dataTypes: ['profile', 'settings', 'activity_logs']
    };

    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `user-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Data Downloaded",
      description: "Your data has been exported successfully."
    });
  };

  const deleteAccount = () => {
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast({
        variant: "destructive",
        title: "Account Deletion",
        description: "Account deletion is not implemented yet. Please contact support."
      });
    }
  };

  const changePassword = () => {
    toast({
      title: "Change Password",
      description: "Password change functionality will be implemented soon."
    });
  };

  const changeEmail = () => {
    toast({
      title: "Change Email",
      description: "Email change functionality will be implemented soon."
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <TopNavigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Account Settings</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your account preferences and privacy settings</p>
        </div>

        <div className="space-y-6">
          {/* Notifications */}
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Bell className="w-5 h-5 text-blue-600" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications" className="dark:text-white">Email Notifications</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Receive updates about your account via email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notifications" className="dark:text-white">Push Notifications</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Get real-time notifications in your browser</p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketing-emails" className="dark:text-white">Marketing Communications</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Receive tips, updates, and special offers</p>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={settings.marketingEmails}
                  onCheckedChange={(checked) => handleSettingChange('marketingEmails', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                {settings.darkMode ? <Moon className="w-5 h-5 text-blue-600" /> : <Sun className="w-5 h-5 text-blue-600" />}
                Appearance & Localization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode" className="dark:text-white">Dark Mode</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Switch to dark theme</p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language" className="dark:text-white">Language</Label>
                  <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                    <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timezone" className="dark:text-white">Timezone</Label>
                  <Select value={settings.timezone} onValueChange={(value) => handleSettingChange('timezone', value)}>
                    <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time</SelectItem>
                      <SelectItem value="PST">Pacific Time</SelectItem>
                      <SelectItem value="GMT">GMT</SelectItem>
                      <SelectItem value="CET">Central European Time</SelectItem>
                      <SelectItem value="JST">Japan Standard Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Shield className="w-5 h-5 text-blue-600" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-save" className="dark:text-white">Auto-save Documents</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Automatically save your work as you type</p>
                </div>
                <Switch
                  id="auto-save"
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => handleSettingChange('autoSave', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="analytics" className="dark:text-white">Usage Analytics</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Help improve our service by sharing usage data</p>
                </div>
                <Switch
                  id="analytics"
                  checked={settings.analytics}
                  onCheckedChange={(checked) => handleSettingChange('analytics', checked)}
                />
              </div>
              <div className="pt-4">
                <Button variant="outline" className="w-full dark:border-slate-600 dark:text-white dark:hover:bg-slate-700" onClick={downloadData}>
                  <Download className="w-4 h-4 mr-2" />
                  Download My Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Management */}
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <SettingsIcon className="w-5 h-5 text-blue-600" />
                Account Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="current-email" className="dark:text-white">Current Email</Label>
                <Input
                  id="current-email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" onClick={changePassword} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                  Change Password
                </Button>
                <Button variant="outline" onClick={changeEmail} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                  Change Email
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-800 dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">Delete Account</h3>
                <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button variant="destructive" size="sm" onClick={deleteAccount}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800" 
              onClick={saveSettings}
              disabled={!hasChanges || isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : hasChanges ? (
                <Check className="w-4 h-4 mr-2" />
              ) : null}
              {isLoading ? 'Saving...' : hasChanges ? 'Save All Changes' : 'All Changes Saved'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
