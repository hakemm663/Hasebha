import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Smartphone,
  Globe,
  Receipt,
  MessageSquare,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Lock,
  Mail,
  UserCheck,
  Building,
  DollarSign,
  QrCode,
  Layers,
  ChevronRight,
} from "lucide-react";
import { useApp } from "../context/AppContext";

export const LandingPage: React.FC<{ onExploreDemo: () => void }> = ({
  onExploreDemo,
}) => {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    language,
    setLanguage,
    isSupabaseOnline,
    setSubscriptionTier,
  } = useApp();

  const isAr = language === "ar";
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"free" | "pro" | "business">("pro");

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      if (authMode === "signin") {
        const { error } = await signInWithEmail(email, password);
        if (error) setAuthError(error.message);
      } else {
        const { error } = await signUpWithEmail(email, password, businessName);
        if (error) {
          setAuthError(error.message);
        } else {
          await setSubscriptionTier(selectedPlan);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen bg-[#050505] text-[#F0F0F0] flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200"
    >
      {/* Navigation Header */}
      <header className="border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-black flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/20 font-mono">
              H
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">
                  Hasebha
                </span>
                <span className="text-emerald-400 font-bold text-sm font-arabic">
                  احسبها
                </span>
              </div>
              <span className="text-[10px] text-white/40 font-mono block">
                Real-Time Cloud Financial SaaS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <button
              onClick={() => setLanguage(isAr ? "en" : "ar")}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-bold transition-colors"
            >
              {isAr ? "English" : "العربية"}
            </button>

            <button
              onClick={onExploreDemo}
              className="hidden sm:flex px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? "تجربة فورية (Demo)" : "Live Demo"}</span>
            </button>

            <a
              href="#auth-section"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <span>{isAr ? "تسجيل الدخول" : "Sign In"}</span>
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Ambient subtle glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {isAr
                ? "منصة مالية موحدة: تطبيق Flutter للموبايل + لوحة تحكم سحابية"
                : "Dual Platform: Flutter Mobile App + Real-Time SaaS Dashboard"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            {isAr ? (
              <>
                المحاسب الذكي والفوترة الإلكترونية <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">
                  لرواد الأعمال والشركات الصغيرة
                </span>
              </>
            ) : (
              <>
                The Intelligent Financial Operating System <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">
                  For Modern Businesses & Founders
                </span>
              </>
            )}
          </h1>

          <p className="text-sm sm:text-base text-white/60 max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? "أنشئ الفواتير بالصوت، تتبع التدفق النقدي والمصروفات، احصل على تحليلات مالية فورية مع وكيل الذكاء الاصطناعي، وشارك روابط الدفع الفوري عبر انستاباي والواتساب."
              : "Create tax-compliant invoices by voice, track expenses & cash flow, receive autonomous AI financial insights, and settle instantly with InstaPay & WhatsApp payment reminders."}
          </p>

          {/* Quick Dual Platform Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 font-mono text-xs">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0A0A0A] border border-white/10 text-white/80">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>iOS & Android Flutter App</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0A0A0A] border border-white/10 text-white/80">
              <Globe className="w-4 h-4 text-teal-400" />
              <span>Web SaaS Dashboard</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0A0A0A] border border-white/10 text-white/80">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Shared Supabase Cloud DB</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-white/5 bg-[#0A0A0A]/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isAr ? "كل ما تحتاجه لإدارة أموالك بذكاء" : "Engineered for Complete Financial Mastery"}
            </h2>
            <p className="text-xs sm:text-sm text-white/40">
              {isAr
                ? "تكامل سلس بين هاتفك المحمول ولوحة التحكم المكتبية"
                : "Real-time synchronization between your mobile pocket and desktop browser"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-4 hover:border-emerald-500/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">
                {isAr ? "فوترة سريعة بالصوت وضريبة 14%" : "Voice Invoicing & 14% Egyptian VAT"}
              </h3>
              <p className="text-xs text-white/50 leading-relaxed">
                {isAr
                  ? "تحدث فقط باللغة العامية أو الفصحى، وسيقوم حاسبها AI بإنشاء فاتورة ضريبية كاملة بالأصناف والأسعار."
                  : "Speak naturally in Arabic or English to generate complete tax-compliant invoices with automatic VAT calculations."}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-4 hover:border-emerald-500/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">
                {isAr ? "تذكيرات الواتساب والدفع الفوري" : "WhatsApp Reminders & InstaPay"}
              </h3>
              <p className="text-xs text-white/50 leading-relaxed">
                {isAr
                  ? "إرسال رسائل تذكير مهذبة عبر واتساب بضغطة زر مع رابط ويب مباشر للسداد الفوري عبر انستاباي وفودافون كاش."
                  : "Draft high-converting polite WhatsApp reminders with 1-click customer payment links supporting InstaPay & Vodafone Cash."}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-4 hover:border-emerald-500/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">
                {isAr ? "محاسب ذكاء اصطناعي Edge Function" : "Autonomous AI Accountant Agent"}
              </h3>
              <p className="text-xs text-white/50 leading-relaxed">
                {isAr
                  ? "تحليل التدفق النقدي، تقديم نصائح لزيادة الأرباح، وتنبيهات الاستحقاق الضريبي التلقائي."
                  : "Real-time financial health diagnostics, profitability recommendations, and cash flow forecasting on Supabase Edge."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{isAr ? "باقات اشتراك مرنة وعادلة" : "Transparent SaaS Pricing"}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              {isAr ? "اختر الخطة المناسبة لحجم أعمالك" : "Simple Plans Built for Scaling Businesses"}
            </h2>
            <p className="text-xs sm:text-sm text-white/50">
              {isAr
                ? "استخدم نفس الحساب على الموبايل والويب دون أي تكاليف إضافية"
                : "One subscription works seamlessly across your mobile app and web dashboard"}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Free Plan */}
            <div className="p-8 rounded-3xl bg-[#0A0A0A] border border-white/10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">Free Starter</h3>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/5 text-white/50">
                    {isAr ? "مجاني دائماً" : "Forever Free"}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-4xl font-black text-white">0</span>
                  <span className="text-xs text-white/50">EGP / mo</span>
                </div>
                <p className="text-xs text-white/50">
                  {isAr ? "مثالي للمستقلين والمشاريع الفردية الجديدة." : "Perfect for solo freelancers getting started."}
                </p>
                <ul className="space-y-2.5 text-xs text-white/70 font-mono pt-4 border-t border-white/5">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Up to 15 invoices / month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>PDF Generation & InstaPay links</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Expense tracking & 14% VAT</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setSelectedPlan("free");
                  const el = document.getElementById("auth-section");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs font-mono transition-colors"
              >
                {isAr ? "ابدأ مجاناً" : "Select Starter"}
              </button>
            </div>

            {/* Pro Plan (Highlighted) */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-[#141E18] to-[#0A0A0A] border-2 border-emerald-500/50 relative flex flex-col justify-between space-y-6 shadow-2xl shadow-emerald-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-black text-[10px] font-bold font-mono uppercase tracking-wider">
                {isAr ? "الأكثر طلباً للشركات" : "Most Popular"}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">Professional</h3>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                    Pro
                  </span>
                </div>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-4xl font-black text-emerald-400">299</span>
                  <span className="text-xs text-white/50">EGP / mo</span>
                </div>
                <p className="text-xs text-white/60">
                  {isAr ? "للشركات الصغيرة ومقدمي الخدمات التجارية." : "Everything small businesses need to grow fast."}
                </p>
                <ul className="space-y-2.5 text-xs text-white/80 font-mono pt-4 border-t border-white/10">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unlimited Invoices & PDF Export</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Full AI Accountant Agent (Voice & Text)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>WhatsApp 1-Click Reminder Integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Real-time Mobile + Web Cloud Sync</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setSelectedPlan("pro");
                  const el = document.getElementById("auth-section");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs font-mono shadow-xl shadow-emerald-500/20 transition-all"
              >
                {isAr ? "اختيار باقة المحترفين" : "Select Pro Plan"}
              </button>
            </div>

            {/* Business Plan */}
            <div className="p-8 rounded-3xl bg-[#0A0A0A] border border-white/10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">Business Enterprise</h3>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/5 text-white/50">
                    Scale
                  </span>
                </div>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-4xl font-black text-white">699</span>
                  <span className="text-xs text-white/50">EGP / mo</span>
                </div>
                <p className="text-xs text-white/50">
                  {isAr ? "للوكالات والمؤسسات متعددة الفروع والموظفين." : "For agencies and multi-member operations."}
                </p>
                <ul className="space-y-2.5 text-xs text-white/70 font-mono pt-4 border-t border-white/5">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unlimited everything + Multiple staff seats</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Automated Quarterly VAT Tax Report</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Custom Brand Domain & Payment Portal</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setSelectedPlan("business");
                  const el = document.getElementById("auth-section");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs font-mono transition-colors"
              >
                {isAr ? "اختيار باقة الأعمال" : "Select Business Plan"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Auth & Onboarding Section */}
      <section id="auth-section" className="py-16 px-4 sm:px-6 lg:px-8 bg-[#080808] border-t border-white/5">
        <div className="max-w-md mx-auto">
          <div className="bg-[#0D0D0D] p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto font-bold font-mono text-lg">
                H
              </div>
              <h2 className="text-xl font-bold text-white">
                {authMode === "signin"
                  ? isAr ? "تسجيل الدخول إلى حاسبها" : "Sign In to Hasebha SaaS"
                  : isAr ? "إنشاء حساب تجاري جديد" : "Create Business Account"}
              </h2>
              <p className="text-xs text-white/40">
                {isAr
                  ? "متصل مباشرة بنفس قاعدة بيانات تطبيق الموبايل"
                  : "Connects directly to your Flutter mobile app database"}
              </p>
            </div>

            {/* Auth Mode Toggle */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#050505] border border-white/5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setAuthMode("signup")}
                className={`py-2 rounded-xl font-bold transition-all ${
                  authMode === "signup"
                    ? "bg-emerald-500 text-black shadow-md"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {isAr ? "حساب جديد" : "Sign Up"}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("signin")}
                className={`py-2 rounded-xl font-bold transition-all ${
                  authMode === "signin"
                    ? "bg-emerald-500 text-black shadow-md"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {isAr ? "تسجيل دخول" : "Sign In"}
              </button>
            </div>

            {authError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs font-mono">
              {authMode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-white/60 text-[11px] block">
                    {isAr ? "اسم الشركة / النشاط التجاري" : "Business / Brand Name"}
                  </label>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[#050505] border border-white/10 focus-within:border-emerald-500">
                    <Building className="w-4 h-4 text-white/40 shrink-0" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Karim Fouad Design"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full bg-transparent text-white focus:outline-none text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-white/60 text-[11px] block">
                  {isAr ? "البريد الإلكتروني" : "Email Address"}
                </label>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#050505] border border-white/10 focus-within:border-emerald-500">
                  <Mail className="w-4 h-4 text-white/40 shrink-0" />
                  <input
                    type="email"
                    required
                    placeholder="owner@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-white focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 text-[11px] block">
                  {isAr ? "كلمة المرور" : "Password"}
                </label>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#050505] border border-white/10 focus-within:border-emerald-500">
                  <Lock className="w-4 h-4 text-white/40 shrink-0" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent text-white focus:outline-none text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all mt-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>{isAr ? "جاري التحقق..." : "Authenticating..."}</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>
                      {authMode === "signup"
                        ? isAr ? "إنشاء حساب والدخول للوحة" : "Create Account & Launch"
                        : isAr ? "تسجيل الدخول" : "Sign In to Dashboard"}
                    </span>
                  </>
                )}
              </button>
            </form>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-3 text-white/30 text-[10px] font-mono">
                {isAr ? "أو المتابعة عبر" : "OR CONTINUE WITH"}
              </span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={signInWithGoogle}
                className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs font-mono flex items-center justify-center gap-2 transition-colors"
              >
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={onExploreDemo}
                className="py-3 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-bold text-xs font-mono flex items-center justify-center gap-2 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAr ? "استكشاف Demo" : "Explore Demo"}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 py-8 px-4 text-center text-xs text-white/40 font-mono">
        <p>Hasebha (احسبها) © 2026. Two-Platform SaaS Financial Suite.</p>
        <p className="text-[10px] text-white/20 mt-1">
          Connected to Supabase PostgreSQL & Auth with Row Level Security.
        </p>
      </footer>
    </div>
  );
};
