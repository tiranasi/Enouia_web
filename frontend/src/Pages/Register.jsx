import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) { alert('请输入邮箱和密码'); return; }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      alert('注册成功，请登录');
      navigate(createPageUrl('Login'));
    } catch (e) {
      alert(e.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Card className="p-6 rounded-3xl shadow-sm border-0">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-teal-500 mx-auto mb-3 flex items-center justify-center text-white text-xl">E</div>
            <h1 className="text-xl font-bold text-gray-900">注册</h1>
            <p className="text-sm text-gray-500 mt-1">创建你的账号</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">邮箱</label>
              <input className="w-full rounded-2xl border border-gray-200 h-11 px-3 bg-gray-50 focus:bg-white" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">密码</label>
              <input type="password" className="w-full rounded-2xl border border-gray-200 h-11 px-3 bg-gray-50 focus:bg-white" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" />
            </div>
            <Button className="w-full h-11 rounded-2xl bg-teal-500 hover:bg-teal-600 mt-2" onClick={handleSubmit} disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              已有账号？<Link to={createPageUrl('Login')} className="text-teal-600">返回登录</Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

