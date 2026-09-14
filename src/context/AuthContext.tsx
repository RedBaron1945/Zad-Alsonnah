import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider, isAdminUser } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { validateAndNormalizeArabicName } from '../lib/nameValidation';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  needsNameInput: boolean;
  signInWithGoogle: () => Promise<FirebaseUser>;
  signInWithAdminEmail: (email: string, password: string) => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  confirmStudentName: (name: string) => Promise<void>;
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
    let unsubscribeDoc: (() => void) | null = null;

    // Single source of truth: Firebase Authentication state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (user) {
        setCurrentUser(user);
        const isRealAdmin = isAdminUser(user.uid);

        let profile: UserProfile;
        const userDocRef = doc(db, 'users', user.uid);

        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            const determinedRole: UserRole = isRealAdmin ? 'admin' : 'student';
            const isConfirmed = isRealAdmin ? true : Boolean(data.nameConfirmed);

            profile = {
              uid: user.uid,
              name: data.name || user.displayName?.trim() || (isRealAdmin ? 'مدير البرنامج' : 'طالب علم'),
              email: user.email || data.email || '',
              role: determinedRole,
              createdAt: data.createdAt || user.metadata?.creationTime || new Date().toISOString(),
              nameConfirmed: isConfirmed,
              nameConfirmedAt: data.nameConfirmedAt || '',
            };

            // Guarantee that the user document in Firestore has role, email, etc.
            // without overwriting existing name or nameConfirmed
            const baseUpdate: Record<string, any> = {
              uid: user.uid,
              email: profile.email,
              role: determinedRole,
              updatedAt: new Date().toISOString(),
            };
            if (data.name) {
              baseUpdate.name = data.name;
            }
            if (data.nameConfirmed !== undefined) {
              baseUpdate.nameConfirmed = data.nameConfirmed;
            }
            await setDoc(userDocRef, baseUpdate, { merge: true });
          } else {
            profile = {
              uid: user.uid,
              name: user.displayName?.trim() || (isRealAdmin ? 'مدير البرنامج' : 'طالب علم'),
              email: user.email || '',
              role: isRealAdmin ? 'admin' : 'student',
              createdAt: user.metadata?.creationTime || new Date().toISOString(),
              nameConfirmed: isRealAdmin ? true : false,
              nameConfirmedAt: isRealAdmin ? new Date().toISOString() : '',
            };
            await setDoc(userDocRef, profile, { merge: true });
          }
        } catch (err) {
          console.warn('Firestore profile sync fallback:', err);
          profile = {
            uid: user.uid,
            name: user.displayName?.trim() || (isRealAdmin ? 'مدير البرنامج' : 'طالب علم'),
            email: user.email || '',
            role: isRealAdmin ? 'admin' : 'student',
            createdAt: user.metadata?.creationTime || new Date().toISOString(),
            nameConfirmed: isRealAdmin ? true : false,
            nameConfirmedAt: isRealAdmin ? new Date().toISOString() : '',
          };
        }

        setUserProfile(profile);

        // Name confirmation check:
        // Admins never need the student name prompt.
        // For students: If name is not confirmed (missing or false),
        // the mandatory name confirmation modal MUST block access!
        if (isRealAdmin) {
          setNeedsNameInput(false);
        } else {
          setNeedsNameInput(profile.nameConfirmed !== true);
        }

        // Set up real-time listener for user profile document
        // This ensures that when the admin modifies the student's name in Firestore,
        // or resets their confirmation status, it updates immediately on the student's screen in real time!
        try {
          unsubscribeDoc = onSnapshot(userDocRef, (snap) => {
            if (snap.exists()) {
              const freshData = snap.data();
              const freshName = freshData?.name ? String(freshData.name).trim() : '';
              const freshConfirmed = Boolean(freshData?.nameConfirmed);

              setUserProfile((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  name: freshName || prev.name,
                  nameConfirmed: isRealAdmin ? true : freshConfirmed,
                  nameConfirmedAt: freshData?.nameConfirmedAt || prev.nameConfirmedAt,
                };
              });

              if (!isRealAdmin) {
                // If admin resets confirmation or student confirms, react immediately in real time
                setNeedsNameInput(!freshConfirmed);
              }
            }
          });
        } catch (subErr) {
          console.warn('Could not establish real-time profile listener:', subErr);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setNeedsNameInput(false);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
    };
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
      // Strictly verify that the authenticated UID is the authorized administrator
      if (!isAdminUser(cred.user.uid)) {
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

  const confirmStudentName = async (name: string) => {
    if (!auth.currentUser) {
      throw new Error('يجب تسجيل الدخول أولاً لتأكيد الاسم');
    }

    const validation = validateAndNormalizeArabicName(name);
    if (!validation.isValid) {
      throw new Error(validation.error || 'الاسم غير مطابق للمواصفات المطلوبة');
    }

    const cleanName = validation.normalizedName;
    const uid = auth.currentUser.uid;
    const nowISO = new Date().toISOString();

    // 1. Update Firebase Auth displayName
    try {
      await updateProfile(auth.currentUser, { displayName: cleanName });
    } catch (err) {
      console.warn('Could not update Firebase user displayName:', err);
    }

    // 2. Persist directly to Firestore in 'users' collection with nameConfirmed: true
    try {
      const userDocRef = doc(db, 'users', uid);
      await setDoc(
        userDocRef,
        {
          uid,
          name: cleanName,
          email: auth.currentUser.email || '',
          role: 'student',
          nameConfirmed: true,
          nameConfirmedAt: nowISO,
          updatedAt: nowISO,
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Could not confirm student name in Firestore:', err);
      throw err;
    }

    // 3. Also update in legacy 'students' collection if exists
    try {
      await setDoc(
        doc(db, 'students', uid),
        {
          uid,
          name: cleanName,
          nameConfirmed: true,
          nameConfirmedAt: nowISO,
          updatedAt: nowISO,
        },
        { merge: true }
      );
    } catch {
      // Ignore if not present
    }

    setCurrentUser({
      ...auth.currentUser,
      displayName: cleanName,
    } as FirebaseUser);

    setUserProfile((prev) =>
      prev
        ? { ...prev, name: cleanName, nameConfirmed: true, nameConfirmedAt: nowISO }
        : {
            uid,
            name: cleanName,
            email: auth.currentUser?.email || '',
            role: 'student',
            createdAt: nowISO,
            nameConfirmed: true,
            nameConfirmedAt: nowISO,
          }
    );

    setNeedsNameInput(false);
  };

  const updateProfileName = async (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) throw new Error('الاسم لا يمكن أن يكون فارغاً');

    if (!auth.currentUser) {
      throw new Error('يجب تسجيل الدخول أولاً لتعديل الاسم');
    }

    const uid = auth.currentUser.uid;
    const isRealAdmin = isAdminUser(uid);

    // If not admin and user's name is already confirmed, forbid modification
    if (!isRealAdmin && userProfile?.nameConfirmed) {
      throw new Error('تم تأكيد اسمك مسبقاً، تعديل الأسماء بعد التأكيد خاص بإدارة البرنامج فقط');
    }

    // 1. Update Firebase Auth displayName
    try {
      await updateProfile(auth.currentUser, { displayName: cleanName });
    } catch (err) {
      console.warn('Could not update Firebase user displayName:', err);
    }

    // 2. Persist directly to Firestore in 'users' collection with merge: true
    try {
      const userDocRef = doc(db, 'users', uid);
      const updateData: Record<string, any> = {
        name: cleanName,
        updatedAt: new Date().toISOString(),
      };
      if (auth.currentUser.email) {
        updateData.email = auth.currentUser.email;
      }
      if (isRealAdmin) {
        updateData.role = 'admin';
      } else {
        updateData.role = 'student';
      }
      await setDoc(userDocRef, updateData, { merge: true });
    } catch (err) {
      console.error('Could not update Firestore user document:', err);
      throw err;
    }

    setCurrentUser({
      ...auth.currentUser,
      displayName: cleanName,
    } as FirebaseUser);

    setUserProfile((prev) => (prev ? { ...prev, name: cleanName } : {
      uid,
      name: cleanName,
      email: auth.currentUser?.email || '',
      role: isRealAdmin ? 'admin' : 'student',
      createdAt: new Date().toISOString(),
    }));
  };

  const completeStudentName = async (name: string) => {
    await confirmStudentName(name);
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
        confirmStudentName,
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

