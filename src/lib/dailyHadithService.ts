import { DailyHadith, DailyProgress } from '../types';
import { getSaturdayBasedDayIndex, ARABIC_DAYS } from './weekDateUtils';
import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
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

const LOCAL_STORAGE_HADITHS_KEY = 'zad_alsonnah_hadiths_custom';
const LOCAL_STORAGE_DELETED_KEY = 'zad_alsonnah_hadiths_deleted_ids';

function getDeletedHadithIds(): string[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_DELETED_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function markHadithDeleted(id: string) {
  try {
    if (typeof window === 'undefined') return;
    const list = getDeletedHadithIds();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(LOCAL_STORAGE_DELETED_KEY, JSON.stringify(list));
    }
  } catch {}
}

function unmarkHadithDeleted(id: string) {
  try {
    if (typeof window === 'undefined') return;
    const list = getDeletedHadithIds().filter((item) => item !== id);
    localStorage.setItem(LOCAL_STORAGE_DELETED_KEY, JSON.stringify(list));
  } catch {}
}

function getLocalHadiths(): Record<string, DailyHadith> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_HADITHS_KEY) : null;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalHadith(hadith: DailyHadith) {
  try {
    if (typeof window === 'undefined') return;
    unmarkHadithDeleted(hadith.id);
    const map = getLocalHadiths();
    map[hadith.id] = hadith;
    localStorage.setItem(LOCAL_STORAGE_HADITHS_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

function deleteLocalHadith(id: string) {
  try {
    if (typeof window === 'undefined') return;
    markHadithDeleted(id);
    const map = getLocalHadiths();
    delete map[id];
    localStorage.setItem(LOCAL_STORAGE_HADITHS_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('LocalStorage delete error:', e);
  }
}

/**
 * Fetch all Hadiths for a specific date (YYYY-MM-DD)
 */
export async function getDailyHadithsForDate(
  dateStr: string
): Promise<DailyHadith[]> {
  const localMap = getLocalHadiths();
  const deletedIds = new Set(getDeletedHadithIds());
  const localHadithsForDate = Object.values(localMap).filter(
    (h) => h.date === dateStr && !deletedIds.has(h.id)
  );

  let firestoreList: DailyHadith[] = [];
  try {
    const q = query(
      collection(db, 'dailyHadiths'),
      where('date', '==', dateStr)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      snap.forEach((d) => {
        const data = d.data() as any;
        if (!data.deleted && !deletedIds.has(d.id)) {
          firestoreList.push({ ...data, id: d.id } as DailyHadith);
        }
      });
    }
  } catch (err) {
    console.warn('Could not load daily hadiths from Firestore collection, checking local & fallback:', err);
  }

  // Combine default template + firestore list + local overrides
  const combinedMap = new Map<string, DailyHadith>();
  const defaultTemplates = generateHadithsForDate(dateStr);
  defaultTemplates.forEach((h) => {
    if (!deletedIds.has(h.id)) {
      combinedMap.set(h.id, h);
    }
  });
  firestoreList.forEach((h) => combinedMap.set(h.id, h));
  localHadithsForDate.forEach((h) => combinedMap.set(h.id, h));

  const result = Array.from(combinedMap.values());
  result.sort((a, b) => (a.order || 0) - (b.order || 0));
  return result;
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
    id,
    date: String(hadith.date || '').trim(),
    dayName: String(hadith.dayName || '').trim(),
    title: String(hadith.title || '').trim(),
    content: String(hadith.content || '').trim(),
    source: String(hadith.source || 'حديث شريف').trim(),
    category: String(hadith.category || 'تطبيقات السنة النبوية').trim(),
    order: Number.isFinite(Number(hadith.order)) ? Number(hadith.order) : 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Immediately cache locally
  saveLocalHadith(record);

  // 2. Persist to Firestore dailyHadiths
  try {
    await setDoc(doc(db, 'dailyHadiths', id), record);
  } catch (err: any) {
    console.warn('Could not save hadith to dailyHadiths directly, attempting admin fallback:', err);
    try {
      await setDoc(doc(db, 'adminSettings', `hadith_${id}`), record, { merge: true });
    } catch (fbErr) {
      console.warn('adminSettings fallback note:', fbErr);
    }
  }

  return record;
}

export async function updateDailyHadith(
  id: string,
  updates: Partial<Omit<DailyHadith, 'id' | 'createdAt'>>
): Promise<void> {
  const cleanUpdates: Record<string, any> = {
    id,
    updatedAt: new Date().toISOString(),
  };
  if (updates.title !== undefined) cleanUpdates.title = String(updates.title).trim();
  if (updates.content !== undefined) cleanUpdates.content = String(updates.content).trim();
  if (updates.date !== undefined) cleanUpdates.date = String(updates.date).trim();
  if (updates.dayName !== undefined) cleanUpdates.dayName = String(updates.dayName).trim();
  if (updates.source !== undefined) cleanUpdates.source = String(updates.source).trim();
  if (updates.category !== undefined) cleanUpdates.category = String(updates.category).trim();
  if (updates.order !== undefined) {
    const num = Number(updates.order);
    cleanUpdates.order = Number.isFinite(num) ? num : 1;
  }

  // 1. Immediately cache updates locally
  const localMap = getLocalHadiths();
  const existing = localMap[id] || {};
  saveLocalHadith({ ...existing, ...cleanUpdates } as DailyHadith);

  // 2. Persist to Firestore
  try {
    await setDoc(doc(db, 'dailyHadiths', id), cleanUpdates, { merge: true });
  } catch (err: any) {
    console.warn('Could not update daily hadith in dailyHadiths directly, attempting admin fallback:', err);
    try {
      await setDoc(doc(db, 'adminSettings', `hadith_${id}`), cleanUpdates, { merge: true });
    } catch (fbErr) {
      console.warn('adminSettings update fallback note:', fbErr);
    }
  }
}

export async function deleteDailyHadith(id: string): Promise<void> {
  deleteLocalHadith(id);
  try {
    await setDoc(doc(db, 'dailyHadiths', id), { id, deleted: true }, { merge: true });
  } catch (err) {
    try {
      await deleteDoc(doc(db, 'dailyHadiths', id));
    } catch {}
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
  const result: Record<string, boolean> = {};

  // 1. Instant load from local storage
  try {
    const raw = localStorage.getItem(getCompletionsKey(userId));
    if (raw) {
      const data = JSON.parse(raw) as Record<string, boolean>;
      const prefix = `${dateStr}_`;
      for (const [key, val] of Object.entries(data)) {
        if (key.startsWith(prefix) && val) {
          const hadithId = key.substring(prefix.length);
          result[hadithId] = true;
        }
      }
    }
  } catch (err) {
    console.warn('Local storage cache read error:', err);
  }

  // 2. Fetch and merge from Firestore
  try {
    const q = query(
      collection(db, 'dailyProgress'),
      where('userId', '==', userId),
      where('date', '==', dateStr)
    );
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const data = d.data();
      if (data.completed && data.practiceId) {
        result[data.practiceId] = true;
      }
    });
  } catch (err) {
    console.warn('Firestore read error in getStudentHadithCompletionsForDate:', err);
  }

  return result;
}

export async function setHadithCompletion(
  userId: string,
  hadithId: string,
  dateStr: string,
  completed: boolean,
  studentName?: string,
  studentEmail?: string
): Promise<void> {
  if (!userId || !hadithId) return;
  const docId = `${userId}_${dateStr}_${hadithId}`;

  // 1. Local cache update for instant responsiveness
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

  // 2. Firestore persistent update
  try {
    if (completed) {
      const record: DailyProgress & { userName?: string; userEmail?: string } = {
        id: docId,
        userId,
        practiceId: hadithId,
        date: dateStr,
        completed: true,
        completedAt: new Date().toISOString(),
      };
      if (studentName) record.userName = studentName;
      if (studentEmail) record.userEmail = studentEmail;
      await setDoc(doc(db, 'dailyProgress', docId), record, { merge: true });
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
