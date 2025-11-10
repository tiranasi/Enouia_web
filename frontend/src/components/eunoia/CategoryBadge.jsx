import React from 'react';
import { Badge } from '@/components/ui/badge';

const categoryStyles = {
  'AI Relief': 'bg-teal-100 text-teal-700 border-teal-200',
  'Treehole': 'bg-pink-100 text-pink-700 border-pink-200',
  'Support Center': 'bg-blue-100 text-blue-700 border-blue-200',
  'Challenges': 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function CategoryBadge({ category, size = 'sm' }) {
  return (
    <Badge 
      className={`${categoryStyles[category] || 'bg-gray-100 text-gray-700'} border font-medium ${
        size === 'xs' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
      variant="outline"
    >
      {category}
    </Badge>
  );
}