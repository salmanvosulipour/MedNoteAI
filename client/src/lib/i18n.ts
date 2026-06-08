export type Lang = "en" | "ar";

const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Auth
    "auth.tagline": "Your AI Medical Scribe",
    "auth.subtitle": "Finish your clinic notes in minutes, not hours",
    "auth.apple": "Sign in with Apple",
    "auth.email_login": "Sign in with Email",
    "auth.email_register": "Create Account with Email",
    "auth.feature1": "Speak naturally — AI writes the note for you",
    "auth.feature2": "Structured SOAP notes, ICD codes, discharge summaries",
    "auth.feature3": "Save 2+ hours of documentation every shift",
    "auth.badge": "Secure & Private — Patient data never stored or shared",
    "auth.terms": "By continuing, you agree to our Terms of Service and Privacy Policy",

    // Navigation
    "nav.home": "Home",
    "nav.record": "Record",
    "nav.cases": "Cases",
    "nav.profile": "Profile",

    // Home
    "home.greeting.morning": "Good Morning",
    "home.greeting.afternoon": "Good Afternoon",
    "home.greeting.evening": "Good Evening",
    "home.search": "Search patient history...",
    "home.new_session": "New Session",
    "home.auto_scribe": "Auto-Scribe",
    "home.all_cases": "All Cases",
    "home.records": "Records",
    "home.go_pro": "Go Pro",
    "home.go_pro_sub": "Unlimited notes, ICD coding, discharge summaries — $39/mo",
    "home.upgrade": "Upgrade",
    "home.recent_cases": "Recent Cases",
    "home.view_all": "View All",
    "home.no_cases": "No Cases Yet",
    "home.no_cases_sub": "Start your first recording to create a case",
    "home.demo_badge": "Demo",

    // Cases
    "cases.title": "All Cases",
    "cases.empty": "No cases yet",
    "cases.empty_sub": "Tap the microphone to start your first session",
    "cases.search": "Search by name or complaint...",

    // Subscription
    "sub.title": "MedNote AI Pro",
    "sub.subtitle": "Document smarter, not harder",
    "sub.monthly": "Monthly",
    "sub.yearly": "Yearly",
    "sub.per_month": "/month",
    "sub.per_year": "/year",
    "sub.save": "Save",
    "sub.cta": "Start Free Trial",
    "sub.trial_badge": "14-day free trial included",
    "sub.restore": "Restore Purchase",
    "sub.terms": "Terms",
    "sub.privacy": "Privacy",

    // Profile
    "profile.language": "Language",
    "profile.english": "English",
    "profile.arabic": "العربية",
    "profile.personal_info": "Personal Information",
    "profile.billing": "Subscription & Billing",
    "profile.security": "Security & Privacy",
    "profile.support": "Help & Support",
    "profile.logout": "Sign Out",
    "profile.notifications": "Notifications",
  },

  ar: {
    // Auth
    "auth.tagline": "مساعدك الطبي بالذكاء الاصطناعي",
    "auth.subtitle": "أنهِ ملاحظاتك في دقائق، لا ساعات",
    "auth.apple": "تسجيل الدخول بـ Apple",
    "auth.email_login": "تسجيل الدخول بالبريد الإلكتروني",
    "auth.email_register": "إنشاء حساب بالبريد الإلكتروني",
    "auth.feature1": "تحدّث بشكل طبيعي — الذكاء الاصطناعي يكتب الملاحظة",
    "auth.feature2": "ملاحظات SOAP منظّمة، رموز ICD، ملخصات الخروج",
    "auth.feature3": "وفّر أكثر من ساعتين في كل وردية",
    "auth.badge": "آمن وخاص — بيانات المريض لا تُخزَّن أو تُشارَك",
    "auth.terms": "بالمتابعة، أنت توافق على شروط الخدمة وسياسة الخصوصية",

    // Navigation
    "nav.home": "الرئيسية",
    "nav.record": "تسجيل",
    "nav.cases": "الحالات",
    "nav.profile": "الملف الشخصي",

    // Home
    "home.greeting.morning": "صباح الخير",
    "home.greeting.afternoon": "مساء الخير",
    "home.greeting.evening": "مساء الخير",
    "home.search": "ابحث في سجلات المرضى...",
    "home.new_session": "جلسة جديدة",
    "home.auto_scribe": "تسجيل تلقائي",
    "home.all_cases": "جميع الحالات",
    "home.records": "سجلات",
    "home.go_pro": "اشترك بـ Pro",
    "home.go_pro_sub": "ملاحظات غير محدودة، رموز ICD، ملخصات الخروج — ٣٩ دولار/شهر",
    "home.upgrade": "ترقية",
    "home.recent_cases": "الحالات الأخيرة",
    "home.view_all": "عرض الكل",
    "home.no_cases": "لا توجد حالات بعد",
    "home.no_cases_sub": "ابدأ تسجيلك الأول لإنشاء حالة",
    "home.demo_badge": "عرض",

    // Cases
    "cases.title": "جميع الحالات",
    "cases.empty": "لا توجد حالات بعد",
    "cases.empty_sub": "اضغط على الميكروفون لبدء جلستك الأولى",
    "cases.search": "ابحث بالاسم أو الشكوى...",

    // Subscription
    "sub.title": "MedNote AI Pro",
    "sub.subtitle": "وثّق بذكاء، لا بجهد",
    "sub.monthly": "شهري",
    "sub.yearly": "سنوي",
    "sub.per_month": "/شهر",
    "sub.per_year": "/سنة",
    "sub.save": "وفّر",
    "sub.cta": "ابدأ التجربة المجانية",
    "sub.trial_badge": "١٤ يوم تجربة مجانية",
    "sub.restore": "استعادة الاشتراك",
    "sub.terms": "الشروط",
    "sub.privacy": "الخصوصية",

    // Profile
    "profile.language": "اللغة",
    "profile.english": "English",
    "profile.arabic": "العربية",
    "profile.personal_info": "المعلومات الشخصية",
    "profile.billing": "الاشتراك والفوترة",
    "profile.security": "الأمان والخصوصية",
    "profile.support": "المساعدة والدعم",
    "profile.logout": "تسجيل الخروج",
    "profile.notifications": "الإشعارات",
  },
};

const LANG_KEY = "mednote_lang";

export function getStoredLang(): Lang {
  const stored = localStorage.getItem(LANG_KEY);
  if (stored === "ar" || stored === "en") return stored;
  // Auto-detect from browser/device locale
  const locale = navigator.language || "en";
  return locale.startsWith("ar") ? "ar" : "en";
}

export function setStoredLang(lang: Lang) {
  localStorage.setItem(LANG_KEY, lang);
}

export function t(key: string, lang: Lang): string {
  return translations[lang][key] ?? translations["en"][key] ?? key;
}
