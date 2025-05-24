
import React from "react";
import { motion } from "framer-motion";

// Export motion directly from framer-motion
export { motion } from "framer-motion";

// Fade in animation component
export const FadeIn = ({ 
  children, 
  delay = 0, 
  duration = 0.5,
  className = ""
}: { 
  children: React.ReactNode; 
  delay?: number; 
  duration?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

// Slide up animation component
export const SlideUp = ({ 
  children, 
  delay = 0, 
  duration = 0.5,
  className = ""
}: { 
  children: React.ReactNode; 
  delay?: number; 
  duration?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

// Staggered children animation
export const StaggeredContainer = ({ 
  children, 
  staggerDelay = 0.1,
  className = "",
}: { 
  children: React.ReactNode; 
  staggerDelay?: number;
  className?: string;
}) => {
  // We need React.Children.toArray to apply keys to children
  const childrenArray = React.Children.toArray(children);
  
  return (
    <div className={className}>
      {childrenArray.map((child, index) => (
        <motion.div
          key={`item-${index}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * staggerDelay }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
};

// Pulse animation for buttons or highlights
export const Pulse = ({ 
  children,
  className = ""
}: { 
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    className={className}
    whileHover={{ 
      scale: 1.05,
      boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)",
      transition: { duration: 0.2 }
    }}
    whileTap={{ scale: 0.95 }}
  >
    {children}
  </motion.div>
);

// Loading spinner with animation
export const LoadingSpinner = ({
  size = 40,
  color = "#3b82f6"
}: {
  size?: number;
  color?: string;
}) => (
  <motion.div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      border: `4px solid ${color}`,
      borderTopColor: "transparent",
    }}
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
  />
);

// Page transition wrapper
export const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className="w-full h-full"
  >
    {children}
  </motion.div>
);

// Enhanced gradient background with wave effect
export const GradientBackground = ({ 
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div 
    className={`relative overflow-hidden ${className}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1 }}
  >
    <motion.div 
      className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      animate={{ 
        background: [
          "linear-gradient(to bottom right, #f0f4ff, #e6eeff, #f5f3ff)",
          "linear-gradient(to bottom right, #e6eeff, #f5f3ff, #f0f4ff)",
          "linear-gradient(to bottom right, #f5f3ff, #f0f4ff, #e6eeff)"
        ]
      }}
      transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
    />
    
    {/* Animated wave shapes */}
    <motion.div 
      className="absolute top-0 left-0 right-0 h-24 opacity-20"
      style={{ 
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z' fill='%234f46e5'%3E%3C/path%3E%3C/svg%3E\")",
        backgroundSize: "cover"
      }}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    />
    
    <motion.div 
      className="absolute bottom-0 left-0 right-0 h-24 opacity-10 transform rotate-180"
      style={{ 
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z' fill='%233b82f6'%3E%3C/path%3E%3C/svg%3E\")",
        backgroundSize: "cover"
      }}
      animate={{ y: [0, 10, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
    />
    
    <div className="relative z-10">
      {children}
    </div>
  </motion.div>
);

// 3D card animation component
export const AnimatedCard = ({ 
  children,
  className = ""
}: { 
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}
      whileHover={{ 
        y: -5,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {children}
    </motion.div>
  );
};

// Attention-grabbing shine effect for call-to-action buttons
export const ShineButton = ({ 
  children,
  className = ""
}: { 
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className="absolute top-0 -right-full bottom-0 w-1/2 bg-white opacity-30"
        animate={{ right: ['100%', '-100%'] }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          repeatType: "loop", 
          repeatDelay: 2,
          ease: "easeInOut"
        }}
      />
      {children}
    </motion.div>
  );
};
