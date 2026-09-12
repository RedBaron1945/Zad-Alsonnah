import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TakweenLogo } from './TakweenLogo';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';

export const StudentNameModal: React.FC = () => {
  const { currentUser, completeStudentName } = useAuth();
  const [name, setName] = useState(
    currentUser?.displayName && !currentUser.displayName.includes('@')
      ? currentUser.displayName
      : ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('يرجى كتابة اسمك للمتابعة');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await completeStudentName(cleanName);
    } catch {
      setError('تعذر حفظ الاسم، يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-xl border border-slate-100 text-center">
        <div className="flex justify-center mb-3">
          <TakweenLogo size="lg" showText={false} />
        </div>

        <h2 className="text-xl font-black text-slate-800 mt-2 mb-1">
          ما اسمك؟
        </h2>
        <p className="text-xs text-slate-500 mb-6 font-medium">
          يرجى كتابة اسمك ليتم تسجيل إنجازاتك اليومية باسمك
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اكتب اسمك هنا..."
              dir="rtl"
              autoFocus
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-800 text-sm font-medium bg-slate-50 focus:bg-white text-center transition-all"
            />
          </div>

          {error && (
            <div className="text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded-xl border border-red-200 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none text-white text-sm font-bold rounded-2xl transition-all cursor-pointer shadow-md shadow-blue-600/20"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-white" />
                <span>جارٍ الحفظ...</span>
              </>
            ) : (
              <>
                <span>متابعة</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
