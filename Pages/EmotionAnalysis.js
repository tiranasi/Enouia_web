
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, CheckCircle, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function EmotionAnalysis() {
  const navigate = useNavigate();
  const [selectedChats, setSelectedChats] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: chatHistories = [] } = useQuery({
    queryKey: ['chatHistories'],
    queryFn: async () => {
      if (!user?.email) return [];
      const allChats = await base44.entities.ChatHistory.list('-last_message_at');
      return allChats.filter(chat => chat.created_by === user.email);
    },
    enabled: !!user?.email,
    initialData: [],
  });

  const createReportMutation = useMutation({
    mutationFn: (reportData) => base44.entities.EmotionReport.create(reportData),
  });

  const handleToggleChat = (chatId) => {
    setSelectedChats(prev =>
      prev.includes(chatId)
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleAnalyze = async () => {
    if (selectedChats.length === 0) {
      alert('请至少选择一条对话记录');
      return;
    }

    setAnalyzing(true);
    try {
      // 创建分析报告
      const report = await createReportMutation.mutateAsync({
        title: `情绪分析报告 ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
        selected_chats: selectedChats,
        status: 'analyzing',
      });

      // 在后台开始分析
      performAnalysis(report.id);

      // 跳转到报告列表
      navigate(createPageUrl('EmotionReports'));
    } catch (error) {
      console.error('创建报告失败:', error);
      alert('创建报告失败，请重试');
    } finally {
      setAnalyzing(false);
    }
  };

  const performAnalysis = async (reportId) => {
    try {
      // 获取选中的对话内容
      const selectedChatData = chatHistories
        .filter(chat => selectedChats.includes(chat.id))
        .map(chat => ({
          title: chat.title,
          style: chat.style_name,
          messages: chat.messages || [],
        }));

      // 构建分析提示词
      const analysisPrompt = `你是一位专业的青少年心理咨询师，请根据以下对话记录进行深入的情绪分析。

# 分析对象
12-18岁青少年的AI聊天记录

# 对话记录
${selectedChatData.map((chat, idx) => `
## 对话${idx + 1}：${chat.title}
使用角色：${chat.style}
${chat.messages.map(msg => `${msg.role === 'user' ? '用户' : 'AI'}：${msg.content}`).join('\n')}
`).join('\n')}

# 分析要求
请从以下几个维度进行专业分析：

1. **情绪倾向总结**：分析用户在对话中表现出的整体情绪状态，包括情绪的强度、持续性和变化趋势。

2. **主要情绪分布**：识别用户表达的主要情绪类型（如焦虑、沮丧、愤怒、喜悦、恐惧等），评估每种情绪的占比和具体表现。

3. **潜在心理问题**：基于对话内容，谨慎推断可能存在的心理健康问题（如考试焦虑、人际关系困扰、自我认同问题、抑郁倾向等），注意不要过度诊断。

4. **积极建议**：提供3-5条具体、可操作的建议，帮助用户改善情绪状态和心理健康。建议应该温和、鼓励性的，适合青少年理解和实践。

5. **总体评估**：给出一个简明的总体心理健康状态评估，包括积极方面和需要关注的方面。

# 注意事项
- 保持专业、客观、温和的语气
- 避免使用过于医学化的术语
- 关注青少年的特殊心理需求
- 强调积极面，给予希望和鼓励
- 如果发现严重问题，建议寻求专业帮助

请以JSON格式返回分析结果。`;

      // 调用AI进行分析
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            emotional_trend: { type: "string" },
            dominant_emotions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  emotion: { type: "string" },
                  percentage: { type: "number" },
                  description: { type: "string" }
                }
              }
            },
            potential_issues: {
              type: "array",
              items: { type: "string" }
            },
            suggestions: {
              type: "array",
              items: { type: "string" }
            },
            overall_assessment: { type: "string" }
          }
        }
      });

      // 更新报告状态
      await base44.entities.EmotionReport.update(reportId, {
        status: 'completed',
        analysis_result: result,
        analyzed_at: new Date().toISOString(),
      });

    } catch (error) {
      console.error('分析失败:', error);
      // 更新为失败状态
      await base44.entities.EmotionReport.update(reportId, {
        status: 'failed',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-white pb-8">
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
              <h1 className="text-xl font-bold text-gray-900">情绪分析</h1>
            </div>
            <Button
              className="bg-purple-600 hover:bg-purple-700 rounded-full px-6"
              onClick={handleAnalyze}
              disabled={analyzing || selectedChats.length === 0}
            >
              {analyzing ? '创建中...' : '开始分析'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <Card className="p-5 rounded-3xl bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
          <div className="flex gap-3">
            <div className="text-2xl">🧠</div>
            <div>
              <p className="text-sm font-medium text-purple-900 mb-1">AI情绪分析</p>
              <p className="text-xs text-purple-700 leading-relaxed">
                选择您想要分析的对话记录，AI将为您生成详细的情绪分析报告，包括情绪倾向、潜在问题和改善建议。
              </p>
            </div>
          </div>
        </Card>

        {/* Selection Info */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            已选择 <span className="font-semibold text-purple-600">{selectedChats.length}</span> 条对话
          </p>
          {selectedChats.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedChats([])}
            >
              清空选择
            </Button>
          )}
        </div>

        {/* Chat List */}
        <div className="space-y-3">
          {chatHistories.map((chat) => {
            const isSelected = selectedChats.includes(chat.id);
            const messageCount = chat.messages?.length || 0;

            return (
              <Card
                key={chat.id}
                className={`p-4 rounded-2xl cursor-pointer transition-all ${
                  isSelected
                    ? 'border-2 border-purple-500 bg-purple-50'
                    : 'border border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleToggleChat(chat.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {isSelected ? (
                      <CheckCircle className="w-5 h-5 text-purple-600" strokeWidth={2} />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" strokeWidth={2} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 mb-1">{chat.title}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{chat.style_name}</span>
                      <span>•</span>
                      <span>{messageCount} 条消息</span>
                      <span>•</span>
                      <span>{format(new Date(chat.last_message_at), 'MM/dd')}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {chatHistories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">暂无对话记录</p>
              <Button
                variant="link"
                className="mt-2 text-purple-600"
                onClick={() => navigate(createPageUrl('EunoiaChat'))}
              >
                去聊天
              </Button>
            </div>
          )}
        </div>

        {/* Tips */}
        <Card className="p-4 rounded-3xl bg-blue-50 border-blue-100">
          <div className="flex gap-3">
            <div className="text-lg">💡</div>
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">分析提示</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• 建议选择2-5条最近的对话记录</li>
                <li>• 分析需要1-2分钟，可以在后台进行</li>
                <li>• 报告会保存在历史记录中供随时查看</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
