import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, Clock, Heart, TrendingUp, AlertTriangle, Lightbulb, Info } from 'lucide-react';
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
  const idNum = Number(reportId);
  const queryClient = useQueryClient();

  const { data: report, isLoading } = useQuery({
    queryKey: ['emotionReport', idNum],
    queryFn: async () => {
      const reports = await base44.entities.EmotionReport.list();
      const foundReport = reports.find((r) => r.id === idNum);
      if (foundReport && !foundReport.is_viewed && foundReport.status === 'completed') {
        await base44.entities.EmotionReport.update(idNum, { is_viewed: true });
        queryClient.invalidateQueries({ queryKey: ['emotionReports'] });
      }
      return foundReport;
    },
    enabled: Number.isFinite(idNum),
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
          <p className="text-sm text-gray-500 mb-6">AI 正在分析您的对话记录，预计需 1-2 分钟</p>
          <Button onClick={() => navigate(-1)} variant="outline">返回</Button>
        </div>
      </div>
    );
  }

  const result = report.analysis_result || {};
  const rawText = typeof result.raw_text === 'string' ? result.raw_text : null;
  const overall = result.overall_assessment || result.summary || null;
  const trend = result.emotional_trend || null;
  const concerns = result.concerns || result.potential_issues || result.attention_points || result.risks || [];
  const emotionsRaw = result.dominant_emotions || result.emotions || [];
  const emotions = Array.isArray(emotionsRaw)
    ? emotionsRaw.map((e) => {
        if (typeof e === 'string') return { label: e, value: null, description: '' };
        const label = e.label || e.emotion || '情绪';
        let value = null;
        if (typeof e.value === 'number') value = e.value; // 0..1
        else if (typeof e.percentage === 'number') value = Math.max(0, Math.min(1, e.percentage / 100));
        const description = e.description || '';
        return { label, value, description };
      })
    : [];
  const suggestions = Array.isArray(result.suggestions) ? result.suggestions : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-white pb-8">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 pt-safe pb-4">
          <div className="flex items-center gap-3 pt-4">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
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
              <BarChart3 className="w-7 h-7" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold mb-1">{report.title}</h2>
              <div className="text-xs text-white/90 space-x-2">
                <span>分析了 {Array.isArray(report.selected_chats) ? report.selected_chats.length : 0} 条对话记录</span>
                <span>·</span>
                <span>{format(new Date(report.created_at), 'yyyy-MM-dd HH:mm')}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* 总体评估 */}
        {overall && (
          <Card className="p-5 rounded-3xl border-0 bg-rose-50">
            <div className="flex items-center gap-2 mb-2 text-rose-600">
              <Heart className="w-4 h-4" />
              <h3 className="text-sm font-semibold text-gray-900">总体评估</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{overall}</p>
          </Card>
        )}

        {/* 情绪倾向 */}
        {trend && (
          <Card className="p-5 rounded-3xl border-0 bg-indigo-50">
            <div className="flex items-center gap-2 mb-2 text-rose-600">
              <TrendingUp className="w-4 h-4" />
              <h3 className="text-sm font-semibold text-gray-900">情绪倾向</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{trend}</p>
          </Card>
        )}

        {/* 主要情绪分布 */}
        {emotions.length > 0 && (
          <Card className="p-5 rounded-3xl border-0 bg-white shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">主要情绪分布</h3>
            <div className="space-y-3">
              {emotions.map((e, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{e.label}</span>
                    {e.value != null && <span className="text-xs text-gray-500">{Math.round(e.value * 100)}%</span>}
                  </div>
                  {e.value != null && <Progress value={Math.round(e.value * 100)} />}
                  {e.description && <p className="text-xs text-gray-500 mt-1">{e.description}</p>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 需要关注的方面 */}
        {Array.isArray(concerns) && concerns.length > 0 && (
          <Card className="p-5 rounded-3xl border-0 bg-amber-50">
            <div className="flex items-center gap-2 mb-2 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              <h3 className="text-sm font-semibold">需要关注的方面</h3>
            </div>
            <ul className="list-disc pl-5 text-sm text-amber-900 space-y-1">
              {concerns.map((c, idx) => (<li key={idx}>{c}</li>))}
            </ul>
          </Card>
        )}

        {/* 改善建议 */}
        {Array.isArray(suggestions) && suggestions.length > 0 && (
          <Card className="p-5 rounded-3xl border-0 bg-emerald-50">
            <div className="flex items-center gap-2 mb-2 text-emerald-600">
              <Lightbulb className="w-4 h-4" />
              <h3 className="text-sm font-semibold text-gray-900">改善建议</h3>
            </div>
            <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
              {suggestions.map((r, idx) => (<li key={idx}>{r}</li>))}
            </ol>
          </Card>
        )}

        {/* 原始结果兜底 */}
        {!overall && !trend && emotions.length === 0 && suggestions.length === 0 && rawText && (
          <Card className="p-5 rounded-3xl border-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">原始结果</h3>
            <pre className="whitespace-pre-wrap text-sm text-gray-700">{rawText}</pre>
          </Card>
        )}

        {/* 免责声明 */}
        <Card className="p-4 rounded-3xl border-0 bg-blue-50">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center">
              <Info className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">重要提示</p>
              <p className="text-sm text-blue-800 leading-relaxed">此报告由 AI 生成，仅供参考。如您感到持续的情绪困扰或心理压力，建议寻求专业心理咨询师的帮助。</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
