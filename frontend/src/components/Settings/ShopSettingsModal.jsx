import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Store, X, Save, CheckCircle, ShieldAlert, Phone, MapPin, CreditCard, FileText } from 'lucide-react';

export const ShopSettingsModal = ({ isOpen, onClose }) => {
  const { shopDetails, updateShopDetails } = useData();
  const { currentUser } = useAuth();

  const [name, setName] = useState(shopDetails.name || '');
  const [tagline, setTagline] = useState(shopDetails.tagline || '');
  const [phone, setPhone] = useState(shopDetails.phone || '');
  const [altPhone, setAltPhone] = useState(shopDetails.altPhone || '');
  const [email, setEmail] = useState(shopDetails.email || '');
  const [address, setAddress] = useState(shopDetails.address || '');
  const [gstin, setGstin] = useState(shopDetails.gstin || '');
  const [upiId, setUpiId] = useState(shopDetails.upiId || '');
  const [bankName, setBankName] = useState(shopDetails.bankName || '');
  const [accountNo, setAccountNo] = useState(shopDetails.accountNo || '');
  const [ifscCode, setIfscCode] = useState(shopDetails.ifscCode || '');
  const [terms, setTerms] = useState(shopDetails.termsAndConditions || '');

  const [savedMsg, setSavedMsg] = useState(false);

  if (!isOpen) return null;

  // Only Owner can edit shop details
  if (currentUser?.role !== 'OWNER') {
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">Owner Access Required</h3>
          <p className="text-xs text-slate-400 mb-4">Only the Owner account has permission to edit shop & billing configuration.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleSave = (e) => {
    e.preventDefault();
    updateShopDetails({
      name,
      tagline,
      phone,
      altPhone,
      email,
      address,
      gstin,
      upiId,
      bankName,
      accountNo,
      ifscCode,
      termsAndConditions: terms
    });

    setSavedMsg(true);
    setTimeout(() => {
      setSavedMsg(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Edit Shop & Business Details</h3>
              <p className="text-xs text-slate-400">Customize store name, contact numbers, address, bank info & terms.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedMsg && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-400 text-xs px-6 py-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Shop details updated successfully! Invoices & prints will immediately show new details.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Shop / Business Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
                placeholder="e.g. JAGANNA"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Business Tagline / Subtitle</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                placeholder="e.g. Auto Spares & Service Station"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Customer Support Phones</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                placeholder="+91 93339 11911, +91 63644 44752"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Store Direct Mobile</label>
              <input
                type="text"
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                placeholder="7411556115"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">GSTIN Tax Number</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase"
                placeholder="29ABCDE1234F1Z5"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Store Address</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              placeholder="Main Road, Near Bus Stand, Bengaluru"
            ></textarea>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <h4 className="font-bold text-white mb-2 flex items-center gap-1.5 text-xs">
              <CreditCard className="w-4 h-4 text-emerald-400" /> Bank & UPI Details (For Invoice Printing & Payment QR)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">UPI ID (VPA)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  placeholder="jaganna@hdfcbank"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  placeholder="HDFC Bank"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Account Number</label>
                <input
                  type="text"
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  placeholder="50200012345678"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase"
                  placeholder="HDFC0001234"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-400" /> Terms & Conditions Text
            </label>
            <input
              type="text"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              placeholder="Thanks for doing business with us!"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30"
            >
              <Save className="w-4 h-4" /> Save Shop Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
