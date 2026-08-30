import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Building2, X, Save, CheckCircle, Plus, Phone, MapPin, CreditCard, Sparkles } from 'lucide-react';

export const CompanyModal = ({ isOpen, onClose }) => {
  const { shopDetails, updateShopDetails, createNewCompany } = useData();
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

  const [isNewCompanyMode, setIsNewCompanyMode] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  if (!isOpen) return null;

  const handleCreateNew = () => {
    setIsNewCompanyMode(true);
    setName('');
    setTagline('EV Two-Wheeler Sales & Service Station');
    setPhone('');
    setAltPhone('');
    setEmail('');
    setAddress('');
    setGstin('');
    setUpiId('');
    setBankName('');
    setAccountNo('');
    setIfscCode('');
    setTerms('Warranty applies as per manufacturer terms. Thank you!');
  };

  const handleSave = (e) => {
    e.preventDefault();
    const payload = {
      name: name || 'EV Motors',
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
    };

    if (isNewCompanyMode) {
      createNewCompany(payload);
      setSavedMsg('New Company created successfully!');
    } else {
      updateShopDetails(payload);
      setSavedMsg('Company details updated successfully!');
    }

    setTimeout(() => {
      setSavedMsg('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/10 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isNewCompanyMode ? 'Create New Company / Store' : 'Edit Company & Workshop Details'}
              </h3>
              <p className="text-xs text-slate-400">Configure EV workshop name, phone, address, and billing settings.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isNewCompanyMode && (
              <button
                onClick={handleCreateNew}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> New Company
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {savedMsg && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-400 text-xs px-6 py-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{savedMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Company / Workshop Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
                placeholder="e.g. Yashas EV Service"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Tagline / Subtitle</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                placeholder="e.g. EV Two-Wheeler Sales & Service Station"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Primary Phone Number *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                placeholder="9876543210"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Alternate Phone / Support</label>
              <input
                type="text"
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                placeholder="9123456789"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">GSTIN (Optional)</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase"
                placeholder="29EVHUB1234F1Z5"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Company Address *</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              placeholder="Full Workshop Address"
              required
            ></textarea>
          </div>

          {/* Bank & Payment Info */}
          <div className="border-t border-slate-800 pt-4">
            <h4 className="font-bold text-white mb-2 flex items-center gap-1.5 text-xs">
              <CreditCard className="w-4 h-4 text-emerald-400" /> Bank & UPI Details for Customer QR Payments
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">UPI ID (VPA)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  placeholder="evmotors@upi"
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
                  placeholder="50200088991122"
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

          <div>
            <label className="block text-slate-300 font-medium mb-1">Invoice Footer Terms & Conditions</label>
            <input
              type="text"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              placeholder="Thanks for choosing our EV service station!"
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
              <Save className="w-4 h-4" /> {isNewCompanyMode ? 'Save New Company' : 'Update Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
