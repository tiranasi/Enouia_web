
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Heart, AlertTriangle, Lightbulb, BarChart3, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function EmotionReportDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportId = searchParams.get('id');
  const queryClient = useQueryClient();

  const { data: report, isLoading } = useQuery({
    queryKey: ['emotionReport', reportId],
    queryFn: async () => {
      const reports = await base44.entities.EmotionReport.list();
      const foundReport = reports.find(r => r.id === reportId);
      
      // 标记为已查看
      if (foundReport && !foundReport.is_viewed && foundReport.status === 'completed') {
        await base44.entities.EmotionReport.update(reportId, { is_viewed: true });
        queryClient.invalidateQueries({ queryKey: ['emotionReports'] });
        // Optionally refetch the current report to get the updated is_viewed status
        // return { ...foundReport, is_viewed: true }; 
        // For now, we'll just return the found report and the invalidate will handle list updates.
      }
      
      return foundReport;
    },
    enabled: !!reportId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-purple-600 animate-pulse" strokeWidth={1.5} />
          </div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">报告不存在</p>
          <Button onClick={() => navigate(-1)} variant="outline">返回</Button>
        </div>
      </div>
    );
  }

  if (report.status !== 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-white flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
            <Clock className="w-10 h-10 text-purple-600 animate-spin" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">报告分析中...</h3>
          <p className="text-sm text-gray-500 mb-6">AI正在分析您的对话记录，预计需要1-2分钟</p>
          <Button onClick={() => navigate(-1)} variant="outline">返回</Button>
        </div>
      </div>
    );
  }

  const result = report.analysis_result;

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-white flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-gray-500 mb-4">报告数据不完整</p>
          <Button onClick={() => navigate(-1)} variant="outline">返回</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-white pb-8">
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
            <h1 className="text-xl font-bold text-gray-900">分析报告</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header Card */}
        <Card className="p-6 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold mb-2">{report.title}</h2>
              <p className="text-sm opacity-90">
                分析了 {report.selected_chats?.length || 0} 条对话记录
              </p>
              <p className="text-xs opacity-75 mt-1">
                {report.analyzed_at ? format(new Date(report.analyzed_at), 'yyyy年MM月dd日 HH:mm') : format(new Date(report.created_at), 'yyyy年MM月dd日 HH:mm')}
              </p>
            </div>
          </div>
        </Card>

        {/* Overall Assessment */}
        {result.overall_assessment && (
          <Card className="p-6 rounded-3xl border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-600" strokeWidth={1.5} />
              <h3 className="text-base font-bold text-gray-900">总体评估</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {result.overall_assessment}
            </p>
          </Card>
        )}

        {/* Emotional Trend */}
        {result.emotional_trend && (
          <Card className="p-6 rounded-3xl border-0 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-pink-600" strokeWidth={1.5} />
              <h3 className="text-base font-bold text-gray-900">情绪倾向</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {result.emotional_trend}
            </p>
          </Card>
        )}

        {/* Dominant Emotions */}
        {result.dominant_emotions && result.dominant_emotions.length > 0 && (
          <Card className="p-6 rounded-3xl border-0 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4">主要情绪分布</h3>
            <div className="space-y-4">
              {result.dominant_emotions.map((emotion, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{emotion.emotion}</span>
                    <span className="text-sm font-semibold text-purple-600">{emotion.percentage}%</span>
                  </div>
                  <Progress value={emotion.percentage} className="h-2 mb-2" />
                  {emotion.description && (
                    <p className="text-xs text-gray-600">{emotion.description}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Potential Issues */}
        {result.potential_issues && result.potential_issues.length > 0 && (
          <Card className="p-6 rounded-3xl border-0 shadow-sm bg-orange-50">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-600" strokeWidth={1.5} />
              <h3 className="text-base font-bold text-gray-900">需要关注的方面</h3>
            </div>
            <ul className="space-y-2">
              {result.potential_issues.map((issue, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-orange-600 flex-shrink-0 mt-0.5">•</span>
                  <span className="leading-relaxed">{issue}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Suggestions */}
        {result.suggestions && result.suggestions.length > 0 && (
          <Card className="p-6 rounded-3xl border-0 shadow-sm bg-green-50">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-green-600" strokeWidth={1.5} />
              <h3 className="text-base font-bold text-gray-900">改善建议</h3>
            </div>
            <ul className="space-y-3">
              {result.suggestions.map((suggestion, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed flex-1">{suggestion}</p>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Disclaimer */}
        <Card className="p-4 rounded-3xl bg-blue-50 border-blue-100">
          <div className="flex gap-3">
            <div className="text-lg flex-shrink-0">ℹ️</div>
            <div>
              <p className="text-xs font-medium text-blue-900 mb-1">重要提示</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                此报告由AI生成，仅供参考。如您感到持续的情绪困扰或心理压力，建议寻求专业心理咨询师的帮助。
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
