# برنامج زاد السنة لتكوين النسيم — متابعة التطبيقات

تطبيق ويب لمتابعة إنجاز الطلاب لتطبيقات الأحاديث النبوية الشريفة والأذكار اليومية على مدار برنامج «زاد السنة» (٩ أسابيع / ٤٥ يوماً دراسياً، بمعدل حديثين يومياً).

## المزايا

- **تسجيل دخول** بالبريد الإلكتروني وكلمة المرور (المشرف)، أو بحساب Google (الطلاب)، عبر Firebase Authentication.
- **لوحة الطالب**: عرض حديث/تطبيق اليوم، تسجيل الإنجاز اليومي، تتبع نسبة الإنجاز والسلسلة المتتابعة (streak).
- **لوحة المشرف (Admin)**: إدارة الأحاديث اليومية، مصفوفة إنجاز شاملة لكل الطلاب، تفاصيل كل طالب على حدة.
- تعديلات المشرف على الأحاديث اليومية تُحفظ احتياطياً في localStorage كطبقة استرجاع إضافية عند تعذّر الاتصال بـ Firestore.
- **نظام أوسمة (Badges)** بمستويات (برونزي، فضي، ذهبي، زمردي، ماسي) تُمنح تلقائياً حسب التقدّم.
- تأثير احتفالي (confetti) عند إتمام الإنجاز.
- تصميم عربي كامل (RTL) بخط Cairo وAmiri.

## التقنيات المستخدمة

- React 19 + TypeScript + Vite 6
- Tailwind CSS 4
- Firebase (Authentication + Firestore)
- lucide-react للأيقونات، canvas-confetti للاحتفال

## النشر على Cloudflare Pages

عند ربط مستودع GitHub بمشروع Cloudflare Pages، تأكد من الإعدادات التالية (Settings > Build & deployments):

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **إصدار Node.js:** المشروع يستخدم Vite 6 وTailwind CSS 4 اللذان يتطلبان Node.js 20 أو أحدث. المستودع يحدد ذلك عبر ملف `.node-version` وحقل `engines.node` في `package.json`، لكن Cloudflare Pages (نظام البناء V2) لا يزال افتراضياً يستخدم إصداراً أقدم من Node.js ما لم تحدده صراحةً. أضف متغير بيئة `NODE_VERSION=20` في إعدادات المشروع على Cloudflare إن استمر فشل البناء، أو رقّي "Build system version" إلى v3 من نفس صفحة الإعدادات.

## التشغيل محلياً

**المتطلبات:** Node.js (نسخة 20 أو أحدث)

```bash
npm install
npm run dev
```

سيعمل التطبيق على `http://localhost:3000`.

للبناء للإنتاج:

```bash
npm run build
npm run preview
```

## إعداد Firebase وصلاحيات المشرف

المشروع مرتبط حالياً بمشروع Firebase باسم `zad-alsonnah`. عند نسخ المشروع لاستخدامه ببيانات مختلفة:

1. أنشئ مشروع Firebase جديداً وفعّل فيه Authentication (Email/Password + Google) وFirestore.
2. حدّث بيانات الإعداد (`firebaseConfig`) في [`src/lib/firebase.ts`](src/lib/firebase.ts) بمعرّفات مشروعك. مفتاح الويب (`apiKey`) الخاص بـ Firebase ليس سرّياً بطبيعته؛ الحماية الفعلية تأتي من قواعد Firestore.
3. صلاحية المشرف تُحدَّد حصراً بمعرّف المستخدم الثابت `ADMIN_UID` في [`src/lib/firebase.ts`](src/lib/firebase.ts)، وبنفس القيمة داخل `isAdmin()` في [`firestore.rules`](firestore.rules). **لا يوجد أي تحقق ببريد إلكتروني** — عند تغيير حساب المشرف، حدّث `ADMIN_UID` وقيمة الـ UID في `firestore.rules` معاً (القيمتان يجب أن تتطابقا دائماً).
4. انشر قواعد الأمان: `firebase deploy --only firestore:rules` (يتطلب Firebase CLI مُهيأً على حسابك).
5. راجع [`firebase-blueprint.json`](firebase-blueprint.json) لمخطط البيانات الكامل (المجموعات والحقول) إن أردت توليد بيانات ابتدائية أو أدوات إدارية إضافية.

## هيكل المشروع

```
src/
├── components/     # مكوّنات الواجهة (تسجيل الدخول، لوحة الطالب، لوحة المشرف، الأوسمة...)
├── context/        # AuthContext لإدارة حالة تسجيل الدخول وتحديد صلاحية المشرف
├── lib/            # خدمات Firebase، البيانات، الأوسمة، الأحاديث اليومية، التواريخ، الاحتفال
├── types.ts        # الأنواع وثوابت البرنامج (تاريخ البدء/الانتهاء، عدد الأيام...)
public/             # الشعارات وأيقونة الموقع
scripts/            # سكربت توليد شعار الأيقونة (public/naseem-emblem.png, public/logo.png)
```
