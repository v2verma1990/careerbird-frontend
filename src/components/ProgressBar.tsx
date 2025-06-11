import React from 'react';
import '../styles/Dashboard.css';

interface ProgressBarProps {
  percentage: number;
  gradientClasses: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, gradientClasses }) => {
  // Round the percentage to the nearest 5%
  const roundedPercentage = Math.round(percentage / 5) * 5;
  // Ensure the percentage is between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, roundedPercentage));
  
  return (
    <div className="progress-bar">
      <div 
        className={`progress-bar-fill bg-gradient-to-r ${gradientClasses} progress-${clampedPercentage}`}
      />
    </div>
  );
};

export default ProgressBar;