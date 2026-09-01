import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { CurrencyCode } from "../../types";
import {
  Building2,
  CreditCard,
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ShieldCheck,
  Zap,
  Globe,
  DollarSign,
  Smartphone,
} from "lucide-react";

export const SettingsTab: React.FC = () => {
  const {
    language,
    business,
    user,
    demoMode,
    signOut,
    updateBusinessProfile,
    isSupabaseOnline,
    currency,
  } = useApp();

  const isAr = language === "ar";

  const [form, setForm] = useState({
    businessName: business.businessName || "",
    businessNameAr: business.businessNameAr || "",
    ownerName: business.ownerName || "",
    ownerNameAr: business.ownerNameAr || "",
    taxNumber: business.taxNumber || "",
    commercialRegister: business.commercialRegister || "",
    phone: business.phone || "",
    address: business.address || "",
    defaultCurrency: (business.defaultCurrency || currency || "EGP") as CurrencyCode,
    defaultVatRate: business.defaultVatRate ?? 14,
    bankName: business.bankDetails?.bankName || "",
    accountNumber: business.bankDetails?.accountNumber || "",
    iban: business.bankDetails?.iban || "",
    instaPayHandle: business.bankDetails?.instaPayHandle || "",
    vodafoneCashNumber: business.bankDetails?.vodafoneCashNumber || "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const res = await updateBusinessProfile({
        businessName: form.businessName,
        businessNameAr: form.businessNameAr,
        ownerName: form.ownerName,
        ownerNameAr: form.ownerNameAr,
        taxNumber: form.taxNumber,
        commercialRegister: form.commercialRegister,
        phone: form.phone,
        address: form.address,
        defaultCurrency: form.defaultCurrency,
        defaultVatRate: Number(form.defaultVatRate),
        bankDetails: {
          bankName: form.bankName,
          accountNumber: form.accountNumber,
          iban: form.iban,
          instaPayHandle: form.instaPayHandle,
          vodafoneCashNumber: form.vodafoneCashNumber,
        },
      });

      if (res.error) {
        setErrorMessage(res.error.message || "Failed to save profile");
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Unexpected error saving profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#0F0F0F] border border-white/5 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
              {isAr ? "إعدادات المنشأة والحساب" : "BUSINESS & ACCOUNT SETTINGS"}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-white/40 font-mono">
              {isSupabaseOnline ? "Postgres Persisted" : "Local State"}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            {isAr ? "الملف التعريفي وبيانات السداد" : "Business Profile & Payment Details"}
          </h2>
          <p className="text-xs text-white/50 mt-1 max-w-xl">
            {isAr
              ? "بيانات الدفع المحددة هنا (إنستاباي، المحافظ الإلكترونية، الحساب البنكي) ستظهر مباشرة على فواتيرك ورسائل التذكير."
              : "Payment details saved here (InstaPay handle, mobile wallet, bank account) will automatically populate all client invoices & payment links."}
          </p>
        </div>

        <button
          onClick={signOut}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold font-mono transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isAr ? "تسجيل الخروج" : "Sign Out"}</span>
        </button>
      </div>

      {/* Status Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 text-xs font-bold font-mono animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            {isAr
              ? "تم حفظ وتحديث بيانات المنشأة وطرق التحصيل بنجاح في قاعدة البيانات!"
              : "Business profile and payment methods successfully saved to Supabase database!"}
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-3 text-xs font-bold font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Business Identity */}
        <div className="p-6 rounded-3xl bg-[#0F0F0F] border border-white/5 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white font-mono">
              {isAr ? "بيانات المنشأة والنشاط" : "Business Identity & Tax Registration"}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium text-white/50 block mb-1.5 font-mono">
                {isAr ? "اسم النشاط التجاري (إنجليزي)" : "Business Name (English)"}
              </label>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                required
                className="w-full bg-[#050505] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="e.g. Acme Creative Agency"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-white/50 block mb-1.5 font-mono">
                {isAr ? "اسم النشاط التجاري (عربي)" : "Business Name (Arabic)"}
              </label>
              <input
                type="text"
                value={form.businessNameAr}
                onChange={(e) => setForm({ ...form, businessNameAr: e.target.value })}
                className="w-full bg-[#050505] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="مثال: وكالة الإبداع الرقمي"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-white/50 block mb-1.5 font-mono">
                {isAr ? "اسم المالك / المسؤول (إنجليزي)" : "Owner Name (English)"}
              </label>
              <input
                type="text"
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                required
                className="w-full bg-[#050505] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="e.g. Karim Fouad"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-white/50 block mb-1.5 font-mono">
                {isAr ? "اسم المالك / المسؤول (عربي)" : "Owner Name (Arabic)"}
              </label>
              <input
                type="text"
                value={form.ownerNameAr}
                onChange={(e) => setForm({ ...form, ownerNameAr: e.target.value })}
                className="w-full bg-[#050505] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="مثال: كريم فؤاد"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-white/50 block mb-1.5 font-mono">
                {isAr ? "الرقم الضريبي (ETA / VAT)" : "Tax Registration Number (ETA)"}
              </label>
              <input
                type="text"
                value={form.taxNumber}
                onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                className="w-full bg-[#050505] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="e.g. EG-394827104"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-white/50 block mb-1.5 font-mono">
                {isAr ? "رقم السجل التجاري" : "Commercial Register (CR)"}
              </label>
              <input
                type="text"
                value={form.commercialRegister}
                onChange={(e) => setForm({ ...form, commercialRegister: e.target.value })}
                className="w-full bg-[#050505] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="e.g. CR-849204"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Instant Payment & Settlement Information */}
        <div className="p-6 rounded-3xl bg-[#0F0F0F] border border-emerald-500/20 shadow-xl space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white font-mono">
                {isAr ? "بيانات السداد الفوري (إنستاباي والمحافظ)" : "Instant Payment Methods (InstaPay & Wallets)"}
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              {isAr ? "تظهر على الفواتير" : "Auto-invoiced"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium text-emerald-400 block mb-1.5 font-mono">
                {isAr ? "معرف إنستاباي (InstaPay Handle / IPA)" : "InstaPay Handle (IPA)"}
              </label>
              <input
                type="text"
                value={form.instaPayHandle}
                onChange={(e) => setForm({ ...form, instaPayHandle: e.target.value })}
                className="w-full bg-[#050505] border border-emerald-500/30 rounded-2xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="yourbusiness@instapay"
              />
              <span className="text-[10px] text-white/40 mt-1 block">
                {isAr ? "سيتمكن عملاؤك من نسخ المعرف أو السداد برابط مباشر" : "Clients can copy or tap to pay via InstaPay app directly"}
              </span>
            </div>

            <div>
              <label className="text-[11px] font-medium text-white/50 block mb-1.5 font-mono">
                {isAr ? "رقم محفظة فودافون كاش / أورانج / إتصالات" : "Vodafone Cash / Mobile Wallet"}
              </label>
              <input
                type="text"
                value={form.vodafoneCashNumber}
                onChange={(e) => setForm({ ...form, vodafoneCashNumber: e.target.value })}
                className="w-full bg-[#050505] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="+20 100 293 8471"
              />
              <span className="text-[10px] text-white/40 mt-1 block">
                {isAr ? "رقم المحفظة الإلكترونية لاستلام التحويلات" : "E-wallet mobile number for cash transfers"}
              </span>
            </div>

            <div>
              <label className="text-[11px] font-medium text-white/50 block mb-1.5 font-mono">
                {isAr ? "اسم البنك" : "Bank Name"}
              </label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="w-full bg-[#050505] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="e.g. Commercial International Bank (CIB)"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-white/50 block mb-1.5 font-mono">
                {isAr ? "رقم الحساب البنكي" : "Bank Account Number"}
              </label>
              <input
                type="text"
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                className="w-full bg-[#050505] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="1000 4829 3847"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium text-white/50 block mb-1.5 font-mono">
                {isAr ? "رقم الآيبان (IBAN)" : "International Bank Account Number (IBAN)"}
              </label>
              <input
                type="text"
                value={form.iban}
                onChange={(e) => setForm({ ...form, iban: e.target.value })}
                className="w-full bg-[#050505] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="EG38 0010 0004 8293 8472 9104 29"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Financial Defaults & Currency */}
        <div className="p-6 rounded-3xl bg-[#0F0F0F] border border-white/5 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white font-mono">
              {isAr ? "العملة الافتراضية والضرائب" : "Currency & Tax Preferences"}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium text-white/50 block mb-1.5 font-mono">
                {isAr ? "العملة الافتراضية للفواتير" : "Default Billing Currency"}
              </label>
              <select
                value={form.defaultCurrency}
                onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value as CurrencyCode })}
                className="w-full bg-[#050505] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="EGP">EGP (ج.م - الجنيه المصري)</option>
                <option value="SAR">SAR (ر.س - الريال السعودي)</option>
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="AED">AED (د.إ - الدرهم الإماراتي)</option>
                <option value="EUR">EUR (€ - Euro)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-white/50 block mb-1.5 font-mono">
                {isAr ? "نسبة ضريبة القيمة المضافة الافتراضية (%)" : "Default VAT Rate (%)"}
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.defaultVatRate}
                onChange={(e) => setForm({ ...form, defaultVatRate: Number(e.target.value) })}
                className="w-full bg-[#050505] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <span className="text-[10px] text-white/40 mt-1 block">
                {isAr ? "14% هي النسبة المعتمدة لمصلحة الضرائب المصرية" : "Standard Egyptian VAT rate is 14%"}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 4: Contact & Account Info (Read-only Auth) */}
        <div className="p-6 rounded-3xl bg-[#0F0F0F] border border-white/5 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
            <User className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white font-mono">
              {isAr ? "معلومات الحساب والتواصل" : "Account Authentication & Contact"}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium text-white/50 block mb-1.5 font-mono">
                {isAr ? "بريد الحساب (للقراءة فقط من Supabase Auth)" : "Account Email (Read-only from Supabase Auth)"}
              </label>
              <input
                type="text"
                value={user?.email || (demoMode ? "demo-owner@hasebha.app" : "workspace-owner@hasebha.app")}
                disabled
                className="w-full bg-[#050505]/60 border border-white/5 rounded-2xl px-3.5 py-2.5 text-xs text-white/40 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-white/50 block mb-1.5 font-mono">
                {isAr ? "رقم هاتف التواصل والواتساب" : "Contact Phone / WhatsApp"}
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-[#050505] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="+20 100 000 0000"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium text-white/50 block mb-1.5 font-mono">
                {isAr ? "العنوان التجاري" : "Business Address"}
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full bg-[#050505] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="e.g. 15 El-Tahrir St, Dokki, Giza, Egypt"
              />
            </div>
          </div>
        </div>

        {/* Submit Save Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all font-mono"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>{isAr ? "جاري الحفظ في قاعدة البيانات..." : "Persisting changes to Supabase..."}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isAr ? "حفظ التغييرات الآن" : "Save Profile & Payment Details"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
