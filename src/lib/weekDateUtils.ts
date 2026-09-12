// Week and Date utilities adhering strictly to Saturday-to-Wednesday week cycles
// Program Schedule: Starts Saturday 12 September 2026, 9 weeks (45 study days, 90 hadiths)
import {
  PROGRAM_START_DATE,
  PROGRAM_END_DATE,
  PROGRAM_DURATION_DAYS,
  PROGRAM_DURATION_WEEKS,
  PROGRAM_STUDY_DAYS,
  PROGRAM_TOTAL_HADITHS,
} from '../types';

export const ALL_ARABIC_DAYS = [
  'السبت',
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
] as const;

export const ARABIC_DAYS = [
  'السبت',
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
] as const;

export type ArabicDayName = typeof ALL_ARABIC_DAYS[number];

export const ARABIC_WEEK_ORDINALS = [
  'الأول',
  'الثاني',
  'الثالث',
  'الرابع',
  'الخامس',
  'السادس',
  'السابع',
  'الثامن',
  'التاسع',
] as const;

export interface DayInfo {
  dateStr: string; // 'YYYY-MM-DD'
  dayName: ArabicDayName;
  dayIndex: number; // 0 (Saturday) to 4 (Wednesday)
  programDayNumber: number; // 1 to 45 in the program
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  isLocked: boolean; // Locked until the day arrives for students
  isStudyDay: boolean; // Saturday to Wednesday (2 hadiths/day)
  formattedShort: string; // e.g. "12 سبتمبر"
  formattedFull: string; // e.g. "السبت 12 سبتمبر 2026"
  formattedHijriShort: string; // e.g. "1 ربيع الآخر"
  formattedHijriFull: string; // e.g. "السبت، 1 ربيع الآخر 1448 هـ"
}

export interface WeekInfo {
  weekNumber: number; // 1 to 9
  weekOffset: number; // 0 = current week, -1 = previous, etc.
  weekLabel: string; // e.g. "الأسبوع الأول (1 من 9)"
  startDateStr: string; // Saturday YYYY-MM-DD
  endDateStr: string; // Wednesday YYYY-MM-DD
  formattedRange: string; // e.g. "12 سبتمبر - 16 سبتمبر 2026"
  formattedHijriRange: string; // e.g. "1 ربيع الآخر - 5 ربيع الآخر 1448 هـ"
  isCurrentWeek: boolean;
  days: DayInfo[];
}

/**
 * Format a Date object to YYYY-MM-DD (local time)
 */
export function formatDateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get Saturday-to-Friday day index (0 = Saturday, ..., 6 = Friday)
 */
export function getSaturdayBasedDayIndex(date: Date): number {
  const jsDay = date.getDay(); // 0 is Sunday, 6 is Saturday
  return (jsDay + 1) % 7;
}

/**
 * Get today's ISO date string YYYY-MM-DD
 */
export function getTodayISO(): string {
  return formatDateToISO(new Date());
}

/**
 * Parse YYYY-MM-DD string into local midnight Date
 */
export function parseISODate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

/**
 * Hijri (Umm al-Qura) formatters that automatically adapt to 29/30 day lunar months
 */
let hijriFormatterShort: Intl.DateTimeFormat | null = null;
let hijriFormatterFull: Intl.DateTimeFormat | null = null;
let hijriFormatterYear: Intl.DateTimeFormat | null = null;

try {
  hijriFormatterShort = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', {
    day: 'numeric',
    month: 'long',
  });
  hijriFormatterFull = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  hijriFormatterYear = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', {
    year: 'numeric',
  });
} catch {
  try {
    hijriFormatterShort = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
    });
    hijriFormatterFull = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    // fallback
  }
}

/**
 * Convert any date (Date or YYYY-MM-DD string) to short Hijri string: "1 ربيع الآخر"
 */
export function formatHijriShort(date: Date | string): string {
  const dt = typeof date === 'string' ? parseISODate(date) : date;
  if (hijriFormatterShort) {
    try {
      return hijriFormatterShort.format(dt);
    } catch {
      // fallback
    }
  }
  return formatArabicShort(dt);
}

/**
 * Convert any date to full Hijri string: "السبت، 1 ربيع الآخر 1448 هـ"
 */
export function formatHijriFull(date: Date | string): string {
  const dt = typeof date === 'string' ? parseISODate(date) : date;
  if (hijriFormatterFull) {
    try {
      return hijriFormatterFull.format(dt);
    } catch {
      // fallback
    }
  }
  return formatArabicDateFull(typeof date === 'string' ? date : formatDateToISO(dt));
}

/**
 * Format date range in Hijri: "1 ربيع الآخر - 5 ربيع الآخر 1448 هـ"
 */
export function formatHijriRange(startDate: Date, endDate: Date): string {
  const startStr = formatHijriShort(startDate);
  const endStr = formatHijriShort(endDate);
  let yearStr = '1448 هـ';
  if (hijriFormatterYear) {
    try {
      yearStr = hijriFormatterYear.format(endDate);
    } catch {
      // fallback
    }
  }
  return `${startStr} - ${endStr} ${yearStr}`;
}

/**
 * Arabic Month Names
 */
const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

export function formatArabicShort(date: Date): string {
  const d = date.getDate();
  const m = ARABIC_MONTHS[date.getMonth()];
  return `${d} ${m}`;
}

export function formatArabicDateFull(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  const dayIndex = getSaturdayBasedDayIndex(date);
  const dayName = ALL_ARABIC_DAYS[dayIndex];
  return `${dayName}، ${d} ${ARABIC_MONTHS[m - 1]} ${y}`;
}

/**
 * Check if a specific date is locked for a student.
 * A day is locked if its date is in the future relative to today.
 * When the day arrives, the lock opens automatically.
 */
export function isDayLockedForStudent(dateStr: string): boolean {
  const todayStr = getTodayISO();

  // If today is on or after the date, it is open / unlocked
  if (todayStr >= dateStr) {
    return false;
  }

  // If today is before the program starts, allow previewing the launch day (Day 1) only; all subsequent days are locked
  if (todayStr < PROGRAM_START_DATE && dateStr === PROGRAM_START_DATE) {
    return false;
  }

  // Any future day is locked
  return true;
}

/**
 * Get day number in program (1 to 63)
 * September 12, 2026 is Day 1
 */
export function getDayNumberInProgram(dateStr: string): number {
  const startDt = parseISODate(PROGRAM_START_DATE);
  const targetDt = parseISODate(dateStr);
  const diffDays = Math.round((targetDt.getTime() - startDt.getTime()) / (24 * 60 * 60 * 1000));
  return diffDays + 1;
}

/**
 * Determine the active week number of the program (1 to 9) for today
 */
export function getCurrentProgramWeekNumber(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDateToISO(today);

  if (todayStr < PROGRAM_START_DATE) {
    // Before September 12, 2026 -> Start from Week 1
    return 1;
  }

  if (todayStr > PROGRAM_END_DATE) {
    // After November 13, 2026 -> Final week 9
    return PROGRAM_DURATION_WEEKS;
  }

  const startDt = parseISODate(PROGRAM_START_DATE);
  const diffDays = Math.round((today.getTime() - startDt.getTime()) / (24 * 60 * 60 * 1000));
  const weekNum = Math.floor(diffDays / 7) + 1;
  return Math.min(PROGRAM_DURATION_WEEKS, Math.max(1, weekNum));
}

/**
 * Get default selected date for the app
 * If today is before Sept 12, 2026, defaults to Sept 12 (start of program)
 */
export function getDefaultSelectedDate(): string {
  const todayStr = getTodayISO();
  if (todayStr < PROGRAM_START_DATE) {
    return PROGRAM_START_DATE;
  }
  if (todayStr > PROGRAM_END_DATE) {
    return PROGRAM_END_DATE;
  }

  const today = new Date();
  const satIndex = getSaturdayBasedDayIndex(today);
  if (satIndex >= 5) {
    // Thursday or Friday: default to Wednesday of the week
    const currentWeekNum = getCurrentProgramWeekNumber();
    const weekInfo = getProgramWeekInfo(currentWeekNum);
    return weekInfo.days[4].dateStr;
  }

  return todayStr;
}

/**
 * Generate full WeekInfo for a specific program week (1 to 9)
 * Focuses strictly on Saturday to Wednesday (5 days per week, 45 days total)
 */
export function getProgramWeekInfo(weekNumber: number): WeekInfo {
  // Clamp weekNumber between 1 and 9
  const clampedWeek = Math.min(PROGRAM_DURATION_WEEKS, Math.max(1, weekNumber));
  const activeCurrentWeek = getCurrentProgramWeekNumber();
  const weekOffset = clampedWeek - activeCurrentWeek;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDateToISO(today);

  // Program starts Saturday September 12, 2026
  const programStart = parseISODate(PROGRAM_START_DATE);

  // Start of this week: Saturday + (clampedWeek - 1) * 7 days
  const weekSaturday = new Date(programStart);
  weekSaturday.setDate(programStart.getDate() + (clampedWeek - 1) * 7);

  const days: DayInfo[] = [];

  // Focus only on Saturday (0), Sunday (1), Monday (2), Tuesday (3), Wednesday (4)
  for (let i = 0; i < 5; i++) {
    const dayDate = new Date(weekSaturday);
    dayDate.setDate(weekSaturday.getDate() + i);
    const dateStr = formatDateToISO(dayDate);
    const dayIndex = i;
    const dayName = ARABIC_DAYS[dayIndex];

    const isToday = dateStr === todayStr;
    const isPast = dayDate.getTime() < today.getTime();
    const isFuture = dayDate.getTime() > today.getTime();
    const programDayNumber = (clampedWeek - 1) * 5 + (i + 1);
    const isLocked = isDayLockedForStudent(dateStr);
    const isStudyDay = true;

    days.push({
      dateStr,
      dayName,
      dayIndex,
      programDayNumber,
      isToday,
      isPast,
      isFuture,
      isLocked,
      isStudyDay,
      formattedShort: formatArabicShort(dayDate),
      formattedFull: `${dayName} ${formatArabicShort(dayDate)}`,
      formattedHijriShort: formatHijriShort(dayDate),
      formattedHijriFull: formatHijriFull(dayDate),
    });
  }

  const startDateStr = days[0].dateStr;
  const endDateStr = days[4].dateStr;

  const startDay = new Date(weekSaturday);
  const endDay = new Date(weekSaturday);
  endDay.setDate(endDay.getDate() + 4);

  const formattedRange = `${startDay.getDate()} ${ARABIC_MONTHS[startDay.getMonth()]} - ${endDay.getDate()} ${ARABIC_MONTHS[endDay.getMonth()]} ${endDay.getFullYear()}`;
  const formattedHijriRange = formatHijriRange(startDay, endDay);
  const ordinalLabel = ARABIC_WEEK_ORDINALS[clampedWeek - 1] || `${clampedWeek}`;
  const weekLabel = `الأسبوع ${ordinalLabel} (${clampedWeek} من ${PROGRAM_DURATION_WEEKS})`;

  return {
    weekNumber: clampedWeek,
    weekOffset,
    weekLabel,
    startDateStr,
    endDateStr,
    formattedRange,
    formattedHijriRange,
    isCurrentWeek: clampedWeek === activeCurrentWeek,
    days,
  };
}

/**
 * Get all 9 weeks of the program (for quick jump / tabs / summary)
 */
export function getAllProgramWeeks(): WeekInfo[] {
  const weeks: WeekInfo[] = [];
  for (let w = 1; w <= PROGRAM_DURATION_WEEKS; w++) {
    weeks.push(getProgramWeekInfo(w));
  }
  return weeks;
}

/**
 * Backwards compatible getWeekInfo
 * If weekOffset is passed, calculates week relative to current active program week
 */
export function getWeekInfo(weekOffset: number = 0): WeekInfo {
  const currentWeek = getCurrentProgramWeekNumber();
  const targetWeek = currentWeek + weekOffset;
  return getProgramWeekInfo(targetWeek);
}

