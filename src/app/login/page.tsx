'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // For demo purposes, accept any credentials
      // In production, this would use Supabase auth
      // const { user, error } = await signIn(email, password);
      
      // Simulate login delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 
                    flex items-center justify-center p-4">
      {/* Login Card */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in">
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 
                            bg-gradient-to-br from-pink-500 to-purple-500 
                            rounded-2xl shadow-lg shadow-purple-500/30 mb-4">
              <span className="text-3xl font-bold text-white">Q</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Quarion Dashboard</h1>
            <p className="text-gray-500 mt-2">ระบบจัดการรายรับ-รายจ่าย</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 
                            rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                อีเมล
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                           focus:border-purple-500 transition-all"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                             focus:border-purple-500 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 
                             hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300 text-purple-500 
                             focus:ring-purple-500/20"
                />
                <span className="text-gray-600">จดจำฉัน</span>
              </label>
              <a href="#" className="text-purple-500 hover:text-purple-600 transition-colors">
                ลืมรหัสผ่าน?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 
                         text-white font-semibold rounded-xl shadow-lg 
                         shadow-purple-500/25 hover:shadow-purple-500/40 
                         hover:scale-[1.02] transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>กำลังเข้าสู่ระบบ...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>เข้าสู่ระบบ</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500 mb-3">บัญชีทดสอบ</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => { setEmail('owner@demo.com'); setPassword('demo123'); }}
                className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => { setEmail('admin@demo.com'); setPassword('demo123'); }}
                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => { setEmail('viewer@demo.com'); setPassword('demo123'); }}
                className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Viewer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
