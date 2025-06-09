
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/auth/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import CookieConsent from '@/components/CookieConsent';

// Auth pages
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';

// Main pages
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import CandidateDashboard from '@/pages/CandidateDashboard';
import FreePlanDashboard from '@/pages/FreePlanDashboard';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import Upgrade from '@/pages/Upgrade';
import NotFound from '@/pages/NotFound';

// Service pages
import ResumeOptimizer from '@/pages/ResumeOptimizer';
import ResumeCustomizer from '@/pages/ResumeCustomizer';
import ResumeBuilder from '@/pages/services/ResumeBuilder';
import ResumeBuilderApp from '@/pages/ResumeBuilderApp';
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

// Navigation
import Navbar from '@/components/Navbar';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
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
                  <CandidateProtectedRoute>
                    <FreePlanDashboard />
                  </CandidateProtectedRoute>
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
              <Route path="/resume-builder" element={<ResumeBuilder />} />
              <Route 
                path="/resume-builder-app" 
                element={
                  <CandidateProtectedRoute>
                    <ResumeBuilderApp />
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
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            <Toaster />
            <CookieConsent />
          </div>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
