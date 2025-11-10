import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, TrendingUp, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function TrendAnalysisDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trendId = searchParams.get('id');

  const { data: trend } = useQuery({
    queryKey: ['trendAnalysis', trendId],
    queryFn: async () => {
      const trends = await base44.entities.TrendAnalysis.list();
      return trends.find(t => t.id === trendId);
    },
    enabled: !!trendId,
  });

  if (!trend) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 to-white flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  const result = trend.trend_result || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 to-white pb-8">
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
            <h1 className="text-xl font-bold text-gray-900">趋势分析报告</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header Card */}
        <Card className="p-6 rounded-3xl shadow-sm border-0 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold mb-1">{trend.title}</h2>
              <p className="text-sm opacity-90 mb-3">
                基于 {trend.selected_reports?.length || 0} 份报告的综合分析
              </p>
              <div className="flex items-center gap-3 text-xs opacity-80">
        <span>{format(new Date(trend.analyzed_at || trend.created_at), 'yyyy-MM-dd HH:mm')}</span>
                <Badge className="bg-white/20 text-white border-0">AI分析</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Overall Trend */}
        <Card className="p-6 rounded-3xl shadow-sm border-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-bold text-gray-900">整体情绪趋势</h3>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {result.overall_trend || '暂无分析结果'}
          </p>
        </Card>

        {/* Key Changes */}
        {result.key_changes && result.key_changes.length > 0 && (
          <Card className="p-6 rounded-3xl shadow-sm border-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-bold text-gray-900">关键变化点</h3>
            </div>
            <div className="space-y-3">
              {result.key_changes.map((change, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600">{idx + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed flex-1">{change}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Improvement Areas */}
        {result.improvement_areas && result.improvement_areas.length > 0 && (
          <Card className="p-6 rounded-3xl shadow-sm border-0 bg-gradient-to-br from-green-50 to-teal-50 border-green-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-bold text-gray-900">改善建议</h3>
            </div>
            <div className="space-y-3">
              {result.improvement_areas.map((suggestion, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-green-600">✓</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed flex-1">{suggestion}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Warning Signs */}
        {result.warning_signs && result.warning_signs.length > 0 && (
          <Card className="p-6 rounded-3xl shadow-sm border-0 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-bold text-gray-900">需要关注的信号</h3>
            </div>
            <div className="space-y-3">
              {result.warning_signs.map((warning, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-amber-600">!</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed flex-1">{warning}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tips */}
        <Card className="p-4 rounded-3xl bg-purple-50 border-purple-100">
          <div className="flex gap-3">
            <div className="text-lg">💡</div>
            <div>
              <p className="text-sm font-medium text-purple-900 mb-1">温馨提示</p>
              <p className="text-xs text-purple-700 leading-relaxed">
                趋势分析基于AI算法，仅供参考。如果情绪持续低落或出现严重问题，建议及时寻求专业心理咨询师的帮助。
              </p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-2xl h-12"
            onClick={() => navigate(createPageUrl('EmotionReports'))}
          >
            返回报告列表
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-2xl h-12"
            onClick={() => navigate(createPageUrl('CreateTrendAnalysis'))}
          >
            创建新分析
          </Button>
        </div>
      </div>
    </div>
  );
}