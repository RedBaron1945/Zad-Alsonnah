import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ADMIN_UID } from './lib/firebase';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentNameModal } from './components/StudentNameModal';

const AppContent: React.FC = () => {
  const { currentUser, userProfile, loading, needsNameInput } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-xs font-bold">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Login Page (Light, clean, minimal, without header)
  if (!currentUser) {
    return <LoginPage />;
  }

  // Logged in with Google, but needs to enter/confirm name
  if (needsNameInput) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] text-gray-900 flex flex-col">
        <StudentNameModal />
      </div>
    );
  }

  // Logged in -> Admin or Student Dashboard
  const isAdmin = currentUser.uid === ADMIN_UID;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 flex flex-col">
      <Navbar />
      <main className="flex-1">
        {isAdmin ? <AdminDashboard /> : <StudentDashboard />}
      </main>
      <footer className="py-6 text-center text-slate-500 text-xs border-t border-slate-200 bg-white/70 backdrop-blur-xs">
        <div className="flex flex-col items-center justify-center gap-2 max-w-7xl mx-auto px-4">
          <p className="font-bold text-slate-700">
            برنامج زاد السنة • تطبيق ومتابعة الأحاديث النبوية الشريفة
          </p>
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] font-medium text-slate-700 shadow-2xs">
            <span>تسجيل الدخول موثّق ومحمي عبر <strong className="font-bold text-slate-900">Firebase Authentication</strong></span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1 font-bold text-blue-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Google Sign-In
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
