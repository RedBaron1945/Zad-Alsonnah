import React, { useState, useEffect, useMemo } from 'react';
import {
  getProgramWeekInfo,
  getAllProgramWeeks,
  getCurrentProgramWeekNumber,
  getDefaultSelectedDate,
  getTodayISO,
  formatArabicDateFull,
  formatHijriFull,
  formatHijriShort,
  formatHijriRange,
  WeekInfo,
} from '../lib/weekDateUtils';
import {
  PROGRAM_START_DATE,
  PROGRAM_END_DATE,
  PROGRAM_DURATION_DAYS,
  PROGRAM_DURATION_WEEKS,
  DailyHadith,
} from '../types';
import {
  getDailyHadithsForDate,
  addDailyHadith,
  updateDailyHadith,
  deleteDailyHadith,
  ensureWeekDatesSeeded,
} from '../lib/dailyHadithService';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Edit2,
  Trash2,
  BookOpen,
  RotateCcw,
  Check,
  AlertCircle,
} from 'lucide-react';

export const AdminDailyHadithsManager: React.FC = () => {
  const allWeeks = useMemo(() => getAllProgramWeeks(), []);
  const currentActiveWeek = useMemo(() => getCurrentProgramWeekNumber(), []);
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number>(currentActiveWeek);
  const weekInfo: WeekInfo = useMemo(
    () => getProgramWeekInfo(selectedWeekNumber),
    [selectedWeekNumber]
  );

  const todayISO = useMemo(() => getTodayISO(), []);
  const initialDateStr = useMemo(() => getDefaultSelectedDate(), []);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(initialDateStr);

  const [hadiths, setHadiths] = useState<DailyHadith[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal states for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHadith, setEditingHadith] = useState<DailyHadith | null>(null);

  // Form inputs
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formSource, setFormSource] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formOrder, setFormOrder] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Handle week selection
  const handleSelectWeek = (weekNum: number) => {
    const clamped = Math.max(1, Math.min(PROGRAM_DURATION_WEEKS, weekNum));
    setSelectedWeekNumber(clamped);
    const targetWeek = getProgramWeekInfo(clamped);
    if (!targetWeek.days.some((d) => d.dateStr === selectedDateStr)) {
      setSelectedDateStr(targetWeek.days[0].dateStr);
    }
  };

  // Jump to Current / Default Date
  const handleJumpToToday = () => {
    const activeW = getCurrentProgramWeekNumber();
    setSelectedWeekNumber(activeW);
    setSelectedDateStr(getDefaultSelectedDate());
  };

  // Selected day object
  const selectedDayInfo = useMemo(() => {
    return (
      weekInfo.days.find((d) => d.dateStr === selectedDateStr) ||
      weekInfo.days[0]
    );
  }, [weekInfo, selectedDateStr]);

  // Ensure current week dates exist in Firestore if completely empty
  useEffect(() => {
    const dates = weekInfo.days.map((d) => d.dateStr);
    ensureWeekDatesSeeded(dates).catch((e) =>
      console.warn('Seeding check in admin:', e)
    );
  }, [weekInfo]);

  // Load hadiths for the selected date
  const loadHadiths = async () => {
    setLoading(true);
    try {
      const data = await getDailyHadithsForDate(selectedDateStr);
      setHadiths(data);
    } catch (err) {
      console.error('Error loading hadiths:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHadiths();
  }, [selectedDateStr]);

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingHadith(null);
    setFormTitle('');
    setFormContent('');
    setFormSource('');
    setFormCategory('تطبيقات السنة النبوية');
    setFormOrder(hadiths.length + 1);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (hadith: DailyHadith) => {
    setEditingHadith(hadith);
    setFormTitle(hadith.title);
    setFormContent(hadith.content);
    setFormSource(hadith.source || '');
    setFormCategory(hadith.category || 'تطبيقات السنة النبوية');
    setFormOrder(hadith.order ?? 1);
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit Add or Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      setFormError('يرجى إدخال عنوان الحديث ونصه');
      return;
    }

    setIsSaving(true);
    setFormError('');
    try {
      if (editingHadith) {
        // Update existing
        const updates = {
          date: editingHadith.date || selectedDateStr,
          dayName: editingHadith.dayName || selectedDayInfo?.dayName || '',
          title: formTitle.trim(),
          content: formContent.trim(),
          source: formSource.trim() || 'حديث شريف',
          category: formCategory.trim() || 'تطبيقات السنة النبوية',
          order: Number(formOrder) || 1,
        };
        await updateDailyHadith(editingHadith.id, updates);
        setHadiths((prev) =>
          prev.map((h) => (h.id === editingHadith.id ? { ...h, ...updates } : h))
        );
      } else {
        // Add new
        const newHadith = {
          date: selectedDateStr,
          dayName: selectedDayInfo?.dayName || '',
          title: formTitle.trim(),
          content: formContent.trim(),
          source: formSource.trim() || 'حديث شريف',
          category: formCategory.trim() || 'تطبيقات السنة النبوية',
          order: Number(formOrder) || hadiths.length + 1,
        };
        const created = await addDailyHadith(newHadith);
        setHadiths((prev) => [...prev, created]);
      }

      setIsModalOpen(false);
      // Background refresh from Firestore
      loadHadiths().catch(() => {});
    } catch (err: any) {
      console.error('Error saving hadith:', err);
      const code = err?.code || '';
      const msg = err?.message || '';
      if (code === 'permission-denied' || msg.includes('permission')) {
        setFormError('تعذر الحفظ: رفض الفايربيز العملية بسبب نقص الصلاحية (Permission Denied). يرجى التأكد من تحديث Rules الفايربيز إلى القواعد المعتمدة.');
      } else {
        setFormError(msg ? `تعذر حفظ الحديث: ${msg}` : 'تعذر حفظ الحديث، يرجى المحاولة لاحقاً');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Delete hadith
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف حديث "${title}"؟`)) return;
    try {
      await deleteDailyHadith(id);
      setHadiths((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error('Error deleting hadith:', err);
      alert('تعذر حذف الحديث، يرجى المحاولة لاحقاً');
    }
  };

  return (
    <div className="space-y-6">
      {/* 0. Header: جدول البرنامج المعتمد */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          جدول البرنامج المعتمد
        </h2>

        {/* Quick Week Select Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="adminWeekSelect" className="text-xs font-bold text-slate-600 whitespace-nowrap">
            اختر الأسبوع:
          </label>
          <select
            id="adminWeekSelect"
            value={selectedWeekNumber}
            onChange={(e) => handleSelectWeek(Number(e.target.value))}
            className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold py-2 px-3 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
          >
            {allWeeks.map((w) => (
              <option key={w.weekNumber} value={w.weekNumber} className="bg-white text-slate-900">
                الأسبوع {w.weekNumber}: {w.formattedHijriRange} {w.isCurrentWeek ? '• الأسبوع الحالي' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. Week & Date Selection Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-base sm:text-lg font-black text-slate-800">
              {weekInfo.weekLabel}
            </h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {weekInfo.formattedHijriRange}
            </span>
            {weekInfo.isCurrentWeek && (
              <span className="text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                الأسبوع النشط
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectWeek(selectedWeekNumber - 1)}
              disabled={selectedWeekNumber <= 1}
              className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
              <span>الأسبوع السابق</span>
            </button>

            {selectedWeekNumber !== currentActiveWeek && (
              <button
                type="button"
                onClick={handleJumpToToday}
                className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-all cursor-pointer border border-blue-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>الأسبوع الحالي</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSelectWeek(selectedWeekNumber + 1)}
              disabled={selectedWeekNumber >= PROGRAM_DURATION_WEEKS}
              className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <span>الأسبوع القادم</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5 Days Grid (السبت إلى الأربعاء) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {weekInfo.days.map((day) => {
            const isSelected = day.dateStr === selectedDateStr;
            const isToday = day.isToday;
            const isLaunchDay = day.dateStr === PROGRAM_START_DATE;

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => setSelectedDateStr(day.dateStr)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all cursor-pointer text-center relative border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25 scale-[1.02]'
                    : isToday
                    ? 'bg-amber-50 text-slate-800 border-amber-300 hover:border-blue-400'
                    : isLaunchDay
                    ? 'bg-blue-50/70 text-slate-800 border-blue-200 hover:bg-blue-50'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                {isToday ? (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-md mb-1 ${
                      isSelected
                        ? 'bg-white text-blue-700'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    اليوم
                  </span>
                ) : isLaunchDay ? (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-md mb-1 ${
                      isSelected
                        ? 'bg-white text-blue-700'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    البداية
                  </span>
                ) : null}
                <span className="font-black text-sm">{day.dayName}</span>
                <span
                  className={`text-xs font-semibold mt-1 ${
                    isSelected ? 'text-blue-100' : 'text-slate-600'
                  }`}
                >
                  {day.formattedHijriShort}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Hadiths for Selected Day */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="text-xs font-bold text-slate-400 mb-0.5">
              {selectedDayInfo?.formattedHijriFull || formatHijriFull(selectedDateStr)}
            </div>
            <h3 className="text-lg font-black text-slate-800">
              أحاديث وتطبيقات: {selectedDayInfo?.dayName} • اليوم {selectedDayInfo?.programDayNumber} من {PROGRAM_DURATION_DAYS}
            </h3>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة حديث جديد لهذا اليوم</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-xs font-bold">
              جارٍ تحميل أحاديث هذا اليوم من قاعدة البيانات...
            </p>
          </div>
        ) : hadiths.length === 0 ? (
          <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700 mb-1">
              لم تتم إضافة أي أحاديث لهذا اليوم بعد
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              يمكنك إضافة حديث أو ذكر أو سنة نبوية ليظهر للطلاب في هذا اليوم
              المحدد.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="py-2 px-4 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-xl border border-blue-200 transition-colors cursor-pointer"
            >
              + إضافة أول حديث
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {hadiths.map((hadith, index) => (
              <div
                key={hadith.id}
                className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                        {index + 1}
                      </span>
                      <h4 className="text-base font-black text-slate-800">
                        {hadith.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(hadith)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                        title="تعديل الحديث"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(hadith.id, hadith.title)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                        title="حذف الحديث"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200/60 my-2">
                    <p className="text-slate-800 text-sm font-['Amiri',serif] leading-relaxed font-bold">
                      {hadith.content}
                    </p>
                  </div>

                  {hadith.source && (
                    <div className="text-[11px] font-bold text-slate-500 mt-1">
                      التخريج: {hadith.source}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Add / Edit Hadith Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 text-right">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base sm:text-lg font-black text-slate-800">
                {editingHadith ? 'تعديل الحديث النبوي' : 'إضافة حديث أو تطبيق جديد'}
              </h3>
              <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg">
                يوم {selectedDayInfo?.dayName} ({selectedDateStr})
              </span>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان الحديث أو التطبيق *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: ذكر ما بعد الوضوء، دعاء دخول المسجد"
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-slate-50 focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نص الحديث الشريف أو الذكر أو الدعاء *
                </label>
                <textarea
                  rows={4}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="اكتب نص الحديث النبوي الشريف كاملاً أو الذكر المأثور..."
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-slate-50 focus:bg-white text-slate-800 font-['Amiri',serif] leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    التخريج (اختياري)
                  </label>
                  <input
                    type="text"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    placeholder="مثال: صحيح مسلم، صحيح البخاري"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-slate-50 focus:bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ترتيب الحديث في اليوم
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-slate-50 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-600/20 disabled:opacity-60"
                >
                  {isSaving ? 'جارٍ الحفظ في Firestore...' : 'حفظ الحديث'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
