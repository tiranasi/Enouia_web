import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Mentions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 pt-safe pb-4">
          <div className="flex items-center gap-3 pt-4">
            <Button 
              variant="ghost" 
              size="icon"
              className="rounded-full"
              onClick={() => navigate(createPageUrl('EunoiaMe'))}
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">提及我的</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
            <MessageSquare className="w-10 h-10 text-blue-600" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">暂无提及</h3>
          <p className="text-sm text-gray-500 mb-6">当有人在评论中提到你时，会显示在这里</p>
          <Button
            className="bg-blue-500 hover:bg-blue-600 rounded-full px-6"
            onClick={() => navigate(createPageUrl('EunoiaSquare'))}
          >
            去广场看看
          </Button>
        </div>
      </div>
    </div>
  );
}