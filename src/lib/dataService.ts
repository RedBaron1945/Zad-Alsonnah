import {
  UserProfile,
  Practice,
  DailyProgress,
  StudentStats,
  PROGRAM_DURATION_DAYS,
  PROGRAM_DURATION_WEEKS,
  PROGRAM_TOTAL_HADITHS,
} from '../types';
import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';

export const INITIAL_PRACTICES: Practice[] = [
  {
    id: 'hadith_day_1',
    title: 'ذكر ما بعد إسباغ الوضوء',
    text: '«ما منكم من أحد يتوضأ فيبلغ - أو فيسبغ - الوضوء ثم يقول: أشهد أن لا إله إلا الله وحده لا شريك له، وأشهد أن محمداً عبده ورسوله؛ إلا فتحت له أبواب الجنة الثمانية يدخل من أيها شاء»',
    source: 'صحيح مسلم',
    category: 'أذكار الطهارة والصلاة',
    dayNumber: 1,
    weekNumber: 1,
    notes: 'يستحب المحافظة عليه عقب كل وضوء للصلاة',
    active: true,
  },
  {
    id: 'hadith_day_2',
    title: 'دعاء دخول المسجد والخروج منه',
    text: '«إذا دخل أحدكم المسجد فليسلم على النبي ﷺ وليقل: اللهم افتح لي أبواب رحمتك، وإذا خرج فليقل: اللهم إني أسألك من فضلك»',
    source: 'صحيح مسلم',
    category: 'سنن المساجد',
    dayNumber: 2,
    weekNumber: 1,
    notes: 'تقديم الرجل اليمنى عند الدخول واليسرى عند الخروج',
    active: true,
  },
  {
    id: 'hadith_day_3',
    title: 'إفشاء السلام بين المسلمين',
    text: '«لا تدخلون الجنة حتى تؤمنوا، ولا تؤمنوا حتى تحابوا، أولا أدلكم على شيء إذا فعلتموه تحاببتم؟ أفشوا السلام بينكم»',
    source: 'صحيح مسلم',
    category: 'الآداب والتعامل',
    dayNumber: 3,
    weekNumber: 1,
    notes: 'السلام على من عرفت ومن لم تعرف',
    active: true,
  },
  {
    id: 'hadith_day_4',
    title: 'سنة الضحى (صلاة الأوابين)',
    text: '«يصبح على كل سلامى من أحدكم صدقة... ويجزئ من ذلك ركعتان يركعهما من الضحى»',
    source: 'صحيح مسلم',
    category: 'النوافل والسنن الراتبة',
    dayNumber: 4,
    weekNumber: 1,
    notes: 'وقتها من بعد شروق الشمس بربع ساعة إلى قبيل الظهر بربع ساعة',
    active: true,
  },
  {
    id: 'hadith_day_5',
    title: 'سيد الاستغفار',
    text: '«اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت، أعوذ بك من شر ما صنعت، أبوء لك بنعمتك علي، وأبوء بذنبي فاغفر لي فإنه لا يغفر الذنوب إلا أنت»',
    source: 'صحيح البخاري',
    category: 'أذكار الصباح والمساء',
    dayNumber: 5,
    weekNumber: 1,
    notes: 'من قالها موقناً بها حين يمسي فمات دخل الجنة، وحين يصبح فمات دخل الجنة',
    active: true,
  },
  {
    id: 'hadith_day_6',
    title: 'الصلاة على النبي ﷺ يوم الجمعة',
    text: '«إن من أفضل أيامكم يوم الجمعة، فيه خُلق آدم، وفيه قُبض، وفيه النفخة، وفيه الصعقة، فأكثروا علي من الصلاة فيه فإن صلاتكم معروضة علي»',
    source: 'سنن أبي داود والنسائي',
    category: 'سنن يوم الجمعة',
    dayNumber: 6,
    weekNumber: 1,
    notes: 'الإكثار من الصلاة والسلام على الحبيب المصطفى ﷺ ليلة الجمعة ويومها',
    active: true,
  },
  {
    id: 'hadith_day_7',
    title: 'كفارة المجلس وحفظ اللسان',
    text: '«من جلس في مجلس فكثر فيه لغطه، فقال قبل أن يقوم من مجلسه ذلك: سبحانك اللهم وبحمدك، أشهد أن لا إله إلا أنت، أستغفرك وأتوب إليك؛ إلا غفر له ما كان في مجلسه ذلك»',
    source: 'سنن الترمذي وصححه الألباني',
    category: 'آداب المجالس',
    dayNumber: 7,
    weekNumber: 1,
    notes: 'دعاء جامع يكفر اللغو والزلل في ختام أي لقاء أو مجلس',
    active: true,
  },
  {
    id: 'hadith_continuous_adhkar',
    title: 'الأذكار الموظفة بعد الصلوات المكتوبة',
    text: '«من سبح الله في دبر كل صلاة ثلاثاً وثلاثين، وحمد الله ثلاثاً وثلاثين، وكبر الله ثلاثاً وثلاثين، فتلك تسعة وتسعون، وقال تمام المائة: لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير؛ غفرت خطاياه وإن كانت مثل زبد البحر»',
    source: 'صحيح مسلم',
    category: 'الأذكار اليومية الراتبة',
    dayNumber: 0,
    notes: 'وظيفة يومية ملازمة لجميع أيام البرنامج',
    active: true,
  },
];

// Helper: Get today's date formatted as YYYY-MM-DD
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Format Arabic Date
export function formatArabicDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Calculate week number from day number (1..45)
export function getWeekFromDay(dayNumber: number): number {
  if (dayNumber <= 0) return 0;
  return Math.min(PROGRAM_DURATION_WEEKS, Math.ceil(dayNumber / 5));
}

// Ensure practices are seeded
export async function ensurePracticesSeeded(): Promise<Practice[]> {
  try {
    const snap = await getDocs(collection(db, 'practices'));
    if (snap.empty) {
      // Seed default initial practices
      for (const p of INITIAL_PRACTICES) {
        await setDoc(doc(db, 'practices', p.id), p);
      }
      return INITIAL_PRACTICES;
    }
    const list: Practice[] = [];
    snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Practice));
    return list;
  } catch (err) {
    console.warn('Could not seed/load practices from Firestore:', err);
    return INITIAL_PRACTICES;
  }
}

export async function getAllPractices(): Promise<Practice[]> {
  try {
    const snap = await getDocs(collection(db, 'practices'));
    if (!snap.empty) {
      const list: Practice[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Practice));
      return list;
    }
  } catch (err) {
    console.warn('Could not load practices from Firestore, using default:', err);
  }
  return INITIAL_PRACTICES;
}

export async function addPractice(
  practice: Omit<Practice, 'id' | 'createdAt'>
): Promise<Practice> {
  const id = `practice_${Date.now()}`;
  const record: Practice = {
    ...practice,
    id,
    active: true,
    createdAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'practices', id), record);
  } catch (err) {
    console.warn('Could not save practice to Firestore:', err);
  }
  return record;
}

export const addNewPractice = addPractice;

export async function updatePractice(
  id: string,
  updates: Partial<Practice>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'practices', id), updates);
  } catch (err) {
    console.warn('Could not update practice in Firestore:', err);
    throw err;
  }
}

export async function deletePractice(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'practices', id));
  } catch (err) {
    console.warn('Could not delete practice from Firestore:', err);
    throw err;
  }
}

// User Profile Operations
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    console.warn('Could not fetch user profile from Firestore:', err);
  }
  return null;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  if (!profile.uid) return;
  try {
    await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
  } catch (err) {
    console.warn('Could not save user profile to Firestore:', err);
  }
}

export async function updateStudentName(
  uid: string,
  newName: string
): Promise<void> {
  if (!uid) return;
  const cleanName = newName.trim();
  if (!cleanName) return;
  try {
    await setDoc(
      doc(db, 'users', uid),
      {
        name: cleanName,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Could not update student name in Firestore:', err);
    throw err;
  }
}

// Helpers for in-session user progress
function getCompletionsKey(userId: string): string {
  return `zad_progress_${userId}`;
}

// Daily Progress Operations
export async function getStudentTodayProgress(
  userId: string,
  date: string = getTodayDateString()
): Promise<Record<string, boolean>> {
  if (!userId) return {};
  try {
    const q = query(
      collection(db, 'dailyProgress'),
      where('userId', '==', userId),
      where('date', '==', date)
    );
    const snap = await getDocs(q);
    const result: Record<string, boolean> = {};
    snap.forEach((d) => {
      const data = d.data();
      if (data.completed && data.practiceId) {
        result[data.practiceId] = true;
      }
    });
    return result;
  } catch (err) {
    console.warn('Fallback to local storage for today progress:', err);
    try {
      const raw = localStorage.getItem(getCompletionsKey(userId));
      if (!raw) return {};
      const data = JSON.parse(raw) as Record<string, boolean>;
      const prefix = `${date}_`;
      const result: Record<string, boolean> = {};
      for (const [key, val] of Object.entries(data)) {
        if (key.startsWith(prefix) && val) {
          result[key.substring(prefix.length)] = true;
        }
      }
      return result;
    } catch {
      return {};
    }
  }
}

export async function markPracticeComplete(
  userId: string,
  practiceId: string,
  date: string = getTodayDateString()
): Promise<void> {
  if (!userId || !practiceId) return;
  const docId = `${userId}_${date}_${practiceId}`;
  const record: DailyProgress = {
    id: docId,
    userId,
    practiceId,
    date,
    completed: true,
    completedAt: new Date().toISOString(),
  };

  // Immediate local cache
  try {
    const raw = localStorage.getItem(getCompletionsKey(userId));
    const localData = raw ? JSON.parse(raw) : {};
    localData[`${date}_${practiceId}`] = true;
    localStorage.setItem(getCompletionsKey(userId), JSON.stringify(localData));
  } catch {}

  // Persistent Firestore record
  try {
    await setDoc(doc(db, 'dailyProgress', docId), record);
  } catch (err) {
    console.error('Error saving practice progress to Firestore:', err);
    throw err;
  }
}

export async function unmarkPracticeComplete(
  userId: string,
  practiceId: string,
  date: string = getTodayDateString()
): Promise<void> {
  if (!userId || !practiceId) return;
  const docId = `${userId}_${date}_${practiceId}`;

  // Immediate local cache
  try {
    const raw = localStorage.getItem(getCompletionsKey(userId));
    const localData = raw ? JSON.parse(raw) : {};
    delete localData[`${date}_${practiceId}`];
    localStorage.setItem(getCompletionsKey(userId), JSON.stringify(localData));
  } catch {}

  // Delete from Firestore
  try {
    await deleteDoc(doc(db, 'dailyProgress', docId));
  } catch (err) {
    console.error('Error deleting practice progress from Firestore:', err);
    throw err;
  }
}

export async function getStudentAllProgress(
  userId: string
): Promise<DailyProgress[]> {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, 'dailyProgress'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const list: DailyProgress[] = [];
    snap.forEach((d) => {
      list.push(d.data() as DailyProgress);
    });
    list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return list;
  } catch (err) {
    console.warn('Fallback to local progress storage:', err);
    try {
      const raw = localStorage.getItem(getCompletionsKey(userId));
      if (!raw) return [];
      const data = JSON.parse(raw) as Record<string, boolean>;
      const list: DailyProgress[] = [];
      for (const [key, val] of Object.entries(data)) {
        if (val) {
          const parts = key.split('_');
          const date = parts[0];
          const practiceId = parts.slice(1).join('_');
          list.push({
            id: key,
            userId,
            practiceId,
            date,
            completed: true,
            completedAt: date,
          });
        }
      }
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      return list;
    } catch {
      return [];
    }
  }
}

export function getPracticesForDay(
  dayNumber: number,
  allPractices: Practice[]
): Practice[] {
  return allPractices.filter(
    (p) =>
      p.active !== false &&
      (p.dayNumber === dayNumber || p.dayNumber === 0 || !p.dayNumber)
  );
}

export async function getAdminDashboardData(
  _allPractices: Practice[]
): Promise<{
  totalStudents: number;
  completedTodayCount: number;
  notCompletedTodayCount: number;
  studentsList: StudentStats[];
}> {
  try {
    const today = getTodayDateString();

    // 1. Fetch all student profiles from Firestore
    const usersSnap = await getDocs(collection(db, 'users'));
    const students: UserProfile[] = [];
    usersSnap.forEach((d) => {
      const u = d.data() as UserProfile;
      if (u.role === 'student') {
        students.push(u);
      }
    });

    // 2. Fetch all dailyProgress records from Firestore
    const progressSnap = await getDocs(collection(db, 'dailyProgress'));
    const progressByUser: Record<string, DailyProgress[]> = {};
    progressSnap.forEach((d) => {
      const p = d.data() as DailyProgress;
      if (p.completed && p.userId) {
        if (!progressByUser[p.userId]) progressByUser[p.userId] = [];
        progressByUser[p.userId].push(p);
      }
    });

    // 3. Build detailed StudentStats for each student
    const studentsList: StudentStats[] = students.map((user) => {
      const userRecords = progressByUser[user.uid] || [];
      const distinctDates = Array.from(new Set(userRecords.map((r) => r.date))).sort();
      const completedDaysCount = distinctDates.length;
      const totalCompleted = userRecords.length;

      const todayRecords = userRecords.filter((r) => r.date === today);
      const completedTodayCount = todayRecords.length;
      const todayCompletedAll = completedTodayCount >= 2;

      const completionRate = Math.min(
        100,
        Math.round((totalCompleted / PROGRAM_TOTAL_HADITHS) * 100)
      );

      // Calculate streaks
      let currentStreak = 0;
      let maxStreak = 0;
      let tempStreak = 0;
      let lastDate: Date | null = null;

      for (const dStr of distinctDates) {
        const dObj = new Date(dStr);
        if (!lastDate) {
          tempStreak = 1;
        } else {
          const diffDays = Math.round(
            (dObj.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)
          );
          if (diffDays === 1) {
            tempStreak += 1;
          } else if (diffDays > 1) {
            tempStreak = 1;
          }
        }
        lastDate = dObj;
        if (tempStreak > maxStreak) maxStreak = tempStreak;
      }
      currentStreak = tempStreak;

      return {
        user,
        totalCompleted,
        completedTodayCount,
        todayCompletedAll,
        completionRate,
        completedDaysCount,
        recentRecords: userRecords.slice(0, 10),
        allRecords: userRecords,
        currentStreak,
        maxStreak,
      };
    });

    const totalStudents = studentsList.length;
    const completedTodayCount = studentsList.filter(
      (s) => s.completedTodayCount > 0
    ).length;
    const notCompletedTodayCount = totalStudents - completedTodayCount;

    return {
      totalStudents,
      completedTodayCount,
      notCompletedTodayCount,
      studentsList,
    };
  } catch (err) {
    console.warn('Error fetching admin dashboard data from Firestore:', err);
    return {
      totalStudents: 0,
      completedTodayCount: 0,
      notCompletedTodayCount: 0,
      studentsList: [],
    };
  }
}

export async function clearAllProgramData(): Promise<void> {
  try {
    const progressSnap = await getDocs(collection(db, 'dailyProgress'));
    const batch = writeBatch(db);
    progressSnap.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
  } catch (err) {
    console.warn('Could not clear Firestore progress:', err);
  }
}

