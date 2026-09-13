import React, { useEffect, useState, useMemo } from 'react';
import {
  getAdminDashboardData,
  ensurePracticesSeeded,
  addNewPractice,
  updateStudentName,
  deletePractice,
  clearAllProgramData,
  getTodayDateString,
  getWeekFromDay,
} from '../lib/dataService';
import {
  getCurrentProgramWeekNumber,
  getProgramWeekInfo,
} from '../lib/weekDateUtils';
import {
  StudentStats,
  Practice,
  PROGRAM_DURATION_DAYS,
  PROGRAM_DURATION_WEEKS,
} from '../types';
import { StudentDetailsView } from './StudentDetailsView';
import { AdminDailyHadithsManager } from './AdminDailyHadithsManager';
import { AdminAchievementMatrix } from './AdminAchievementMatrix';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  Users,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Edit3,
  PlusCircle,
  BookOpen,
  Trash2,
  Calendar,
  Award,
  ChevronLeft,
  X,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'students' | 'matrix' | 'hadiths'>('students');
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<{
    totalStudents: number;
    completedTodayCount: number;
    notCompletedTodayCount: number;
    studentsList: StudentStats[];
  }>({
    totalStudents: 0,
    completedTodayCount: 0,
    notCompletedTodayCount: 0,
    studentsList: [],
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentStats | null>(null);

  const currentWeekInfo = useMemo(() => {
    const wNum = getCurrentProgramWeekNumber();
    return getProgramWeekInfo(wNum);
  }, []);

  // Student Name Edit State (Admin editing a student's name)
  const [editingStudent, setEditingStudent] = useState<StudentStats | null>(null);
  const [newStudentName, setNewStudentName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [editNameError, setEditNameError] = useState('');

  // Add Hadith Modal State
  const [isAddingHadith, setIsAddingHadith] = useState(false);
  const [hadithTitle, setHadithTitle] = useState('');
  const [hadithText, setHadithText] = useState('');
  const [hadithSource, setHadithSource] = useState('');
  const [hadithCategory, setHadithCategory] = useState('سنن وآداب نبوية');
  const [hadithDayNumber, setHadithDayNumber] = useState<number>(1);
  const [isEverydayHadith, setIsEverydayHadith] = useState(false);
  const [hadithNotes, setHadithNotes] = useState('');
  const [isSavingHadith, setIsSavingHadith] = useState(false);
  const [hadithFormError, setHadithFormError] = useState('');

  // Clear data confirmation modal
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      const [data, seeded] = await Promise.all([
        getAdminDashboardData([]),
        ensurePracticesSeeded().catch((err) => {
          console.warn('Practice seed non-fatal notice:', err);
          return [];
        }),
      ]);
      setStats(data);
      if (seeded && seeded.length > 0) {
        setPractices(seeded);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Listen to real-time changes in users collection
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      () => {
        getAdminDashboardData([]).then((data) => setStats(data)).catch(console.warn);
      },
      (err) => console.warn('Users snapshot listener error:', err)
    );

    // Listen to real-time changes in dailyProgress collection
    const unsubProgress = onSnapshot(
      collection(db, 'dailyProgress'),
      () => {
        getAdminDashboardData([]).then((data) => setStats(data)).catch(console.warn);
      },
      (err) => console.warn('Progress snapshot listener error:', err)
    );

    return () => {
      unsubUsers();
      unsubProgress();
    };
  }, []);

  // Filter students by search query
  const filteredStudents = stats.studentsList.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.user.name.toLowerCase().includes(q) ||
      s.user.email.toLowerCase().includes(q)
    );
  });

  // Handle saving student name edit
  const handleSaveStudentName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const cleanName = newStudentName.trim();
    if (!cleanName) {
      setEditNameError('يرجى إدخال اسم صحيح');
      return;
    }

    try {
      setIsSavingName(true);
      await updateStudentName(editingStudent.user.uid, cleanName);

      // Update in local state
      setStats((prev) => ({
        ...prev,
        studentsList: prev.studentsList.map((item) =>
          item.user.uid === editingStudent.user.uid
            ? { ...item, user: { ...item.user, name: cleanName } }
            : item
        ),
      }));

      if (selectedStudent?.user.uid === editingStudent.user.uid) {
        setSelectedStudent((prev) =>
          prev ? { ...prev, user: { ...prev.user, name: cleanName } } : null
        );
      }

      setEditingStudent(null);
      setEditNameError('');
    } catch {
      setEditNameError('فشل حفظ الاسم، يرجى المحاولة ثانية');
    } finally {
      setIsSavingName(false);
    }
  };

  // Handle adding new hadith/practice
  const handleCreateHadith = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hadithTitle.trim() || !hadithText.trim()) {
      setHadithFormError('يرجى كتابة عنوان الحديث ونصه الشريف');
      return;
    }

    try {
      setIsSavingHadith(true);
      const dayNumber = isEverydayHadith ? 0 : Number(hadithDayNumber);
      const weekNumber = getWeekFromDay(dayNumber);

      const created = await addNewPractice({
        title: hadithTitle.trim(),
        text: hadithText.trim(),
        source: hadithSource.trim() || 'حديث شريف',
        category: hadithCategory.trim(),
        dayNumber,
        weekNumber,
        notes: hadithNotes.trim(),
        active: true,
      });

      setPractices((prev) => [...prev, created]);
      setIsAddingHadith(false);
      // Reset form
      setHadithTitle('');
      setHadithText('');
      setHadithSource('');
      setHadithNotes('');
      setHadithFormError('');
    } catch {
      setHadithFormError('تعذر إضافة الحديث، يرجى المحاولة لاحقاً');
    } finally {
      setIsSavingHadith(false);
    }
  };

  // Handle deleting a hadith
  const handleDeleteHadith = async (practiceId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحديث من البرنامج؟')) return;
    try {
      await deletePractice(practiceId);
      setPractices((prev) => prev.filter((p) => p.id !== practiceId));
    } catch (err) {
      console.error('Error deleting practice:', err);
    }
  };

  // Handle clear all data (Wipe)
  const handleClearAllData = async () => {
    try {
      setIsClearingData(true);
      await clearAllProgramData();
      await loadDashboardData();
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Error clearing data:', err);
    } finally {
      setIsClearingData(false);
    }
  };

  // Calculate overall program stats
  const averageCompletionRate =
    stats.totalStudents > 0
      ? Math.round(
          stats.studentsList.reduce((acc, s) => acc + s.completionRate, 0) /
            stats.totalStudents
        )
      : 0;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 text-sm font-semibold">
          جارٍ تحميل لوحة إدارة برنامج زاد السنة...
        </p>
      </div>
    );
  }

  // If a student is selected for detailed inspection
  if (selectedStudent) {
    return (
      <StudentDetailsView
        studentStats={selectedStudent}
        practices={practices}
        onBack={() => setSelectedStudent(null)}
        onEditName={() => {
          setEditingStudent(selectedStudent);
          setNewStudentName(selectedStudent.user.name);
          setEditNameError('');
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Banner: Program Header */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                لوحة إدارة برنامج زاد السنة لتكوين النسيم
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
                إدارة المشرف
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              يبدأ السبت 12 سبتمبر 2026 • متابعة تطبيق السنن والأحاديث النبوية طوال مدة البرنامج ({PROGRAM_DURATION_WEEKS} أسابيع -{' '}
              {PROGRAM_DURATION_DAYS} يوماً حتى 11 نوفمبر • 90 حديثاً)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={loadDashboardData}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>تحديث</span>
            </button>

            <button
              onClick={() => setActiveTab('hadiths')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إدارة وجدول الأحاديث</span>
            </button>

            <button
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all cursor-pointer"
              title="تصفير بيانات الطلاب والإنجاز"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">حذف وتصفير البيانات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Program 74-Day Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500">إجمالي الطلاب</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">
            {stats.totalStudents}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">طالب مسجل في البرنامج</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500">أنجزوا تطبيقات اليوم</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">
            {stats.completedTodayCount}
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-1">
            من أصل {stats.totalStudents} طالب اليوم
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500">
              مدة البرنامج الكلية
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-800">
            {PROGRAM_DURATION_DAYS}{' '}
            <span className="text-xs font-bold text-gray-500">يوماً</span>
          </div>
          <p className="text-[11px] text-amber-700 mt-1">
            {PROGRAM_DURATION_WEEKS} أسابيع (45 يوم مدارسة • 90 حديثاً)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500">متوسط إنجاز الطلاب</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-800">
            {averageCompletionRate}%
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            نسبة الإنجاز من البرنامج الكلي
          </p>
        </div>
      </div>

      {/* Tabs Navigation: Students List vs Matrix vs Hadiths Management */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('students')}
          className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeTab === 'students'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>قائمة الطلاب العامة ({stats.totalStudents})</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeTab === 'matrix'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>جدول الإنجاز الأسبوعي والشهري</span>
        </button>

        <button
          onClick={() => setActiveTab('hadiths')}
          className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeTab === 'hadiths'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>أحاديث وتطبيقات البرنامج ({practices.length})</span>
        </button>
      </div>

      {/* TAB 1: Students Table */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-2xs overflow-hidden">
          {/* Table Header & Search */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                سجل إنجاز الطلاب
              </h3>
              <p className="text-xs text-gray-500">
                متابعة تطبيق الطلاب لبرنامج زاد السنة خلال مدة الـ{' '}
                {PROGRAM_DURATION_DAYS} يوماً
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                className="w-full pr-9 pl-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
              />
            </div>
          </div>

          {/* Students Table */}
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-800">
                {searchQuery
                  ? 'لا يوجد طلاب مطابقون لنتيجة البحث'
                  : 'لا يوجد طلاب مسجلون حالياً في البرنامج'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                عندما يسجل أي طالب عبر حسابه أو بريده، سيظهر اسمه وإنجازه اليومي هنا
                فوراً.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                    <th className="py-3 px-4">اسم الطالب</th>
                    <th className="py-3 px-4">البريد الإلكتروني</th>
                    <th className="py-3 px-4">إنجاز اليوم</th>
                    <th className="py-3 px-4 text-center">أيام الأسبوع الحالي ({currentWeekInfo.weekLabel})</th>
                    <th className="py-3 px-4">
                      الأيام المنجزة (من {PROGRAM_DURATION_DAYS} يوماً)
                    </th>
                    <th className="py-3 px-4">نسبة الإنجاز الكلية</th>
                    <th className="py-3 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredStudents.map((student) => {
                    return (
                      <tr
                        key={student.user.uid}
                        className="hover:bg-gray-50/70 transition-colors"
                      >
                        {/* Student Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                              {student.user.name ? student.user.name[0] : 'ط'}
                            </div>
                            <div>
                              <span className="font-extrabold text-gray-900 block text-xs sm:text-sm">
                                {student.user.name}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">
                          {student.user.email || '—'}
                        </td>

                        {/* Today's Status */}
                        <td className="py-3.5 px-4">
                          {student.todayCompletedAll ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              أنجز اليوم
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                              <Clock className="w-3 h-3 text-amber-600" />
                              لم يُنجز اليوم
                            </span>
                          )}
                        </td>

                        {/* Current Week Days tracker with X for missed days */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            {currentWeekInfo.days.map((day) => {
                              const isDone = (student.allRecords || student.recentRecords || []).some(
                                (r) => r.date === day.dateStr && r.completed
                              );

                              return (
                                <div
                                  key={day.dateStr}
                                  className="flex flex-col items-center"
                                  title={`${day.dayName} (${day.formattedShort}): ${
                                    isDone
                                      ? 'أنجز التطبيق'
                                      : day.isPast
                                      ? 'لم ينجز وانتهى اليوم (علامة ×)'
                                      : day.isToday
                                      ? 'اليوم الحالي (قيد الإنجاز)'
                                      : 'لم يحن وقته'
                                  }`}
                                >
                                  <span className="text-[9px] text-gray-400 font-bold mb-0.5">
                                    {day.dayName[0]}
                                  </span>
                                  {isDone ? (
                                    <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-2xs">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    </span>
                                  ) : day.isPast ? (
                                    <span
                                      className="w-5 h-5 rounded-md bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold shadow-2xs"
                                      title="لم ينجز وانتهى اليوم (علامة ×)"
                                    >
                                      <X className="w-3 h-3 text-rose-600 stroke-[2.5]" />
                                    </span>
                                  ) : day.isToday ? (
                                    <span
                                      className="w-5 h-5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shadow-2xs"
                                      title="اليوم الحالي - قيد الإنجاز"
                                    >
                                      <Clock className="w-2.5 h-2.5 text-amber-600" />
                                    </span>
                                  ) : (
                                    <span className="w-5 h-5 flex items-center justify-center text-gray-300 text-xs font-mono">
                                      —
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        {/* Days completed out of 74 */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-gray-900">
                            {student.completedDaysCount}{' '}
                            <span className="text-gray-400 font-normal">
                              / {PROGRAM_DURATION_DAYS} يوماً
                            </span>
                          </span>
                        </td>

                        {/* Progress Bar (0..100%) */}
                        <td className="py-3.5 px-4 min-w-[130px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all"
                                style={{
                                  width: `${Math.max(2, student.completionRate)}%`,
                                }}
                              />
                            </div>
                            <span className="text-[11px] font-black text-gray-700 w-8 text-left">
                              {student.completionRate}%
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Edit Student Name Button */}
                            <button
                              onClick={() => {
                                setEditingStudent(student);
                                setNewStudentName(student.user.name);
                                setEditNameError('');
                              }}
                              className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
                              title="تعديل اسم الطالب"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* View Details */}
                            <button
                              onClick={() => setSelectedStudent(student)}
                              className="px-2.5 py-1 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer text-[11px] font-bold inline-flex items-center gap-1"
                            >
                              <span>التفاصيل</span>
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Individual Weekly & Monthly Achievement Matrix */}
      {activeTab === 'matrix' && (
        <AdminAchievementMatrix
          students={stats.studentsList}
          onSelectStudent={(student) => setSelectedStudent(student)}
        />
      )}

      {/* TAB 3: Dynamic Weekly & Daily Hadiths Management */}
      {activeTab === 'hadiths' && <AdminDailyHadithsManager />}

      {/* MODAL 1: Edit Student Name Modal (Admin Editing Student) */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-md w-full p-6 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                تعديل اسم الطالب في سجلات البرنامج
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              قم بتعديل اسم الطالب (مثلاً إذا كان مسجلاً باسم البريد الإلكتروني أو اسم
              غير مكتمل):
            </p>

            <form onSubmit={handleSaveStudentName} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  اسم الطالب الجديد:
                </label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="مثال: عبد العزيز بن ناصر السبيعي"
                  dir="rtl"
                  autoFocus
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900 font-medium"
                />
                {editNameError && (
                  <p className="text-xs text-red-600 font-bold mt-1.5">
                    {editNameError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingName}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                >
                  {isSavingName ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-white" />
                      <span>جارٍ الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>حفظ تعديل الاسم</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add New Hadith Modal */}
      {isAddingHadith && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-lg w-full p-6 text-right animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                إضافة حديث وتطبيق جديد للبرنامج
              </h3>
              <button
                onClick={() => setIsAddingHadith(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHadith} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  عنوان الحديث / التطبيق *
                </label>
                <input
                  type="text"
                  value={hadithTitle}
                  onChange={(e) => setHadithTitle(e.target.value)}
                  placeholder="مثال: دعاء الخروج من المنزل"
                  required
                  dir="rtl"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  نص الحديث الشريف *
                </label>
                <textarea
                  value={hadithText}
                  onChange={(e) => setHadithText(e.target.value)}
                  placeholder="اكتب نص الحديث الشريف بتشكيله إن تيسر..."
                  rows={4}
                  required
                  dir="rtl"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900 font-serif"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    تخريج الحديث والمصدر
                  </label>
                  <input
                    type="text"
                    value={hadithSource}
                    onChange={(e) => setHadithSource(e.target.value)}
                    placeholder="مثال: صحيح مسلم / البخاري"
                    dir="rtl"
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    التصنيف
                  </label>
                  <select
                    value={hadithCategory}
                    onChange={(e) => setHadithCategory(e.target.value)}
                    dir="rtl"
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="أذكار الطهارة والصلاة">أذكار الطهارة والصلاة</option>
                    <option value="سنن الصلاة والنوافل">سنن الصلاة والنوافل</option>
                    <option value="سنن وآداب نبوية">سنن وآداب نبوية</option>
                    <option value="أذكار الصباح والمساء">أذكار الصباح والمساء</option>
                    <option value="سنن المعاملات والآداب">سنن المعاملات والآداب</option>
                    <option value="أدعية موظفة">أدعية موظفة</option>
                  </select>
                </div>
              </div>

              {/* Day Assignment */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2.5">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isEverydayCheck"
                    checked={isEverydayHadith}
                    onChange={(e) => setIsEverydayHadith(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <label
                    htmlFor="isEverydayCheck"
                    className="text-xs font-bold text-gray-800 cursor-pointer"
                  >
                    تطبيق يومي مستمر لجميع أيام البرنامج ({PROGRAM_DURATION_DAYS} يوماً)
                  </label>
                </div>

                {!isEverydayHadith && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      تحديد اليوم المخصص (من 1 إلى {PROGRAM_DURATION_DAYS}):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={PROGRAM_DURATION_DAYS}
                        value={hadithDayNumber}
                        onChange={(e) => setHadithDayNumber(Number(e.target.value))}
                        className="w-24 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg text-center font-bold text-gray-900"
                      />
                      <span className="text-xs text-gray-500">
                        يتبع للأسبوع {getWeekFromDay(hadithDayNumber)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  الفائدة والتطبيق العملي (توجيه للطالب)
                </label>
                <input
                  type="text"
                  value={hadithNotes}
                  onChange={(e) => setHadithNotes(e.target.value)}
                  placeholder="مثال: يحرص الطالب على قوله عند عتبة الباب مباشرة"
                  dir="rtl"
                  className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              {hadithFormError && (
                <p className="text-xs text-red-600 font-bold">{hadithFormError}</p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddingHadith(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingHadith}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSavingHadith ? (
                    'جارٍ الإضافة...'
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      إضافة الحديث للبرنامج
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Clear All Data Confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-red-100 max-w-md w-full p-6 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-gray-900 text-center mb-2">
              تصفير وحذف البيانات المسجلة
            </h3>
            <p className="text-xs text-gray-600 text-center mb-5 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف جميع حسابات الطلاب وسجلات الإنجاز اليومية
              المسجلة حالياً؟
              <br />
              <span className="text-red-600 font-bold">
                هذا الإجراء نهائي ولا يمكن التراجع عنه.
              </span>
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleClearAllData}
                disabled={isClearingData}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isClearingData ? 'جارٍ الحذف...' : 'نعم، احذف جميع البيانات'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
