import React from 'react';
import { Card } from '@/components/ui/card';

export default function ActionCard({ icon: Icon, title, subtitle, color = 'teal', onClick }) {
  const colorClasses = {
    teal: 'bg-teal-50 text-teal-600',
    pink: 'bg-pink-50 text-pink-600',
    purple: 'bg-purple-50 text-purple-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <Card 
      className="p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer border-0 bg-white"
      onClick={onClick}
    >
      <div className={`w-12 h-12 rounded-full ${colorClasses[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-6 h-6" strokeWidth={1.5} />
      </div>
      <h3 className="font-semibold text-gray-900 text-sm mb-1">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </Card>
  );
}