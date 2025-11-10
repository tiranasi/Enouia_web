
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Image as ImageIcon, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const categories = [
  { id: 'AI Relief', name: 'AI Relief', color: 'bg-teal-100 text-teal-700 border-teal-300' },
  { id: 'Treehole', name: 'Treehole', color: 'bg-pink-100 text-pink-700 border-pink-300' },
  { id: 'Support Center', name: 'Support Center', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { id: 'Challenges', name: 'Challenges', color: 'bg-purple-100 text-purple-700 border-purple-300' },
];

export default function CreatePost() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Treehole',
    image_url: '',
    tags: [],
    shared_style_id: '',
  });
  const [tagInput, setTagInput] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: myStyles = [] } = useQuery({
    queryKey: ['chatStyles'],
    queryFn: async () => {
      if (!user?.email) return [];
      const allStyles = await base44.entities.ChatStyle.list();
      return allStyles.filter(style => 
        style.created_by === user.email && !style.is_imported
      );
    },
    enabled: !!user?.email,
    initialData: [],
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, image_url: file_url });
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && formData.tags.length < 5) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (index) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  const handlePublish = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('请填写标题和内容');
      return;
    }

    // AI Relief分区必须选择要分享的角色
    if (formData.category === 'AI Relief' && !formData.shared_style_id) {
      alert('发布到AI Relief分区必须分享一个自定义角色');
      return;
    }

    setPublishing(true);
    try {
      let postData = { ...formData };
      
      // 如果是AI Relief，添加角色数据快照
      if (formData.category === 'AI Relief' && formData.shared_style_id) {
        const selectedStyle = myStyles.find(s => s.id === formData.shared_style_id);
        if (selectedStyle) {
          postData.shared_style_data = {
            name: selectedStyle.name,
            avatar: selectedStyle.avatar,
            personality: selectedStyle.personality,
            background: selectedStyle.background || '',
            dialogue_style: selectedStyle.dialogue_style || '',
            author_name: user?.nickname || user?.full_name || '匿名',
            author_email: user?.email,
          };
        }
      }

      await base44.entities.Post.create(postData);
      navigate(createPageUrl('EunoiaSquare'));
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败，请重试');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 to-white pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 pt-safe pb-4">
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                className="rounded-full"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
              </Button>
              <h1 className="text-xl font-bold text-gray-900">发布帖子</h1>
            </div>
            <Button
              className="bg-teal-500 hover:bg-teal-600 rounded-full px-6"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? '发布中...' : '发布'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Category Selection */}
        <Card className="p-6 rounded-3xl shadow-sm border-0">
          <Label className="text-sm font-semibold text-gray-900 mb-4 block">选择分区</Label>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`p-3 rounded-2xl border-2 transition-all text-sm font-medium ${
                  formData.category === cat.id
                    ? cat.color + ' border-current'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setFormData({ ...formData, category: cat.id, shared_style_id: '' })}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </Card>

        {/* AI Relief - Style Selection */}
        {formData.category === 'AI Relief' && (
          <Card className="p-6 rounded-3xl shadow-sm border-0 bg-gradient-to-br from-teal-50 to-teal-100">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">分享你的AI角色</h3>
                <p className="text-xs text-gray-600">选择一个自定义角色分享给社区，帮助其他人获得情感支持</p>
              </div>
            </div>
            
            {myStyles.length > 0 ? (
              <div>
                <Label className="text-sm font-medium text-gray-900 mb-2 block">
                  选择角色 <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.shared_style_id} onValueChange={(value) => setFormData({ ...formData, shared_style_id: value })}>
                  <SelectTrigger className="rounded-2xl h-11 bg-white">
                    <SelectValue placeholder="选择要分享的角色" />
                  </SelectTrigger>
                  <SelectContent>
                    {myStyles.map((style) => (
                      <SelectItem key={style.id} value={style.id}>
                        <div className="flex items-center gap-2">
                          {style.avatar?.startsWith('http') ? (
                            <img src={style.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <span className="text-lg">{style.avatar || '😊'}</span>
                          )}
                          <span>{style.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-3">你还没有创建自定义角色</p>
                <Button
                  size="sm"
                  className="bg-teal-500 hover:bg-teal-600 rounded-full"
                  onClick={() => navigate(createPageUrl('CreateStyle'))}
                >
                  创建角色
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Title */}
        <Card className="p-6 rounded-3xl shadow-sm border-0">
          <Label htmlFor="title" className="text-sm font-semibold text-gray-900 mb-3 block">
            标题
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="给你的帖子起个标题..."
            className="rounded-2xl h-11 text-base"
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-2">{formData.title.length}/100</p>
        </Card>

        {/* Content */}
        <Card className="p-6 rounded-3xl shadow-sm border-0">
          <Label htmlFor="content" className="text-sm font-semibold text-gray-900 mb-3 block">
            内容
          </Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="分享你的想法、感受或故事..."
            className="rounded-2xl min-h-[200px] resize-none text-base"
            maxLength={2000}
          />
          <p className="text-xs text-gray-500 mt-2">{formData.content.length}/2000</p>
        </Card>

        {/* Image Upload */}
        <Card className="p-6 rounded-3xl shadow-sm border-0">
          <Label className="text-sm font-semibold text-gray-900 mb-3 block">
            图片（可选）
          </Label>
          {formData.image_url ? (
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={formData.image_url}
                alt="Preview"
                className="w-full h-48 object-cover"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 rounded-full"
                onClick={() => setFormData({ ...formData, image_url: '' })}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-3xl cursor-pointer hover:border-teal-500 transition-colors">
              <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">
                {uploading ? '上传中...' : '点击上传图片'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </label>
          )}
        </Card>

        {/* Tags */}
        <Card className="p-6 rounded-3xl shadow-sm border-0">
          <Label className="text-sm font-semibold text-gray-900 mb-3 block">
            标签（最多5个）
          </Label>
          <div className="flex gap-2 mb-3">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="输入标签后回车"
              className="rounded-2xl h-10"
              disabled={formData.tags.length >= 5}
            />
            <Button
              onClick={handleAddTag}
              disabled={formData.tags.length >= 5 || !tagInput.trim()}
              className="rounded-2xl"
            >
              添加
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <div
                key={index}
                className="flex items-center gap-1 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm"
              >
                <span>#{tag}</span>
                <button
                  onClick={() => handleRemoveTag(index)}
                  className="hover:text-teal-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Tips */}
        <Card className="p-4 rounded-3xl bg-purple-50 border-purple-100">
          <div className="flex gap-3">
            <div className="text-lg">💡</div>
            <div>
              <p className="text-sm font-medium text-purple-900 mb-1">发布提示</p>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>• 请尊重他人，友善交流</li>
                <li>• 避免透露个人隐私信息</li>
                <li>• 如遇紧急情况请寻求专业帮助</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}