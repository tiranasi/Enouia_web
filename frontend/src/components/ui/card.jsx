import React from 'react';

export function Card({ className = '', children, ...props }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Card;