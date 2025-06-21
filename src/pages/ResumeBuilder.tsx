// This file has been removed - functionality moved to ResumeBuilderApp
// Redirect to ResumeBuilderApp
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResumeBuilderRedirect() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/resume-builder-app', { replace: true });
  }, [navigate]);
  
  return null;
}