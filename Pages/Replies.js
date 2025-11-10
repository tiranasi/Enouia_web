import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function Replies() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['replies'],
    queryFn: async () => {
      if (!user?.email) return [];
  const allNotifications = await base44.entities.Notification.list('-created_at');
      return allNotifications.filter(n => 
        n.recipient_email === user.email && n.type === 'comment'
      );
    },
    enabled: !!user?.email,
    initialData: [],
  });

  const handleReplyClick = (notification) => {
    navigate(createPageUrl('PostDetail') + '?id=' + notification.post_id);
  };

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
            <h1 className="text-xl font-bold text-gray-900">评论回复</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className="p-4 rounded-2xl shadow-sm border-0 cursor-pointer hover:shadow-md transition-all"
                onClick={() => handleReplyClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {notification.actor_name?.[0] || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {notification.actor_name}
                      </p>
                      <p className="text-xs text-gray-500">
        {format(new Date(notification.created_at), 'MM/dd HH:mm')}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      评论了你的帖子 <span className="font-medium">「{notification.post_title}」</span>
                    </p>
                    {notification.comment_content && (
                      <div className="bg-gray-50 rounded-xl p-3 mt-2">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {notification.comment_content}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-blue-600" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">暂无评论</h3>
            <p className="text-sm text-gray-500 mb-6">当有人评论你的帖子时会显示在这里</p>
            <Button
              className="bg-blue-500 hover:bg-blue-600 rounded-full px-6"
              onClick={() => navigate(createPageUrl('EunoiaSquare'))}
            >
              去广场看看
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}