import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Heart, Bookmark, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!user?.email) return [];
  const allNotifications = await base44.entities.Notification.list('-created_at');
      return allNotifications.filter(n => n.recipient_email === user.email);
    },
    enabled: !!user?.email,
    initialData: [],
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => base44.entities.Notification.update(notificationId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsReadMutation.mutateAsync(notification.id);
    }
    navigate(createPageUrl('PostDetail') + '?id=' + notification.post_id);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-pink-500" strokeWidth={1.5} fill="currentColor" />;
      case 'favorite':
        return <Bookmark className="w-5 h-5 text-yellow-500" strokeWidth={1.5} fill="currentColor" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" strokeWidth={1.5} />;
      default:
        return null;
    }
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case 'like':
        return `点赞了你的帖子`;
      case 'favorite':
        return `收藏了你的帖子`;
      case 'comment':
        return `评论了你的帖子`;
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 to-white pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 pt-safe pb-4">
          <div className="flex items-center gap-3 pt-4">
            <Button 
              variant="ghost" 
              size="icon"
              className="rounded-full"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">通知</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 rounded-2xl shadow-sm border-0 cursor-pointer hover:shadow-md transition-all ${
                  !notification.is_read ? 'bg-teal-50' : 'bg-white'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 mb-1">
                      <span className="font-semibold">{notification.actor_name}</span>
                      {' '}
                      <span className="text-gray-600">{getNotificationText(notification)}</span>
                    </p>
                    <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
                      「{notification.post_title}」
                    </p>
                    {notification.type === 'comment' && notification.comment_content && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {notification.comment_content}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
            {format(new Date(notification.created_at), 'MM/dd HH:mm')}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0 mt-2" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">暂无通知</h3>
            <p className="text-sm text-gray-500">当有人点赞、收藏或评论你的帖子时会显示在这里</p>
          </div>
        )}
      </div>
    </div>
  );
}