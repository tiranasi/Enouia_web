import React from 'react';

export function Badge({ className = '', variant = 'solid', children, ...props }) {
  const variants = {
    solid: 'bg-gray-200 text-gray-800',
    outline: 'border border-gray-300 text-gray-700',
    secondary: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}

export default Badge;