
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Heart, MessageCircle, Send, MoreVertical, Sparkles, Download, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge'; // Keep Badge import, it's used
import CategoryBadge from '../Components/eunoia/CategoryBadge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function PostDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const postId = searchParams.get('id');
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [importing, setImporting] = useState(false);

  const { data: post } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const posts = await base44.entities.Post.list();
      return posts.find(p => p.id === postId);
    },
    enabled: !!postId,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      if (!postId) return [];
      const allComments = await base44.entities.Comment.list();
      return allComments.filter(c => c.post_id === postId);
    },
    enabled: !!postId,
    initialData: [],
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      if (!user?.email) return [];
      const allFavorites = await base44.entities.Favorite.list();
      return allFavorites.filter(f => f.created_by === user.email);
    },
    enabled: !!user?.email,
    initialData: [],
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const userEmail = user?.email || 'anonymous';
      const isLiked = post?.liked_by?.includes(userEmail);
      
      if (isLiked) {
        return base44.entities.Post.update(postId, {
          likes_count: Math.max(0, (post?.likes_count || 0) - 1),
          liked_by: (post?.liked_by || []).filter(email => email !== userEmail),
        });
      } else {
        // 创建点赞通知
        if (post?.created_by !== userEmail) {
          await base44.entities.Notification.create({
            type: 'like',
            post_id: postId,
            post_title: post?.title || '',
            actor_email: userEmail,
            actor_name: user?.nickname || user?.full_name || '匿名用户',
            recipient_email: post?.created_by,
          });
        }
        
        return base44.entities.Post.update(postId, {
          likes_count: (post?.likes_count || 0) + 1,
          liked_by: [...(post?.liked_by || []), userEmail],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content) => {
      const comment = await base44.entities.Comment.create({
        post_id: postId,
        content,
        author_name: user?.nickname || user?.full_name || '匿名用户',
      });
      
      await base44.entities.Post.update(postId, {
        comments_count: (post?.comments_count || 0) + 1,
      });

      // 创建评论通知
      if (post?.created_by !== user?.email) {
        await base44.entities.Notification.create({
          type: 'comment',
          post_id: postId,
          post_title: post?.title || '',
          actor_email: user?.email,
          actor_name: user?.nickname || user?.full_name || '匿名用户',
          recipient_email: post?.created_by,
          comment_content: content,
        });
      }
      
      return comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setCommentText('');
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      const isFavorited = favorites.some(f => f.post_id === postId);
      
      if (isFavorited) {
        const favorite = favorites.find(f => f.post_id === postId);
        await base44.entities.Favorite.delete(favorite.id);
      } else {
        await base44.entities.Favorite.create({
          post_id: postId,
          post_title: post?.title || '',
          post_author_email: post?.created_by,
        });

        // 创建收藏通知
        if (post?.created_by !== user?.email) {
          await base44.entities.Notification.create({
            type: 'favorite',
            post_id: postId,
            post_title: post?.title || '',
            actor_email: user?.email,
            actor_name: user?.nickname || user?.full_name || '匿名用户',
            recipient_email: post?.created_by,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const handleImportStyle = async () => {
    if (!post?.shared_style_data || !user?.email) return;
    
    // 检查是否是自己的角色
    if (post.shared_style_data.author_email === user.email) {
      alert('这是你自己创建的角色，无需导入');
      return;
    }

    setImporting(true);
    try {
      const allStyles = await base44.entities.ChatStyle.list();
      const myStyles = allStyles.filter(s => s.created_by === user.email);
      const alreadyImported = myStyles.find(s => s.original_style_id === post.shared_style_id);
      
      if (alreadyImported) {
        alert('你已经添加过这个角色了');
        return;
      }

      // 检查原始角色是否存在
      const originalStyle = allStyles.find(s => s.id === post.shared_style_id);
      if (!originalStyle) {
        alert('该角色已被作者删除，无法添加');
        return;
      }

      await base44.entities.ChatStyle.create({
        name: post.shared_style_data.name,
        avatar: post.shared_style_data.avatar,
        personality: post.shared_style_data.personality,
        background: post.shared_style_data.background || '',
        dialogue_style: post.shared_style_data.dialogue_style || '',
        is_imported: true,
        original_author_email: post.shared_style_data.author_email,
        original_author_name: post.shared_style_data.author_name,
        original_style_id: post.shared_style_id,
      });

      // 刷新数据并显示提示
      await queryClient.invalidateQueries({ queryKey: ['chatStyles'] });
      
      alert('✅ 已添加至我的风格'); // Show alert instead of navigating
    } catch (error) {
      console.error('添加角色失败:', error);
      alert('添加角色失败，请重试');
    } finally {
      setImporting(false);
    }
  };

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleComment = () => {
    if (commentText.trim()) {
      commentMutation.mutate(commentText);
    }
  };

  const handleFavorite = () => {
    favoriteMutation.mutate();
  };

  const isLiked = post?.liked_by?.includes(user?.email);
  const isFavorited = favorites.some(f => f.post_id === postId);
  const isAIRelief = post?.category === 'AI Relief';

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/30 to-white flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 to-white pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 pt-safe pb-4">
          <div className="flex items-center justify-between pt-4">
            <Button 
              variant="ghost" 
              size="icon"
              className="rounded-full"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </Button>
            <h1 className="text-lg font-bold text-gray-900">帖子详情</h1>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="w-5 h-5" strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Post Content */}
        <Card className="rounded-3xl shadow-sm border-0 overflow-hidden mb-6">
          {post.image_url && (
            <div className="relative aspect-video w-full overflow-hidden">
              <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <CategoryBadge category={post.category} />
              <p className="text-xs text-gray-500">
                      {format(new Date(post.created_at), 'MM/dd HH:mm')}
              </p>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>

            {/* AI Relief - Shared Style Card */}
            {isAIRelief && post.shared_style_data && (
              <Card className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
                {/* Note: The 'styleDeleted' logic using originalStyle query is removed,
                    The check for originalStyle's existence is now handled inside handleImportStyle.
                    For display purposes, we assume it's valid unless the import fails or original author deleted.
                    If the original style is deleted, the handleImportStyle will alert the user, but the card
                    itself will still display the data if available in shared_style_data. */}
                  <>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0">
                        {post.shared_style_data.avatar?.startsWith('http') ? (
                          <img src={post.shared_style_data.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">{post.shared_style_data.avatar || '😊'}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="w-4 h-4 text-teal-600" strokeWidth={1.5} />
                          <p className="text-sm font-semibold text-gray-900">
                            {post.shared_style_data.name}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          by {post.shared_style_data.author_name}
                        </p>
                        <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">
                          {post.shared_style_data.personality}
                        </p>
                      </div>
                    </div>
                    {post.shared_style_data.author_email !== user?.email && (
                      <Button
                        className="w-full bg-teal-500 hover:bg-teal-600 text-white rounded-2xl h-10 font-medium"
                        onClick={handleImportStyle}
                        disabled={importing}
                      >
                        {importing ? (
                          '添加中...'
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" strokeWidth={2} />
                            添加此角色
                          </>
                        )}
                      </Button>
                    )}
                  </>
              </Card>
            )}

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag, idx) => (
                  <span key={idx} className="text-xs text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center gap-2 rounded-full ${
                  isLiked ? 'text-pink-600' : 'text-gray-600'
                }`}
                onClick={handleLike}
              >
                <Heart 
                  className="w-5 h-5" 
                  strokeWidth={1.5}
                  fill={isLiked ? 'currentColor' : 'none'}
                />
                <span className="text-sm font-medium">{post.likes_count || 0}</span>
              </Button>
              
              <div className="flex items-center gap-2 text-gray-600">
                <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-sm font-medium">{post.comments_count || 0}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center gap-2 rounded-full ml-auto ${
                  isFavorited ? 'text-yellow-600' : 'text-gray-600'
                }`}
                onClick={handleFavorite}
              >
                <Bookmark 
                  className="w-5 h-5" 
                  strokeWidth={1.5}
                  fill={isFavorited ? 'currentColor' : 'none'}
                />
              </Button>
            </div>
          </div>
        </Card>

        {/* Comments Section */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-gray-900">评论 ({comments.length})</h3>

          {/* Comment Input */}
          <Card className="p-4 rounded-3xl shadow-sm border-0">
            <div className="flex gap-2 items-start">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                {user?.avatar?.startsWith('http') ? (
                  <img src={user.avatar} alt="Me" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-sm font-semibold">
                    {(user?.nickname || user?.full_name)?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="写下你的评论..."
                className="rounded-2xl min-h-[80px] resize-none flex-1"
              />
              <Button
                size="icon"
                className="rounded-full bg-teal-500 hover:bg-teal-600 flex-shrink-0 h-10 w-10"
                onClick={handleComment}
                disabled={!commentText.trim()}
              >
                <Send className="w-4 h-4" strokeWidth={2} />
              </Button>
            </div>
          </Card>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.map((comment) => (
              <Card key={comment.id} className="p-4 rounded-2xl shadow-sm border-0">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {comment.author_name?.[0] || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {comment.author_name || '匿名用户'}
                      </p>
                      <p className="text-xs text-gray-500">
                      {format(new Date(comment.created_at), 'MM/dd HH:mm')}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              </Card>
            ))}

            {comments.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">暂无评论，快来抢沙发吧～</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
