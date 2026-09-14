import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TakweenLogo } from './TakweenLogo';
import {
  CheckCircle2,
  Edit3,
  AlertCircle,
  Loader2,
  ShieldCheck,
  LogOut,
  Info,
} from 'lucide-react';
import {
  validateAndNormalizeArabicName,
  isArabicFullNameValid,
} from '../lib/nameValidation';

export const StudentNameModal: React.FC = () => {
  const { currentUser, userProfile, confirmStudentName, signOut } = useAuth();

  // Determine initial name to suggest
  const rawInitialName = (
    userProfile?.name && userProfile.name !== 'طالب علم'
      ? userProfile.name
      : currentUser?.displayName && !currentUser.displayName.includes('@')
      ? currentUser.displayName
      : ''
  ).trim();

  // If initial name is already a valid Arabic full name, allow single-click confirmation
  const isInitialValid = isArabicFullNameValid(rawInitialName);

  // States
  const [isEditing, setIsEditing] = useState(!isInitialValid);
  const [inputName, setInputName] = useState(rawInitialName);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  // Handle direct confirmation of the current valid name
  const handleConfirmCurrentName = async () => {
    setValidationError('');
    const validation = validateAndNormalizeArabicName(rawInitialName);
    if (!validation.isValid) {
      setValidationError(validation.error || 'يرجى تعديل الاسم وتصحيحه');
      setIsEditing(true);
      return;
    }

    setSubmitting(true);
    try {
      await confirmStudentName(validation.normalizedName);
      setSuccessToast(true);
    } catch (err: any) {
      setValidationError(err?.message || 'تعذر تأكيد الاسم، يرجى المحاولة ثانية');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle submitting edited/new name
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const validation = validateAndNormalizeArabicName(inputName);
    if (!validation.isValid) {
      setValidationError(validation.error || 'الاسم غير مطابق للمواصفات المطلوبة');
      return;
    }

    setSubmitting(true);
    try {
      await confirmStudentName(validation.normalizedName);
      setSuccessToast(true);
    } catch (err: any) {
      setValidationError(err?.message || 'تعذر حفظ وتأكيد الاسم، يرجى المحاولة ثانية');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="name-confirmation-title"
    >
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200/80 text-right my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="shrink-0 mb-3">
            <TakweenLogo size="lg" showText={false} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>تأكيد بيانات الطالب • خطوة إلزامية لمرة واحدة</span>
          </div>
          <h2
            id="name-confirmation-title"
            className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight"
          >
            حيّاك الله نورتنا في برنامج زاد السنة!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-md">
            فضلًا اكتب وتأكد من اسمك الثلاثي والكريم باللغة العربية؛ ليُعتمد رسمياً في
            إصدار الشهادات وسجلات الإنجاز اليومية، ولا يمكن تعديله لاحقاً إلا عبر إدارة البرنامج.
          </p>
        </div>

        {/* Success Alert */}
        {successToast ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
            <p className="text-base font-black text-emerald-900">
              تم تأكيد الاسم بنجاح!
            </p>
            <p className="text-xs font-medium text-emerald-700">
              جاري توجيهك إلى لوحة المتابعة اليومية...
            </p>
          </div>
        ) : (
          <>
            {/* View Mode: Confirm existing Arabic full name */}
            {!isEditing && rawInitialName && isInitialValid ? (
              <div className="space-y-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="block text-xs font-bold text-slate-500 mb-1.5">
                    الاسم الحالي المسجل:
                  </span>
                  <div className="text-lg sm:text-xl font-black text-slate-900 py-1">
                    {rawInitialName}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>مطابق لشروط الأسماء العربية</span>
                  </div>
                </div>

                {validationError && (
                  <div className="flex items-start gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}

                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmCurrentName}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-sm font-bold rounded-2xl transition-all cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>جارٍ تأكيد الاسم...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تأكيد هذا الاسم والمتابعة</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setInputName(rawInitialName);
                      setValidationError('');
                    }}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-2xl transition-all cursor-pointer border border-slate-200"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>تعديل أو تصحيح الاسم قبل التأكيد</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Edit Mode: Enter or fix the name */
              <form onSubmit={handleSubmitEdit} className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                    اكتب اسمك الثلاثي والكريم باللغة العربية:
                  </label>
                  <input
                    type="text"
                    value={inputName}
                    onChange={(e) => {
                      setInputName(e.target.value);
                      if (validationError) setValidationError('');
                    }}
                    placeholder="مثال: عبد الرحمن بن فهد الشمري"
                    dir="rtl"
                    autoFocus
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900 text-sm sm:text-base font-bold bg-slate-50 focus:bg-white text-right transition-all"
                  />
                </div>

                {/* Validation Guidelines */}
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-blue-900 text-xs space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-blue-950">
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>شروط الاسم المعتمد:</span>
                  </div>
                  <ul className="space-y-1 text-slate-600 text-[11px] pr-5 list-disc leading-relaxed">
                    <li>يُكتب بالأحرف العربية فقط دون أحرف إنجليزية أو رموز.</li>
                    <li>لا يحتوي على أرقام أو إيموجي أو علامات ترقيم خاصة.</li>
                    <li>الاسم كامل (ثلاثي أو ثنائي على الأقل) بدون اختصارات بحرف مفرد.</li>
                  </ul>
                </div>

                {validationError && (
                  <div className="flex items-start gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}

                <div className="space-y-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={submitting || !inputName.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm font-bold rounded-2xl transition-all cursor-pointer shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>جارٍ حفظ وتأكيد الاسم...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تأكيد وحفظ الاسم نهائياً</span>
                      </>
                    )}
                  </button>

                  {rawInitialName && isInitialValid && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setValidationError('');
                      }}
                      disabled={submitting}
                      className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer"
                    >
                      الرجوع للاسم المسجل ({rawInitialName})
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Account Switcher / Sign Out */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="truncate max-w-[200px]" dir="ltr">
                {currentUser?.email}
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-red-600 font-bold transition-colors cursor-pointer"
                title="تسجيل الخروج والتبديل إلى حساب آخر"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تبديل الحساب / خروج</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
