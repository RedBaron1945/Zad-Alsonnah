import { DailyHadith, DailyProgress } from '../types';
import { getSaturdayBasedDayIndex, ARABIC_DAYS } from './weekDateUtils';
import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';

/**
 * Default Templates for a complete Saturday-to-Friday week
 */
const DEFAULT_WEEK_HADITHS: Record<
  number,
  Array<{ title: string; content: string; source?: string; category?: string }>
> = {
  // 0: السبت
  0: [
    {
      title: 'ذكر ما بعد إسباغ الوضوء',
      content:
        '«ما منكم من أحد يتوضأ فيبلغ - أو فيسبغ - الوضوء ثم يقول: أشهد أن لا إله إلا الله وحده لا شريك له، وأشهد أن محمداً عبده ورسوله؛ إلا فتحت له أبواب الجنة الثمانية يدخل من أيها شاء»',
      source: 'صحيح مسلم',
      category: 'أذكار الطهارة والصلاة',
    },
    {
      title: 'دعاء دخول المسجد والخروج منه',
      content:
        '«إذا دخل أحدكم المسجد فليسلم على النبي ﷺ وليقل: اللهم افتح لي أبواب رحمتك، وإذا خرج فليقل: اللهم إني أسألك من فضلك»',
      source: 'صحيح مسلم',
      category: 'سنن المساجد',
    },
  ],
  // 1: الأحد
  1: [
    {
      title: 'كفارة المجلس وحفظ اللسان',
      content:
        '«من جلس في مجلس فكثر فيه لغطه، فقال قبل أن يقوم من مجلسه ذلك: سبحانك اللهم وبحمدك، أشهد أن لا إله إلا أنت، أستغفرك وأتوب إليك؛ إلا غفر له ما كان في مجلسه ذلك»',
      source: 'سنن الترمذي',
      category: 'آداب المجالس',
    },
    {
      title: 'إفشاء السلام وبذل المحبة',
      content:
        '«لا تدخلون الجنة حتى تؤمنوا، ولا تؤمنوا حتى تحابوا، أولا أدلكم على شيء إذا فعلتموه تحاببتم؟ أفشوا السلام بينكم»',
      source: 'صحيح مسلم',
      category: 'الآداب والأخلاق',
    },
  ],
  // 2: الاثنين
  2: [
    {
      title: 'صلاة الضحى (صلاة الأوابين)',
      content:
        '«يصبح على كل سلامى من أحدكم صدقة... ويجزئ من ذلك ركعتان يركعهما من الضحى»',
      source: 'صحيح مسلم',
      category: 'النوافل والسنن الراتبة',
    },
    {
      title: 'الأذكار الموظفة بعد الصلوات المكتوبة',
      content:
        '«من سبح الله في دبر كل صلاة ثلاثاً وثلاثين، وحمد الله ثلاثاً وثلاثين، وكبر الله ثلاثاً وثلاثين، فتلك تسعة وتسعون، وقال تمام المائة: لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير؛ غفرت خطاياه وإن كانت مثل زبد البحر»',
      source: 'صحيح مسلم',
      category: 'أذكار ما بعد الصلاة',
    },
  ],
  // 3: الثلاثاء
  3: [
    {
      title: 'سيد الاستغفار',
      content:
        '«اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت، أعوذ بك من شر ما صنعت، أبوء لك بنعمتك علي، وأبوء بذنبي فاغفر لي فإنه لا يغفر الذنوب إلا أنت»',
      source: 'صحيح البخاري',
      category: 'أذكار الصباح والمساء',
    },
    {
      title: 'سنة ركعتي الفجر',
      content: '«ركعتا الفجر خير من الدنيا وما فيها»',
      source: 'صحيح مسلم',
      category: 'السنن الراتبة',
    },
  ],
  // 4: الأربعاء
  4: [
    {
      title: 'دعاء الخروج من المنزل والتوكل',
      content:
        '«إذا خرج الرجل من بيته فقال: بسم الله، توكلت على الله، لا حول ولا قوة إلا بالله، يقال له: هُديت وكُفيت ووُقيت، وتنحى عنه الشيطان»',
      source: 'سنن أبي داود والترمذي',
      category: 'الأذكار اليومية',
    },
    {
      title: 'حمد الله والثناء عليه بعد الطعام',
      content:
        '«من أكل طعاماً ثم قال: الحمد لله الذي أطعمني هذا الطعام ورزقنيه من غير حول مني ولا قوة؛ غفر له ما تقدم من ذنبه»',
      source: 'سنن أبي داود والترمذي',
      category: 'آداب الطعام',
    },
  ],
  // 5: الخميس
  5: [
    {
      title: 'الرضا بالله رباً وبالإسلام ديناً وبمحمد ﷺ نبياً',
      content:
        '«ذاق طعم الإيمان من رضي بالله رباً، وبالإسلام ديناً، وبمحمد رسولاً»',
      source: 'صحيح مسلم',
      category: 'ترسيخ الإيمان',
    },
    {
      title: 'إماطة الأذى عن الطريق والصدقة اليومية',
      content:
        '«الإيمان بضع وسبعون شعبة، فأفضلها قول لا إله إلا الله، وأدناها إماطة الأذى عن الطريق»',
      source: 'متفق عليه',
      category: 'أعمال البر المجتمعية',
    },
  ],
  // 6: الجمعة
  6: [
    {
      title: 'الإكثار من الصلاة والسلام على النبي ﷺ يوم الجمعة',
      content:
        '«إن من أفضل أيامكم يوم الجمعة، فيه خُلق آدم، وفيه قُبض، وفيه النفخة، وفيه الصعقة، فأكثروا علي من الصلاة فيه فإن صلاتكم معروضة علي»',
      source: 'سنن أبي داود والنسائي',
      category: 'سنن يوم الجمعة',
    },
    {
      title: 'قراءة سورة الكهف والتبكير',
      content:
        '«من قرأ سورة الكهف في يوم الجمعة أضاء له من النور ما بين الجمعتين»',
      source: 'سنن البيهقي والحاكم',
      category: 'سنن يوم الجمعة',
    },
  ],
};

function generateHadithsForDate(dateStr: string): DailyHadith[] {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const saturdayIndex = getSaturdayBasedDayIndex(dateObj);
  const dayName = ARABIC_DAYS[saturdayIndex] || '';

  const templates = DEFAULT_WEEK_HADITHS[saturdayIndex] || [
    {
      title: 'تطبيق السنة النبوية اليومية',
      content: '«من أحيا سنتي فقد أحبني، ومن أحبني كان معي في الجنة»',
      source: 'سنن الترمذي',
      category: 'سنن عامة',
    },
  ];

  return templates.map((tpl, idx) => ({
    id: `hadith_${dateStr}_${idx + 1}`,
    date: dateStr,
    dayName,
    title: tpl.title,
    content: tpl.content,
    source: tpl.source,
    category: tpl.category || 'تطبيقات السنة النبوية',
    order: idx + 1,
    createdAt: dateStr,
    updatedAt: dateStr,
  }));
}

/**
 * Fetch all Hadiths for a specific date (YYYY-MM-DD)
 */
export async function getDailyHadithsForDate(
  dateStr: string
): Promise<DailyHadith[]> {
  try {
    const q = query(
      collection(db, 'dailyHadiths'),
      where('date', '==', dateStr)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list: DailyHadith[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as DailyHadith));
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
      return list;
    }
  } catch (err) {
    console.warn('Could not load daily hadiths from Firestore, generating fallback:', err);
  }
  return generateHadithsForDate(dateStr);
}

/**
 * Fetch all Hadiths for a date range or list of dates
 */
export async function getDailyHadithsForDates(
  dates: string[]
): Promise<Record<string, DailyHadith[]>> {
  const result: Record<string, DailyHadith[]> = {};
  for (const dateStr of dates) {
    result[dateStr] = await getDailyHadithsForDate(dateStr);
  }
  return result;
}

export async function ensureWeekDatesSeeded(
  dates: string[]
): Promise<Record<string, DailyHadith[]>> {
  return getDailyHadithsForDates(dates);
}

export async function addDailyHadith(
  hadith: Omit<DailyHadith, 'id' | 'createdAt'>
): Promise<DailyHadith> {
  const id = `hadith_${hadith.date}_${Date.now()}`;
  const record: DailyHadith = {
    ...hadith,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'dailyHadiths', id), record);
  } catch (err) {
    console.warn('Could not save hadith to Firestore:', err);
  }
  return record;
}

export async function updateDailyHadith(
  id: string,
  updates: Partial<Omit<DailyHadith, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'dailyHadiths', id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Could not update daily hadith in Firestore:', err);
    throw err;
  }
}

export async function deleteDailyHadith(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'dailyHadiths', id));
  } catch (err) {
    console.warn('Could not delete daily hadith from Firestore:', err);
    throw err;
  }
}

/**
 * Helpers for in-session user progress
 */
function getCompletionsKey(userId: string): string {
  return `zad_progress_${userId}`;
}

export async function getStudentHadithCompletionsForDate(
  userId: string,
  dateStr: string
): Promise<Record<string, boolean>> {
  if (!userId) return {};
  try {
    const q = query(
      collection(db, 'dailyProgress'),
      where('userId', '==', userId),
      where('date', '==', dateStr)
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
    console.warn('Fallback to local storage for hadith completions:', err);
    try {
      const raw = localStorage.getItem(getCompletionsKey(userId));
      if (!raw) return {};
      const data = JSON.parse(raw) as Record<string, boolean>;
      const prefix = `${dateStr}_`;
      const result: Record<string, boolean> = {};
      for (const [key, val] of Object.entries(data)) {
        if (key.startsWith(prefix) && val) {
          const hadithId = key.substring(prefix.length);
          result[hadithId] = true;
        }
      }
      return result;
    } catch {
      return {};
    }
  }
}

export async function setHadithCompletion(
  userId: string,
  hadithId: string,
  dateStr: string,
  completed: boolean,
  _studentName?: string
): Promise<void> {
  if (!userId || !hadithId) return;
  const docId = `${userId}_${dateStr}_${hadithId}`;

  // Local cache update
  try {
    const raw = localStorage.getItem(getCompletionsKey(userId));
    const data: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    const key = `${dateStr}_${hadithId}`;
    if (completed) {
      data[key] = true;
    } else {
      delete data[key];
    }
    localStorage.setItem(getCompletionsKey(userId), JSON.stringify(data));
  } catch (err) {
    console.warn('Could not save local completion:', err);
  }

  // Firestore update
  try {
    if (completed) {
      const record: DailyProgress = {
        id: docId,
        userId,
        practiceId: hadithId,
        date: dateStr,
        completed: true,
        completedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'dailyProgress', docId), record);
    } else {
      await deleteDoc(doc(db, 'dailyProgress', docId));
    }
  } catch (err) {
    console.error('Error saving hadith completion to Firestore:', err);
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
          const hadithId = parts.slice(1).join('_');
          list.push({
            id: key,
            userId,
            practiceId: hadithId,
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
