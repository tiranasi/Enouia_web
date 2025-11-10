import React from 'react';
import { Card } from '@/components/ui/card';
import { Bookmark } from 'lucide-react';
import { format } from 'date-fns';
import CategoryBadge from './CategoryBadge';

export default function PostCard({ post, authorProfile, createdAt, compact = false, onClick }) {
  const type = post.type;
  const category = post.category;
  const title = post.title;
  const content = post.content;
  const image = post.image || post.image_url;
  const tags = post.tags;
  const mood = post.mood;
  const createdBy = post.created_by;
  const displayName = (authorProfile?.nickname || '').trim();
  const avatarUrl = authorProfile?.avatar_url;

  return (
    <Card 
      className={`rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border-0 bg-white cursor-pointer ${
        compact ? 'min-w-[280px]' : 'w-full'
      }`}
      onClick={onClick}
    >
      {image && (
        <div className="relative aspect-video w-full overflow-hidden">
          <img src={image} alt={title} className="w-full h-full object-cover" />
          <div className="absolute top-3 right-3">
            <CategoryBadge category={category} />
          </div>
        </div>
      )}
      
      <div className="p-4">
        {/* 作者信息 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
              {avatarUrl?.startsWith('http') ? (
                <img src={avatarUrl} alt="作者头像" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-sm font-semibold">
                {(displayName || '匿名')[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{displayName || '匿名'}</p>
            </div>
          </div>
          {createdAt && (
            <p className="text-xs text-gray-500 whitespace-nowrap">{format(new Date(createdAt), 'MM/dd HH:mm')}</p>
          )}
        </div>
        {!image && (
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              {type === 'dialogue' && (
                <p className="text-xs text-gray-500 mb-1">Warm Companion • Comfort Scene</p>
              )}
            </div>
            <CategoryBadge category={category} size="xs" />
          </div>
        )}
        
        <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
          {title}
        </h3>
        
        {content && (
          <p className="text-xs text-gray-600 line-clamp-3 mb-3">{content}</p>
        )}
        
        {mood && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-teal-50 text-teal-600 text-xs mb-3">
            <span>😊</span>
            <span>{mood}</span>
          </div>
        )}
        
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-end text-gray-500">
          <button 
            className="hover:text-teal-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              // Handle bookmark
            }}
          >
            <Bookmark className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </Card>
  );
}