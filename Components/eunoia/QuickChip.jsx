import React from 'react';
import { Button } from '@/components/ui/button';

export default function QuickChip({ label, onClick }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full border-gray-200 hover:border-teal-500 hover:bg-teal-50 hover:text-teal-700 text-xs px-3 py-1 h-auto font-normal"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}