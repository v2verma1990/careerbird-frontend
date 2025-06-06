
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Dashboard from "./pages/Dashboard";
import CandidateDashboard from "./pages/CandidateDashboard";
import FreePlanDashboard from "./pages/FreePlanDashboard";
import ResumeOptimizer from "./pages/ResumeOptimizer";
import ResumeCustomizer from "./pages/ResumeCustomizer";
import ResumeBuilder from "./pages/services/ResumeBuilder";
import ResumeBuilderApp from "./pages/ResumeBuilderApp";
import AtsScanner from "./pages/AtsScanner";
import SalaryInsights from "./pages/SalaryInsights";
import CoverLetterGenerator from "./pages/CoverLetterGenerator";
import InterviewQuestions from "./pages/InterviewQuestions";
import BestCandidates from "./pages/BestCandidates";
import OptimizeJob from "./pages/OptimizeJob";
import Upgrade from "./pages/Upgrade";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import CandidateProtectedRoute from "./components/CandidateProtectedRoute";
import RecruiterProtectedRoute from "./components/RecruiterProtectedRoute";
import NotFound from "./pages/NotFound";
// Import legal pages
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsConditions from "./pages/legal/TermsConditions";
// Import service pages
import ATSOptimization from "./pages/services/ATSOptimization";
import CareerInsights from "./pages/services/CareerInsights";
import CoverLetters from "./pages/services/CoverLetters";
import InterviewPrep from "./pages/services/InterviewPrep";
import RecruitingTools from "./pages/services/RecruitingTools";
// Import additional pages
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import Careers from "./pages/Careers";
import HelpCenter from "./pages/HelpCenter";
import HelpSearch from "./pages/HelpSearch";
import ReportIssue from "./pages/ReportIssue";
import TrustSafety from "./pages/TrustSafety";
import FraudAlert from "./pages/FraudAlert";
import Grievances from "./pages/Grievances";
import SummonsNotices from "./pages/SummonsNotices";
import Sitemap from "./pages/Sitemap";
import Credits from "./pages/Credits";
import UpcomingFeatures from "./pages/UpcomingFeatures";
import EmployerHome from "./pages/EmployerHome";
// Import help pages
import ATSScore from "./pages/help/ATSScore";

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background font-sans antialiased">
              <Navbar />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                
                {/* Legal pages */}
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-conditions" element={<TermsConditions />} />
                
                {/* Service pages */}
                <Route path="/ats-optimization" element={<ATSOptimization />} />
                <Route path="/career-insights" element={<CareerInsights />} />
                <Route path="/cover-letters" element={<CoverLetters />} />
                <Route path="/interview-prep" element={<InterviewPrep />} />
                <Route path="/recruiting-tools" element={<RecruitingTools />} />
                <Route path="/resume-builder" element={<ResumeBuilder />} />
                
                {/* Additional pages */}
                <Route path="/about-us" element={<AboutUs />} />
                <Route path="/contact-us" element={<ContactUs />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/help-center" element={<HelpCenter />} />
                <Route path="/help-search" element={<HelpSearch />} />
                <Route path="/report-issue" element={<ReportIssue />} />
                <Route path="/trust-safety" element={<TrustSafety />} />
                <Route path="/fraud-alert" element={<FraudAlert />} />
                <Route path="/grievances" element={<Grievances />} />
                <Route path="/summons-notices" element={<SummonsNotices />} />
                <Route path="/sitemap" element={<Sitemap />} />
                <Route path="/credits" element={<Credits />} />
                <Route path="/upcoming-features" element={<UpcomingFeatures />} />
                <Route path="/employer-home" element={<EmployerHome />} />
                
                {/* Help pages */}
                <Route path="/help/ats-score" element={<ATSScore />} />
                
                {/* Protected routes (general) */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                {/* Candidate-specific protected routes */}
                <Route path="/candidate-dashboard" element={
                  <CandidateProtectedRoute>
                    <CandidateDashboard />
                  </CandidateProtectedRoute>
                } />
                
                <Route path="/free-dashboard" element={
                  <CandidateProtectedRoute>
                    <FreePlanDashboard />
                  </CandidateProtectedRoute>
                } />
                
                <Route path="/resume-optimizer" element={
                  <CandidateProtectedRoute>
                    <ResumeOptimizer />
                  </CandidateProtectedRoute>
                } />
                
                <Route path="/resume-customizer" element={
                  <CandidateProtectedRoute>
                    <ResumeCustomizer />
                  </CandidateProtectedRoute>
                } />
                
                <Route path="/resume-builder-app" element={
                  <CandidateProtectedRoute>
                    <ResumeBuilderApp />
                  </CandidateProtectedRoute>
                } />
                
                <Route path="/ats-scanner" element={
                  <CandidateProtectedRoute>
                    <AtsScanner />
                  </CandidateProtectedRoute>
                } />
                
                <Route path="/salary-insights" element={
                  <CandidateProtectedRoute>
                    <SalaryInsights />
                  </CandidateProtectedRoute>
                } />
                
                <Route path="/cover-letter-generator" element={
                  <CandidateProtectedRoute>
                    <CoverLetterGenerator />
                  </CandidateProtectedRoute>
                } />
                
                <Route path="/interview-questions" element={
                  <CandidateProtectedRoute>
                    <InterviewQuestions />
                  </CandidateProtectedRoute>
                } />
                
                {/* Recruiter-specific protected routes */}
                <Route path="/best-candidates" element={
                  <RecruiterProtectedRoute>
                    <BestCandidates />
                  </RecruiterProtectedRoute>
                } />
                
                <Route path="/optimize-job" element={
                  <RecruiterProtectedRoute>
                    <OptimizeJob />
                  </RecruiterProtectedRoute>
                } />
                
                {/* Upgrade route (accessible to all authenticated users) */}
                <Route path="/upgrade" element={
                  <ProtectedRoute>
                    <Upgrade />
                  </ProtectedRoute>
                } />
                
                {/* Catch-all route for 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
