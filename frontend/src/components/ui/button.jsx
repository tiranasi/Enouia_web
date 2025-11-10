import React from 'react';

export function Button({ className = '', variant = 'default', size = 'md', children, ...props }) {
  const variants = {
    default: 'bg-teal-600 hover:bg-teal-700 text-white',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
    link: 'bg-transparent text-teal-600 hover:underline',
  };
  const sizes = {
    md: 'h-10 px-4',
    sm: 'h-8 px-3 text-sm',
    icon: 'h-10 w-10 p-0',
  };
  return (
    <button
      className={`rounded-2xl font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;