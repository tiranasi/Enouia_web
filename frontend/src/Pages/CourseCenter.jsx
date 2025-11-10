import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function CourseCenter() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list(),
    initialData: [],
  });

  const isPlusUser = user?.subscription_tier === 'plus';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white pb-8">
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
            <h1 className="text-xl font-bold text-gray-900">课程中心</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {courses.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="rounded-2xl shadow-sm border-0 overflow-hidden cursor-pointer hover:shadow-md transition-all"
                onClick={() => navigate(createPageUrl('CourseDetail') + '?id=' + course.id)}
              >
                <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
                  {course.cover_image ? (
                    <img src={course.cover_image} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      📚
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-blue-500 text-white text-xs">合作</Badge>
                  </div>
                  {isPlusUser && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-amber-500 text-white text-xs">9折</Badge>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    与{course.partner_name}合作
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600">
                      {course.total_lessons}节课程
                    </span>
                    <span className="text-sm font-bold text-orange-600">
                      ￥{isPlusUser ? (course.price * course.plus_discount).toFixed(0) : course.price}
                    </span>
                  </div>
                  <Badge variant="outline" className="w-full justify-center text-xs bg-teal-50 text-teal-700 border-teal-200">
                    试看 {isPlusUser ? course.plus_trial_lessons : course.free_trial_lessons} 节
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-blue-600" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">课程即将上线</h3>
            <p className="text-sm text-gray-500">敬请期待更多优质心理课程</p>
          </div>
        )}
      </div>
    </div>
  );
}