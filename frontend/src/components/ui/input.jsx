import React from 'react';

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`border border-gray-200 rounded-xl px-3 py-2 text-sm ${className}`}
      {...props}
    />
  );
}

export default Input;