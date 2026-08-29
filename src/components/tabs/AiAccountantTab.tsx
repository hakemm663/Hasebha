import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import {
  Sparkles,
  Mic,
  MicOff,
  Send,
  Trash2,
  FileText,
  AlertCircle,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Zap,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, generateWhatsAppLink } from "../../utils/formatters";
import { motion, AnimatePresence } from "motion/react";

export const AiAccountantTab: React.FC = () => {
  const {
    aiMessages,
    isAiThinking,
    sendAiMessage,
    executeAiAction,
    clearAiChat,
    language,
    currency,
    business,
    setActiveTab,
    setShareModalInvoice,
  } = useApp();

  const isAr = language === "ar";
  const [inputPrompt, setInputPrompt] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, isAiThinking]);

  // Voice recording simulation / Web Speech API
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleToggleVoice = () => {
    if (isRecording) {
      // Stop recording and send voice transcription
      setIsRecording(false);
      const voicePromptsAr = [
        "اعمل فاتورة لأحمد تريدنج فيها 2 حامل لابتوب بسعر 350 جنيه وماوس وايرلس بسعر 450 جنيه وخصم 100 جنيه",
        "ابعت تذكير واتساب لفاتورة النور سنتر المتأخرة",
        "سجلت مصروف تسويق 1500 جنيه إعلانات فيسبوك",
        "حلل أرباح هذا الشهر وقارنها بالمصروفات",
      ];
      const voicePromptsEn = [
        "Create invoice for Ahmed Trading with 2 Laptop Stands at 350 EGP and 1 Wireless Mouse at 450 EGP",
        "Send a friendly WhatsApp payment reminder to Ahmed Trading for overdue invoice",
        "Record expense of 1500 EGP for Facebook marketing ads",
        "Analyze this month's net profit and collection velocity",
      ];

      const sampleVoice = isAr
        ? voicePromptsAr[Math.floor(Math.random() * voicePromptsAr.length)]
        : voicePromptsEn[Math.floor(Math.random() * voicePromptsEn.length)];

      sendAiMessage(sampleVoice, true);
    } else {
      // Start recording
      setIsRecording(true);

      // Check if browser speech recognition is available
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = isAr ? "ar-EG" : "en-US";
          recognition.continuous = false;
          recognition.interimResults = false;

          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setIsRecording(false);
            if (transcript) {
              sendAiMessage(transcript, true);
            }
          };

          recognition.onerror = () => {
            // Fallback gracefully to simulated voice after 3 seconds
            setTimeout(() => {
              if (isRecording) {
                handleToggleVoice();
              }
            }, 3000);
          };

          recognition.start();
        } catch (e) {
          // Ignore
        }
      }
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isAiThinking) return;
    const text = inputPrompt;
    setInputPrompt("");
    sendAiMessage(text);
  };

  const quickPrompts = [
    {
      title: isAr ? "تحليل أرباح هذا الشهر 📊" : "Analyze this month's profit 📊",
      prompt: isAr ? "حلل أرباح هذا الشهر واعرض لي النصائح" : "Analyze this month's profit and give me recommendations",
    },
    {
      title: isAr ? "ما هي الفواتير المتأخرة؟ ⚠️" : "What invoices are overdue? ⚠️",
      prompt: isAr ? "ما هي الفواتير المتأخرة ومن هم العملاء؟" : "What invoices are currently overdue and need collection?",
    },
    {
      title: isAr ? "أضف مصروف جديد 💸" : "Add a new expense 💸",
      prompt: isAr ? "سجل مصروف شراء أدوات مكتبية بقيمة 450 جنيه" : "Record an expense for office supplies worth 450 EGP",
    },
    {
      title: isAr ? "أنشئ تقرير ضريبي 🧾" : "Generate tax report (14% VAT) 🧾",
      prompt: isAr ? "احسب ضريبة القيمة المضافة 14% لجميع الفواتير هذا الشهر" : "Calculate 14% VAT liability for this month's invoices",
    },
    {
      title: isAr ? "توقع الإيرادات القادمة 🔮" : "Forecast upcoming cash flow 🔮",
      prompt: isAr ? "توقع التدفق النقدي والإيرادات للشهور الثلاثة القادمة" : "Forecast revenue and cash flow for next 3 months",
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-[#050505] text-white rounded-3xl border border-white/5 overflow-hidden">
      {/* AI Header */}
      <div className="px-5 py-4 border-b border-white/5 bg-[#0A0A0A] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs text-white font-mono">
                {isAr ? "حاسبها AI الوكيل المالي" : "Hasebha Autonomous AI"}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[9px] font-mono">
                {isAr ? "وكيل تنفيذي نشط" : "Autonomous Agent"}
              </span>
            </div>
            <p className="text-[10px] text-white/40 font-mono mt-0.5">
              {isAr ? "ينفذ المهام، ينشئ الفواتير، ويرسل تذكيرات الواتساب" : "Executes financial tasks & WhatsApp reminders"}
            </p>
          </div>
        </div>

        <button
          onClick={clearAiChat}
          className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-mono"
          title={isAr ? "مسح المحادثة" : "Clear Chat"}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono">
        {/* Welcome greeting card if early */}
        {aiMessages.length <= 1 && (
          <div className="p-6 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white font-mono">
              {isAr ? "مرحباً كريم! 👋" : "Welcome, Karim! 👋"}
            </h4>
            <p className="text-xs text-white/60 leading-relaxed max-w-sm mx-auto font-sans">
              {isAr
                ? "أنا حاسبها AI محاسبك الذكي المتخصص. قل لي: «اعمل فاتورة لأحمد تريدنج» أو اطلب مني «إرسال تذكير للمتأخرات» وسأنفذ فوراً!"
                : "I am Hasebha AI, your dedicated small business accountant. Tell me: 'Create invoice for Ahmed Trading' or ask to send late payment reminders!"}
            </p>

            {/* Quick action chips matching mockup */}
            <div className="pt-2 space-y-2 text-left rtl:text-right">
              <span className="text-[11px] font-bold text-white/40 block px-1 uppercase tracking-widest font-mono">
                {isAr ? "أوامر سريعة للبدء:" : "Quick actions to start:"}
              </span>
              <div className="space-y-2">
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendAiMessage(qp.prompt)}
                    className="w-full p-3 rounded-2xl bg-[#0A0A0A] hover:bg-white/5 border border-white/5 text-xs font-semibold text-white/80 hover:text-white flex items-center justify-between group transition-all font-sans"
                  >
                    <span>{qp.title}</span>
                    <ArrowRight className={`w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform ${isAr ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Feed */}
        {aiMessages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[90%] p-4 rounded-3xl text-xs leading-relaxed shadow-lg ${
                  isUser
                    ? "bg-emerald-500 text-black font-semibold rounded-br-sm font-sans"
                    : "bg-[#0F0F0F] text-white border border-white/5 rounded-bl-sm font-sans"
                }`}
              >
                {msg.isVoiceInput && (
                  <div className="flex items-center gap-1.5 text-[10px] opacity-80 mb-1 font-bold font-mono">
                    <Mic className="w-3 h-3" />
                    <span>{isAr ? "أمر صوتي" : "Voice Command"}</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* Interactive Tool / Action Cards */}
                {msg.action && msg.action !== "none" && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-3 font-mono">
                    {/* Invoice Action Card */}
                    {msg.action === "create_invoice" && (
                      <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-emerald-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                            <FileText className="w-4 h-4" />
                            {isAr ? "مسودة الفاتورة المقترحة" : "Invoice Draft Ready"}
                          </span>
                          <span className="text-[10px] text-white/40">
                            {msg.actionData?.paymentTermsDays || 15} {isAr ? "يوم" : "days"}
                          </span>
                        </div>

                        <div className="text-xs text-white/80 space-y-1.5 bg-[#050505] p-3 rounded-xl border border-white/5">
                          <div>
                            <span className="text-white/40">{isAr ? "العميل:" : "Client:"} </span>
                            <span className="font-bold text-white">{msg.actionData?.customerName || "Ahmed Trading"}</span>
                          </div>
                          <div>
                            <span className="text-white/40">{isAr ? "الأصناف:" : "Items:"} </span>
                            <span className="text-white/90">
                              {msg.actionData?.items?.map((it: any) => `${it.name} (${it.quantity}x @ ${it.price} ${currency})`).join(", ") || "Consulting"}
                            </span>
                          </div>
                          <div className="font-bold text-emerald-400 pt-1 border-t border-white/5 flex items-center justify-between">
                            <span>{isAr ? "شامل ضريبة 14%:" : "Total with 14% VAT:"} </span>
                            <span>{formatCurrency(msg.actionData?.total || 1179.9, currency, isAr)}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => executeAiAction(msg.action!, msg.actionData)}
                          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isAr ? "اعتماد وإنشاء الفاتورة الآن" : "Confirm & Issue Invoice"}</span>
                        </button>
                      </div>
                    )}

                    {/* WhatsApp Payment Reminder Action Card */}
                    {msg.action === "draft_whatsapp_reminder" && (
                      <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-emerald-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                            <MessageSquare className="w-4 h-4" />
                            {isAr ? "رسالة تذكير واتساب جاهزة" : "WhatsApp Reminder Ready"}
                          </span>
                          <span className="text-xs text-amber-400 font-bold">
                            {formatCurrency(msg.actionData?.amountDue || 12750, currency, isAr)}
                          </span>
                        </div>

                        <p className="text-xs text-white/80 italic bg-[#050505] p-3 rounded-xl border border-white/5 font-sans leading-relaxed">
                          "{msg.actionData?.reminderMessage}"
                        </p>

                        <a
                          href={generateWhatsAppLink(
                            msg.actionData?.customerPhone || "+201012345678",
                            msg.actionData?.reminderMessage || "Friendly payment reminder from Hasebha"
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          <span>{isAr ? "إرسال عبر واتساب بضغطة زر" : "Send via WhatsApp"}</span>
                        </a>
                      </div>
                    )}

                    {/* Add Expense Action Card */}
                    {msg.action === "add_expense" && (
                      <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-rose-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-400 flex items-center gap-1.5 text-xs">
                            <TrendingDown className="w-4 h-4" />
                            {isAr ? "تسجيل مصروف جديد" : "New Expense Logged"}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {formatCurrency(msg.actionData?.amount || 450, currency, isAr)}
                          </span>
                        </div>
                        <div className="text-xs text-white/80 font-sans">
                          {msg.actionData?.title} ({msg.actionData?.category})
                        </div>
                        <button
                          onClick={() => {
                            executeAiAction(msg.action!, msg.actionData);
                            setActiveTab("invoices");
                          }}
                          className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all"
                        >
                          {isAr ? "تأكيد وإضافة لسجل المصروفات" : "Save to Expense Ledger"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <span className="text-[9px] text-white/30 px-2 mt-1 font-mono">{msg.timestamp}</span>
            </motion.div>
          );
        })}

        {/* Thinking Indicator */}
        {isAiThinking && (
          <div className="flex items-center gap-2.5 text-xs text-white/60 bg-[#0F0F0F] p-3.5 rounded-2xl border border-white/5 w-fit font-mono">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>{isAr ? "حاسبها AI يفكر ويجهز الإجراءات..." : "Hasebha AI is processing action..."}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Recording Overlay / Active State */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 py-3.5 bg-emerald-950/80 border-t border-emerald-500/30 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-rose-500 rounded-full animate-ping" />
                <div className="w-3 h-3 bg-rose-500 rounded-full absolute inset-0" />
              </div>
              <span className="text-xs font-bold text-emerald-300 font-mono">
                {isAr ? "جاري الاستماع... تحدث بالصوت" : "Listening to voice... Speak now"} (0:{String(recordingDuration).padStart(2, "0")})
              </span>
            </div>
            <button
              onClick={handleToggleVoice}
              className="text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-1.5 rounded-xl font-mono"
            >
              {isAr ? "إيقاف وإرسال" : "Stop & Send"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar with Mic & Send */}
      <div className="p-4 border-t border-white/5 bg-[#0A0A0A]">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          {/* Voice Mic button */}
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`p-3.5 rounded-2xl transition-all shadow-xl ${
              isRecording
                ? "bg-rose-600 text-white animate-pulse"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
            }`}
            title={isAr ? "تحدث بالصوت" : "Speak to AI"}
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Text input */}
          <input
            type="text"
            placeholder={
              isAr
                ? "اكتب أو تحدث لإنشاء فاتورة، تذكير، أو تحليل..."
                : "Type or talk: create invoice, WhatsApp reminder..."
            }
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isAiThinking}
            className="flex-1 px-4 py-3 rounded-2xl bg-[#050505] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 disabled:opacity-50"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isAiThinking}
            className="p-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/5 text-black disabled:text-white/20 font-bold transition-all shadow-xl shadow-emerald-500/20"
          >
            <Send className="w-4 h-4 rtl:rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
};

