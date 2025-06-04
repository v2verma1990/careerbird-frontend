import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/auth/AuthContext';
import { Toaster } from './components/ui/toaster';
import ProtectedRoute from './components/ProtectedRoute';
import RecruiterProtectedRoute from './components/RecruiterProtectedRoute';
import CandidateProtectedRoute from './components/CandidateProtectedRoute';

// Pages
import Index from './pages/Index';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CandidateDashboard from './pages/CandidateDashboard';
import FreePlanDashboard from './pages/FreePlanDashboard';
import ResumeOptimizer from './pages/ResumeOptimizer';
import ResumeCustomizer from './pages/ResumeCustomizer';
import ResumeBuilder from './pages/ResumeBuilder';
import SalaryInsights from './pages/SalaryInsights';
import AtsScanner from './pages/AtsScanner';
import BestCandidates from './pages/BestCandidates';
import OptimizeJob from './pages/OptimizeJob';
import InterviewQuestions from './pages/InterviewQuestions';
import CoverLetterGenerator from './pages/CoverLetterGenerator';
import NotFound from './pages/NotFound';
import Upgrade from './pages/Upgrade';
import Navbar from './components/Navbar';

import './App.css';


function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<RecruiterProtectedRoute><Dashboard /></RecruiterProtectedRoute>} />
          <Route path="/candidate-dashboard" element={<CandidateProtectedRoute><CandidateDashboard /></CandidateProtectedRoute>} />
          <Route path="/free-plan-dashboard" element={<CandidateProtectedRoute><FreePlanDashboard /></CandidateProtectedRoute>} />
          <Route path="/resume-optimizer" element={<ProtectedRoute><ResumeOptimizer /></ProtectedRoute>} />
          <Route path="/resume-customizer" element={<ProtectedRoute><ResumeCustomizer /></ProtectedRoute>} />
          <Route path="/resume-builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
          <Route path="/salary-insights" element={<ProtectedRoute><SalaryInsights /></ProtectedRoute>} />
          <Route path="/ats-scanner" element={<ProtectedRoute><AtsScanner /></ProtectedRoute>} />
          <Route path="/best-candidates" element={<ProtectedRoute><BestCandidates /></ProtectedRoute>} />
          <Route path="/optimize-job" element={<ProtectedRoute><OptimizeJob /></ProtectedRoute>} />
          <Route path="/interview-questions" element={<ProtectedRoute><InterviewQuestions /></ProtectedRoute>} />
          <Route path="/cover-letter-generator" element={<ProtectedRoute><CoverLetterGenerator /></ProtectedRoute>} />
          <Route path="/upgrade" element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
