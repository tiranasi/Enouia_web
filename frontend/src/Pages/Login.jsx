import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import logo from '@/pic/ENOUIA.png';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    try {
      if (localStorage.getItem('token')) {
        navigate(createPageUrl('EunoiaHome'));
      }
    } catch (_) {}
  }, [navigate]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { alert('请输入邮箱和密码'); return; }
    try {
      await base44.auth.login({ email, password });
      navigate(createPageUrl('EunoiaHome'));
    } catch (e) {
      alert(e.message || '登录失败');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/60 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Card className="p-6 rounded-3xl shadow-sm border-0">
          <div className="text-center mb-6">
            <img src={logo} alt="Eunoia" className="w-12 h-12 rounded-3xl mx-auto mb-3 object-contain bg-white" />
            <h1 className="text-xl font-bold text-gray-900">欢迎使用 Eunoia</h1>
            <p className="text-sm text-gray-500 mt-1">和懂你的角色聊心事，让心轻一点</p>
            <p className="text-xs text-gray-600 mt-1">Open up to the characters you love—feel a little lighter</p>
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
            <Button className="w-full h-11 rounded-2xl bg-teal-500 hover:bg-teal-600 mt-2" onClick={handleLogin}>登录</Button>
            <p className="text-xs text-gray-500 text-center">还没有账号？<Link to={createPageUrl('Register')} className="text-teal-600">前往注册</Link></p>
          </div>
        </Card>
        <p className="text-center text-xs text-gray-500 mt-4">ENT207 Class2 Group5</p>
      </div>
    </div>
  );
}
