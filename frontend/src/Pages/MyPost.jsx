import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import CategoryBadge from '../components/eunoia/CategoryBadge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function MyPost() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: allPosts = [] } = useQuery({
    queryKey: ['posts'],
    queryFn: () => base44.entities.Post.list('-created_at'),
    initialData: [],
  });

  const myPosts = allPosts.filter((post) => post.created_by === user?.email);

  const deletePostMutation = useMutation({
    mutationFn: (postId) => base44.entities.Post.delete(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const handleDelete = async (postId, e) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这篇帖子吗？')) {
      await deletePostMutation.mutateAsync(postId);
    }
  };

  const handlePostClick = (postId) => {
    navigate(createPageUrl('PostDetail') + '?id=' + postId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 to-white pb-8">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 pt-safe pb-4">
          <div className="flex items-center gap-3 pt-4">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(createPageUrl('EunoiaMe'))}>
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">我的帖子</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {myPosts.length > 0 ? (
          <div className="space-y-3">
            {myPosts.map((post) => (
              <Card key={post.id} className="p-4 rounded-2xl shadow-sm border-0 cursor-pointer hover:shadow-md transition-all group" onClick={() => handlePostClick(post.id)}>
                <div className="flex gap-3">
                  {post.image_url && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <CategoryBadge category={post.category} size="xs" />
                      </div>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 flex-shrink-0" onClick={(e) => handleDelete(post.id, e)}>
                        <Trash2 className="w-4 h-4 text-red-500" strokeWidth={1.5} />
                      </Button>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{post.title}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">{post.content}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{post.likes_count || 0} 赞</span>
                      <span>·</span>
                      <span>{post.comments_count || 0} 评论</span>
                      <span>·</span>
                      <span>{format(new Date(post.created_at), 'MM/dd')}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-teal-100 flex items-center justify-center">
              <Edit className="w-10 h-10 text-teal-600" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">还没有发布帖子</h3>
            <p className="text-sm text-gray-500 mb-6">去广场分享你的想法吧</p>
            <Button className="bg-teal-500 hover:bg-teal-600 rounded-full px-6" onClick={() => navigate(createPageUrl('CreatePost'))}>
              发布帖子
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

