import React, { useState, useMemo } from 'react';
import { StudentStats, Practice, PROGRAM_DURATION_DAYS, PROGRAM_DURATION_WEEKS } from '../types';
import { formatArabicDate } from '../lib/dataService';
import { evaluateStudentBadges } from '../lib/badgeService';
import {
  getAllProgramWeeks,
  getProgramWeekInfo,
  formatArabicDateFull,
  formatHijriFull,
  formatHijriShort,
  formatHijriRange,
} from '../lib/weekDateUtils';
import {
  ArrowRight,
  CheckCircle2,
  Calendar,
  Mail,
  Edit3,
  Award,
  Clock,
  BookOpen,
  Flame,
  Sparkles,
  Zap,
  Target,
  Medal,
  Star,
  ShieldCheck,
  Crown,
  Compass,
  CalendarCheck,
  Footprints,
  Trophy,
  Table as TableIcon,
  X,
  Trash2,
} from 'lucide-react';

interface StudentDetailsViewProps {
  studentStats: StudentStats;
  practices: Practice[];
  onBack: () => void;
  onEditName?: () => void;
  onDeleteStudent?: () => void;
}

export const StudentDetailsView: React.FC<StudentDetailsViewProps> = ({
  studentStats,
  practices,
  onBack,
  onEditName,
  onDeleteStudent,
}) => {
  const {
    user,
    totalCompleted,
    completedDaysCount,
    completionRate,
    recentRecords,
    allRecords,
    todayCompletedAll,
    currentStreak = 0,
    maxStreak = 0,
  } = studentStats;

  const recordsToUse = allRecords && allRecords.length > 0 ? allRecords : recentRecords;

  const [individualTableMode, setIndividualTableMode] = useState<'weeks' | 'months'>('weeks');

  const badgesResult = evaluateStudentBadges(
    recordsToUse,
    todayCompletedAll
  );

  const practiceTitleMap: Record<string, string> = {};
  practices.forEach((p) => {
    practiceTitleMap[p.id] = p.title;
  });

  const allWeeks = useMemo(() => getAllProgramWeeks(), []);

  // Map of completed date strings
  const completedDateMap = useMemo(() => {
    const map = new Map<string, number>();
    recordsToUse.forEach((r) => {
      if (r.completed) {
        map.set(r.date, (map.get(r.date) || 0) + 1);
      }
    });
    return map;
  }, [recordsToUse]);

  // Program phases (9 weeks)
  const phases = [
    {
      id: 'm1',
      title: 'الشهر الأول (الأسابيع 1 - 4)',
      dateRange: '12 سبتمبر - 7 أكتوبر 2026 • 20 يوم مدارسة (40 حديثاً)',
      weekNumbers: [1, 2, 3, 4],
      totalDays: 20,
    },
    {
      id: 'm2',
      title: 'الشهر الثاني (الأسابيع 5 - 8)',
      dateRange: '10 أكتوبر - 4 نوفمبر 2026 • 20 يوم مدارسة (40 حديثاً)',
      weekNumbers: [5, 6, 7, 8],
      totalDays: 20,
    },
    {
      id: 'm3',
      title: 'الأسبوع الختامي (الأسبوع 9)',
      dateRange: '7 نوفمبر - 11 نوفمبر 2026 • 5 أيام مدارسة (10 أحاديث)',
      weekNumbers: [9],
      totalDays: 5,
    },
  ];

  const renderBadgeIcon = (iconName: string) => {
    const iconClass = 'w-4 h-4';
    switch (iconName) {
      case 'Footprints':
        return <Footprints className={iconClass} />;
      case 'Flame':
        return <Flame className={iconClass} />;
      case 'Zap':
        return <Zap className={iconClass} />;
      case 'Sparkles':
        return <Sparkles className={iconClass} />;
      case 'CalendarCheck':
        return <CalendarCheck className={iconClass} />;
      case 'Award':
        return <Award className={iconClass} />;
      case 'Compass':
        return <Compass className={iconClass} />;
      case 'Target':
        return <Target className={iconClass} />;
      case 'ShieldCheck':
        return <ShieldCheck className={iconClass} />;
      case 'Medal':
        return <Medal className={iconClass} />;
      case 'Star':
        return <Star className={iconClass} />;
      case 'Crown':
        return <Crown className={iconClass} />;
      case 'CheckCircle2':
        return <CheckCircle2 className={iconClass} />;
      default:
        return <Award className={iconClass} />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all cursor-pointer shadow-2xs"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لقائمة الطلاب</span>
        </button>

        <div className="flex items-center gap-2">
          {onEditName && (
            <button
              onClick={onEditName}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>تعديل اسم الطالب</span>
            </button>
          )}

          {onDeleteStudent && (
            <button
              onClick={onDeleteStudent}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="حذف الطالب وسجلاته بشكل نهائي"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف الطالب نهائياً</span>
            </button>
          )}
        </div>
      </div>

      {/* Student Overview Bento Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-6 border border-gray-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-xl shadow-xs">
              {user.name ? user.name[0] : 'ط'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-gray-900">{user.name}</h2>
                {onEditName && (
                  <button
                    onClick={onEditName}
                    className="text-gray-400 hover:text-blue-600 p-1"
                    title="تعديل اسم الطالب"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-mono">{user.email || 'بدون بريد'}</span>
              </div>
            </div>
          </div>

          <div>
            {todayCompletedAll ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>أنجز تطبيقات اليوم</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-bold text-xs shadow-2xs">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>لم يكتمل إنجاز اليوم</span>
              </span>
            )}
          </div>
        </div>

        {/* 74-Day Program Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>الأيام المنجزة</span>
            </div>
            <p className="text-base font-black text-gray-900">
              {completedDaysCount}{' '}
              <span className="text-xs font-normal text-gray-500">
                / {PROGRAM_DURATION_DAYS} يوماً
              </span>
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1 font-semibold">
              <Award className="w-3.5 h-3.5 text-gray-400" />
              <span>نسبة الإنجاز الكلية</span>
            </div>
            <p className="text-base font-black text-blue-700">
              {completionRate}%
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
              <span>إجمالي التطبيقات المنجزة</span>
            </div>
            <p className="text-base font-black text-emerald-700">
              {totalCompleted} تطبيقاً
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>تاريخ الانضمام</span>
            </div>
            <p className="text-xs font-bold text-gray-800">
              {formatArabicDate(user.createdAt) || 'غير محدد'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex justify-between text-xs text-gray-600 mb-1.5 font-bold">
            <span>مسار البرنامج (شهرين وأسبوعين)</span>
            <span>{completionRate}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${Math.max(2, completionRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Student Badges Showcase Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-6 border border-gray-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">
                أوسمة الطالب والمواظبة ({badgesResult.unlockedCount} من {badgesResult.badges.length})
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                الأوسمة المكتسبة بناءً على تتابع الأيام وإتمام الأسابيع والسنن
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200 text-xs font-black">
              <Flame className="w-3.5 h-3.5 text-orange-600" />
              <span>المواظبة الحالية: {badgesResult.currentStreak} أيام</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
              <span>أطول سلسلة: {badgesResult.maxStreak} أيام</span>
            </span>
          </div>
        </div>

        {/* Badges icons row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {badgesResult.badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-3 rounded-2xl border text-center transition-all ${
                badge.unlocked
                  ? 'bg-gradient-to-b from-amber-50/70 to-white border-amber-300 shadow-2xs'
                  : 'bg-gray-50/60 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex justify-center mb-1.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    badge.unlocked
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {renderBadgeIcon(badge.iconName)}
                </div>
              </div>
              <div className="text-xs font-black text-gray-900 truncate">
                {badge.title}
              </div>
              <div className="text-[10px] text-gray-500 line-clamp-1 mt-0.5" title={badge.description}>
                {badge.description}
              </div>
              <div className="mt-1.5">
                {badge.unlocked ? (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    مكتمل
                  </span>
                ) : (
                  <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-200 text-gray-600">
                    {badge.currentProgress} / {badge.targetProgress} {badge.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Weekly & Monthly Achievements Table */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-6 border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">
                جدول إنجاز الطالب التفصيلي (أسبوعياً وشهرياً)
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                مصفوفة إنجاز الطالب لجميع أسابيع وشهور البرنامج الـ {PROGRAM_DURATION_WEEKS} ({PROGRAM_DURATION_DAYS} يوماً • 90 حديثاً)
              </p>
            </div>
          </div>

          <div className="flex items-center bg-gray-100/80 p-1 rounded-xl border border-gray-200 self-start sm:self-auto">
            <button
              onClick={() => setIndividualTableMode('weeks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                individualTableMode === 'weeks'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              جدول الـ {PROGRAM_DURATION_WEEKS} أسابيع (يوم بيوم)
            </button>
            <button
              onClick={() => setIndividualTableMode('months')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                individualTableMode === 'months'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              جدول الشهور والمراحل
            </button>
          </div>
        </div>

        {/* WEEKS TABLE FOR INDIVIDUAL */}
        {individualTableMode === 'weeks' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-gray-100/80 text-gray-600 font-bold border-b border-gray-200">
                  <th className="py-2.5 px-3 min-w-[140px]">الأسبوع</th>
                  <th className="py-2.5 px-2 text-center min-w-[65px]">السبت</th>
                  <th className="py-2.5 px-2 text-center min-w-[65px]">الأحد</th>
                  <th className="py-2.5 px-2 text-center min-w-[65px]">الاثنين</th>
                  <th className="py-2.5 px-2 text-center min-w-[65px]">الثلاثاء</th>
                  <th className="py-2.5 px-2 text-center min-w-[65px]">الأربعاء</th>
                  <th className="py-2.5 px-3 text-center min-w-[85px]">إنجاز الأسبوع</th>
                  <th className="py-2.5 px-3 text-center min-w-[110px]">النسبة</th>
                  <th className="py-2.5 px-3 text-center min-w-[95px]">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allWeeks.map((week) => {
                  let completedCountInWeek = 0;
                  week.days.forEach((d) => {
                    if (completedDateMap.has(d.dateStr)) {
                      completedCountInWeek++;
                    }
                  });
                  const weekPct = Math.round((completedCountInWeek / 5) * 100);

                  return (
                    <tr
                      key={week.weekNumber}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        week.isCurrentWeek ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {/* Week Name & Dates */}
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-gray-900 flex items-center gap-1.5">
                          <span>{week.weekLabel}</span>
                          {week.isCurrentWeek && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                              الحالي
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 font-normal">
                          {week.formattedHijriRange}
                        </div>
                      </td>

                      {/* 5 Days (Sat-Wed) */}
                      {week.days.map((day) => {
                        const isDone = completedDateMap.has(day.dateStr);

                        return (
                          <td
                            key={day.dateStr}
                            className="py-2.5 px-2 text-center"
                            title={`${day.formattedHijriFull || day.formattedFull}: ${
                              isDone
                                ? 'أنجز الطالب التطبيق'
                                : day.isPast
                                ? 'لم ينجز وانتهى اليوم (علامة ×)'
                                : day.isToday
                                ? 'اليوم الحالي (قيد الإنجاز)'
                                : 'لم يحن وقته بعد'
                            }`}
                          >
                            {isDone ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              </span>
                            ) : day.isPast ? (
                              <span
                                className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-rose-50 text-rose-600 border border-rose-200 font-bold shadow-2xs"
                                title="لم ينجز في هذا اليوم وانتهى موعده (علامة ×)"
                              >
                                <X className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
                              </span>
                            ) : day.isToday ? (
                              <span
                                className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs"
                                title="اليوم الحالي - قيد الإنجاز"
                              >
                                <Clock className="w-3 h-3 text-amber-600" />
                              </span>
                            ) : (
                              <span className="text-gray-300 font-mono">—</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Completed count */}
                      <td className="py-3 px-3 text-center font-black text-gray-900">
                        {completedCountInWeek}{' '}
                        <span className="text-gray-400 text-[10px]">/ 5</span>
                      </td>

                      {/* Progress Bar */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                weekPct === 100
                                  ? 'bg-emerald-500'
                                  : weekPct >= 50
                                  ? 'bg-blue-600'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.max(4, weekPct)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-gray-700 w-7 text-left">
                            {weekPct}%
                          </span>
                        </div>
                      </td>

                      {/* Badge / Status */}
                      <td className="py-3 px-3 text-center">
                        {weekPct === 100 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                            <Trophy className="w-2.5 h-2.5 text-amber-500" />
                            مكتمل
                          </span>
                        ) : completedCountInWeek > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold">
                            {completedCountInWeek} أيام
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">لم يبدأ</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* MONTHS & PHASES TABLE FOR INDIVIDUAL */
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-gray-100/80 text-gray-600 font-bold border-b border-gray-200">
                  <th className="py-3 px-4 min-w-[200px]">المرحلة / الشهر</th>
                  <th className="py-3 px-3 text-center min-w-[120px]">الفترة والأسابيع</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">الأيام المنجزة</th>
                  <th className="py-3 px-3 text-center min-w-[140px]">نسبة إنجاز المرحلة</th>
                  <th className="py-3 px-3 text-center min-w-[120px]">تقييم المرحلة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {phases.map((ph) => {
                  let phaseDoneDays = 0;
                  ph.weekNumbers.forEach((wNum) => {
                    const wInfo = getProgramWeekInfo(wNum);
                    wInfo.days.forEach((d) => {
                      if (completedDateMap.has(d.dateStr)) {
                        phaseDoneDays++;
                      }
                    });
                  });
                  const phasePct = Math.min(
                    100,
                    Math.round((phaseDoneDays / ph.totalDays) * 100)
                  );

                  return (
                    <tr key={ph.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-gray-900 block text-xs sm:text-sm">
                          {ph.title}
                        </span>
                        <span className="text-[11px] text-gray-500 font-normal">
                          {ph.dateRange}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center font-bold text-gray-700">
                        {ph.totalDays} يوماً (الأسابيع {ph.weekNumbers.join('، ')})
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="font-black text-gray-900 text-sm">
                          {phaseDoneDays}{' '}
                          <span className="text-gray-400 text-xs font-normal">
                            / {ph.totalDays} يوماً
                          </span>
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${Math.max(4, phasePct)}%` }}
                            />
                          </div>
                          <span className="font-black text-gray-900 text-xs w-8 text-left">
                            {phasePct}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {phasePct >= 90 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            امتياز نبوي
                          </span>
                        ) : phasePct >= 70 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
                            مواظبة عالية
                          </span>
                        ) : phasePct > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                            قيد المتابعة
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">لم يبدأ بعد</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daily Progress History Bento Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-6 border border-gray-200 shadow-2xs">
        <h3 className="text-base font-black text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          سجل الإنجاز والمواظبة اليومية
        </h3>

        {recordsToUse.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-xs font-medium">
            لم يقم الطالب بتسجيل أي تطبيق حتى الآن.
          </div>
        ) : (
          <div className="space-y-3">
            {recordsToUse.map((record, index) => {
              const title = practiceTitleMap[record.practiceId] || 'تطبيق سنة نبوية';
              const formattedDate = formatArabicDate(record.date);

              return (
                <div
                  key={`${record.practiceId}_${record.date}_${index}`}
                  className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-gray-900 block">{title}</span>
                      <span className="text-[11px] text-gray-500">
                        التاريخ: {formattedDate}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-full">
                    مكتمل
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
