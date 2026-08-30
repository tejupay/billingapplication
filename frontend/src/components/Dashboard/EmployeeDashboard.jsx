import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { PlusCircle, Search, Printer, Share2, ShoppingBag, Receipt, CheckCircle, ShieldOff } from 'lucide-react';

export const EmployeeDashboard = ({ onOpenBilling, onSelectInvoiceForPrint }) => {
  const { invoices, products, customers, shopDetails } = useData();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');

  // Filter ONLY employee's own sales (No access to overall profit data)
  const mySales = invoices.filter(i => i.createdBy === currentUser?.username);
  
  const todayTotal = mySales
    .filter(i => i.date === new Date().toISOString().split('T')[0])
    .reduce((sum, i) => sum + (i.grandTotal || 0), 0);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.barcode.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Employee POS Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white">
            Welcome, {currentUser?.fullName}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Quickly search catalog, create GST bills, print receipts & send invoices on WhatsApp.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-right">
            <div className="text-[10px] text-slate-400">My Today's Counter Sales</div>
            <div className="text-base font-bold text-emerald-400 font-heading">₹{todayTotal.toLocaleString()}</div>
          </div>
          <button
            onClick={onOpenBilling}
            className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-5 h-5" /> Fast POS Billing
          </button>
        </div>
      </div>

      {/* Security Privacy Notice */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 flex items-center gap-2">
        <ShieldOff className="w-4 h-4 text-amber-400 shrink-0" />
        <span>Notice: You are logged in with Employee role access. Company profit & net financial metrics are hidden.</span>
      </div>

      {/* Quick Search & Catalog Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Search & Inventory Quick Lookup */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white font-heading">Quick Catalog & Barcode Search</h3>
            <span className="text-xs text-slate-400">{filteredProducts.length} Items</span>
          </div>

          <div className="relative mb-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type product name or scan barcode (e.g. 890123456701)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
            {filteredProducts.map(p => (
              <div key={p.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition">
                <div>
                  <div className="text-xs font-semibold text-white">{p.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">BC: {p.barcode} • GST: {p.taxRate}%</div>
                  <div className="text-[10px] text-slate-500">Stock: {p.stockQuantity} {p.unit}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-blue-400">₹{p.sellingPrice.toLocaleString()}</div>
                  <button
                    onClick={onOpenBilling}
                    className="mt-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 hover:bg-emerald-500/20"
                  >
                    + Add to Bill
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Employee's Own Created Invoices */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-base font-bold text-white font-heading mb-1">My Sales History</h3>
          <p className="text-xs text-slate-400 mb-4">Invoices generated by your counter</p>

          <div className="space-y-3">
            {mySales.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No bills generated yet today. Click "Fast POS Billing" to create your first sale.
              </div>
            ) : (
              mySales.map(inv => (
                <div key={inv.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white font-mono">{inv.invoiceNumber}</span>
                    <span className="text-xs font-bold text-emerald-400">₹{inv.grandTotal.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mb-2">{inv.customerName} • {inv.date}</div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onSelectInvoiceForPrint(inv)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3 text-blue-400" /> Print
                    </button>
                    <a
                      href={`https://wa.me/${(inv.customerPhone || inv.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                        `🧾 *INVOICE: #${inv.invoiceNumber || 'INV'}*\n` +
                        `🏢 *${shopDetails?.name || 'GreenDrive EV Motors'}*\n` +
                        `----------------------------------------\n` +
                        `👤 Customer: ${inv.customerName || 'Valued Customer'}\n` +
                        `💰 *LOCKED PAYABLE AMOUNT:* *₹${Number(inv.grandTotal || 0).toLocaleString('en-IN')}*\n\n` +
                        `⚡ *1-CLICK PAYMENT LINK (PhonePe / Google Pay / Paytm / Any UPI App):*\n` +
                        `upi://pay?pa=${shopDetails?.upiId || 'apexretail@hdfcbank'}&pn=${encodeURIComponent(shopDetails?.name || 'GreenDrive EV')}&am=${Number(inv.grandTotal || 0).toFixed(2)}&cu=INR&tn=${encodeURIComponent('Invoice-' + (inv.invoiceNumber || 'BILL'))}\n\n` +
                        `*(Note: Opens your UPI app with the exact locked amount of ₹${Number(inv.grandTotal || 0).toLocaleString('en-IN')} prefilled)*\n\n` +
                        `Thank you for your business! 🙏`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white text-[10px] rounded flex items-center gap-1 transition"
                    >
                      <Share2 className="w-3 h-3" /> WhatsApp
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
