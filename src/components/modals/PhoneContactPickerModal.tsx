import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  UserPlus,
  Search,
  Check,
  X,
  Smartphone,
  Building,
  User,
  Plus,
} from "lucide-react";
import { Customer } from "../../types";

const mockPhoneContacts = [
  {
    name: "Tarek Mansour",
    nameAr: "طارق منصور للتوريدات",
    phone: "+20 100 789 4561",
    email: "tarek.mansour@gmail.com",
    address: "Maadi, Cairo",
    avatarColor: "bg-blue-600",
  },
  {
    name: "Mona El-Sayed Co.",
    nameAr: "شركة منى السيد للتصميم",
    phone: "+20 111 234 8970",
    email: "mona.design@outlook.com",
    address: "Heliopolis, Cairo",
    avatarColor: "bg-emerald-600",
  },
  {
    name: "Khaled Badran Trading",
    nameAr: "مؤسسة خالد بدران التجارية",
    phone: "+20 122 555 9812",
    email: "badran.trading@gmail.com",
    address: "Mohandessin, Giza",
    avatarColor: "bg-amber-600",
  },
  {
    name: "Al-Ahram Logistics",
    nameAr: "الأهرام للشحن واللوجستيات",
    phone: "+20 102 444 1122",
    email: "alahram.shipping@domain.com",
    address: "6th of October City",
    avatarColor: "bg-purple-600",
  },
  {
    name: "Modern Furnishings",
    nameAr: "المفروشات العصرية",
    phone: "+20 155 333 7788",
    email: "modern.furnish@gmail.com",
    address: "Smouha, Alexandria",
    avatarColor: "bg-rose-600",
  },
];

export const PhoneContactPickerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { customers, addCustomer, language } = useApp();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [customName, setCustomName] = useState("");
  const [customPhone, setCustomPhone] = useState("");
  const [showAddManual, setShowAddManual] = useState(false);

  if (!isOpen) return null;

  const toggleSelect = (phone: string) => {
    if (selectedContacts.includes(phone)) {
      setSelectedContacts(selectedContacts.filter((p) => p !== phone));
    } else {
      setSelectedContacts([...selectedContacts, phone]);
    }
  };

  const handleImportSelected = () => {
    const toImport = mockPhoneContacts.filter((c) =>
      selectedContacts.includes(c.phone)
    );

    toImport.forEach((contact) => {
      // Check if not already in customers
      const exists = customers.some((c) => c.phone === contact.phone);
      if (!exists) {
        addCustomer({
          name: contact.name,
          nameAr: contact.nameAr,
          phone: contact.phone,
          email: contact.email,
          address: contact.address,
          totalInvoiced: 0,
          outstandingBalance: 0,
          avatarColor: contact.avatarColor,
        });
      }
    });

    setSelectedContacts([]);
    onClose();
  };

  const handleAddManualContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customPhone) return;

    addCustomer({
      name: customName,
      nameAr: customName,
      phone: customPhone,
      totalInvoiced: 0,
      outstandingBalance: 0,
      avatarColor: "bg-emerald-600",
    });

    setCustomName("");
    setCustomPhone("");
    setShowAddManual(false);
    onClose();
  };

  const filtered = mockPhoneContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.nameAr.includes(search) ||
      c.phone.includes(search)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-[#0A0A0A] rounded-3xl p-6 shadow-2xl border border-white/10 text-white space-y-5 max-h-[85vh] flex flex-col font-mono">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {isAr ? "استيراد جهات الاتصال من الهاتف" : "Import Phone Contacts"}
              </h3>
              <span className="text-xs text-white/40">
                {isAr ? "اختر جهات الاتصال لإضافتها للعملاء" : "Select contacts to import to Hasebha"}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Manual Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              placeholder={isAr ? "بحث في دفتر العناوين..." : "Search contacts..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2.5 rounded-2xl bg-[#0F0F0F] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 font-sans"
            />
          </div>

          <button
            onClick={() => setShowAddManual(!showAddManual)}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold shrink-0 border border-white/10 transition-colors"
            title={isAr ? "إضافة يدوية" : "Manual Add"}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Manual Contact Form */}
        {showAddManual && (
          <form onSubmit={handleAddManualContact} className="p-4 bg-[#0F0F0F] rounded-2xl border border-white/10 space-y-3 text-xs">
            <span className="font-bold text-white block">
              {isAr ? "إضافة عميل يدوي سريع" : "Add Custom Client"}
            </span>
            <input
              type="text"
              required
              placeholder={isAr ? "اسم العميل / الشركة" : "Customer / Business Name"}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#050505] border border-white/10 text-xs text-white placeholder:text-white/30 font-sans focus:outline-none"
            />
            <input
              type="text"
              required
              placeholder={isAr ? "رقم الهاتف (+20...)" : "Phone Number (+20...)"}
              value={customPhone}
              onChange={(e) => setCustomPhone(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#050505] border border-white/10 text-xs text-white placeholder:text-white/30 font-sans focus:outline-none"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs transition-colors"
            >
              {isAr ? "حفظ كعميل" : "Save as Customer"}
            </button>
          </form>
        )}

        {/* Phonebook List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filtered.map((contact) => {
            const isSelected = selectedContacts.includes(contact.phone);
            const alreadyImported = customers.some((c) => c.phone === contact.phone);

            return (
              <div
                key={contact.phone}
                onClick={() => !alreadyImported && toggleSelect(contact.phone)}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                  alreadyImported
                    ? "bg-[#0F0F0F]/40 opacity-40 border-white/5"
                    : isSelected
                    ? "bg-emerald-500/10 border-emerald-500/40"
                    : "bg-[#0F0F0F] border-white/5 hover:border-white/15"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl ${contact.avatarColor} text-white flex items-center justify-center font-bold text-xs`}
                  >
                    {contact.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-white font-sans">
                      {isAr ? contact.nameAr : contact.name}
                    </h5>
                    <p className="text-[10px] text-white/40">{contact.phone}</p>
                  </div>
                </div>

                <div>
                  {alreadyImported ? (
                    <span className="text-[10px] text-white/40 font-semibold px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                      {isAr ? "موجود مسبقاً" : "Added"}
                    </span>
                  ) : (
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-emerald-500 border-emerald-500 text-black font-bold"
                          : "border-white/20"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={handleImportSelected}
          disabled={selectedContacts.length === 0}
          className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/5 text-black disabled:text-white/20 font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>
            {isAr
              ? `استيراد (${selectedContacts.length}) جهات اتصال للعملاء`
              : `Import (${selectedContacts.length}) Selected Contacts`}
          </span>
        </button>
      </div>
    </div>
  );
};

