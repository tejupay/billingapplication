import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Users, Plus, Search, CreditCard, CheckCircle2, Trash2 } from 'lucide-react';

export const CustomerLedger = () => {
  const { customers, addCustomer, deleteCustomer, recordCustomerPayment } = useData();
  const { currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedCust, setSelectedCust] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  const handleDeleteCust = (cust) => {
    if (window.confirm(`Are you sure you want to delete customer profile for "${cust.name}"?`)) {
      deleteCustomer(cust.id, currentUser);
    }
  };

  // Add customer form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState(25000);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  const handleAddCust = (e) => {
    e.preventDefault();
    addCustomer({ name, phone, email, gstin, address, creditLimit: Number(creditLimit) });
    setShowAddModal(false);
    setName(''); setPhone(''); setEmail(''); setGstin(''); setAddress('');
  };

  const handleRecordPay = (e) => {
    e.preventDefault();
    if (selectedCust && payAmount > 0) {
      recordCustomerPayment(selectedCust.id, Number(payAmount));
      setShowPayModal(false);
      setPayAmount('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold font-heading text-white">Customer Profiles & Debt Ledger</h2>
          <p className="text-xs text-slate-400 mt-0.5">Track customer purchases, credit limits, and collect pending balance payments.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer by name or mobile number..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
        />
      </div>

      {/* Customer Directory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(cust => {
          const hasDue = cust.pendingBalance > 0;
          return (
            <div key={cust.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white font-heading">{cust.name}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    hasDue ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {hasDue ? `Due: ₹${cust.pendingBalance.toLocaleString()}` : 'No Dues'}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  <div>Phone: <span className="text-slate-200 font-mono">{cust.phone || 'N/A'}</span></div>
                  <div>Email: <span className="text-slate-200">{cust.email || 'N/A'}</span></div>
                  <div>GSTIN: <span className="text-slate-200 font-mono">{cust.gstin || 'Unregistered'}</span></div>
                  {cust.address && <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">{cust.address}</div>}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Credit Limit: ₹{(cust.creditLimit || 0).toLocaleString()}</span>
                <div className="flex items-center gap-1.5">
                  {hasDue && (
                    <button
                      onClick={() => {
                        setSelectedCust(cust);
                        setShowPayModal(true);
                      }}
                      className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Collect Payment
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteCust(cust)}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition"
                    title="Delete Customer Profile"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-base font-bold text-white mb-4">Add Customer Profile</h3>
            <form onSubmit={handleAddCust} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Customer / Company Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {showPayModal && selectedCust && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-white mb-1">Collect Customer Payment</h3>
            <p className="text-xs text-slate-400 mb-4">{selectedCust.name} (Current Outstanding: ₹{selectedCust.pendingBalance})</p>

            <form onSubmit={handleRecordPay} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Payment Received Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  max={selectedCust.pendingBalance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" /> Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
