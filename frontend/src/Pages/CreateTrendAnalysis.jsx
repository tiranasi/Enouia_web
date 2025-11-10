import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, TrendingUp, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function CreateTrendAnalysis() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: reports = [] } = useQuery({
    queryKey: ['emotionReportsForTrend'],
    queryFn: async () => {
      if (!user?.email) return [];
      const allReports = await base44.entities.EmotionReport.list('-created_at');
      return allReports.filter((r) => r.created_by === user.email && r.status === 'completed');
    },
    enabled: !!user?.email,
    initialData: [],
  });

  const minRequired = 5;
  const canSubmit = useMemo(() => selectedIds.length >= minRequired && !submitting, [selectedIds, submitting]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const createTrendMutation = useMutation({
    mutationFn: (payload) => base44.entities.TrendAnalysis.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trendAnalyses'] });
    },
  });

  const performTrendAnalysis = async (trendId, pickedReports) => {
    const summaryBlocks = pickedReports.map((r, idx) => {
      const ar = r.analysis_result || {};
      return `报告${idx + 1}：总体(${ar.overall_assessment||''}); 趋势(${ar.emotional_trend||''}); 主导情绪(${(ar.dominant_emotions||[]).join(', ')||''}); 建议(${(ar.recommendations||[]).join('; ')||''})`;
    });

    const prompt = [
      '你是一名专业的情绪分析师。',
      '基于用户最近的多份情绪报告，进行趋势综合分析。',
      '请给出整体趋势、关键变化点、改进建议、需要关注的信号，输出严格的 JSON。',
      '以下是报告摘要：',
      summaryBlocks.join('\n')
    ].join('\n\n');

    const schema = {
      type: 'object',
      properties: {
        overall_trend: { type: 'string' },
        key_changes: { type: 'array', items: { type: 'string' } },
        improvement_areas: { type: 'array', items: { type: 'string' } },
        warning_signs: { type: 'array', items: { type: 'string' } },
      },
      required: ['overall_trend']
    };

    const llm = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema,
      // 使用后端默认模型（大模型 glm 系列），保证兼容性
      // model: 'glm-4.5-flash',
    });

    const result = llm || {};
    await base44.entities.TrendAnalysis.update(trendId, {
      status: 'completed',
      trend_result: result,
      analyzed_at: new Date().toISOString(),
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const picked = reports.filter((r) => selectedIds.includes(r.id));
      const title = `趋势分析（${format(new Date(), 'MM/dd HH:mm')}）`;

      const trend = await createTrendMutation.mutateAsync({
        title,
        created_by: user.email,
        selected_reports: picked.map((r) => r.id),
        status: 'analyzing',
      });

      // 异步分析
      try {
        await performTrendAnalysis(trend.id, picked);
      } catch (err) {
        console.error('趋势分析失败:', err);
        await base44.entities.TrendAnalysis.update(trend.id, { status: 'failed' });
        throw err;
      }
      navigate(createPageUrl('TrendAnalysisDetail') + '?id=' + trend.id);
    } catch (e) {
      console.error(e);
      alert('创建趋势分析失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 to-white pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 pt-safe pb-4">
          <div className="flex items-center gap-3 pt-4">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(createPageUrl('EmotionReports'))}>
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">创建趋势分析</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card className="p-6 rounded-3xl shadow-sm border-0">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">选择要纳入趋势的报告</h3>
              <p className="text-xs text-gray-500 mt-1">至少选择 {minRequired} 份已完成的报告进行综合分析</p>
            </div>
          </div>

          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((r) => (
                <label key={r.id} className={`flex items-start gap-3 p-4 rounded-2xl border ${selectedIds.includes(r.id) ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'} cursor-pointer`}>
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selectedIds.includes(r.id)}
                    onChange={() => toggleSelect(r.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-white" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{r.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{format(new Date(r.created_at), 'yyyy-MM-dd HH:mm')}</p>
                      </div>
                    </div>
                    {r.analysis_result?.overall_assessment && (
                      <p className="text-xs text-gray-700 mt-2">摘要：{r.analysis_result.overall_assessment}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">暂无已完成报告</p>
              <Button className="mt-4 rounded-full" onClick={() => navigate(createPageUrl('EmotionAnalysis'))}>去创建报告</Button>
            </div>
          )}
        </Card>

        <Button
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-2xl h-12"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {submitting ? '正在创建...' : `开始趋势分析（已选 ${selectedIds.length}/${minRequired}）`}
        </Button>
      </div>
    </div>
  );
}