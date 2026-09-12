import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getProgramWeekInfo,
  getAllProgramWeeks,
  getCurrentProgramWeekNumber,
  getDefaultSelectedDate,
  getTodayISO,
  formatArabicDateFull,
  formatHijriFull,
  formatHijriShort,
  isDayLockedForStudent,
  DayInfo,
  WeekInfo,
} from '../lib/weekDateUtils';
import {
  PROGRAM_START_DATE,
  PROGRAM_END_DATE,
  PROGRAM_DURATION_DAYS,
  PROGRAM_DURATION_WEEKS,
  PROGRAM_STUDY_DAYS,
  PROGRAM_TOTAL_HADITHS,
  DailyHadith,
  DailyProgress,
} from '../types';
import {
  getDailyHadithsForDate,
  getStudentHadithCompletionsForDate,
  setHadithCompletion,
  ensureWeekDatesSeeded,
} from '../lib/dailyHadithService';
import { getStudentAllProgress } from '../lib/dataService';
import { evaluateStudentBadges } from '../lib/badgeService';
import { triggerCelebrationConfetti, triggerFireworksConfetti } from '../lib/confettiService';
import { BadgesSection } from './BadgesSection';
import {
  CheckCircle2,
  Check,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Award,
  BookOpen,
  Edit3,
  Flame,
  Info,
  Lock,
  LockKeyhole,
  PartyPopper,
  Target,
  Layers,
  Loader2,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { userProfile, updateProfileName } = useAuth();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'hadiths' | 'badges'>('hadiths');

  // Program schedule: weeks starting Saturday September 5, 2026
  const currentActiveWeek = useMemo(() => getCurrentProgramWeekNumber(), []);
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number>(currentActiveWeek);
  const currentWeekInfo: WeekInfo = useMemo(
    () => getProgramWeekInfo(selectedWeekNumber),
    [selectedWeekNumber]
  );

  // Selected date ISO string (defaults to Sept 5, 2026 if today is before start)
  const todayISO = useMemo(() => getTodayISO(), []);
  const initialDateStr = useMemo(() => getDefaultSelectedDate(), []);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(initialDateStr);

  // Daily Hadiths state for the selected day
  const [hadiths, setHadiths] = useState<DailyHadith[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [loadingHadiths, setLoadingHadiths] = useState<boolean>(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Overall progress / history for streaks and badges
  const [allHistory, setAllHistory] = useState<DailyProgress[]>([]);

  // Name editing modal/state
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

  // Selected day object from week
  const selectedDayInfo = useMemo(() => {
    return (
      currentWeekInfo.days.find((d) => d.dateStr === selectedDateStr) ||
      currentWeekInfo.days[0]
    );
  }, [currentWeekInfo, selectedDateStr]);

  // Initial load: ensure current week's dates are seeded in Firestore if empty
  useEffect(() => {
    const dates = currentWeekInfo.days.map((d) => d.dateStr);
    ensureWeekDatesSeeded(dates).catch((err) =>
      console.warn('Seeding check:', err)
    );
  }, [currentWeekInfo]);

  // Load hadiths and student completion whenever selectedDateStr or user changes
  useEffect(() => {
    let isMounted = true;
    async function loadDayData() {
      if (!userProfile) return;
      try {
        setLoadingHadiths(true);
        const [dayHadiths, dayCompletions, history] = await Promise.all([
          getDailyHadithsForDate(selectedDateStr),
          getStudentHadithCompletionsForDate(userProfile.uid, selectedDateStr),
          getStudentAllProgress(userProfile.uid),
        ]);

        if (isMounted) {
          setHadiths(dayHadiths);
          setCompletions(dayCompletions);
          setAllHistory(history);
        }
      } catch (err) {
        console.error('Error loading daily hadiths:', err);
      } finally {
        if (isMounted) setLoadingHadiths(false);
      }
    }

    loadDayData();
    return () => {
      isMounted = false;
    };
  }, [selectedDateStr, userProfile]);

  // Handle marking a hadith as completed / uncompleted
  const handleToggleCompletion = async (
    hadith: DailyHadith,
    e?: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (!userProfile || savingId) return;
    const currentVal = !!completions[hadith.id];
    const newVal = !currentVal;

    // Optimistic UI update
    setCompletions((prev) => ({ ...prev, [hadith.id]: newVal }));
    setSavingId(hadith.id);

    // Whenever confirming application (newVal === true) -> trigger celebratory fireworks!
    if (newVal) {
      let clickOrigin: { x: number; y: number } | undefined;
      if (e) {
        clickOrigin = {
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight,
        };
      }
      triggerFireworksConfetti(clickOrigin);

      // If student just completed the final uncompleted hadith of the day -> also trigger celebration!
      const willBeCompletedCount = hadiths.filter(
        (h) => (h.id === hadith.id ? true : !!completions[h.id])
      ).length;
      if (willBeCompletedCount === hadiths.length && hadiths.length > 0) {
        setTimeout(() => {
          triggerCelebrationConfetti();
        }, 350);
      }
    }

    try {
      await setHadithCompletion(
        userProfile.uid,
        hadith.id,
        selectedDateStr,
        newVal,
        userProfile.name
      );

      // Refresh history in background to keep stats in sync
      getStudentAllProgress(userProfile.uid).then(setAllHistory).catch(() => {});
    } catch (err) {
      console.error('Error updating completion:', err);
      // Revert optimistic update
      setCompletions((prev) => ({ ...prev, [hadith.id]: currentVal }));
    } finally {
      setSavingId(null);
    }
  };

  // Change week and preserve or choose first day of week
  const handleSelectWeek = (weekNum: number) => {
    const clamped = Math.max(1, Math.min(PROGRAM_DURATION_WEEKS, weekNum));
    setSelectedWeekNumber(clamped);
    const targetWeek = getProgramWeekInfo(clamped);
    if (!targetWeek.days.some((d) => d.dateStr === selectedDateStr)) {
      setSelectedDateStr(targetWeek.days[0].dateStr);
    }
  };

  // Jump back to Today or Program Start
  const handleJumpToToday = () => {
    const activeW = getCurrentProgramWeekNumber();
    setSelectedWeekNumber(activeW);
    setSelectedDateStr(getDefaultSelectedDate());
  };

  // Track which weeks are expanded: default is ONLY current active week
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>(() => ({
    [currentActiveWeek]: true,
  }));

  // Week display mode: 'all-weeks' (show all with collapsible cards) or 'current-only' (focus mode)
  const [weekDisplayMode, setWeekDisplayMode] = useState<'all-weeks' | 'current-only'>('all-weeks');

  // Compute stats and status for all 9 weeks
  const allProgramWeeks = useMemo(() => getAllProgramWeeks(), []);

  const weekStats = useMemo(() => {
    return allProgramWeeks.map((week) => {
      const weekDates = new Set(week.days.map((d) => d.dateStr));
      const completedInWeek = allHistory.filter(
        (h) => h.completed && weekDates.has(h.date)
      ).length;
      const totalHadithsInWeek = week.days.length * 2;
      const isCompleted = completedInWeek >= totalHadithsInWeek && totalHadithsInWeek > 0;
      const isCurrent = week.weekNumber === currentActiveWeek;
      const isPast = week.weekNumber < currentActiveWeek;
      const isFuture = week.weekNumber > currentActiveWeek;

      return {
        week,
        completedInWeek,
        totalHadithsInWeek,
        isCompleted,
        isCurrent,
        isPast,
        isFuture,
      };
    });
  }, [allProgramWeeks, allHistory, currentActiveWeek]);

  // Check if all weeks are expanded
  const allWeeksAreExpanded = useMemo(() => {
    return allProgramWeeks.every((w) => !!expandedWeeks[w.weekNumber]);
  }, [allProgramWeeks, expandedWeeks]);

  // Toggle a week's expansion
  const handleToggleWeek = (weekNum: number) => {
    setExpandedWeeks((prev) => {
      const isCurrentlyOpen = !!prev[weekNum];
      if (!isCurrentlyOpen) {
        // When expanding this week, also select it
        setSelectedWeekNumber(weekNum);
        const targetWeek = getProgramWeekInfo(weekNum);
        if (!targetWeek.days.some((d) => d.dateStr === selectedDateStr)) {
          setSelectedDateStr(targetWeek.days[0].dateStr);
        }
        return { ...prev, [weekNum]: true };
      }
      return { ...prev, [weekNum]: false };
    });
  };

  // Focus on current week: collapse others, expand active week, jump to today/default
  const handleFocusCurrentWeek = () => {
    setExpandedWeeks({ [currentActiveWeek]: true });
    setSelectedWeekNumber(currentActiveWeek);
    setSelectedDateStr(getDefaultSelectedDate());
  };

  // Toggle all weeks expanded / collapsed
  const handleToggleAllWeeks = (expand: boolean) => {
    const updated: Record<number, boolean> = {};
    for (let w = 1; w <= PROGRAM_DURATION_WEEKS; w++) {
      updated[w] = expand;
    }
    setExpandedWeeks(updated);
    if (expand && !expandedWeeks[selectedWeekNumber]) {
      handleSelectWeek(currentActiveWeek);
    }
  };

  // Select day in a specific week
  const handleSelectDayInWeek = (weekNum: number, dateStr: string) => {
    setSelectedWeekNumber(weekNum);
    setSelectedDateStr(dateStr);
    // Ensure this week is expanded
    setExpandedWeeks((prev) => ({ ...prev, [weekNum]: true }));
  };

  // Check if a day has 2 completed hadiths
  const isDayFullyCompleted = (dateStr: string) => {
    return allHistory.filter((h) => h.date === dateStr && h.completed).length >= 2;
  };

  const isTodaySelected = selectedDateStr === todayISO;
  const totalCompletedCount = allHistory.filter((h) => h.completed).length;
  const completedTodayCount = hadiths.filter((h) => completions[h.id]).length;
  const todayCompletedAll = hadiths.length > 0 && completedTodayCount === hadiths.length;

  // Calculate Badges & Streaks
  const badges = useMemo(() => {
    return evaluateStudentBadges(allHistory, todayCompletedAll, todayISO).badges;
  }, [allHistory, todayCompletedAll, todayISO]);

  // Handle saving student name
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setNameError('يرجى إدخال اسم صحيح');
      return;
    }
    setSavingName(true);
    setNameError('');
    try {
      await updateProfileName(nameInput.trim());
      setIsEditingName(false);
    } catch (err) {
      setNameError('تعذر تحديث الاسم، يرجى المحاولة لاحقاً');
    } finally {
      setSavingName(false);
    }
  };

  // Helper to render the daily hadith tasks content for the active selected day
  const renderDailyHadithsArea = () => {
    return (
      <div className="space-y-4 pt-4 border-t border-slate-200/80">
        {/* Day Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-xs font-extrabold border border-blue-400/30">
                {selectedDayInfo?.isLocked
                  ? '🔒 يوم مقفل'
                  : isTodaySelected
                  ? 'محتوى اليوم'
                  : selectedDateStr === PROGRAM_START_DATE
                  ? 'انطلاق البرنامج'
                  : 'عرض اليوم المحدد'}
              </span>
              <span className="text-xs text-slate-300 font-bold">
                {selectedDayInfo?.formattedHijriFull || formatHijriFull(selectedDateStr)}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              {selectedDayInfo?.dayName} • اليوم {selectedDayInfo?.programDayNumber} من {PROGRAM_DURATION_DAYS}
            </h3>
            <p className="text-xs text-blue-200 font-medium mt-1">
              المقرر: حديثان نبويان شريفان للتطبيق العملي اليومي
            </p>
          </div>

          {!selectedDayInfo?.isLocked && hadiths.length > 0 && (
            <div className="bg-white/10 backdrop-blur-xs px-4 py-2 rounded-2xl border border-white/15 text-xs font-bold text-slate-100">
              تم إنجاز {completedTodayCount} من أصل {hadiths.length} حديث
            </div>
          )}
        </div>

        {/* Visual Celebration Confetti Banner upon 100% daily completion */}
        {!selectedDayInfo?.isLocked && todayCompletedAll && hadiths.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-5 sm:p-6 shadow-md shadow-emerald-600/20 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-black flex items-center gap-2">
                <span>هنيئاً لك إنجاز كافة سنن وتطبيقات اليوم!</span>
                <span className="text-xl">🎉</span>
              </h4>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                تقبل الله طاعتكم وكتب أجركم، وثبتكم على سنة المصطفى ﷺ
              </p>
            </div>
          </div>
        )}

        {/* CONDITIONAL RENDERING: LOCKED DAY STATE vs UNLOCKED DAY HADITHS */}
        {selectedDayInfo?.isLocked ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-amber-200/80 shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-black">
                <Lock className="w-3.5 h-3.5" />
                <span>هذا اليوم مقفل حالياً</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-black text-slate-800">
                يفتح هذا اليوم بمشيئة الله تعالى في موعده
              </h4>
              <div className="pt-1">
                <span className="text-sm font-bold text-blue-700 bg-blue-50/80 py-2 px-4 rounded-xl border border-blue-100 inline-block">
                  موعد الفتح: {selectedDayInfo?.formattedHijriFull || formatHijriFull(selectedDateStr)}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed pt-2">
                تم إغلاق الأيام القادمة لتعزيز التركيز على إتقان وتطبيق سنن اليوم الحاضر خطوة بخطوة، وعدم استباق الأيام حتى تثبت السنة في القلب والعمل، تطبيقاً لقوله ﷺ: «أَحَبُّ الأَعْمَالِ إِلَى اللهِ أَدْوَمُهَا وَإِنْ قَلَّ».
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleJumpToToday}
                className="inline-flex items-center gap-2 py-2.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-blue-600/20"
              >
                <RotateCcw className="w-4 h-4" />
                <span>العودة إلى اليوم المتاح حالياً</span>
              </button>
            </div>
          </div>
        ) : loadingHadiths ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-xs font-bold">
              جارٍ تحميل الأحاديث المقررة لهذا اليوم...
            </p>
          </div>
        ) : hadiths.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700 mb-1">
              لا توجد أحاديث مسجلة لهذا اليوم بعد
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              يقوم مشرف البرنامج بإضافة وتعيين الأحاديث النبوية والتطبيقات
              لكل يوم. ستظهر الأحاديث هنا تلقائياً بمجرد إضافتها.
            </p>
          </div>
        ) : (
          hadiths.map((hadith, index) => {
            const isCompleted = !!completions[hadith.id];
            const isSavingThis = savingId === hadith.id;

            return (
              <div
                key={hadith.id}
                className={`bg-white rounded-3xl p-6 sm:p-7 border transition-all duration-200 shadow-sm ${
                  isCompleted
                    ? 'border-emerald-300/80 bg-emerald-50/15'
                    : 'border-slate-200/90 hover:border-blue-300'
                }`}
              >
                {/* Top Row: Index Badge & Title */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-black flex items-center justify-center">
                    {index + 1}
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-slate-800">
                    {hadith.title}
                  </h4>
                </div>

                {/* Hadith Matn / Content */}
                <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-100 mb-4">
                  <p className="text-slate-800 text-sm sm:text-base font-['Amiri',serif] leading-loose text-justify font-bold">
                    {hadith.content}
                  </p>
                </div>

                {/* Bottom Action: Toggle Completion & Hadith Source */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-emerald-700 font-black">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>تم التطبيق بنجاح</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400 font-medium">
                        <Clock className="w-4 h-4" />
                        <span>لم يتم التطبيق بعد</span>
                      </span>
                    )}

                    {hadith.source && (
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                        {hadith.source}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleToggleCompletion(hadith, e)}
                    disabled={isSavingThis}
                    className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs ${
                      isCompleted
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-[0.99]'
                        : 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 active:scale-[0.99]'
                    } disabled:opacity-60`}
                  >
                    {isSavingThis ? (
                      <span>جارٍ الحفظ...</span>
                    ) : isCompleted ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>✓ تم التطبيق</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4" />
                        <span>اضغط لتأكيد التطبيق</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Student Welcome & Profile Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20 shrink-0">
            {userProfile?.name?.charAt(0) || 'ط'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-800">
                مرحباً، {userProfile?.name || 'طالب العلم'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setNameInput(userProfile?.name || '');
                  setIsEditingName(true);
                }}
                className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                title="تعديل الاسم"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              داوم على تطبيق السنن النبوية اليومية لتثبيت العمل ونيل الأجر
            </p>
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
          <div className="bg-blue-50/80 border border-blue-100/80 px-4 py-2 rounded-2xl text-center">
            <span className="block text-[11px] font-bold text-blue-800">
              إجمالي التطبيقات
            </span>
            <span className="text-base font-black text-blue-900">
              {totalCompletedCount}
            </span>
          </div>

          <div className="bg-amber-50/80 border border-amber-100/80 px-4 py-2 rounded-2xl text-center">
            <span className="block text-[11px] font-bold text-amber-800">
              مكتمل اليوم
            </span>
            <span className="text-base font-black text-amber-900">
              {hadiths.length > 0
                ? `${completedTodayCount} / ${hadiths.length}`
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation: Hadiths vs Badges */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('hadiths')}
          className={`flex items-center gap-2 py-2.5 px-5 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'hadiths'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>تطبيق الأحاديث والسنن</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('badges')}
          className={`flex items-center gap-2 py-2.5 px-5 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'badges'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>الأوسمة والمواظبة</span>
        </button>
      </div>

      {activeTab === 'badges' ? (
        <BadgesSection badges={badges} />
      ) : (
        <div className="space-y-6">
          {/* ══════════════════════════════════════════════════════════════
              WEEK SCHEDULE CONTROLS & OVERVIEW BAR
             ══════════════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-row items-center justify-between gap-3 overflow-x-auto">
            <div className="shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-800 whitespace-nowrap">
                  جدول الأسابيع و التطبيقات
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Focus on Current Week button */}
              <button
                type="button"
                onClick={handleFocusCurrentWeek}
                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                title="التركيز على الأسبوع النشط وطَي باقي الأسابيع"
              >
                <Target className="w-3.5 h-3.5 text-blue-600" />
                <span>الأسبوع الحالي ({currentActiveWeek})</span>
              </button>

              {/* View Mode Toggle: Current Week Only vs All Weeks */}
              <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-2xl border border-slate-200/80 text-xs font-bold whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => setWeekDisplayMode('current-only')}
                  className={`py-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
                    weekDisplayMode === 'current-only'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  الحالي فقط
                </button>
                <button
                  type="button"
                  onClick={() => setWeekDisplayMode('all-weeks')}
                  className={`py-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
                    weekDisplayMode === 'all-weeks'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  كافة الأسابيع (9)
                </button>
              </div>

              {/* Toggle All Expand/Collapse button if in all-weeks mode */}
              {weekDisplayMode === 'all-weeks' && (
                <button
                  type="button"
                  onClick={() => handleToggleAllWeeks(!allWeeksAreExpanded)}
                  className="py-1.5 px-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                >
                  {allWeeksAreExpanded ? 'طَي الكل' : 'توسيع الكل'}
                </button>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              WEEKS ACCORDION LIST
             ══════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            {(weekDisplayMode === 'current-only'
              ? weekStats.filter((ws) => ws.week.weekNumber === currentActiveWeek)
              : weekStats
            ).map((stat) => {
              const weekNum = stat.week.weekNumber;
              const isExpanded = !!expandedWeeks[weekNum] || weekDisplayMode === 'current-only';
              const isSelectedWeek = selectedWeekNumber === weekNum;
              const isCurrentWeek = stat.isCurrent;

              return (
                <div
                  key={weekNum}
                  className={`rounded-3xl border transition-all overflow-hidden ${
                    isCurrentWeek
                      ? 'bg-white border-blue-300 shadow-sm ring-1 ring-blue-500/20'
                      : 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  {/* Week Header Row / Clickable Accordion Toggle */}
                  <div
                    onClick={() => handleToggleWeek(weekNum)}
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 cursor-pointer select-none transition-colors ${
                      isExpanded
                        ? 'bg-slate-50/70 border-b border-slate-100'
                        : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Week Number Badge */}
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                          isCurrentWeek
                            ? 'bg-blue-600 text-white shadow-blue-600/25'
                            : stat.isCompleted
                            ? 'bg-emerald-600 text-white shadow-emerald-600/25'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {weekNum}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-slate-800">
                            {stat.week.weekLabel}
                          </h3>

                          {isCurrentWeek && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-black">
                              الأسبوع الحالي (النشط)
                            </span>
                          )}

                          {stat.isCompleted ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>مكتمل 10/10</span>
                            </span>
                          ) : stat.isPast ? (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                              أسبوع سابق
                            </span>
                          ) : stat.isFuture ? (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold">
                              أسبوع قادم
                            </span>
                          ) : null}
                        </div>

                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {stat.week.formattedHijriRange} • {stat.week.formattedRange}
                        </p>
                      </div>
                    </div>

                    {/* Right side: Progress badge & Expand/Collapse button */}
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                        أُنجز {stat.completedInWeek} من {stat.totalHadithsInWeek} حديث
                      </span>

                      <button
                        type="button"
                        className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                          isExpanded
                            ? 'bg-slate-200/80 text-slate-800'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                        }`}
                      >
                        <span>{isExpanded ? 'طَي الأسبوع' : 'توسيع وجدول المهام'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content: 5 Study Days Grid + Selected Day Hadiths */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 space-y-6">
                      {/* Notice if week display mode is current-only */}
                      {weekDisplayMode === 'current-only' && (
                        <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-center justify-between gap-2 text-xs">
                          <span className="text-blue-800 font-medium">
                            وضع التركيز مفعّل: يتم عرض الأسبوع النشط فقط لتقليل ازدحام المعلومات
                          </span>
                          <button
                            type="button"
                            onClick={() => setWeekDisplayMode('all-weeks')}
                            className="text-blue-700 font-bold hover:underline shrink-0"
                          >
                            استعراض كافة الأسابيع (9)
                          </button>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-black text-slate-600">
                            أيام الدراسة والمدارسة (السبت - الأربعاء):
                          </h4>
                          <span className="text-[11px] text-slate-400 font-medium">
                            انقر على أي يوم لاستعراض الأحاديث وتأكيد التطبيق
                          </span>
                        </div>

                        {/* 5 Days Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                          {stat.week.days.map((day) => {
                            const isSelected =
                              isSelectedWeek && day.dateStr === selectedDateStr;
                            const isToday = day.isToday;
                            const isLaunchDay = day.dateStr === PROGRAM_START_DATE;
                            const isLocked = day.isLocked;
                            const isDayDone = isDayFullyCompleted(day.dateStr);

                            return (
                              <button
                                key={day.dateStr}
                                type="button"
                                onClick={() =>
                                  handleSelectDayInWeek(weekNum, day.dateStr)
                                }
                                className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all cursor-pointer text-center relative border ${
                                  isSelected
                                    ? isLocked
                                      ? 'bg-slate-800 text-white border-slate-700 shadow-md scale-[1.02]'
                                      : 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25 scale-[1.02]'
                                    : isLocked
                                    ? 'bg-slate-50/70 text-slate-500 border-slate-200/60 hover:bg-slate-100 hover:border-slate-300'
                                    : isToday
                                    ? 'bg-amber-50/80 text-slate-800 border-amber-300 hover:border-blue-400'
                                    : isDayDone
                                    ? 'bg-emerald-50/70 text-slate-800 border-emerald-300 hover:border-emerald-400'
                                    : isLaunchDay
                                    ? 'bg-blue-50/60 text-slate-800 border-blue-200 hover:bg-blue-50'
                                    : 'bg-slate-50/80 text-slate-700 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                                }`}
                              >
                                {/* Status Badge */}
                                {isLocked ? (
                                  <span
                                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-md mb-1 flex items-center gap-0.5 ${
                                      isSelected
                                        ? 'bg-amber-400 text-slate-950'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                    title="هذا اليوم مقفل حتى يحين موعده"
                                  >
                                    <Lock className="w-2.5 h-2.5" />
                                    <span>مقفل</span>
                                  </span>
                                ) : isToday ? (
                                  <span
                                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-md mb-1 ${
                                      isSelected
                                        ? 'bg-white text-blue-700'
                                        : 'bg-amber-500 text-white'
                                    }`}
                                  >
                                    اليوم
                                  </span>
                                ) : isDayDone ? (
                                  <span
                                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-md mb-1 flex items-center gap-0.5 ${
                                      isSelected
                                        ? 'bg-white text-emerald-700'
                                        : 'bg-emerald-500 text-white'
                                    }`}
                                  >
                                    <Check className="w-2.5 h-2.5" />
                                    <span>مكتمل</span>
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
                                ) : (
                                  <span className="text-[9px] font-medium text-emerald-600 mb-1 flex items-center gap-0.5">
                                    <Check className="w-2.5 h-2.5" />
                                    <span>متاح</span>
                                  </span>
                                )}

                                <span className="font-black text-sm tracking-tight flex items-center gap-1">
                                  {day.dayName}
                                  {isLocked && (
                                    <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                                  )}
                                </span>
                                <span
                                  className={`text-xs font-bold mt-1 ${
                                    isSelected
                                      ? isLocked
                                        ? 'text-slate-300'
                                        : 'text-blue-100'
                                      : 'text-slate-600'
                                  }`}
                                >
                                  {day.formattedHijriShort}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Daily Hadiths Area for the Selected Day in this Week */}
                      {isSelectedWeek && renderDailyHadithsArea()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Student Name Modal */}
      {isEditingName && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-100 text-right">
            <h3 className="text-lg font-black text-slate-800 mb-1">
              تعديل اسم الطالب
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              اكتب اسمك الكريم ليظهر في سجلات وإحصائيات البرنامج
            </p>

            <form onSubmit={handleSaveName} className="space-y-4">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="اكتب اسمك هنا..."
                dir="rtl"
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-sm font-medium"
              />

              {nameError && (
                <div className="text-xs text-red-600 font-bold bg-red-50 p-2 rounded-lg">
                  {nameError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingName}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none"
                >
                  {savingName ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-white" />
                      <span>جارٍ الحفظ...</span>
                    </>
                  ) : (
                    <span>حفظ الاسم</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
