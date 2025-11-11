
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Bell, Settings, ChevronRight, FileText, Bookmark, Edit, MessageSquare, BarChart3, Shield, BellRing, Palette, Database, HelpCircle, Info, LogOut, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import BottomNav from '../components/eunoia/BottomNav';
import { base44 } from '@/api/base44Client';
import { isRenderableImage } from '@/utils/image';
import { useQuery } from '@tanstack/react-query';

const featureGrid = [
  { id: 1, icon: FileText, label: 'My Posts', badge: null, color: 'teal', page: 'MyPost' },
  { id: 2, icon: Bookmark, label: 'Favorites', badge: null, color: 'pink', page: 'Favorites' },
  { id: 3, icon: Edit, label: 'Drafts', badge: null, color: 'purple', page: 'Drafts' },
  { id: 4, icon: MessageSquare, label: 'Replies', badge: null, color: 'blue', page: 'Replies' },
];

const settingsSections = [
  {
    title: 'Account & Privacy',
    items: [
      { icon: Shield, label: 'Privacy Settings', page: null },
      { icon: Database, label: 'Data Management', page: null },
    ],
  },
  {
    title: 'Subscription',
    items: [
      { icon: Sparkles, label: 'Subscription Management', page: 'PlusSubscription' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: BellRing, label: 'Notifications', page: null },
      { icon: Palette, label: 'Appearance', page: null },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: HelpCircle, label: 'Help & Feedback', page: null },
      { icon: Info, label: 'About & Terms', page: null },
    ],
  },
];

export default function EunoiaMe() {
  const navigate = useNavigate();
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['emotionReports'],
    queryFn: async () => {
      if (!user?.email) return [];
  const allReports = await base44.entities.EmotionReport.list('-created_at');
      return allReports.filter(report => report.created_by === user.email);
    },
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: allPosts = [] } = useQuery({
    queryKey: ['posts'],
  queryFn: () => base44.entities.Post.list('-created_at'),
    initialData: [],
  });

  const { data: replies = [] } = useQuery({
    queryKey: ['replies'],
    queryFn: async () => {
      if (!user?.email) return [];
      const allNotifications = await base44.entities.Notification.list();
      return allNotifications.filter(n => 
        n.recipient_email === user.email && n.type === 'comment' && !n.is_read
      );
    },
    enabled: !!user?.email,
    initialData: [],
  });

  const myPostsCount = allPosts.filter(post => post.created_by === user?.email).length;

  const newReportsCount = reports.filter(r => 
    r.status === 'completed' && 
    !r.is_viewed &&
    r.analyzed_at &&
    new Date(r.analyzed_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  const unreadRepliesCount = replies.length;

  const displayName = user?.nickname || user?.full_name || 'User';
  const displayAvatar = user?.avatar || user?.avatar_url;
  // user.id 为 Prisma Int，直接 .slice 会报错；转为字符串再截取
  const displayBio = user?.bio || 'ID: eunoia_#' + String(user?.id ?? '').slice(0, 6);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 to-white pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 pt-safe pb-4">
          <div className="flex items-center justify-between pt-4">
            <h1 className="text-2xl font-bold text-gray-900">Me</h1>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full relative"
                onClick={() => navigate(createPageUrl('Notifications'))}
              >
                <Bell className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
                {(newReportsCount > 0 || unreadRepliesCount > 0) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full" />
                )}
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Settings className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        {/* Profile Card */}
        <div className="py-6">
          <Card className="p-6 rounded-3xl shadow-sm border-0">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                {isRenderableImage(displayAvatar) ? (
                  <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                    {displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900 mb-1">{displayName}</h2>
                <p className="text-sm text-gray-500 mb-2 break-words">{displayBio}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-full h-8 px-4 text-xs font-medium"
                  onClick={() => navigate(createPageUrl('EditProfile'))}
                >
                  Edit Profile
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Feature Grid */}
        <div className="py-2">
          <div className="grid grid-cols-2 gap-3">
            {featureGrid.map(item => {
              const Icon = item.icon;
              const colorClasses = {
                teal: 'bg-teal-50 text-teal-600',
                pink: 'bg-pink-50 text-pink-600',
                purple: 'bg-purple-50 text-purple-600',
                blue: 'bg-blue-50 text-blue-600',
              };
              
              let badge = null;
              if (item.id === 1) badge = myPostsCount;
              if (item.id === 4) badge = unreadRepliesCount;
              
              return (
                <Card 
                  key={item.id}
                  className="p-4 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer border-0"
                  onClick={() => navigate(createPageUrl(item.page))}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-10 h-10 rounded-full ${colorClasses[item.color]} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    {badge !== null && badge > 0 && (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs">
                        {badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Emotion Analysis Center */}
        <div className="py-4">
          <Card 
            className="p-5 rounded-3xl shadow-sm border-0 bg-gradient-to-br from-pink-50 to-purple-50 border-pink-100 cursor-pointer hover:shadow-md transition-all"
            onClick={() => navigate(createPageUrl('EmotionReports'))}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-600" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">Emotion Analysis</h3>
              </div>
              {newReportsCount > 0 && (
                <Badge className="bg-pink-500 text-white text-xs">New: {newReportsCount}</Badge>
              )}
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-3 ml-12">
              Authorize to analyze recent chats and generate a saved report
            </p>
            <Button 
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-full h-8 px-4 text-xs font-medium ml-12"
              onClick={(e) => {
                e.stopPropagation();
                navigate(createPageUrl('EmotionReports'));
              }}
            >
              View Reports
            </Button>
          </Card>
        </div>

        {/* Settings Sections */}
        <div className="py-4 space-y-6">
          {settingsSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
                {section.title}
              </h3>
              <Card className="rounded-2xl shadow-sm border-0 overflow-hidden">
                {section.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const isSubscriptionItem = section.title === 'Subscription' && item.page === 'PlusSubscription';
                  return (
                    <button
                      key={itemIdx}
                      className={`w-full flex items-center justify-between p-4 transition-colors ${
                        itemIdx < section.items.length - 1 ? 'border-b border-gray-100' : ''
                      } ${isSubscriptionItem ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-gray-50'}`}
                      onClick={() => item.page && navigate(createPageUrl(item.page))}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isSubscriptionItem ? 'text-amber-600' : 'text-gray-500'}`} strokeWidth={1.5} />
                        <span className={`text-sm font-medium ${isSubscriptionItem ? 'text-amber-800' : 'text-gray-900'}`}>{item.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isSubscriptionItem ? 'text-amber-500' : 'text-gray-400'}`} strokeWidth={1.5} />
                    </button>
                  );
                })}
              </Card>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="py-6 pb-8">
          <Button 
            variant="outline"
            className="w-full rounded-2xl h-12 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
            onClick={() => { try { localStorage.removeItem('token'); } catch(_){}; navigate(createPageUrl('Login')); }}
          >
            <LogOut className="w-5 h-5 mr-2" strokeWidth={1.5} />
            Log Out
          </Button>
          <p className="text-xs text-gray-500 text-center mt-3">
            On shared devices, clear local cache before logout
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
