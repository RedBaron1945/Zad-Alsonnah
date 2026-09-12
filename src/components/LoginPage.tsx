import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  Sparkles,
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import cleanLogo from '../assets/images/logo-clean.png';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, signInWithAdminEmail } = useAuth();
  const [viewMode, setViewMode] = useState<'main' | 'admin'>('main');

  // Student Google login state
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  // Admin email/password login state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  const handleGoogleLogin = async () => {
    setGoogleError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // On success, onAuthStateChanged in AuthContext will update currentUser and redirect to dashboard
    } catch (err: any) {
      setGoogleError(
        err?.message || 'حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    if (!adminEmail.trim()) {
      setAdminError('يرجى إدخال البريد الإلكتروني للإدارة.');
      return;
    }
    if (!adminPassword) {
      setAdminError('يرجى إدخال كلمة المرور.');
      return;
    }

    setAdminLoading(true);
    try {
      await signInWithAdminEmail(adminEmail, adminPassword);
      // On success, AuthContext updates currentUser/userProfile and navigates to Admin Dashboard
    } catch (err: any) {
      setAdminError(
        err?.message || 'تعذر تسجيل الدخول. تحقق من صحة البريد وكلمة السر.'
      );
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center py-10 sm:py-14 px-4 relative bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#fbf8f2] text-slate-800 selection:bg-blue-100 overflow-hidden">
      {/* Ambient Islamic decorative aura: Sapphire Blue & Golden Amber matching the logo */}
      <div className="absolute -top-24 right-1/2 translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-blue-600/10 via-sky-400/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-80 h-80 bg-amber-400/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-10 -left-20 w-80 h-80 bg-blue-600/8 blur-3xl rounded-full pointer-events-none" />

      {/* Main Centered Login Container */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-xs rounded-3xl shadow-xl shadow-slate-300/40 border border-slate-200/90 text-center transition-all overflow-hidden">
          {/* Top Decorative Gold & Sapphire Gradient Accent Trim */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-blue-600 to-amber-500" />

          {viewMode === 'main' ? (
            /* =================== الشاشة الرئيسية =================== */
            <div className="p-6 sm:p-8">
              {/* 1. Official Photo Display with Transparent Background & Soft Radiant Aura */}
              <div className="relative flex flex-col items-center justify-center mb-3">
                {/* Soft atmospheric radial glow in gold and sapphire blue */}
                <div className="absolute w-44 h-44 bg-gradient-to-tr from-amber-300/20 via-blue-600/15 to-transparent rounded-full blur-2xl pointer-events-none scale-125" />

                <img
                  id="login-photo"
                  src={cleanLogo}
                  alt="شعار البرنامج"
                  className="relative z-10 w-44 sm:w-52 md:w-56 h-auto max-h-60 object-contain mx-auto drop-shadow-xs transition-transform duration-300 hover:scale-[1.02]"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.png';
                  }}
                />
              </div>

              {/* Decorative Program Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-50 to-blue-50 border border-amber-200/80 text-amber-900 text-[11px] font-extrabold mb-2 shadow-2xs">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>برنامج زاد السنة النبوية</span>
              </div>

              {/* 2. Website Name & Subtitle */}
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug mb-5">
                برنامج زاد السنة • تطبيق ومتابعة الأحاديث النبوية الشريفة
              </h1>

              {/* Google Login Error Alert */}
              {googleError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200/80 rounded-2xl text-xs text-red-600 font-bold flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{googleError}</span>
                </div>
              )}

              {/* Actions Area */}
              <div className="space-y-3">
                {/* 1. Primary Button: Google Sign-in for Students */}
                <button
                  id="google-login-btn"
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3.5 py-3 px-5 rounded-2xl bg-white hover:bg-blue-50/40 active:scale-[0.99] border border-slate-300 hover:border-blue-400 text-slate-800 font-bold text-sm sm:text-base shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none"
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600 shrink-0" />
                      <span>جارٍ تسجيل الدخول...</span>
                    </>
                  ) : (
                    <>
                      {/* Official Google Colored G Icon */}
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>المتابعة باستخدام Google</span>
                    </>
                  )}
                </button>

                {/* 2. Admin Login Button (Exact same design and dimensions!) */}
                <button
                  id="admin-login-entry-btn"
                  type="button"
                  onClick={() => {
                    setViewMode('admin');
                    setAdminError('');
                  }}
                  className="w-full flex items-center justify-center gap-3.5 py-3 px-5 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.99] border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-sm sm:text-base shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <span>تسجيل دخول الإدارة</span>
                </button>

                <p className="text-[11px] text-slate-500 font-medium pt-1">
                  تسجيل الدخول يتم مباشرة وبأمان عبر حسابك في Google
                </p>
              </div>
            </div>
          ) : (
            /* =================== صفحة تسجيل دخول الإدارة =================== */
            <div className="p-6 sm:p-8 text-right">
              {/* Back Button and Header */}
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                <button
                  type="button"
                  id="back-to-main-btn"
                  onClick={() => setViewMode('main')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-100"
                >
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                  <span>العودة للرئيسية</span>
                </button>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-extrabold">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>بوابة المشرفين والإدارة</span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
                  <Shield className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-black text-slate-900">
                  تسجيل دخول الإدارة
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  أدخل البريد الإلكتروني وكلمة المرور للولوج إلى لوحة الإدارة ومتابعة الطلاب
                </p>
              </div>

              {/* Admin Error Alert */}
              {adminError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200/80 rounded-xl text-xs text-red-600 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{adminError}</span>
                </div>
              )}

              {/* Admin Email & Password Form */}
              <form onSubmit={handleAdminLogin} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="admin-email-input"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    البريد الإلكتروني للإدارة
                  </label>
                  <div className="relative">
                    <input
                      id="admin-email-input"
                      type="email"
                      dir="ltr"
                      autoFocus
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@naseem.sa"
                      disabled={adminLoading}
                      required
                      className="w-full pr-3.5 pl-10 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all font-sans"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="admin-password-input"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <input
                      id="admin-password-input"
                      type={showPassword ? 'text' : 'password'}
                      dir="ltr"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={adminLoading}
                      required
                      className="w-full pr-3.5 pl-10 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  id="admin-submit-btn"
                  type="submit"
                  disabled={adminLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-slate-900 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none mt-2"
                >
                  {adminLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                      <span>جارٍ تسجيل الدخول...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>تسجيل الدخول للإدارة</span>
                    </>
                  )}
                </button>

                {/* Cancel link */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('main')}
                    className="text-xs text-slate-500 hover:text-slate-700 font-medium underline underline-offset-4 cursor-pointer"
                  >
                    إلغاء والعودة لتسجيل دخول الطلاب
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Subtle Footer Caption & Cloud Status */}
        <div className="text-center mt-5 flex flex-col items-center justify-center gap-2">
          <div className="text-xs text-slate-600 font-bold flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>برنامج زاد السنة • تطبيق ومتابعة الأحاديث النبوية الشريفة</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 border border-blue-200/90 text-[11px] text-slate-700 shadow-2xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span>توثيق الهوية عبر <span className="font-bold text-slate-900">Firebase Authentication</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};
