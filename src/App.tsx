import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { AiCopilotPanel } from "./components/AiCopilotPanel";
import { BottomNavBar } from "./components/BottomNavBar";
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

const MainApp: React.FC = () => {
  const { activeTab } = useApp();
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showFlutterArch, setShowFlutterArch] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-[#F0F0F0] flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200 antialiased">
      {/* Desktop Enterprise Immersive Layout (>= lg) */}
      <div className="hidden lg:flex w-full min-h-screen">
        {/* Left Sidebar */}
        <Sidebar onOpenFlutterArch={() => setShowFlutterArch(true)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <Header onOpenFlutterArch={() => setShowFlutterArch(true)} />

          {/* Desktop Body with Dynamic Col 8 / Col 4 split */}
          <main className="flex-1 p-6 lg:p-8 overflow-y-auto no-scrollbar">
            <div className="max-w-[1600px] mx-auto">
              {activeTab === "ai" ? (
                <div className="max-w-4xl mx-auto h-[80vh]">
                  <AiAccountantTab />
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-6 items-start">
                  {/* Left Column (Primary View Tab) */}
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

                  {/* Right Column (Live AI Accountant Copilot Panel) */}
                  <div className="col-span-12 xl:col-span-4 sticky top-6 h-[calc(100vh-140px)]">
                    <AiCopilotPanel />
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Shell (< lg) */}
      <div className="flex lg:hidden flex-col min-h-screen w-full bg-[#050505] relative">
        <Header onOpenFlutterArch={() => setShowFlutterArch(true)} />

        <main className="flex-1 overflow-y-auto pb-6">
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
          {activeTab === "ai" && <AiAccountantTab />}
        </main>

        <BottomNavBar />
      </div>

      {/* Global Modals & Overlays */}
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

