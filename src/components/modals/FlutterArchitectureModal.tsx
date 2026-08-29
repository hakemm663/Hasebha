import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  Code,
  Layers,
  Cpu,
  Database,
  Bell,
  CheckCircle2,
  Copy,
  Check,
  X,
  FileCode,
  FolderTree,
} from "lucide-react";

export const FlutterArchitectureModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { language } = useApp();
  const isAr = language === "ar";
  const [activeCodeTab, setActiveCodeTab] = useState<
    "bloc" | "di" | "supabase" | "fcm" | "structure"
  >("bloc");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const flutterArchitectureTree = `lib/
├── core/
│   ├── di/
│   │   └── injection_container.dart       # get_it service locator
│   ├── network/
│   │   ├── api_client.dart               # Dio / Supabase REST client
│   │   └── error_handler.dart
│   ├── services/
│   │   ├── notification_service.dart     # Firebase Cloud Messaging (FCM)
│   │   └── pdf_service.dart              # pdf & printing package
│   └── utils/
│       └── formatters.dart
├── features/
│   ├── ai_agent/
│   │   ├── data/ (datasources, repositories, models)
│   │   ├── domain/ (usecases, entities)
│   │   └── presentation/ (cubit: AiAgentCubit, screens, widgets)
│   ├── invoice/
│   │   ├── presentation/cubit/ (InvoiceCubit, InvoiceState)
│   │   └── presentation/screens/ (InvoiceListScreen, CreateInvoiceScreen)
│   ├── insights/
│   │   └── presentation/cubit/ (FinancialAnalysisCubit)
│   └── customers/
│       └── presentation/cubit/ (CustomerCubit)
└── main.dart`;

  const blocCode = `// lib/features/invoice/presentation/cubit/invoice_cubit.dart
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';

part 'invoice_state.dart';

class InvoiceCubit extends Cubit<InvoiceState> {
  final CreateInvoiceUseCase createInvoiceUseCase;
  final GetInvoicesUseCase getInvoicesUseCase;

  InvoiceCubit({
    required this.createInvoiceUseCase,
    required this.getInvoicesUseCase,
  }) : super(InvoiceInitial());

  Future<void> createInvoice(InvoiceEntity invoice) async {
    emit(InvoiceLoading());
    final result = await createInvoiceUseCase(invoice);
    result.fold(
      (failure) => emit(InvoiceError(failure.message)),
      (newInvoice) => emit(InvoiceCreatedSuccess(newInvoice)),
    );
  }

  Future<void> triggerAiVoiceInvoice(String voiceText) async {
    emit(AiVoiceProcessing());
    // Parse voice commands & dispatch structured invoice actions
  }
}`;

  const diCode = `// lib/core/di/injection_container.dart
import 'package:get_it/get_it.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

final sl = GetIt.instance;

Future<void> initDependencies() async {
  // Features - Invoices
  sl.registerFactory(() => InvoiceCubit(
    createInvoiceUseCase: sl(),
    getInvoicesUseCase: sl(),
  ));

  // UseCases
  sl.registerLazySingleton(() => CreateInvoiceUseCase(sl()));

  // Repository & DataSources
  sl.registerLazySingleton<InvoiceRepository>(
    () => InvoiceRepositoryImpl(remoteDataSource: sl()),
  );

  // External
  final supabase = Supabase.instance.client;
  sl.registerLazySingleton(() => supabase);
  sl.registerLazySingleton(() => FirebaseMessaging.instance);
}`;

  const supabaseCode = `// lib/features/invoice/data/datasources/supabase_remote_data_source.dart
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseInvoiceDataSource {
  final SupabaseClient client;
  SupabaseInvoiceDataSource(this.client);

  Future<List<InvoiceModel>> fetchInvoices() async {
    final response = await client
        .from('invoices')
        .select('*, invoice_items(*)')
        .order('created_at', ascending: false);
    return (response as List).map((i) => InvoiceModel.fromJson(i)).toList();
  }

  Stream<List<InvoiceModel>> streamRealtimeInvoices() {
    return client
        .from('invoices')
        .stream(primaryKey: ['id'])
        .map((data) => data.map((e) => InvoiceModel.fromJson(e)).toList());
  }
}`;

  const fcmCode = `// lib/core/services/notification_service.dart
import 'package:firebase_messaging/firebase_messaging.dart';

class PushNotificationService {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;

  Future<void> initialize() async {
    NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      // Show in-app notification when customer pays invoice online
      if (message.data['type'] == 'invoice_paid') {
        // Trigger live haptic feedback and update state
      }
    });
  }
}`;

  const currentCode =
    activeCodeTab === "bloc"
      ? blocCode
      : activeCodeTab === "di"
      ? diCode
      : activeCodeTab === "supabase"
      ? supabaseCode
      : activeCodeTab === "fcm"
      ? fcmCode
      : flutterArchitectureTree;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0A0A0A] rounded-3xl shadow-2xl border border-white/10 text-white overflow-hidden my-auto max-h-[90vh] flex flex-col font-mono">
        {/* Header */}
        <div className="p-5 bg-[#0F0F0F] border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-md">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white font-sans">
                {isAr ? "هندسة تطبيق Flutter المعمارية" : "Senior Flutter Developer Architecture"}
              </h3>
              <p className="text-[10px] text-white/40">
                BLoC / Cubit • Dependency Injection (get_it) • Supabase • FCM Push
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Code Tabs */}
        <div className="flex items-center gap-2 p-3 bg-[#0F0F0F] border-b border-white/5 overflow-x-auto text-xs">
          {[
            { id: "bloc", label: "BLoC / Cubit" },
            { id: "di", label: "DI (get_it)" },
            { id: "supabase", label: "Supabase Data Layer" },
            { id: "fcm", label: "FCM Push Notifications" },
            { id: "structure", label: "Clean Architecture Tree" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCodeTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeCodeTab === tab.id
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "text-white/40 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code Viewer */}
        <div className="flex-1 p-5 overflow-y-auto bg-[#050505] font-mono text-xs text-white/80 relative leading-relaxed">
          <button
            onClick={handleCopy}
            className="absolute top-4 right-4 rtl:right-auto rtl:left-4 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white flex items-center gap-2 border border-white/10 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy Code"}</span>
          </button>

          <pre className="overflow-x-auto whitespace-pre-wrap font-mono pt-4">{currentCode}</pre>
        </div>

        {/* Summary Footer */}
        <div className="p-4 bg-[#0F0F0F] border-t border-white/5 flex items-center justify-between text-xs">
          <span className="text-[11px] text-white/40">
            {isAr
              ? "هذا التطبيق التفاعلي يقدم نموذجاً حياً كاملاً لـ Hasebha مع دعم التصدير لـ Flutter"
              : "Full interactive live Hasebha prototype with complete Flutter export blueprints"}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-colors"
          >
            {isAr ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};
