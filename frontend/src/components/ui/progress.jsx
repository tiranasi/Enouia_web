import React from 'react';

export function Progress({ value = 0, max = 100, className = '' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`w-full h-2 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div className="h-full bg-teal-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default Progress;