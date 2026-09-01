import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  X,
  Mail,
  Lock,
  Building2,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const AuthModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const {
    language,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    setDemoMode,
    isSupabaseOnline,
  } = useApp();

  const isAr = language === "ar";
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        const res = await signUpWithEmail(email, password, businessName);
        if (res.error) {
          setError(res.error.message || "Failed to create account.");
        } else {
          setSuccessMsg(
            isAr
              ? "تم إنشاء الحساب بنجاح! جاري تسجيل الدخول..."
              : "Account created successfully! Logging in..."
          );
          setTimeout(() => {
            onClose();
          }, 1200);
        }
      } else {
        const res = await signInWithEmail(email, password);
        if (res.error) {
          setError(res.error.message || "Invalid credentials.");
        } else {
          setSuccessMsg(
            isAr ? "تم تسجيل الدخول بنجاح!" : "Logged in successfully!"
          );
          setTimeout(() => {
            onClose();
          }, 800);
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setDemoMode(true);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-[#0D0D0D] rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 text-white relative overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 rtl:right-auto rtl:left-5 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Brand header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-black font-black text-lg shadow-md font-mono">
              H
            </div>
            <div>
              <h2 className="text-xl font-black text-white font-mono">
                {isAr ? "حاسبها | HASEBHA" : "HASEBHA SAAS"}
              </h2>
              <p className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {isSignUp
                  ? isAr
                    ? "تسجيل منشأة جديدة"
                    : "Create Business Workspace"
                  : isAr
                  ? "تسجيل الدخول إلى حسابك"
                  : "Sign In to Workspace"}
              </p>
            </div>
          </div>

          {/* Notifications */}
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 font-mono">
                    {isAr ? "اسم الشركة / النشاط التجاري" : "Business / Company Name"}
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3.5" />
                    <input
                      type="text"
                      required
                      placeholder={isAr ? "مثال: مؤسسة النور للحلول البرمجية" : "e.g. Acme Tech Solutions"}
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 font-mono">
                {isAr ? "البريد الإلكتروني" : "Email Address"}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3.5" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 font-mono">
                {isAr ? "كلمة المرور" : "Password"}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-all shadow-lg flex items-center justify-center gap-2 font-mono mt-2"
            >
              {loading ? (
                <span>{isAr ? "جاري المعالجة..." : "Processing..."}</span>
              ) : (
                <>
                  <span>
                    {isSignUp
                      ? isAr
                        ? "إنشاء الحساب وبدء التجربة المجانية"
                        : "Start 14-Day Free Pro Trial"
                      : isAr
                      ? "تسجيل الدخول"
                      : "Sign In"}
                  </span>
                  <ArrowRight className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />
                </>
              )}
            </button>
          </form>

          {/* Toggle login vs register */}
          <div className="mt-4 pt-4 border-t border-white/5 text-center text-xs font-mono">
            <span className="text-white/40">
              {isSignUp
                ? isAr
                  ? "لديك حساب بالفعل؟"
                  : "Already have an account?"
                : isAr
                ? "ليس لديك حساب بعد؟"
                : "Don't have an account yet?"}
            </span>{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-emerald-400 hover:underline font-bold"
            >
              {isSignUp
                ? isAr
                  ? "تسجيل الدخول"
                  : "Sign In"
                : isAr
                ? "إنشاء حساب منشأة جديد"
                : "Create Free Account"}
            </button>
          </div>

          {/* Quick Demo Mode fallback trigger */}
          <div className="mt-3">
            <button
              onClick={handleDemoLogin}
              className="w-full py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5 text-[11px] font-mono transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {isAr
                  ? "تجربة النظام بحساب تجريبي ممتلئ بالبيانات (Demo)"
                  : "Explore with Demo Company (Karim Tech)"}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
