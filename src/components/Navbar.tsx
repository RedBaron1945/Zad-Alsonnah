import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isAdminUser } from '../lib/firebase';
import { LogOut, Edit3, Check, X, Shield, Loader2 } from 'lucide-react';
import { TakweenLogo } from './TakweenLogo';

interface NavbarProps {
  onAdminViewChange?: (view: 'dashboard' | 'students' | 'hadiths') => void;
  currentAdminView?: 'dashboard' | 'students' | 'hadiths';
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { currentUser, userProfile, updateProfileName, signOut } = useAuth();
  const isAdmin = isAdminUser(currentUser?.uid);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

  const handleStartEditName = () => {
    setEditNameValue(userProfile?.name || '');
    setNameError('');
    setIsEditingName(true);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNameValue.trim()) {
      setNameError('الرجاء كتابة اسم صحيح');
      return;
    }
    try {
      setIsSavingName(true);
      await updateProfileName(editNameValue.trim());
      setIsEditingName(false);
    } catch (err: any) {
      console.error('Failed to update name in Navbar:', err);
      setNameError(err?.message || 'تعذر حفظ الاسم، يرجى المحاولة ثانية');
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <TakweenLogo size="md" showText={false} />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base md:text-lg leading-snug text-gray-900">
                برنامج زاد السنة لتكوين النسيم
              </h1>
              <span className="text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap border bg-blue-50 text-blue-700 border-blue-200">
                متابعة التطبيقات
              </span>
            </div>
          </div>

          {/* User Info & Actions */}
          {userProfile && (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Profile Card / Name */}
              <div className="flex items-center gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {userProfile.name ? userProfile.name.charAt(0) : 'ط'}
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col text-right">
                    <span className="max-w-[110px] sm:max-w-[150px] truncate text-gray-900 font-bold text-xs sm:text-sm">
                      {userProfile.name || 'طالب علم'}
                    </span>
                    {isAdmin ? (
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" />
                        إدارة البرنامج
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-500 font-medium">
                        طالب بالبرنامج
                      </span>
                    )}
                  </div>

                  {/* Edit Name Button (Strictly for admin; students cannot edit after confirmation) */}
                  {isAdmin && (
                    <button
                      onClick={handleStartEditName}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="تعديل اسم المشرف"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={() => signOut()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer border border-gray-200 hover:border-red-200"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Edit Student / User Name Modal */}
      {isEditingName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-6 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                تعديل الاسم الشخصي
              </h3>
              <button
                onClick={() => setIsEditingName(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              اكتب اسمك الثلاثي أو الاسم الذي ترغب بأن يظهر في كشوفات وسجلات إنجاز برنامج زاد السنة لتكوين النسيم:
            </p>

            <form onSubmit={handleSaveName} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  placeholder="مثال: عبد الرحمن بن فهد الشمري"
                  dir="rtl"
                  autoFocus
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900 font-medium"
                />
                {nameError && (
                  <p className="text-xs text-red-600 font-bold mt-1.5">{nameError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingName}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                >
                  {isSavingName ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-white" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>حفظ الاسم</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
