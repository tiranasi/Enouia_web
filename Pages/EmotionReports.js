import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Plus, FileText, Clock, CheckCircle, AlertCircle, Trash2, TrendingUp, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

const statusConfig = {
  pending: { label: '待分析', color: 'bg-gray-100 text-gray-700', icon: Clock },
  analyzing: { label: '分析中', color: 'bg-blue-100 text-blue-700', icon: Clock },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  failed: { label: '分析失败', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

export default function EmotionReports() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('reports');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['emotionReports'],
    queryFn: async () => {
      if (!user?.email) return [];
  const allReports = await base44.entities.EmotionReport.list('-created_at');
      return allReports.filter(report => report.created_by === user.email);
    },
    enabled: !!user?.email,
    initialData: [],
    refetchInterval: 5000,
  });

  const { data: trendAnalyses = [] } = useQuery({
    queryKey: ['trendAnalyses'],
    queryFn: async () => {
      if (!user?.email) return [];
  const allAnalyses = await base44.entities.TrendAnalysis.list('-created_at');
      return allAnalyses.filter(analysis => analysis.created_by === user.email);
    },
    enabled: !!user?.email,
    initialData: [],
    refetchInterval: 5000,
  });

  const deleteReportMutation = useMutation({
    mutationFn: (reportId) => base44.entities.EmotionReport.delete(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emotionReports'] });
    },
  });

  const deleteTrendMutation = useMutation({
    mutationFn: (trendId) => base44.entities.TrendAnalysis.delete(trendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trendAnalyses'] });
    },
  });

  const handleViewReport = (report) => {
    if (report.status === 'completed') {
      navigate(createPageUrl('EmotionReportDetail') + '?id=' + report.id);
    } else if (report.status === 'analyzing') {
      alert('报告正在分析中，请稍候...');
    } else if (report.status === 'failed') {
      alert('报告分析失败，请重试');
    }
  };

  const handleViewTrend = (trend) => {
    if (trend.status === 'completed') {
      navigate(createPageUrl('TrendAnalysisDetail') + '?id=' + trend.id);
    } else if (trend.status === 'analyzing') {
      alert('趋势分析正在进行中，请稍候...');
    } else if (trend.status === 'failed') {
      alert('趋势分析失败，请重试');
    }
  };

  const handleDeleteReport = async (reportId, e) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这份报告吗？')) {
      await deleteReportMutation.mutateAsync(reportId);
    }
  };

  const handleDeleteTrend = async (trendId, e) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这份趋势分析吗？')) {
      await deleteTrendMutation.mutateAsync(trendId);
    }
  };

  const handleTrendAnalysisClick = () => {
    const isPlusUser = user?.subscription_tier === 'plus';
    if (!isPlusUser) {
      if (window.confirm('趋势分析是Plus会员专属功能。\n\n自动汇总最近5份报告并给出建议\n\n是否升级Plus会员？')) {
        navigate(createPageUrl('PlusSubscription'));
      }
    } else {
      navigate(createPageUrl('CreateTrendAnalysis'));
    }
  };

  const handleCreateReport = () => {
    const isPlusUser = user?.subscription_tier === 'plus';
    const today = new Date().toISOString().split('T')[0];
    const resetNeeded = user?.daily_report_reset_date !== today;
    const currentReportCount = resetNeeded ? 0 : (user?.daily_report_count || 0);
    const canCreate = isPlusUser || currentReportCount < 1;

    if (canCreate) {
      navigate(createPageUrl('EmotionAnalysis'));
    } else {
      if (window.confirm('今日分析次数已用完。升级Plus可无限次分析，是否了解更多？')) {
        navigate(createPageUrl('PlusSubscription'));
      }
    }
  };

  const isPlusUser = user?.subscription_tier === 'plus';
  const today = new Date().toISOString().split('T')[0];
  const resetNeeded = user?.daily_report_reset_date !== today;
  const currentReportCount = resetNeeded ? 0 : (user?.daily_report_count || 0);

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
                onClick={() => navigate(createPageUrl('EunoiaMe'))}
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
              </Button>
              <h1 className="text-xl font-bold text-gray-900">情绪分析中心</h1>
            </div>
            {activeTab === 'reports' && (
              <div className="flex items-center gap-2">
                {!isPlusUser && (
                  <Badge variant="outline" className="text-xs">
                    今日 {currentReportCount}/1
                  </Badge>
                )}
                <Button
                  size="icon"
                  className="rounded-full bg-purple-600 hover:bg-purple-700"
                  onClick={handleCreateReport}
                >
                  <Plus className="w-5 h-5" strokeWidth={2} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full bg-gray-100 p-1 rounded-2xl">
            <TabsTrigger value="reports" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-gray-900">
              情绪报告
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-gray-900 relative">
              趋势分析
              {!isPlusUser && (
                <Lock className="w-3 h-3 ml-1 text-amber-600" strokeWidth={2} />
              )}
            </TabsTrigger>
          </TabsList>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-6">
            {reports.length > 0 ? (
              <div className="space-y-3">
                {reports.map((report) => {
                  const status = statusConfig[report.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  const isNew = report.status === 'completed' && 
                    !report.is_viewed &&
                    report.analyzed_at &&
                    new Date(report.analyzed_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

                  return (
                    <Card
                      key={report.id}
                      className={`p-4 rounded-2xl transition-all hover:shadow-md group ${
                        report.status === 'completed' 
                          ? 'border-0 cursor-pointer' 
                          : 'border border-gray-200 cursor-default'
                      }`}
                      onClick={() => handleViewReport(report)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-6 h-6 text-white" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 flex-1">
                              {report.title}
                            </h3>
                            <div className="flex items-center gap-2 ml-2">
                              {isNew && (
                                <Badge className="bg-pink-500 text-white text-xs flex-shrink-0">
                                  New
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 flex-shrink-0"
                                onClick={(e) => handleDeleteReport(report.id, e)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" strokeWidth={1.5} />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${status.color} text-xs flex items-center gap-1`}>
                              <StatusIcon className="w-3 h-3" strokeWidth={2} />
                              {status.label}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {report.selected_chats?.length || 0} 条对话
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
              {format(new Date(report.created_at), 'yyyy-MM-dd HH:mm')}
                          </p>
                          {report.status === 'completed' && (
                            <p className="text-xs text-teal-600 mt-1">点击查看详情 →</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-purple-600" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">暂无分析报告</h3>
                <p className="text-sm text-gray-500 mb-6">开始您的第一次情绪分析吧</p>
                <Button
                  className="bg-purple-600 hover:bg-purple-700 rounded-full px-6"
                  onClick={handleCreateReport}
                >
                  <Plus className="w-5 h-5 mr-2" strokeWidth={2} />
                  创建分析
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="mt-6">
            {isPlusUser ? (
              trendAnalyses.length > 0 ? (
                <div className="space-y-3">
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl h-12 font-medium mb-4"
                    onClick={handleTrendAnalysisClick}
                  >
                    <Plus className="w-5 h-5 mr-2" strokeWidth={2} />
                    创建趋势分析
                  </Button>
                  {trendAnalyses.map((trend) => {
                    const status = statusConfig[trend.status] || statusConfig.pending;
                    const StatusIcon = status.icon;

                    return (
                      <Card
                        key={trend.id}
                        className={`p-4 rounded-2xl transition-all hover:shadow-md group ${
                          trend.status === 'completed' 
                            ? 'border-0 cursor-pointer' 
                            : 'border border-gray-200 cursor-default'
                        }`}
                        onClick={() => handleViewTrend(trend)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-6 h-6 text-white" strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 flex-1">
                                {trend.title}
                              </h3>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 flex-shrink-0"
                                onClick={(e) => handleDeleteTrend(trend.id, e)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" strokeWidth={1.5} />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={`${status.color} text-xs flex items-center gap-1`}>
                                <StatusIcon className="w-3 h-3" strokeWidth={2} />
                                {status.label}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {trend.selected_reports?.length || 0} 份报告
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
              {format(new Date(trend.created_at), 'yyyy-MM-dd HH:mm')}
                            </p>
                            {trend.status === 'completed' && (
                              <p className="text-xs text-purple-600 mt-1">点击查看详情 →</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
                    <TrendingUp className="w-10 h-10 text-indigo-600" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">暂无趋势分析</h3>
                  <p className="text-sm text-gray-500 mb-6">至少需要5份报告才能创建趋势分析</p>
                  <Button
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full px-6"
                    onClick={handleTrendAnalysisClick}
                    disabled={reports.filter(r => r.status === 'completed').length < 5}
                  >
                    <Plus className="w-5 h-5 mr-2" strokeWidth={2} />
                    创建趋势分析
                  </Button>
                </div>
              )
            ) : (
              <Card className="p-6 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center">
                    <Lock className="w-8 h-8 text-amber-600" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">解锁趋势分析</h3>
                  <p className="text-sm text-gray-700 mb-4">
                    自动汇总最近 5 份报告并给出建议
                  </p>
                  <Button
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full px-8 h-11 font-semibold"
                    onClick={() => navigate(createPageUrl('PlusSubscription'))}
                  >
                    开通 Plus ￥35/月
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}