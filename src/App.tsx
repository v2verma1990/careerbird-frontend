import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/auth/AuthContext';
import { ResumeProvider } from '@/contexts/resume/ResumeContext';
import { ResumeColorProvider } from '@/contexts/resume/ResumeColorContext';
import { Toaster } from '@/components/ui/toaster';
import CookieConsent from '@/components/CookieConsent';

// Auth pages
import Login from '@/pages/Login';
import Signup from '@/pages/auth/Signup';

// Main pages
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import CandidateDashboard from '@/pages/CandidateDashboard';
import FreePlanDashboard from '@/pages/FreePlanDashboard';
import RecruiterDashboardNew from '@/pages/RecruiterDashboardNew';
import ResumeAnalysis from '@/pages/recruiter/ResumeAnalysis';
import BulkProcessing from '@/pages/recruiter/BulkProcessing';
import CandidateComparison from '@/pages/recruiter/CandidateComparison';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import Upgrade from '@/pages/Upgrade';
import AccountPage from '@/pages/AccountPage';
import NotFound from '@/pages/NotFound';
import DashboardRedirect from '@/pages/DashboardRedirect';
import ResumeThumbnailGenerator from '@/pages/admin/ResumeThumbnailGenerator';

// Service pages
import ResumeOptimizer from '@/pages/ResumeOptimizer';
import ResumeCustomizer from '@/pages/ResumeCustomizer';
import ResumeBuilderApp from '@/pages/ResumeBuilderApp';
import ResumePreview from '@/pages/ResumePreview';
//import ResumeTemplateDemo from '@/pages/ResumeTemplateDemo';
import AtsScanner from '@/pages/AtsScanner';
import SalaryInsights from '@/pages/SalaryInsights';
import CoverLetterGenerator from '@/pages/CoverLetterGenerator';
import InterviewQuestions from '@/pages/InterviewQuestions';

// Additional pages
import AboutUs from '@/pages/AboutUs';
import ContactUs from '@/pages/ContactUs';
import Careers from '@/pages/Careers';
import HelpCenter from '@/pages/HelpCenter';
import TrustSafety from '@/pages/TrustSafety';
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy';
import TermsConditions from '@/pages/legal/TermsConditions';
import BestCandidates from '@/pages/BestCandidates';
import OptimizeJob from '@/pages/OptimizeJob';
import UpcomingFeatures from '@/pages/UpcomingFeatures';

// Protected route components
import ProtectedRoute from '@/components/ProtectedRoute';
import CandidateProtectedRoute from '@/components/CandidateProtectedRoute';
import RecruiterProtectedRoute from '@/components/RecruiterProtectedRoute';
import FreePlanProtectedRoute from '@/components/FreePlanProtectedRoute';

// Navigation
import Navbar from '@/components/Navbar';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <ResumeProvider>
            <ResumeColorProvider>
              <div className="App">
              <Navbar />
              <Routes>
              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/trust-safety" element={<TrustSafety />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsConditions />} />
              <Route path="/upcoming-features" element={<UpcomingFeatures />} />
              <Route path="/dashboard-redirect" element={<DashboardRedirect />} />
              
              {/* Dashboard routes */}
              <Route 
                path="/dashboard" 
                element={
                  <RecruiterProtectedRoute>
                    <Dashboard />
                  </RecruiterProtectedRoute>
                } 
              />
              <Route 
                path="/recruiter-dashboard-new" 
                element={
                  <RecruiterProtectedRoute>
                    <RecruiterDashboardNew />
                  </RecruiterProtectedRoute>
                } 
              />
              <Route 
                path="/candidate-dashboard" 
                element={
                  <CandidateProtectedRoute>
                    <CandidateDashboard />
                  </CandidateProtectedRoute>
                } 
              />
              <Route 
                path="/free-plan-dashboard" 
                element={
                  <FreePlanProtectedRoute>
                    <FreePlanDashboard />
                  </FreePlanProtectedRoute>
                } 
              />
              
              {/* Profile and Settings routes */}
              <Route 
                path="/profile" 
                element={
                  <CandidateProtectedRoute>
                    <Profile />
                  </CandidateProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <CandidateProtectedRoute>
                    <Settings />
                  </CandidateProtectedRoute>
                } 
              />
              <Route 
                path="/account" 
                element={
                  <CandidateProtectedRoute>
                    <AccountPage />
                  </CandidateProtectedRoute>
                } 
              />
              
              {/* Service routes */}
              <Route 
                path="/resume-optimizer" 
                element={
                  <CandidateProtectedRoute>
                    <ResumeOptimizer />
                  </CandidateProtectedRoute>
                } 
              />
              <Route 
                path="/resume-customizer" 
                element={
                  <CandidateProtectedRoute>
                    <ResumeCustomizer />
                  </CandidateProtectedRoute>
                } 
              />
              <Route 
                path="/resume-builder-app" 
                element={
                  <CandidateProtectedRoute>
                    <ResumeBuilderApp />
                  </CandidateProtectedRoute>
                } 
              />
              <Route 
                path="/resume-preview" 
                element={
                  <CandidateProtectedRoute>
                    <ResumePreview />
                  </CandidateProtectedRoute>
                } 
              />
              <Route 
                path="/ats-scanner" 
                element={
                  <CandidateProtectedRoute>
                    <AtsScanner />
                  </CandidateProtectedRoute>
                } 
              />
              <Route 
                path="/salary-insights" 
                element={
                  <CandidateProtectedRoute>
                    <SalaryInsights />
                  </CandidateProtectedRoute>
                } 
              />
              <Route 
                path="/cover-letter-generator" 
                element={
                  <CandidateProtectedRoute>
                    <CoverLetterGenerator />
                  </CandidateProtectedRoute>
                } 
              />
              <Route 
                path="/interview-questions" 
                element={
                  <CandidateProtectedRoute>
                    <InterviewQuestions />
                  </CandidateProtectedRoute>
                } 
              />
              
              {/* Subscription and business routes */}
              <Route 
                path="/upgrade" 
                element={
                  <ProtectedRoute>
                    <Upgrade />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/best-candidates" 
                element={
                  <RecruiterProtectedRoute>
                    <BestCandidates />
                  </RecruiterProtectedRoute>
                } 
              />
              <Route 
                path="/optimize-job" 
                element={
                  <RecruiterProtectedRoute>
                    <OptimizeJob />
                  </RecruiterProtectedRoute>
                } 
              />
              
              {/* Recruiter feature routes */}
              <Route 
                path="/recruiter/resume-analysis" 
                element={
                  <RecruiterProtectedRoute>
                    <ResumeAnalysis />
                  </RecruiterProtectedRoute>
                } 
              />
              <Route 
                path="/recruiter/bulk-processing" 
                element={
                  <RecruiterProtectedRoute>
                    <BulkProcessing />
                  </RecruiterProtectedRoute>
                } 
              />
              <Route 
                path="/recruiter/candidate-comparison" 
                element={
                  <RecruiterProtectedRoute>
                    <CandidateComparison />
                  </RecruiterProtectedRoute>
                } 
              />
              
              {/* Admin routes */}
              <Route path="/admin/resume-thumbnails" element={<ResumeThumbnailGenerator />} />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            
              <Toaster />
              <CookieConsent />
            </div>
            </ResumeColorProvider>
          </ResumeProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
