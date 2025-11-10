import React from 'react';

export function Textarea({ className = '', rows = 4, ...props }) {
  return (
    <textarea
      rows={rows}
      className={`border border-gray-200 rounded-xl px-3 py-2 text-sm resize-y ${className}`}
      {...props}
    />
  );
}

export default Textarea;