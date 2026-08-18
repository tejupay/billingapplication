import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Printer, Share2, Search, Filter, Plus, MessageSquare, Edit, Trash2 } from 'lucide-react';
import { WhatsAppModal } from './WhatsAppModal';

export const InvoiceList = ({ onOpenBilling, onSelectInvoiceForPrint, onEditInvoice }) => {
  const { invoices, deleteInvoice } = useData();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [selectedWhatsAppInvoice, setSelectedWhatsAppInvoice] = useState(null);

  const handleDeleteInvoice = (inv) => {
    if (window.confirm(`Are you sure you want to delete Invoice #${inv.invoiceNumber}? This will return items back to inventory stock.`)) {
      deleteInvoice(inv.id, currentUser);
    }
  };

  const filtered = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
                          inv.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'ALL' || inv.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold font-heading text-white">Invoices & Quotation History</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage tax bills, proforma quotations, and sales return credit notes.</p>
        </div>

        <button
          onClick={onOpenBilling}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30"
        >
          <Plus className="w-4 h-4" /> Create New Bill
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number or customer name..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
          />
        </div>

        <div className="flex gap-2">
          {['ALL', 'TAX_INVOICE', 'QUOTATION', 'SALES_RETURN'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                filterType === type
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Invoice #</th>
                <th className="p-4">Type</th>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Date</th>
                <th className="p-4">Staff</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-mono font-bold text-white">{inv.invoiceNumber}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-mono text-[10px]">
                      {inv.type || 'TAX_INVOICE'}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-white">{inv.customerName}</td>
                  <td className="p-4 text-slate-400">{inv.date}</td>
                  <td className="p-4 text-slate-400">{inv.createdByName || inv.createdBy}</td>
                  <td className="p-4 text-right font-bold text-emerald-400 font-mono">₹{inv.grandTotal.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inv.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {inv.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEditInvoice && onEditInvoice(inv)}
                        className="p-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white rounded-lg transition"
                        title="Edit Invoice"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onSelectInvoiceForPrint(inv)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                        title="Print Invoice"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-400" />
                      </button>
                      <button
                        onClick={() => setSelectedWhatsAppInvoice(inv)}
                        className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg transition"
                        title="Send via WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(inv)}
                        className="p-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {selectedWhatsAppInvoice && (
        <WhatsAppModal
          invoice={selectedWhatsAppInvoice}
          onClose={() => setSelectedWhatsAppInvoice(null)}
        />
      )}
    </div>
  );
};
