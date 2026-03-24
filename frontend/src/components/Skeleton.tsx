import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rectangular' }) => {
  const baseClass = 'animate-pulse bg-dark-surface border border-dark-border/50';
  
  const variantClass = {
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    text: 'rounded-md h-4 w-full',
  }[variant];

  return <div className={`${baseClass} ${variantClass} ${className}`} />;
};

export default Skeleton;
