import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, PlusCircle, ArrowUpRight, ArrowDownRight, Package, Receipt, FileText, CheckCircle2 } from 'lucide-react';

export const ManagerDashboard = ({ onOpenBilling, onNavigateTab }) => {
  const { products, invoices, adjustStock } = useData();
  const { currentUser } = useAuth();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockDelta, setStockDelta] = useState(5);
  const [stockMode, setStockMode] = useState('IN');
  const [successMsg, setSuccessMsg] = useState('');

  const lowStockList = products.filter(p => p.stockQuantity <= p.minStockThreshold);

  const handleStockSubmit = (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    adjustStock(selectedProduct.id, Number(stockDelta), stockMode, currentUser);
    setSuccessMsg(`Stock updated successfully for ${selectedProduct.name}`);
    setSelectedProduct(null);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-semibold rounded-lg font-mono">
            STORE MANAGER CONSOLE
          </span>
          <h2 className="text-xl font-bold font-heading text-white mt-1">Inventory Control & Sales Monitoring</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage stock levels, inspect employee billing activity, and generate store reports.</p>
        </div>

        <button
          onClick={onOpenBilling}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30"
        >
          <PlusCircle className="w-4 h-4" /> Create Bill / Quotation
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl p-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts & Fast Adjustment */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" /> Low Stock Warning Thresholds
              </h3>
              <p className="text-xs text-slate-400">Products requiring immediate reordering</p>
            </div>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs text-blue-400 hover:underline"
            >
              View All Products &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {lowStockList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                All inventory items are currently above minimum stock thresholds.
              </div>
            ) : (
              lowStockList.map(item => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">{item.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Barcode: {item.barcode} • HSN: {item.hsnCode}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs font-bold text-rose-400">{item.stockQuantity} {item.unit}</div>
                      <div className="text-[10px] text-slate-500">Min: {item.minStockThreshold}</div>
                    </div>
                    <button
                      onClick={() => setSelectedProduct(item)}
                      className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-medium transition"
                    >
                      Refill Stock
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Store Bills */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-base font-bold text-white font-heading mb-1">Recent Invoices Generated</h3>
          <p className="text-xs text-slate-400 mb-4">Bills created by all staff members</p>

          <div className="space-y-3">
            {invoices.slice(0, 5).map(inv => (
              <div key={inv.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{inv.invoiceNumber}</div>
                  <div className="text-[10px] text-slate-400">{inv.customerName} • By {inv.createdByName}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-400">₹{inv.grandTotal.toLocaleString()}</div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">
                    {inv.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Refill Adjustment Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Adjust Inventory Stock</h3>
            <p className="text-xs text-slate-400 mb-4">{selectedProduct.name} (Current: {selectedProduct.stockQuantity} {selectedProduct.unit})</p>

            <form onSubmit={handleStockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStockMode('IN')}
                    className={`py-2 text-xs font-semibold rounded-lg border ${
                      stockMode === 'IN' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Stock IN (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockMode('OUT')}
                    className={`py-2 text-xs font-semibold rounded-lg border ${
                      stockMode === 'OUT' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Stock OUT (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Quantity ({selectedProduct.unit})</label>
                <input
                  type="number"
                  min="1"
                  value={stockDelta}
                  onChange={(e) => setStockDelta(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                >
                  Save Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
