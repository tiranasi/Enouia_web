import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@/index.css';

// Pages (will be copied in next step)
import EunoiaHome from '@/Pages/EunoiaHome';
import EunoiaChat from '@/Pages/EunoiaChat';
import EunoiaSquare from '@/Pages/EunoiaSquare';
import PostDetail from '@/Pages/PostDetail';
import EmotionReports from '@/Pages/EmotionReports';
import EmotionAnalysis from '@/Pages/EmotionAnalysis';
import EmotionReportDetail from '@/Pages/EmotionReportDetail';
import TrendAnalysisDetail from '@/Pages/TrendAnalysisDetail';
import Replies from '@/Pages/Replies';
import CreateTrendAnalysis from '@/Pages/CreateTrendAnalysis';
import CourseCenter from '@/Pages/CourseCenter';
import CourseDetail from '@/Pages/CourseDetail';
import PlusSubscription from '@/Pages/PlusSubscription';
import Notifications from '@/Pages/Notifications';
import Favorites from '@/Pages/Favorites';
import Mentions from '@/Pages/Mentions';
import MyPost from '@/Pages/MyPost';
import EditProfile from '@/Pages/EditProfile';
import CreatePost from '@/Pages/CreatePost';
import CreateStyle from '@/Pages/CreateStyle';
import EunoiaMe from '@/Pages/EunoiaMe';
import Login from '@/Pages/Login';
import Register from '@/Pages/Register';
import Drafts from '@/Pages/Drafts';

const qc = new QueryClient();

function RequireAuth({ children }) {
  const token = (() => { try { return localStorage.getItem('token'); } catch { return null; } })();
  if (!token) return <Login />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={<RequireAuth><EunoiaHome /></RequireAuth>} />
      <Route path="/chat" element={<RequireAuth><EunoiaChat /></RequireAuth>} />
      <Route path="/square" element={<RequireAuth><EunoiaSquare /></RequireAuth>} />
      <Route path="/post-detail" element={<RequireAuth><PostDetail /></RequireAuth>} />
      <Route path="/emotion-reports" element={<RequireAuth><EmotionReports /></RequireAuth>} />
      <Route path="/emotion-analysis" element={<RequireAuth><EmotionAnalysis /></RequireAuth>} />
      <Route path="/emotion-report-detail" element={<RequireAuth><EmotionReportDetail /></RequireAuth>} />
      <Route path="/trend-analysis" element={<RequireAuth><TrendAnalysisDetail /></RequireAuth>} />
      <Route path="/replies" element={<RequireAuth><Replies /></RequireAuth>} />
      <Route path="/create-trend-analysis" element={<RequireAuth><CreateTrendAnalysis /></RequireAuth>} />
      <Route path="/course-center" element={<RequireAuth><CourseCenter /></RequireAuth>} />
      <Route path="/course-detail" element={<RequireAuth><CourseDetail /></RequireAuth>} />
      <Route path="/plus" element={<RequireAuth><PlusSubscription /></RequireAuth>} />
      <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
      <Route path="/favorites" element={<RequireAuth><Favorites /></RequireAuth>} />
      <Route path="/mentions" element={<RequireAuth><Mentions /></RequireAuth>} />
      <Route path="/my-post" element={<RequireAuth><MyPost /></RequireAuth>} />
      <Route path="/edit-profile" element={<RequireAuth><EditProfile /></RequireAuth>} />
      <Route path="/EditProfile" element={<RequireAuth><EditProfile /></RequireAuth>} />
      <Route path="/create-post" element={<RequireAuth><CreatePost /></RequireAuth>} />
      <Route path="/create-style" element={<RequireAuth><CreateStyle /></RequireAuth>} />
      <Route path="/me" element={<RequireAuth><EunoiaMe /></RequireAuth>} />
      <Route path="/drafts" element={<RequireAuth><Drafts /></RequireAuth>} />
      <Route path="/Drafts" element={<RequireAuth><Drafts /></RequireAuth>} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

