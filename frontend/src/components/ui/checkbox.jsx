import React from 'react';

export function Checkbox({ className = '', checked, onCheckedChange, ...props }) {
  return (
    <input
      type="checkbox"
      className={`w-4 h-4 rounded border-gray-300 ${className}`}
      checked={!!checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  );
}

export default Checkbox;