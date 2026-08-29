import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  Sparkles,
  Mic,
  Send,
  Trash2,
  CheckCircle2,
  FileText,
  MessageSquare,
  TrendingDown,
  ArrowRight,
  Zap,
} from "lucide-react";
import { formatCurrency, generateWhatsAppLink } from "../utils/formatters";

export const AiCopilotPanel: React.FC = () => {
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
  } = useApp();

  const isAr = language === "ar";
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);

  const handleVoiceToggle = () => {
    if (isListening) {
      setIsListening(false);
      const voicePromptsAr = [
        "اعمل فاتورة لأحمد تريدنج فيها 2 حامل لابتوب بسعر 350 جنيه وماوس وايرلس بسعر 450 جنيه",
        "ابعت تذكير واتساب لفاتورة النور سنتر المتأخرة",
        "سجل مصروف تسويق 1500 جنيه إعلانات فيسبوك",
      ];
      const voicePromptsEn = [
        "Create invoice for Ahmed Trading with 2 Laptop Stands at 350 EGP and 1 Wireless Mouse at 450 EGP",
        "Send WhatsApp payment reminder for overdue invoice",
        "Record expense of 1500 EGP for Facebook marketing ads",
      ];
      const prompt = isAr
        ? voicePromptsAr[Math.floor(Math.random() * voicePromptsAr.length)]
        : voicePromptsEn[Math.floor(Math.random() * voicePromptsEn.length)];
      sendAiMessage(prompt, true);
    } else {
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        const prompt = isAr
          ? "اعمل فاتورة لأحمد تريدنج فيها 2 حامل لابتوب وماوس وايرلس"
          : "Create invoice for Ahmed Trading with 2 Laptop Stands and Wireless Mouse";
        sendAiMessage(prompt, true);
      }, 3500);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isAiThinking) return;
    const text = inputText;
    setInputText("");
    sendAiMessage(text);
  };

  return (
    <div className="bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] rounded-3xl border border-white/10 p-5 h-full flex flex-col relative overflow-hidden shadow-2xl">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            <Sparkles className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-widest text-white/90 font-mono block">
              {isAr ? "محاسب احسبها الذكي" : "HASEBHA AI AGENT"}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">
              {isAr ? "مستعد للأوامر الصوتية" : "Autonomous Copilot"}
            </span>
          </div>
        </div>

        <button
          onClick={clearAiChat}
          className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
          title={isAr ? "مسح المحادثة" : "Clear Chat"}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Chat Messages Log */}
      <div className="space-y-3.5 flex-1 overflow-y-auto no-scrollbar relative z-10 pr-1 pb-2">
        {aiMessages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
            >
              <div
                className={`text-xs leading-relaxed ${
                  isUser
                    ? "bg-white text-black px-4 py-2 rounded-2xl rounded-br-none font-medium max-w-[85%]"
                    : "bg-white/5 p-3.5 rounded-2xl rounded-tl-none border border-white/5 text-white/80 max-w-[90%]"
                }`}
              >
                {msg.isVoiceInput && (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mb-1">
                    <Mic className="w-3 h-3" />
                    <span>{isAr ? "أمر صوتي" : "Voice Task"}</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* Structured Action Cards */}
                {msg.action === "create_invoice" && (
                  <div className="mt-2.5 p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] space-y-2">
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {isAr ? "مسودة فاتورة جاهزة" : "Invoice Draft Ready"}
                      </span>
                      <span>{formatCurrency(msg.actionData?.total || 1179.9, currency, isAr)}</span>
                    </div>
                    <button
                      onClick={() => executeAiAction(msg.action!, msg.actionData)}
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform uppercase tracking-tighter"
                    >
                      {isAr ? "اعتماد وإنشاء الفاتورة" : "Create Invoice Now"}
                    </button>
                  </div>
                )}

                {msg.action === "draft_whatsapp_reminder" && (
                  <div className="mt-2.5 p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] space-y-2">
                    <p className="text-white/50 italic text-[10px]">
                      "{msg.actionData?.reminderMessage}"
                    </p>
                    <a
                      href={generateWhatsAppLink(
                        msg.actionData?.customerPhone || "+201012345678",
                        msg.actionData?.reminderMessage || "Friendly payment reminder from Hasebha"
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform uppercase tracking-tighter flex items-center justify-center gap-1"
                    >
                      <span>{isAr ? "إرسال عبر واتساب" : "Send via WhatsApp"}</span>
                    </a>
                  </div>
                )}

                {msg.action === "add_expense" && (
                  <div className="mt-2.5 p-3 rounded-xl bg-black/40 border border-rose-500/30 text-[11px] space-y-2">
                    <div className="flex items-center justify-between text-rose-400 font-bold">
                      <span>{msg.actionData?.title}</span>
                      <span>-{formatCurrency(msg.actionData?.amount || 1500, currency, isAr)}</span>
                    </div>
                    <button
                      onClick={() => {
                        executeAiAction(msg.action!, msg.actionData);
                        setActiveTab("invoices");
                      }}
                      className="w-full py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition-colors"
                    >
                      {isAr ? "حفظ في المصروفات" : "Save to Expenses"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isAiThinking && (
          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-2 text-xs text-white/50">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span>{isAr ? "جاري التفكير والتنفيذ..." : "AI Agent is processing..."}</span>
          </div>
        )}
      </div>

      {/* Audio Waveform Listening Box */}
      <div
        onClick={handleVoiceToggle}
        className={`mt-3 p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-2 relative z-10 ${
          isListening
            ? "bg-emerald-500/10 border-emerald-500/40"
            : "bg-white/5 border-dashed border-white/20 hover:border-white/40"
        }`}
      >
        <div className="flex gap-1.5 items-center h-8">
          <div className={`w-1 rounded-full ${isListening ? "h-4 bg-emerald-400 animate-bounce" : "h-3 bg-white/20 animate-pulse"}`} />
          <div className={`w-1 rounded-full ${isListening ? "h-7 bg-emerald-300 animate-bounce delay-75" : "h-6 bg-white/40"}`} />
          <div className={`w-1 rounded-full ${isListening ? "h-5 bg-emerald-400 animate-bounce delay-150" : "h-4 bg-white/60"}`} />
          <div className={`w-1 rounded-full ${isListening ? "h-8 bg-emerald-200 animate-bounce" : "h-8 bg-white"}`} />
          <div className={`w-1 rounded-full ${isListening ? "h-6 bg-emerald-400 animate-bounce delay-100" : "h-5 bg-white/40"}`} />
        </div>
        <p className="text-[10px] text-white/40 uppercase font-semibold tracking-wider">
          {isListening
            ? isAr
              ? "جاري الاستماع... اضغط للإرسال"
              : "Listening for task... Click to finish"
            : isAr
            ? "اضغط للتحدث بالأمر الصوتي"
            : "Click to speak voice task..."}
        </p>
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="mt-3 flex items-center gap-2 relative z-10">
        <button
          type="button"
          onClick={handleVoiceToggle}
          className={`p-2.5 rounded-xl transition-all ${
            isListening
              ? "bg-rose-500 text-white animate-pulse"
              : "bg-white/10 text-white/80 hover:bg-white/20"
          }`}
          title={isAr ? "أمر صوتي" : "Voice Command"}
        >
          <Mic className="w-4 h-4" />
        </button>

        <input
          type="text"
          placeholder={isAr ? "اكتب مهمة للمحاسب..." : "Ask accountant a task..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isAiThinking}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isAiThinking}
          className="p-2.5 rounded-xl bg-white text-black disabled:bg-white/20 disabled:text-white/40 hover:bg-white/90 font-bold transition-all shadow-sm"
        >
          <Send className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>
      </form>
    </div>
  );
};
