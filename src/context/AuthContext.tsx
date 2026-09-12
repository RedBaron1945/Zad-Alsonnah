import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, ADMIN_UID } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  needsNameInput: boolean;
  signInWithGoogle: () => Promise<FirebaseUser>;
  signInWithAdminEmail: (email: string, password: string) => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  completeStudentName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [needsNameInput, setNeedsNameInput] = useState<boolean>(false);

  useEffect(() => {
    // Single source of truth: Firebase Authentication state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const isRealAdmin = user.uid === ADMIN_UID;

        let profile: UserProfile;
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            profile = {
              uid: user.uid,
              name: data.name || user.displayName || (isRealAdmin ? 'مدير البرنامج' : 'طالب علم'),
              email: user.email || data.email || '',
              role: isRealAdmin ? 'admin' : 'student',
              createdAt: data.createdAt || user.metadata?.creationTime || new Date().toISOString(),
            };
            if (isRealAdmin && data.role !== 'admin') {
              await setDoc(userDocRef, { role: 'admin' }, { merge: true });
            }
          } else {
            profile = {
              uid: user.uid,
              name: user.displayName?.trim() || (isRealAdmin ? 'مدير البرنامج' : 'طالب علم'),
              email: user.email || '',
              role: isRealAdmin ? 'admin' : 'student',
              createdAt: user.metadata?.creationTime || new Date().toISOString(),
            };
            await setDoc(userDocRef, profile);
          }
        } catch (err) {
          console.warn('Firestore profile sync fallback:', err);
          profile = {
            uid: user.uid,
            name: user.displayName?.trim() || (isRealAdmin ? 'مدير البرنامج' : 'طالب علم'),
            email: user.email || '',
            role: isRealAdmin ? 'admin' : 'student',
            createdAt: user.metadata?.creationTime || new Date().toISOString(),
          };
        }

        setUserProfile(profile);

        // Admins never need the student name prompt
        if (isRealAdmin) {
          setNeedsNameInput(false);
        } else {
          setNeedsNameInput(!profile.name || profile.name === 'طالب علم' || profile.name.trim().length < 2);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setNeedsNameInput(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<FirebaseUser> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error: any) {
      const code = error?.code || '';
      let arabicMessage = 'حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.';

      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        arabicMessage = 'تم إلغاء نافذة تسجيل الدخول من قِبل المستخدم.';
      } else if (code === 'auth/popup-blocked') {
        arabicMessage =
          'تم حظر النافذة المنبثقة من قِبل المتصفح. يُرجى السماح بالنوافذ المنبثقة ثم المحاولة مرة أخرى.';
      } else if (code === 'auth/unauthorized-domain') {
        arabicMessage =
          'النطاق الحالي غير مصرّح به في Firebase. يجب إضافة رابط الموقع إلى قائمة (Authorized Domains) في إعدادات Firebase Console.';
      } else if (code === 'auth/operation-not-allowed') {
        arabicMessage =
          'تسجيل الدخول بحساب Google غير مفعّل في Firebase Console (Authentication > Sign-in method).';
      } else if (code === 'auth/network-request-failed') {
        arabicMessage =
          'تعذر الاتصال بخوادم Google. يرجى التحقق من اتصال الإنترنت ثم المحاولة مجدداً.';
      }

      const friendlyError = new Error(arabicMessage);
      (friendlyError as any).code = code;
      throw friendlyError;
    }
  };

  const signInWithAdminEmail = async (email: string, password: string): Promise<void> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('يرجى إدخال البريد الإلكتروني.');
    }
    if (!password) {
      throw new Error('يرجى إدخال كلمة المرور.');
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      // Strictly verify that the authenticated UID is the authorized administrator UID
      if (cred.user.uid !== ADMIN_UID) {
        await firebaseSignOut(auth);
        throw new Error('هذا الحساب غير مصرح له بالدخول كمدير للنظام.');
      }
    } catch (error: any) {
      const code = error?.code || '';
      let arabicMessage = error?.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      if (code === 'auth/invalid-email') {
        arabicMessage = 'صيغة البريد الإلكتروني غير صالحة.';
      } else if (
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password'
      ) {
        arabicMessage = 'بيانات الدخول غير صحيحة. يرجى التأكد من صحة البريد وكلمة المرور.';
      } else if (code === 'auth/user-disabled') {
        arabicMessage = 'هذا الحساب معطل حالياً. يرجى التواصل مع الدعم.';
      } else if (code === 'auth/too-many-requests') {
        arabicMessage = 'تم حظر المحاولات مؤقتاً بسبب تكرار المحاولات الخاطئة. حاول لاحقاً.';
      } else if (code === 'auth/network-request-failed') {
        arabicMessage = 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.';
      } else if (code === 'auth/operation-not-allowed') {
        arabicMessage = 'موفر الدخول بالبريد وكلمة المرور غير مفعّل في إعدادات Firebase Console.';
      }

      const friendlyError = new Error(arabicMessage);
      (friendlyError as any).code = code;
      throw friendlyError;
    }
  };

  const updateProfileName = async (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) throw new Error('الاسم لا يمكن أن يكون فارغاً');

    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const isRealAdmin = uid === ADMIN_UID;

      // 1. Update Firebase Auth displayName
      try {
        await updateProfile(auth.currentUser, { displayName: cleanName });
      } catch (err) {
        console.warn('Could not update Firebase user displayName:', err);
      }

      // 2. Persist directly to Firestore in 'users' collection with merge: true
      try {
        const userDocRef = doc(db, 'users', uid);
        await setDoc(
          userDocRef,
          {
            uid,
            name: cleanName,
            email: auth.currentUser.email || userProfile?.email || '',
            role: isRealAdmin ? 'admin' : (userProfile?.role || 'student'),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Could not update Firestore user document:', err);
        throw err;
      }

      setCurrentUser({
        ...auth.currentUser,
        displayName: cleanName,
      } as FirebaseUser);
    }
    setUserProfile((prev) => (prev ? { ...prev, name: cleanName } : null));
  };

  const completeStudentName = async (name: string) => {
    await updateProfileName(name);
    setNeedsNameInput(false);
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
    setCurrentUser(null);
    setUserProfile(null);
    setNeedsNameInput(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        needsNameInput,
        signInWithGoogle,
        signInWithAdminEmail,
        updateProfileName,
        completeStudentName,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

