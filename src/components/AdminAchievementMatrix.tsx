import React, { useState, useMemo } from 'react';
import { StudentStats, PROGRAM_DURATION_DAYS, PROGRAM_DURATION_WEEKS } from '../types';
import {
  getAllProgramWeeks,
  getProgramWeekInfo,
  getCurrentProgramWeekNumber,
  WeekInfo,
  DayInfo,
  formatArabicDateFull,
  formatHijriFull,
  formatHijriShort,
  formatHijriRange,
} from '../lib/weekDateUtils';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Award,
  Users,
  Flame,
  FileSpreadsheet,
  ArrowUpDown,
  Filter,
  Eye,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';

interface AdminAchievementMatrixProps {
  students: StudentStats[];
  onSelectStudent: (student: StudentStats) => void;
}

// Program Month / Phase definition
interface MonthPhase {
  id: 'month_1' | 'month_2' | 'phase_3' | 'all';
  name: string;
  subtitle: string;
  weekNumbers: number[];
  totalDays: number;
}

const MONTH_PHASES: MonthPhase[] = [
  {
    id: 'month_1',
    name: 'الشهر الأول (الأسابيع 1 - 4)',
    subtitle: '12 سبتمبر - 7 أكتوبر 2026 • 20 يوماً (40 حديثاً)',
    weekNumbers: [1, 2, 3, 4],
    totalDays: 20,
  },
  {
    id: 'month_2',
    name: 'الشهر الثاني (الأسابيع 5 - 8)',
    subtitle: '10 أكتوبر - 4 نوفمبر 2026 • 20 يوماً (40 حديثاً)',
    weekNumbers: [5, 6, 7, 8],
    totalDays: 20,
  },
  {
    id: 'phase_3',
    name: 'الأسبوع الختامي (الأسبوع 9)',
    subtitle: '7 نوفمبر - 11 نوفمبر 2026 • 5 أيام (10 أحاديث)',
    weekNumbers: [9],
    totalDays: 5,
  },
  {
    id: 'all',
    name: 'كامل مسار البرنامج (9 أسابيع)',
    subtitle: '12 سبتمبر - 11 نوفمبر 2026 • 45 يوماً (90 حديثاً)',
    weekNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    totalDays: PROGRAM_DURATION_DAYS,
  },
];

export const AdminAchievementMatrix: React.FC<AdminAchievementMatrixProps> = ({
  students,
  onSelectStudent,
}) => {
  const allWeeks = useMemo(() => getAllProgramWeeks(), []);
  const activeCurrentWeekNum = useMemo(() => getCurrentProgramWeekNumber(), []);

  // View modes: 'weekly' (day-by-day table for selected week) | 'monthly' (week-by-week table for selected month) | 'all_weeks' (11 weeks table)
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly' | 'all_weeks'>('weekly');
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(activeCurrentWeekNum);
  const [selectedPhaseId, setSelectedPhaseId] = useState<'month_1' | 'month_2' | 'phase_3' | 'all'>('month_1');
  const [searchQuery, setSearchQuery] = useState('');
  const [completionFilter, setCompletionFilter] = useState<'all' | 'complete' | 'incomplete' | 'missed'>('all');

  const currentWeek = useMemo(
    () => getProgramWeekInfo(selectedWeekNum),
    [selectedWeekNum]
  );

  const currentPhase = useMemo(
    () => MONTH_PHASES.find((p) => p.id === selectedPhaseId) || MONTH_PHASES[0],
    [selectedPhaseId]
  );

  // Filter students
  const filteredStudents = useMemo(() => {
    let result = students;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.user.name.toLowerCase().includes(q) ||
          (s.user.email && s.user.email.toLowerCase().includes(q))
      );
    }

    if (completionFilter === 'complete') {
      if (viewMode === 'weekly') {
        const weekDates = new Set(currentWeek.days.map((d) => d.dateStr));
        result = result.filter((s) => {
          const records = s.recentRecords || [];
          const completedDates = new Set(records.filter((r) => r.completed).map((r) => r.date));
          let count = 0;
          weekDates.forEach((dt) => {
            if (completedDates.has(dt)) count++;
          });
          return count === 5;
        });
      } else {
        result = result.filter((s) => s.completionRate >= 80);
      }
    } else if (completionFilter === 'incomplete') {
      if (viewMode === 'weekly') {
        const weekDates = new Set(currentWeek.days.map((d) => d.dateStr));
        result = result.filter((s) => {
          const records = s.recentRecords || [];
          const completedDates = new Set(records.filter((r) => r.completed).map((r) => r.date));
          let count = 0;
          weekDates.forEach((dt) => {
            if (completedDates.has(dt)) count++;
          });
          return count < 5;
        });
      } else {
        result = result.filter((s) => s.completionRate < 80);
      }
    } else if (completionFilter === 'missed') {
      // Students who missed at least one day that has ended (shows 'X')
      if (viewMode === 'weekly') {
        const pastDates = currentWeek.days.filter((d) => d.isPast).map((d) => d.dateStr);
        result = result.filter((s) => {
          const records = s.recentRecords || [];
          const completedDates = new Set(records.filter((r) => r.completed).map((r) => r.date));
          return pastDates.some((dt) => !completedDates.has(dt));
        });
      } else {
        // Across all weeks, find students who have uncompleted past days
        const allPastDays = allWeeks
          .flatMap((w) => w.days)
          .filter((d) => d.isPast)
          .map((d) => d.dateStr);
        result = result.filter((s) => {
          const records = s.recentRecords || [];
          const completedDates = new Set(records.filter((r) => r.completed).map((r) => r.date));
          return allPastDays.some((dt) => !completedDates.has(dt));
        });
      }
    }

    return result;
  }, [students, searchQuery, completionFilter, viewMode, currentWeek]);

  // Quick statistics for current weekly view
  const weekStats = useMemo(() => {
    const weekDates = new Set(currentWeek.days.map((d) => d.dateStr));
    let perfectStudentsCount = 0;
    let totalCompletedDaysInWeek = 0;

    students.forEach((s) => {
      const records = s.recentRecords || [];
      const completedDates = new Set(records.filter((r) => r.completed).map((r) => r.date));
      let count = 0;
      weekDates.forEach((dt) => {
        if (completedDates.has(dt)) count++;
      });
      if (count === 5) perfectStudentsCount++;
      totalCompletedDaysInWeek += count;
    });

    const maxPossible = students.length * 5;
    const averageWeekRate =
      maxPossible > 0 ? Math.round((totalCompletedDaysInWeek / maxPossible) * 100) : 0;

    return {
      perfectStudentsCount,
      averageWeekRate,
      totalCompletedDaysInWeek,
    };
  }, [students, currentWeek]);

  // Helper to compute a student's completion on a specific date
  const getStudentDateStatus = (student: StudentStats, dateStr: string) => {
    const records = (student.recentRecords || []).filter(
      (r) => r.date === dateStr && r.completed
    );
    return {
      completed: records.length > 0,
      count: records.length,
    };
  };

  // Helper to compute a student's completion count and percentage for a specific week number
  const getStudentWeekProgress = (student: StudentStats, weekNumber: number) => {
    const wInfo = getProgramWeekInfo(weekNumber);
    const weekDates = new Set(wInfo.days.map((d) => d.dateStr));
    const records = student.recentRecords || [];
    const completedDates = new Set(records.filter((r) => r.completed).map((r) => r.date));

    let completedDays = 0;
    let totalHadiths = 0;

    records.forEach((r) => {
      if (r.completed && weekDates.has(r.date)) {
        totalHadiths++;
      }
    });

    weekDates.forEach((dt) => {
      if (completedDates.has(dt)) completedDays++;
    });

    const percentage = Math.round((completedDays / 5) * 100);
    return {
      completedDays,
      totalHadiths,
      percentage,
      isPerfect: completedDays === 5,
    };
  };

  // Helper to compute a student's progress in a phase/month
  const getStudentPhaseProgress = (student: StudentStats, phase: MonthPhase) => {
    let completedDaysTotal = 0;
    phase.weekNumbers.forEach((wNum) => {
      const { completedDays } = getStudentWeekProgress(student, wNum);
      completedDaysTotal += completedDays;
    });
    const percentage = Math.min(
      100,
      Math.round((completedDaysTotal / phase.totalDays) * 100)
    );
    return {
      completedDaysTotal,
      percentage,
    };
  };

  return (
    <div className="space-y-6">
      {/* View Mode Tabs & Filter Header */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-gray-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-gray-900">
                مصفوفة إنجاز الطلاب التفصيلية
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                متابعة فردية دقيقة
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              عرض إنجاز كل طالب باليوم والأسبوع والشهر طوال الـ {PROGRAM_DURATION_DAYS} يوماً المقررة للبرنامج ({PROGRAM_DURATION_WEEKS} أسابيع • 90 حديثاً)
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200/80 self-start lg:self-auto">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'weekly'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              جدول أسبوعي (يوم بيوم)
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'monthly'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              جدول شهري (مراحل البرنامج)
            </button>
            <button
              onClick={() => setViewMode('all_weeks')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'all_weeks'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              كامل الـ {PROGRAM_DURATION_WEEKS} أسابيع
            </button>
          </div>
        </div>

        {/* Sub-Header Controls */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Week or Month Selection */}
          {viewMode === 'weekly' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1">
                <button
                  onClick={() => setSelectedWeekNum((prev) => Math.max(1, prev - 1))}
                  disabled={selectedWeekNum <= 1}
                  className="p-1 rounded-lg hover:bg-gray-200/70 text-gray-700 disabled:opacity-30 cursor-pointer"
                  title="الأسبوع السابق"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <select
                  value={selectedWeekNum}
                  onChange={(e) => setSelectedWeekNum(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-gray-900 py-1 px-1.5 focus:outline-hidden cursor-pointer"
                >
                  {allWeeks.map((w) => (
                    <option key={w.weekNumber} value={w.weekNumber}>
                      {w.weekLabel} • {w.formattedHijriRange}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setSelectedWeekNum((prev) => Math.min(PROGRAM_DURATION_WEEKS, prev + 1))}
                  disabled={selectedWeekNum >= PROGRAM_DURATION_WEEKS}
                  className="p-1 rounded-lg hover:bg-gray-200/70 text-gray-700 disabled:opacity-30 cursor-pointer"
                  title="الأسبوع التالي"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {selectedWeekNum !== activeCurrentWeekNum && (
                <button
                  onClick={() => setSelectedWeekNum(activeCurrentWeekNum)}
                  className="px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all cursor-pointer"
                >
                  الأسبوع الحالي
                </button>
              )}

              <span className="text-xs font-semibold text-gray-500 hidden sm:inline">
                من السبت {currentWeek.days[0]?.formattedHijriShort} إلى الأربعاء {currentWeek.days[currentWeek.days.length - 1]?.formattedHijriShort}
              </span>
            </div>
          )}

          {viewMode === 'monthly' && (
            <div className="flex flex-wrap items-center gap-2">
              {MONTH_PHASES.map((phase) => (
                <button
                  key={phase.id}
                  onClick={() => setSelectedPhaseId(phase.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedPhaseId === phase.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {phase.name}
                </button>
              ))}
            </div>
          )}

          {viewMode === 'all_weeks' && (
            <div className="text-xs font-bold text-gray-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>مصفوفة الـ {PROGRAM_DURATION_WEEKS} أسابيع ({PROGRAM_DURATION_DAYS} يوماً) كاملة لكافة الطلاب</span>
            </div>
          )}

          {/* Search Input and Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-60">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم الطالب..."
                className="w-full pr-8 pl-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            <select
              value={completionFilter}
              onChange={(e) => setCompletionFilter(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 rounded-xl px-2.5 py-1.5 focus:outline-hidden cursor-pointer"
            >
              <option value="all">كل الحالات</option>
              <option value="complete">المكتملون</option>
              <option value="incomplete">بحاجة متابعة</option>
              <option value="missed">فاتهم أيام (علامة ×)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metric Cards for the chosen view */}
      {viewMode === 'weekly' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 text-xs font-bold mb-1">
              <span>طلاب الأسبوع</span>
              <Users className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-xl font-black text-gray-900">{students.length}</div>
            <p className="text-[11px] text-gray-400">طالب مسجل في البرنامج</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 text-xs font-bold mb-1">
              <span>أتموا الأسبوع 100%</span>
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-xl font-black text-emerald-700">
              {weekStats.perfectStudentsCount}
            </div>
            <p className="text-[11px] text-gray-400">طالب أتموا الـ 5 أيام كاملة</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 text-xs font-bold mb-1">
              <span>متوسط إنجاز الأسبوع</span>
              <Award className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-xl font-black text-blue-700">{weekStats.averageWeekRate}%</div>
            <p className="text-[11px] text-gray-400">من إجمالي أيام الأسبوع</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 text-xs font-bold mb-1">
              <span>أيام الأسبوع المقررة</span>
              <Calendar className="w-3.5 h-3.5 text-gray-600" />
            </div>
            <div className="text-xl font-black text-gray-900">5 أيام</div>
            <p className="text-[11px] text-gray-400">من السبت إلى الأربعاء</p>
          </div>
        </div>
      )}

      {/* VIEW 1: WEEKLY DAY-BY-DAY TABLE */}
      {viewMode === 'weekly' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-sm font-black text-gray-900">
                {currentWeek.weekLabel} • {currentWeek.formattedHijriRange}
              </span>
              <p className="text-xs text-gray-500">
                إنجاز كل طالب بالأيام الخمسة (السبت - الأربعاء)
              </p>
            </div>
            <span className="text-xs font-bold text-gray-500">
              عدد الطلاب المعروضين: {filteredStudents.length}
            </span>
          </div>

          {/* Status Indicators Legend */}
          <div className="px-4 py-2.5 bg-gray-50/90 border-b border-gray-200 flex flex-wrap items-center gap-4 text-[11px] font-bold text-gray-600">
            <span className="text-gray-400 font-medium">دليل الرموز:</span>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </span>
              <span>أنجز التطبيق</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
                <X className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
              </span>
              <span className="text-rose-700">لم ينجز (انتهى اليوم ودخل يوم جديد)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3 h-3 text-amber-600" />
              </span>
              <span>اليوم الحالي (قيد الإنجاز)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block text-gray-400 font-mono text-xs w-5 text-center">—</span>
              <span className="text-gray-400">يوم قادم لم يحن وقته</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-gray-100/70 text-gray-600 font-bold border-b border-gray-200">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-4 min-w-[180px]">اسم الطالب</th>
                  {currentWeek.days.map((day) => (
                    <th key={day.dateStr} className="py-3 px-2.5 text-center min-w-[70px]">
                      <div className="font-bold text-gray-900">{day.dayName}</div>
                      <div className="text-[10px] text-gray-500 font-normal">
                        {day.formattedHijriShort}
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center min-w-[90px]">الأيام المنجزة</th>
                  <th className="py-3 px-3 text-center min-w-[120px]">نسبة الأسبوع</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">حالة الأسبوع</th>
                  <th className="py-3 px-3 text-center w-24">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-gray-400">
                      لا يوجد طلاب مطابقون لمعايير البحث الحالية
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => {
                    const weekProg = getStudentWeekProgress(student, selectedWeekNum);

                    return (
                      <tr
                        key={student.user.uid}
                        className="hover:bg-blue-50/40 transition-colors"
                      >
                        {/* Index */}
                        <td className="py-3 px-3 text-center text-gray-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>

                        {/* Student Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                              {student.user.name ? student.user.name[0] : 'ط'}
                            </div>
                            <div className="truncate">
                              <button
                                onClick={() => onSelectStudent(student)}
                                className="font-extrabold text-gray-900 hover:text-blue-600 truncate text-right block text-xs cursor-pointer"
                              >
                                {student.user.name}
                              </button>
                              <span className="text-[10px] text-gray-400 block font-mono truncate">
                                {student.user.email || 'بدون بريد'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 5 Days of the Week (Saturday to Wednesday) */}
                        {currentWeek.days.map((day) => {
                          const status = getStudentDateStatus(student, day.dateStr);

                          return (
                            <td
                              key={day.dateStr}
                              className="py-2.5 px-2 text-center"
                              title={`${student.user.name} • ${day.formattedHijriFull || day.formattedFull}: ${
                                status.completed
                                  ? `مكتمل (${status.count} تطبيق)`
                                  : day.isPast
                                  ? 'لم ينجز وانتهى اليوم (علامة ×)'
                                  : day.isToday
                                  ? 'اليوم الحالي (قيد الإنجاز)'
                                  : 'لم يحن وقته بعد'
                              }`}
                            >
                              {status.completed ? (
                                <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100/90 text-emerald-800 border border-emerald-300 font-bold shadow-2xs">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                </div>
                              ) : day.isPast ? (
                                <div
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 font-bold shadow-2xs"
                                  title="لم ينجز في هذا اليوم وانتهى موعده (علامة ×)"
                                >
                                  <X className="w-4 h-4 text-rose-600 stroke-[2.5]" />
                                </div>
                              ) : day.isToday ? (
                                <div
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs"
                                  title="اليوم الحالي - قيد الإنجاز (لم ينتهِ اليوم بعد)"
                                >
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                </div>
                              ) : (
                                <span className="inline-block text-gray-300 font-mono text-sm">
                                  —
                                </span>
                              )}
                            </td>
                          );
                        })}

                        {/* Completed Days Count */}
                        <td className="py-3 px-3 text-center">
                          <span className="font-extrabold text-gray-900">
                            {weekProg.completedDays}{' '}
                            <span className="text-gray-400 text-[10px]">/ 5</span>
                          </span>
                        </td>

                        {/* Week Percentage */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 justify-center">
                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  weekProg.percentage === 100
                                    ? 'bg-emerald-500'
                                    : weekProg.percentage >= 50
                                    ? 'bg-blue-600'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${Math.max(4, weekProg.percentage)}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-black text-gray-700 w-7 text-left">
                              {weekProg.percentage}%
                            </span>
                          </div>
                        </td>

                        {/* Week Status Badge */}
                        <td className="py-3 px-3 text-center">
                          {weekProg.isPerfect ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                              <Trophy className="w-3 h-3 text-amber-500" />
                              أسبوع تام
                            </span>
                          ) : weekProg.completedDays > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                              مواظب ({weekProg.completedDays} أيام)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-medium">
                              لم يبدأ
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => onSelectStudent(student)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>عرض</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: MONTHLY & PHASE TABLE */}
      {viewMode === 'monthly' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-sm font-black text-gray-900">{currentPhase.name}</span>
              <p className="text-xs text-gray-500">{currentPhase.subtitle}</p>
            </div>
            <span className="text-xs font-bold text-gray-500">
              عدد الطلاب المعروضين: {filteredStudents.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-gray-100/70 text-gray-600 font-bold border-b border-gray-200">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-4 min-w-[180px]">اسم الطالب</th>
                  {currentPhase.weekNumbers.map((wNum) => (
                    <th key={wNum} className="py-3 px-3 text-center min-w-[95px]">
                      <div>الأسبوع {wNum}</div>
                      <div className="text-[10px] text-gray-400 font-normal">
                        5 أيام
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center min-w-[110px]">
                    إجمالي الأيام المنجزة
                  </th>
                  <th className="py-3 px-3 text-center min-w-[120px]">
                    نسبة إنجاز المرحلة
                  </th>
                  <th className="py-3 px-3 text-center min-w-[100px]">
                    المواظبة التراكمية
                  </th>
                  <th className="py-3 px-3 text-center w-24">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-gray-400">
                      لا يوجد طلاب مطابقون لمعايير البحث
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => {
                    const phaseProg = getStudentPhaseProgress(student, currentPhase);

                    return (
                      <tr
                        key={student.user.uid}
                        className="hover:bg-blue-50/40 transition-colors"
                      >
                        <td className="py-3 px-3 text-center text-gray-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>

                        {/* Student Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                              {student.user.name ? student.user.name[0] : 'ط'}
                            </div>
                            <div className="truncate">
                              <button
                                onClick={() => onSelectStudent(student)}
                                className="font-extrabold text-gray-900 hover:text-blue-600 truncate text-right block text-xs cursor-pointer"
                              >
                                {student.user.name}
                              </button>
                              <span className="text-[10px] text-gray-400 block font-mono truncate">
                                {student.user.email || 'بدون بريد'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Weeks of this month/phase */}
                        {currentPhase.weekNumbers.map((wNum) => {
                          const wProg = getStudentWeekProgress(student, wNum);

                          return (
                            <td key={wNum} className="py-3 px-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-extrabold text-xs text-gray-900">
                                  {wProg.completedDays} / 5
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                    wProg.percentage === 100
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : wProg.percentage >= 50
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {wProg.percentage}%
                                </span>
                              </div>
                            </td>
                          );
                        })}

                        {/* Total Phase Days */}
                        <td className="py-3 px-3 text-center">
                          <span className="font-black text-gray-900">
                            {phaseProg.completedDaysTotal}{' '}
                            <span className="text-gray-400 text-[10px]">
                              / {currentPhase.totalDays} يوماً
                            </span>
                          </span>
                        </td>

                        {/* Phase Percentage */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 justify-center">
                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-600 rounded-full"
                                style={{ width: `${Math.max(4, phaseProg.percentage)}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-black text-gray-700 w-7 text-left">
                              {phaseProg.percentage}%
                            </span>
                          </div>
                        </td>

                        {/* Streak */}
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200 text-[10px] font-bold">
                            <Flame className="w-3 h-3 text-orange-600" />
                            {student.currentStreak || 0} أيام
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => onSelectStudent(student)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>عرض</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: COMPREHENSIVE ALL 9 WEEKS MATRIX */}
      {viewMode === 'all_weeks' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-sm font-black text-gray-900">
                مصفوفة أسابيع البرنامج كاملة (الأسبوع 1 حتى الأسبوع {PROGRAM_DURATION_WEEKS})
              </span>
              <p className="text-xs text-gray-500">
                عرض نسبة إنجاز كل طالب لكل أسبوع من الأسابيع الـ {PROGRAM_DURATION_WEEKS} ({PROGRAM_DURATION_DAYS} يوماً • السبت للأربعاء)
              </p>
            </div>
            <span className="text-xs font-bold text-gray-500">
              عدد الطلاب: {filteredStudents.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-gray-100/70 text-gray-600 font-bold border-b border-gray-200">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-4 min-w-[170px]">اسم الطالب</th>
                  {Array.from({ length: PROGRAM_DURATION_WEEKS }, (_, i) => i + 1).map((wNum) => (
                    <th key={wNum} className="py-3 px-2 text-center min-w-[55px]">
                      <div className="font-bold text-gray-900">س{wNum}</div>
                      <div className="text-[9px] text-gray-400 font-normal">
                        {wNum === activeCurrentWeekNum ? 'الحالي' : `${wNum}`}
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center min-w-[90px]">الأيام الكلية</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">النسبة العامة</th>
                  <th className="py-3 px-3 text-center w-24">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-12 text-center text-gray-400">
                      لا يوجد طلاب مطابقون لمعايير البحث
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => {
                    return (
                      <tr
                        key={student.user.uid}
                        className="hover:bg-blue-50/40 transition-colors"
                      >
                        <td className="py-3 px-3 text-center text-gray-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>

                        <td className="py-3 px-4">
                          <button
                            onClick={() => onSelectStudent(student)}
                            className="font-extrabold text-gray-900 hover:text-blue-600 truncate text-right block text-xs cursor-pointer"
                          >
                            {student.user.name}
                          </button>
                          <span className="text-[10px] text-gray-400 block font-mono truncate">
                            {student.user.email || 'بدون بريد'}
                          </span>
                        </td>

                        {/* All 9 weeks */}
                        {Array.from({ length: PROGRAM_DURATION_WEEKS }, (_, i) => i + 1).map((wNum) => {
                          const wProg = getStudentWeekProgress(student, wNum);

                          return (
                            <td key={wNum} className="py-2.5 px-1.5 text-center">
                              <span
                                className={`inline-block w-8 py-0.5 rounded text-[10px] font-bold ${
                                  wProg.percentage === 100
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : wProg.completedDays > 0
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                                title={`الأسبوع ${wNum}: أنجز ${wProg.completedDays} من 5 أيام (${wProg.percentage}%)`}
                              >
                                {wProg.completedDays}
                              </span>
                            </td>
                          );
                        })}

                        {/* Total distinct completed days */}
                        <td className="py-3 px-3 text-center font-bold text-gray-900">
                          {student.completedDaysCount}{' '}
                          <span className="text-[10px] text-gray-400">
                            / {PROGRAM_DURATION_DAYS}
                          </span>
                        </td>

                        {/* Total Completion Rate */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center gap-1.5 justify-center">
                            <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${Math.max(4, student.completionRate)}%` }}
                              />
                            </div>
                            <span className="font-black text-gray-800 text-[11px]">
                              {student.completionRate}%
                            </span>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => onSelectStudent(student)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>عرض</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
