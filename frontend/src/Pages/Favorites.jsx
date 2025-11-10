import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Bookmark, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import CategoryBadge from '../components/eunoia/CategoryBadge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function Favorites() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      if (!user?.email) return [];
      const allFavorites = await base44.entities.Favorite.list('-created_at');
      // 服务端已按用户隔离，这里再次按邮箱过滤以防万一
      return allFavorites.filter((f) => f.created_by === user.email);
    },
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['posts'],
    queryFn: () => base44.entities.Post.list(),
    initialData: [],
  });

  const deleteFavoriteMutation = useMutation({
    mutationFn: (favoriteId) => base44.entities.Favorite.delete(favoriteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const handleDelete = async (favoriteId, e) => {
    e.stopPropagation();
    if (window.confirm('确定要取消收藏吗？')) {
      await deleteFavoriteMutation.mutateAsync(favoriteId);
    }
  };

  const handlePostClick = (postId) => {
    navigate(createPageUrl('PostDetail') + '?id=' + postId);
  };

  const favoritedPosts = favorites
    .map((fav) => ({ ...fav, post: posts.find((p) => p.id === fav.post_id) }))
    .filter((x) => x.post);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white pb-8">
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
            <h1 className="text-xl font-bold text-gray-900">我的收藏</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {favoritedPosts.length > 0 ? (
          <div className="space-y-3">
            {favoritedPosts.map((item) => (
              <Card
                key={item.id}
                className="p-4 rounded-2xl shadow-sm border-0 cursor-pointer hover:shadow-md transition-all group"
                onClick={() => handlePostClick(item.post.id)}
              >
                <div className="flex gap-3">
                  {item.post.image_url && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={item.post.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <CategoryBadge category={item.post.category} size="xs" />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 flex-shrink-0"
                        onClick={(e) => handleDelete(item.id, e)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" strokeWidth={1.5} />
                      </Button>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                      {item.post.title}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {item.post.content}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{item.post.likes_count || 0} 赞</span>
                      <span>·</span>
                      <span>{item.post.comments_count || 0} 评论</span>
                      <span>·</span>
                      <span>{format(new Date(item.created_at), 'MM/dd')}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-pink-100 flex items-center justify-center">
              <Bookmark className="w-10 h-10 text-pink-600" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">还没有收藏</h3>
            <p className="text-sm text-gray-500 mb-6">收藏喜欢的帖子，方便随时查看</p>
            <Button
              className="bg-pink-500 hover:bg-pink-600 rounded-full px-6"
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

