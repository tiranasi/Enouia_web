export const createPageUrl = (page) => {
  const map = {
    EunoiaHome: '/',
    EunoiaChat: '/chat',
    EunoiaSquare: '/square',
    EunoiaMe: '/me',
    EmotionReportDetail: '/emotion-report-detail',
    Login: '/login',
    Register: '/register',
    PostDetail: '/post-detail',
    Notifications: '/notifications',
    EmotionReports: '/emotion-reports',
    EmotionAnalysis: '/emotion-analysis',
    TrendAnalysisDetail: '/trend-analysis',
    CreateTrendAnalysis: '/create-trend-analysis',
    CourseCenter: '/course-center',
    CourseDetail: '/course-detail',
    CreatePost: '/create-post',
    CreateStyle: '/create-style',
    Favorites: '/favorites',
    Mentions: '/mentions',
    MyPost: '/my-post',
    Replies: '/replies',
    PlusSubscription: '/plus',
  };
  return map[page] || `/${page}`;
};
