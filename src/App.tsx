
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth/AuthContext";
import Navbar from "./components/Navbar";
import CookieConsent from "./components/CookieConsent";
import ProtectedRoute from "./components/ProtectedRoute";
import CandidateProtectedRoute from "./components/CandidateProtectedRoute";
import RecruiterProtectedRoute from "./components/RecruiterProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Dashboard from "./pages/Dashboard";
import CandidateDashboard from "./pages/CandidateDashboard";
import FreePlanDashboard from "./pages/FreePlanDashboard";
import ResumeOptimizer from "./pages/ResumeOptimizer";
import ResumeCustomizer from "./pages/ResumeCustomizer";
import AtsScanner from "./pages/AtsScanner";
import BestCandidates from "./pages/BestCandidates";
import CoverLetterGenerator from "./pages/CoverLetterGenerator";
import InterviewQuestions from "./pages/InterviewQuestions";
import SalaryInsights from "./pages/SalaryInsights";
import OptimizeJob from "./pages/OptimizeJob";
import Upgrade from "./pages/Upgrade";
import NotFound from "./pages/NotFound";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import Careers from "./pages/Careers";
import HelpCenter from "./pages/HelpCenter";
import HelpSearch from "./pages/HelpSearch";
import ATSScore from "./pages/help/ATSScore";
import UpcomingFeatures from "./pages/UpcomingFeatures";
import Sitemap from "./pages/Sitemap";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsConditions from "./pages/legal/TermsConditions";
import ResumeBuilder from "./pages/services/ResumeBuilder";
import ATSOptimization from "./pages/services/ATSOptimization";
import CoverLetters from "./pages/services/CoverLetters";
import InterviewPrep from "./pages/services/InterviewPrep";
import RecruitingTools from "./pages/services/RecruitingTools";
import CareerInsights from "./pages/services/CareerInsights";
import EmployerHome from "./pages/EmployerHome";
import Credits from "./pages/Credits";
import FraudAlert from "./pages/FraudAlert";
import TrustSafety from "./pages/TrustSafety";
import SummonsNotices from "./pages/SummonsNotices";
import Grievances from "./pages/Grievances";
import ReportIssue from "./pages/ReportIssue";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-background">
            <Navbar />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <RecruiterProtectedRoute>
                    <Dashboard />
                  </RecruiterProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/candidate-dashboard" element={
                <ProtectedRoute>
                  <CandidateProtectedRoute>
                    <CandidateDashboard />
                  </CandidateProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/free-plan-dashboard" element={
                <ProtectedRoute>
                  <CandidateProtectedRoute>
                    <FreePlanDashboard />
                  </CandidateProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/upcoming-features" element={
                <ProtectedRoute>
                  <CandidateProtectedRoute>
                    <UpcomingFeatures />
                  </CandidateProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/upgrade" element={
                <ProtectedRoute>
                  <Upgrade />
                </ProtectedRoute>
              } />

              {/* Tools & Services */}
              <Route path="/resume-optimizer" element={<ResumeOptimizer />} />
              <Route path="/resume-customizer" element={<ResumeCustomizer />} />
              <Route path="/ats-scanner" element={<AtsScanner />} />
              <Route path="/best-candidates" element={<BestCandidates />} />
              <Route path="/cover-letter-generator" element={<CoverLetterGenerator />} />
              <Route path="/interview-questions" element={<InterviewQuestions />} />
              <Route path="/salary-insights" element={<SalaryInsights />} />
              <Route path="/optimize-job" element={<OptimizeJob />} />

              {/* Service Pages */}
              <Route path="/services/resume-builder" element={<ResumeBuilder />} />
              <Route path="/services/ats-optimization" element={<ATSOptimization />} />
              <Route path="/services/cover-letters" element={<CoverLetters />} />
              <Route path="/services/interview-prep" element={<InterviewPrep />} />
              <Route path="/services/recruiting-tools" element={<RecruitingTools />} />
              <Route path="/services/career-insights" element={<CareerInsights />} />

              {/* Company Pages */}
              <Route path="/employer-home" element={<EmployerHome />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/contact-us" element={<ContactUs />} />
              <Route path="/help-center" element={<HelpCenter />} />
              <Route path="/help-search" element={<HelpSearch />} />
              <Route path="/help/ats-score" element={<ATSScore />} />
              <Route path="/sitemap" element={<Sitemap />} />
              <Route path="/credits" element={<Credits />} />

              {/* Legal Pages */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-conditions" element={<TermsConditions />} />
              <Route path="/fraud-alert" element={<FraudAlert />} />
              <Route path="/trust-safety" element={<TrustSafety />} />
              <Route path="/summons-notices" element={<SummonsNotices />} />
              <Route path="/grievances" element={<Grievances />} />
              <Route path="/report-issue" element={<ReportIssue />} />

              {/* 404 Page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieConsent />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
