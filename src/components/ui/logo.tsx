import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32', 
    lg: 'w-40 h-40',
    xl: 'w-48 h-48'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} flex-shrink-0`}>
        <img 
          src="/Logo.png" 
          alt="ShelfLife Logo" 
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};

export default Logo; 