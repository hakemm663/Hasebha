import React, { useState, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { AiCopilotPanel } from "./components/AiCopilotPanel";
import { LandingPage } from "./components/LandingPage";
import { PublicInvoiceView } from "./components/PublicInvoiceView";
import { DashboardTab } from "./components/tabs/DashboardTab";
import { InvoicesTab } from "./components/tabs/InvoicesTab";
import { CreateInvoiceTab } from "./components/tabs/CreateInvoiceTab";
import { InsightsTab } from "./components/tabs/InsightsTab";
import { CustomersTab } from "./components/tabs/CustomersTab";
import { AiAccountantTab } from "./components/tabs/AiAccountantTab";
import { QuickActionModal } from "./components/QuickActionModal";
import { ShareInvoiceModal } from "./components/modals/ShareInvoiceModal";
import { PublicInvoiceModal } from "./components/modals/PublicInvoiceModal";
import { PhoneContactPickerModal } from "./components/modals/PhoneContactPickerModal";
import { FlutterArchitectureModal } from "./components/modals/FlutterArchitectureModal";
import { X } from "lucide-react";

function getPublicTokenFromUrl(): string | null {
  if (typeof window === "undefined") return null;

  // 1. Path: /pay/:token
  const path = window.location.pathname;
  if (path.startsWith("/pay/")) {
    const segment = path.replace("/pay/", "").trim();
    if (segment) return segment;
  }

  // 2. Hash: #pay/:token or #/pay/:token
  const hash = window.location.hash;
  if (hash.includes("pay/")) {
    const parts = hash.split("pay/");
    if (parts[1]) return parts[1].split("?")[0].split("&")[0];
  }

  // 3. Search query: ?token=... or ?pay=...
  const urlParams = new URLSearchParams(window.location.search);
  const qToken = urlParams.get("token") || urlParams.get("pay");
  if (qToken) return qToken;

  return null;
}

const MainApp: React.FC = () => {
  const { user, activeTab, isLoadingAuth } = useApp();
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showFlutterArch, setShowFlutterArch] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [publicToken, setPublicToken] = useState<string | null>(getPublicTokenFromUrl());

  useEffect(() => {
    const handleHashOrPop = () => {
      setPublicToken(getPublicTokenFromUrl());
    };
    window.addEventListener("popstate", handleHashOrPop);
    window.addEventListener("hashchange", handleHashOrPop);
    return () => {
      window.removeEventListener("popstate", handleHashOrPop);
      window.removeEventListener("hashchange", handleHashOrPop);
    };
  }, []);

  // 1. If public invoice link is requested
  if (publicToken) {
    return (
      <PublicInvoiceView
        token={publicToken}
        onBackToApp={() => {
          setPublicToken(null);
          window.history.pushState({}, "", "/");
        }}
      />
    );
  }

  // 2. Show loading spinner during initial session lookup
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-mono">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-white/50">Initializing Hasebha Workspace...</p>
        </div>
      </div>
    );
  }

  // 3. If user clicked to view the SaaS Landing Page & Pricing
  if (showLandingPage) {
    return <LandingPage onExploreDemo={() => setShowLandingPage(false)} />;
  }

  // 4. Authenticated / Live SaaS Dashboard Layout
  return (
    <div className="min-h-screen bg-[#050505] text-[#F0F0F0] flex font-sans selection:bg-emerald-500/30 selection:text-emerald-200 antialiased overflow-x-hidden">
      {/* Desktop Sidebar (hidden on < lg) */}
      <div className="hidden lg:block shrink-0">
        <Sidebar
          onOpenFlutterArch={() => setShowFlutterArch(true)}
          onOpenLanding={() => setShowLandingPage(true)}
        />
      </div>

      {/* Mobile Drawer Navigation (< lg) */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 bg-black/80"
          />

          {/* Sliding Sidebar */}
          <div className="relative z-10 w-[280px] bg-[#0A0A0A] h-full flex flex-col shadow-2xl border-r border-white/10">
            <div className="absolute top-4 right-4 rtl:left-4 rtl:right-auto z-20">
              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-2 rounded-full text-white/60 hover:text-white bg-white/5 hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <Sidebar
              onOpenFlutterArch={() => {
                setShowFlutterArch(true);
                setMobileNavOpen(false);
              }}
              onOpenLanding={() => {
                setShowLandingPage(true);
                setMobileNavOpen(false);
              }}
              onCloseMobileNav={() => setMobileNavOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenFlutterArch={() => setShowFlutterArch(true)}
          onOpenLanding={() => setShowLandingPage(true)}
          onToggleMobileMenu={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto no-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            {activeTab === "ai" ? (
              <div className="max-w-4xl mx-auto h-[82vh]">
                <AiAccountantTab />
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-6 items-start">
                {/* Primary Content View */}
                <div className="col-span-12 xl:col-span-8 space-y-6">
                  {activeTab === "dashboard" && <DashboardTab />}
                  {activeTab === "invoices" && <InvoicesTab />}
                  {activeTab === "create" && (
                    <CreateInvoiceTab
                      onOpenContactImport={() => setShowContactPicker(true)}
                    />
                  )}
                  {activeTab === "insights" && <InsightsTab />}
                  {activeTab === "customers" && (
                    <CustomersTab
                      onOpenContactImport={() => setShowContactPicker(true)}
                    />
                  )}
                </div>

                {/* Right Column: Live AI Copilot Panel */}
                <div className="col-span-12 xl:col-span-4 sticky top-6 hidden xl:block h-[calc(100vh-140px)]">
                  <AiCopilotPanel />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <QuickActionModal onOpenContactImport={() => setShowContactPicker(true)} />
      <ShareInvoiceModal />
      <PublicInvoiceModal />
      <PhoneContactPickerModal
        isOpen={showContactPicker}
        onClose={() => setShowContactPicker(false)}
      />
      <FlutterArchitectureModal
        isOpen={showFlutterArch}
        onClose={() => setShowFlutterArch(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
