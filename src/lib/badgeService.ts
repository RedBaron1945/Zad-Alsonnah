import { DailyProgress, Badge, PROGRAM_DURATION_DAYS } from '../types';
import { getTodayDateString } from './dataService';

/**
 * Calculates current and maximum consecutive days streak
 */
export function calculateStreaks(records: DailyProgress[], todayStr: string = getTodayDateString()): {
  currentStreak: number;
  maxStreak: number;
  distinctDaysCount: number;
} {
  const distinctDateStrings = Array.from(new Set(records.map((r) => r.date))).sort();
  const distinctDaysCount = distinctDateStrings.length;

  if (distinctDaysCount === 0) {
    return { currentStreak: 0, maxStreak: 0, distinctDaysCount: 0 };
  }

  // Parse dates as UTC day timestamps to avoid timezone shifts
  const parseDateToDay = (dateStr: string): number => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };

  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const daysSorted = distinctDateStrings.map(parseDateToDay);

  // 1. Calculate Maximum Consecutive Streak
  let maxStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < daysSorted.length; i++) {
    const diff = (daysSorted[i] - daysSorted[i - 1]) / ONE_DAY_MS;
    if (Math.round(diff) === 1) {
      currentRun++;
      if (currentRun > maxStreak) {
        maxStreak = currentRun;
      }
    } else if (Math.round(diff) > 1) {
      currentRun = 1;
    }
  }

  // 2. Calculate Current Consecutive Streak (leading to today or yesterday)
  const todayDay = parseDateToDay(todayStr);
  const yesterdayDay = todayDay - ONE_DAY_MS;

  const dateSet = new Set(daysSorted);

  let currentStreak = 0;
  let checkDay = dateSet.has(todayDay) ? todayDay : dateSet.has(yesterdayDay) ? yesterdayDay : null;

  if (checkDay !== null) {
    while (dateSet.has(checkDay)) {
      currentStreak++;
      checkDay -= ONE_DAY_MS;
    }
  }

  return {
    currentStreak,
    maxStreak: Math.max(maxStreak, currentStreak),
    distinctDaysCount,
  };
}

/**
 * Evaluates all Badges for a student based on their history and today's activity
 */
export function evaluateStudentBadges(
  records: DailyProgress[],
  todayCompletedAll: boolean,
  todayStr: string = getTodayDateString()
): {
  badges: Badge[];
  unlockedCount: number;
  currentStreak: number;
  maxStreak: number;
  distinctDaysCount: number;
} {
  const { currentStreak, maxStreak, distinctDaysCount } = calculateStreaks(records, todayStr);
  const totalPractices = records.length;

  const badgesList: Badge[] = [
    {
      id: 'first_step',
      title: 'وسام أول الغيث',
      description: 'تسجيل أول تطبيق لسنة نبوية شريفة في برنامج زاد السنة (أول الغيث قطرة)',
      iconName: 'Footprints',
      category: 'milestone',
      tier: 'bronze',
      unlocked: totalPractices >= 1,
      currentProgress: Math.min(1, totalPractices),
      targetProgress: 1,
      unit: 'تطبيق',
    },
    {
      id: 'daily_champion',
      title: 'وسام همّة اليوم التام',
      description: 'إنجاز جميع السنن والأحاديث النبوية المقررة لليوم الحالي بتمامها وإتقانها',
      iconName: 'CheckCircle2',
      category: 'daily',
      tier: 'bronze',
      unlocked: todayCompletedAll,
      currentProgress: todayCompletedAll ? 1 : 0,
      targetProgress: 1,
      unit: 'يوم',
    },
    {
      id: 'streak_3_days',
      title: 'وسام السنّة الراتبة',
      description: 'المحافظة على التطبيق لـ 3 أيام متتالية دون انقطاع تثبيتاً للسنن النبوية',
      iconName: 'Flame',
      category: 'streak',
      tier: 'silver',
      unlocked: currentStreak >= 3 || maxStreak >= 3,
      currentProgress: Math.min(3, Math.max(currentStreak, maxStreak)),
      targetProgress: 3,
      unit: 'أيام متتالية',
    },
    {
      id: 'streak_5_days',
      title: 'وسام لواء المداومة الخماسي',
      description: 'إتمام 5 أيام مدارسة متتالية من السبت للأربعاء بنصاب حديثين يومياً (أحب الأعمال أدومها)',
      iconName: 'Zap',
      category: 'streak',
      tier: 'silver',
      unlocked: currentStreak >= 5 || maxStreak >= 5,
      currentProgress: Math.min(5, Math.max(currentStreak, maxStreak)),
      targetProgress: 5,
      unit: 'أيام متتالية',
    },
    {
      id: 'week_1_complete',
      title: 'وسام أسبوع الهداية والنور',
      description: 'إتمام أسبوع كامل (7 أيام) في مسار زاد السنة المبارك بنجاح',
      iconName: 'Sparkles',
      category: 'week',
      tier: 'gold',
      unlocked: currentStreak >= 7 || maxStreak >= 7 || distinctDaysCount >= 7,
      currentProgress: Math.min(7, Math.max(currentStreak, distinctDaysCount)),
      targetProgress: 7,
      unit: 'أيام',
    },
    {
      id: 'streak_14_days',
      title: 'وسام نور الأسبوعين',
      description: 'المواظبة لمدة أسبوعين متتاليين (14 يوماً) في حفظ وتطبيق سنن المصطفى ﷺ',
      iconName: 'CalendarCheck',
      category: 'streak',
      tier: 'gold',
      unlocked: currentStreak >= 14 || maxStreak >= 14 || distinctDaysCount >= 14,
      currentProgress: Math.min(14, Math.max(currentStreak, distinctDaysCount)),
      targetProgress: 14,
      unit: 'يوماً',
    },
    {
      id: 'streak_21_days',
      title: 'وسام السابقون بالخيرات',
      description: 'المواظبة لـ 3 أسابيع (21 يوماً) استباقاً في ميادين الخير واقتداءً بالنبي ﷺ',
      iconName: 'Award',
      category: 'streak',
      tier: 'gold',
      unlocked: currentStreak >= 21 || maxStreak >= 21 || distinctDaysCount >= 21,
      currentProgress: Math.min(21, Math.max(currentStreak, distinctDaysCount)),
      targetProgress: 21,
      unit: 'يوماً',
    },
    {
      id: 'month_1_complete',
      title: 'وسام الشهر الأول الأغرّ',
      description: 'إتمام الشهر الأول (الأسابيع 1-4 • 28 يوماً تقويمياً • 40 حديثاً نبوياً شريفاً)',
      iconName: 'Compass',
      category: 'milestone',
      tier: 'emerald',
      unlocked: distinctDaysCount >= 28,
      currentProgress: Math.min(28, distinctDaysCount),
      targetProgress: 28,
      unit: 'يوماً',
    },
    {
      id: 'halfway_32_days',
      title: 'وسام منتصف المضمار النبوي',
      description: 'بلوغ منتصف مدة البرنامج المقررة (32 يوماً تقويمياً) بثبات وإخلاص ويقين',
      iconName: 'Target',
      category: 'milestone',
      tier: 'emerald',
      unlocked: distinctDaysCount >= 32,
      currentProgress: Math.min(32, distinctDaysCount),
      targetProgress: 32,
      unit: 'يوماً',
    },
    {
      id: 'month_2_complete',
      title: 'وسام الشهر الثاني المبارك',
      description: 'إتمام الشهر الثاني كاملاً (الأسابيع 5-8 • 56 يوماً • 80 حديثاً نبوياً شريفاً)',
      iconName: 'Medal',
      category: 'milestone',
      tier: 'emerald',
      unlocked: distinctDaysCount >= 56,
      currentProgress: Math.min(56, distinctDaysCount),
      targetProgress: 56,
      unit: 'يوماً',
    },
    {
      id: 'grand_finale_program_days',
      title: 'وسام تاج السنّة وختام المسك',
      description: `إتمام كامل مسار زاد السنة لتكوين النسيم (9 أسابيع • ${PROGRAM_DURATION_DAYS} يوماً • 90 حديثاً نبوياً) بفضل الله ومنّته`,
      iconName: 'Crown',
      category: 'milestone',
      tier: 'diamond',
      unlocked: distinctDaysCount >= PROGRAM_DURATION_DAYS,
      currentProgress: Math.min(PROGRAM_DURATION_DAYS, distinctDaysCount),
      targetProgress: PROGRAM_DURATION_DAYS,
      unit: 'يوماً',
    },
  ];

  const unlockedCount = badgesList.filter((b) => b.unlocked).length;

  return {
    badges: badgesList,
    unlockedCount,
    currentStreak,
    maxStreak,
    distinctDaysCount,
  };
}
