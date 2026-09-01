import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Eye,
  DollarSign,
  Calendar,
  Sparkles,
  CheckCheck,
  Trash2,
  ExternalLink,
  Flame,
  ArrowRight,
  Filter,
} from "lucide-react";
import { formatDate } from "../../utils/formatters";
import { NotificationType, AppNotification } from "../../types";

export const NotificationsTab: React.FC = () => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    language,
    setActiveTab,
    setShareModalInvoice,
    invoices,
  } = useApp();

  const isAr = language === "ar";
  const [filter, setFilter] = useState<"all" | "unread" | "payments" | "tax">("all");

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "unread") return !item.isRead;
    if (filter === "payments") return item.type === "payment_received";
    if (filter === "tax") return item.type === "tax_deadline" || item.type === "overdue_alert";
    return true;
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "payment_received":
        return <DollarSign className="w-5 h-5 text-emerald-400" />;
      case "invoice_viewed":
        return <Eye className="w-5 h-5 text-cyan-400" />;
      case "overdue_alert":
        return <AlertCircle className="w-5 h-5 text-amber-400" />;
      case "tax_deadline":
        return <Calendar className="w-5 h-5 text-rose-400" />;
      case "ai_recommendation":
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      default:
        return <Bell className="w-5 h-5 text-white/60" />;
    }
  };

  const handleNotificationAction = (notification: AppNotification) => {
    markNotificationAsRead(notification.id);
    if (notification.relatedId) {
      const inv = invoices.find((i) => i.id === notification.relatedId || i.invoiceNumber === notification.relatedId);
      if (inv) {
        setShareModalInvoice(inv);
        return;
      }
    }
    if (notification.type === "tax_deadline" || notification.type === "ai_recommendation") {
      setActiveTab("insights");
    } else {
      setActiveTab("invoices");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-4xl pb-12 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#0F0F0F] border border-white/5 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
              {isAr ? "مركز الإشعارات والتنبيهات الحية" : "REAL-TIME NOTIFICATION CENTER"}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-white/40 font-mono">
              Firebase Cloud Messaging (FCM) Connected
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            {isAr ? "تنبيهات الفواتير والتحصيلات والضرائب" : "Invoices, Payments & Tax Alerts"}
          </h2>
          <p className="text-xs text-white/50 mt-1 max-w-xl">
            {isAr
              ? "متابعة فورية لحظة بلحظة لكل عملية سداد، مشاهدات العملاء للفواتير، المواعيد الضريبية، وتوصيات الذكاء الاصطناعي."
              : "Live notifications for incoming InstaPay settlements, client invoice views, ETA VAT deadlines, and autonomous AI recommendations."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold font-mono transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{isAr ? "تحديد الكل كمقروء" : "Mark All Read"}</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-rose-400 transition-colors"
              title={isAr ? "مسح جميع الإشعارات" : "Clear All"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
        <button
          onClick={() => setFilter("all")}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
            filter === "all"
              ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          }`}
        >
          {isAr ? "الكل" : "All"} ({notifications.length})
        </button>

        <button
          onClick={() => setFilter("unread")}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
            filter === "unread"
              ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          }`}
        >
          <span>{isAr ? "غير مقروء" : "Unread"}</span>
          {unreadCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-400 text-black font-extrabold text-[10px] flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setFilter("payments")}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
            filter === "payments"
              ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          }`}
        >
          {isAr ? "المدفوعات والمبالغ المستلمة" : "Payments Received"}
        </button>

        <button
          onClick={() => setFilter("tax")}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
            filter === "tax"
              ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          }`}
        >
          {isAr ? "تنبيهات الضرائب والمتأخرات" : "Tax & Overdue"}
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#0C0C0C] border border-white/5 space-y-3 font-mono">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/30">
              <Bell className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-white/80">
              {isAr ? "لا توجد إشعارات في هذا التصنيف حالياً" : "No notifications in this category"}
            </p>
            <p className="text-xs text-white/40">
              {isAr
                ? "سيتم إعلامك تلقائياً عند استلام مدفوعات جديدة أو تذكيرات الفواتير."
                : "You will be alerted instantly when invoices are settled or viewed."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationAction(notif)}
              className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer flex items-start gap-4 ${
                !notif.isRead
                  ? "bg-[#121814] border-emerald-500/30 hover:border-emerald-500/60 shadow-lg"
                  : "bg-[#0C0C0C] border-white/5 hover:bg-[#121212] hover:border-white/10 opacity-80"
              }`}
            >
              {/* Icon */}
              <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                {getNotificationIcon(notif.type)}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white truncate">
                      {isAr ? notif.titleAr : notif.title}
                    </h4>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-white/40 font-mono shrink-0">
                    {notif.timestamp}
                  </span>
                </div>

                <p className="text-xs text-white/70 mt-1 leading-relaxed">
                  {isAr ? notif.messageAr : notif.message}
                </p>

                <div className="mt-3 flex items-center gap-3 text-[11px] font-mono text-emerald-400 font-bold">
                  <span className="flex items-center gap-1 hover:underline">
                    <span>{isAr ? "عرض التفاصيل والإجراء" : "View Details & Action"}</span>
                    <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Firebase Config Info Card */}
      <div className="p-5 rounded-3xl bg-[#0A0A0A] border border-white/5 text-xs text-white/50 space-y-2 font-mono">
        <div className="flex items-center justify-between">
          <span className="text-white/80 font-bold">
            {isAr ? "حالة إشعارات Firebase المباشرة:" : "Firebase Real-time Push Status:"}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
            Project: hasebha-b398b
          </span>
        </div>
        <p className="text-[11px] leading-relaxed">
          {isAr
            ? "يتم إرسال إشعارات السداد فوراً إلى تطبيق الموبايل (iOS و Android) عبر Firebase Cloud Messaging وتحديث لوحة التحكم السحابية مباشرة."
            : "Payment settlement webhooks trigger instant Firebase Cloud Messaging (FCM) notifications to iOS & Android apps with live web dashboard sync."}
        </p>
      </div>
    </div>
  );
};
