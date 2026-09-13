export type UserRole = 'student' | 'admin';

export const PROGRAM_START_DATE = '2026-09-12'; // السبت 12 سبتمبر 2026
export const PROGRAM_END_DATE = '2026-11-11'; // الأربعاء 11 نوفمبر 2026
export const PROGRAM_DURATION_DAYS = 45; // 45 يوماً (من السبت للأربعاء: 9 أسابيع × 5 أيام)
export const PROGRAM_STUDY_DAYS = 45; // 45 يوماً
export const PROGRAM_DURATION_WEEKS = 9; // 9 أسابيع
export const PROGRAM_TOTAL_HADITHS = 90; // 90 حديثاً بالخطة (معدل حديثين يومياً: 45 × 2)

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface DailyHadith {
  id: string;
  date: string; // YYYY-MM-DD
  dayName: string; // "السبت" | "الأحد" | "الاثنين" | "الثلاثاء" | "الأربعاء" | "الخميس" | "الجمعة"
  title: string; // عنوان الحديث أو التطبيق
  content: string; // نص الحديث أو الذكر أو الدعاء
  source?: string; // تخريج الحديث (صحيح البخاري، مسلم، إلخ)
  category?: string; // تصنيف
  order?: number; // 1, 2, 3...
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
}

export interface Practice {
  id: string;
  title: string;
  text: string;
  active: boolean;
  dayNumber?: number; // 1 to 74, or 0 / undefined for daily continuous
  weekNumber?: number; // 1 to 11
  category?: string;
  source?: string; // تخريج الحديث (البخاري، مسلم، إلخ)
  notes?: string;
  createdAt?: string;
}

export interface DailyProgress {
  id?: string;
  userId: string;
  practiceId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt: string;
}

export interface StudentStats {
  user: UserProfile;
  totalCompleted: number;
  completedTodayCount: number;
  todayCompletedAll: boolean;
  completionRate: number; // 0 to 100% of 77-day program
  completedDaysCount: number; // Distinct completed days
  recentRecords: DailyProgress[];
  allRecords?: DailyProgress[];
  currentStreak?: number;
  maxStreak?: number;
}

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'emerald' | 'diamond';

export interface Badge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: 'streak' | 'week' | 'milestone' | 'daily';
  tier: BadgeTier;
  unlocked: boolean;
  unlockedDate?: string;
  currentProgress: number;
  targetProgress: number;
  unit: string;
}
