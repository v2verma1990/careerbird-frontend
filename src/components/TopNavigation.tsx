
import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useResume } from '@/contexts/resume/ResumeContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ProfileStatusIndicator from '@/components/ProfileStatusIndicator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  User,
  Settings,
  CreditCard,
  LogOut,
  Crown,
  Zap,
  Calendar,
  ChevronDown,
  Bell,
  HelpCircle,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopNavigation = () => {
  const { user, subscriptionStatus, signOut } = useAuth();
  const { profileStatus } = useResume();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const getSubscriptionBadge = () => {
    if (!subscriptionStatus) return null;
    
    const badgeConfig = {
      premium: { color: "bg-gradient-to-r from-purple-500 to-pink-500", icon: Crown, text: "Premium" },
      basic: { color: "bg-gradient-to-r from-blue-500 to-cyan-500", icon: Zap, text: "Basic" },
      free: { color: "bg-gradient-to-r from-gray-500 to-gray-600", icon: null, text: "Free" }
    };

    const config = badgeConfig[subscriptionStatus.type] || badgeConfig.free;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white border-0 text-xs`}>
        {Icon && <Icon className="w-3 h-3 mr-1" />}
        {config.text}
      </Badge>
    );
  };

  const getRemainingDays = () => {
    if (!subscriptionStatus?.endDate || subscriptionStatus.type === 'free') return null;
    
    const endDate = new Date(subscriptionStatus.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <nav className="bg-white/95 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ResumeAI
                </span>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Profile Status Indicator - Only show for logged in users */}
            {user && (
              <div className="hidden md:block">
                <ProfileStatusIndicator profileStatus={profileStatus} />
              </div>
            )}
            
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>

            {/* Help */}
            <Button variant="ghost" size="sm">
              <HelpCircle className="w-5 h-5 text-gray-600" />
            </Button>

            {/* Account Dropdown */}
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-3 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-medium text-gray-900 truncate max-w-32">
                      {user?.email?.split('@')[0] || 'User'}
                    </span>
                    {getSubscriptionBadge()}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent 
                className="w-80 bg-white/95 backdrop-blur-lg border border-gray-200/50 shadow-xl" 
                align="end"
              >
                <DropdownMenuLabel className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.email || 'User'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        {getSubscriptionBadge()}
                        {subscriptionStatus?.cancelled && subscriptionStatus.type !== 'free' && (
                          <Badge variant="outline" className="border-red-300 text-red-600 text-xs">
                            Cancelled
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>

                {/* Subscription Info */}
                {subscriptionStatus && subscriptionStatus.type !== 'free' && (
                  <>
                    <div className="px-4 py-3 bg-gray-50/50">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {subscriptionStatus.cancelled ? 'Expires' : 'Renews'}
                        </span>
                        <span className="font-medium">
                          {getRemainingDays() !== null 
                            ? `${getRemainingDays()} days` 
                            : 'Today'
                          }
                        </span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Menu Items */}
                <DropdownMenuItem 
                  className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate('/account')}
                >
                  <User className="w-4 h-4 mr-3 text-gray-500" />
                  <span className="text-sm">Profile & Resume</span>
                </DropdownMenuItem>

                <DropdownMenuItem 
                  className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate('/upgrade')}
                >
                  <CreditCard className="w-4 h-4 mr-3 text-gray-500" />
                  <span className="text-sm">Billing & Subscription</span>
                </DropdownMenuItem>

                <DropdownMenuItem 
                  className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="w-4 h-4 mr-3 text-gray-500" />
                  <span className="text-sm">Account Settings</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Upgrade CTA for non-premium users */}
                {subscriptionStatus?.type !== 'premium' && (
                  <>
                    <div className="px-4 py-3">
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm"
                        onClick={() => navigate('/upgrade')}
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade Plan
                      </Button>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem 
                  className="flex items-center px-4 py-3 hover:bg-red-50 cursor-pointer text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  <span className="text-sm">Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavigation;
