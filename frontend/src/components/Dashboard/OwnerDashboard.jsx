import React from 'react';
import { useData } from '../../context/DataContext';
import { 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  CreditCard, 
  ArrowUpRight,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const OwnerDashboard = ({ onOpenBilling, onOpenAudit }) => {
  const { shopDetails, invoices, products, customers, expenses } = useData();

  const totalSales = invoices
    .filter(i => i.type === 'TAX_INVOICE')
    .reduce((sum, i) => sum + (i.grandTotal || 0), 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalSales - totalExpenses;
  const lowStockCount = products.filter(p => p.stockQuantity <= p.minStockThreshold).length;
  const pendingDues = customers.reduce((sum, c) => sum + (c.pendingBalance || 0), 0);

  // Build chart from real invoice data grouped by day of week
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayMap = {};
  dayNames.forEach(d => { dayMap[d] = { day: d, revenue: 0, profit: 0 }; });

  invoices
    .filter(i => i.type === 'TAX_INVOICE')
    .forEach(inv => {
      const date = new Date(inv.date || inv.createdAt);
      if (!isNaN(date)) {
        const dayName = dayNames[date.getDay()];
        dayMap[dayName].revenue += inv.grandTotal || 0;
        // Approximate profit per invoice as revenue - purchase cost
        const invCost = (inv.items || []).reduce((s, item) => s + ((item.purchasePrice || 0) * (item.quantity || 1)), 0);
        dayMap[dayName].profit += (inv.grandTotal || 0) - invCost;
      }
    });

  const salesData = dayNames.map(d => dayMap[d]);

  return (
    <div className="space-y-6">
      {/* Header Overview Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Real-time Financial Analytics</span>
          </div>
          <h2 className="text-2xl font-bold font-heading text-white mt-1">{shopDetails?.name || 'Business ERP'} Dashboard</h2>
          <p className="text-xs text-slate-400 mt-1">Complete control over profit, expenses & customer ledgers.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenBilling}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create GST Invoice
          </button>
          <button
            onClick={onOpenAudit}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-xs border border-slate-700 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" /> Security Audit
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Gross Sales Revenue</span>
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-heading text-white">₹{totalSales.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-2">Total from all GST invoices</div>
        </div>

        {/* Net Profit */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Calculated Net Profit</span>
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-heading ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ₹{netProfit.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
            After ₹{totalExpenses.toLocaleString()} expenses deducted
          </div>
        </div>

        {/* Pending Customer Dues */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Customer Pending Dues</span>
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-heading text-amber-400">₹{pendingDues.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-2">Outstanding customer ledger balance</div>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Low Stock Items</span>
            <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-heading text-rose-400">{lowStockCount} Products</div>
          <div className="text-xs text-rose-400/80 mt-2 font-medium">
            {lowStockCount > 0 ? 'Action required: Reorder stock' : 'All stock levels healthy'}
          </div>
        </div>
      </div>

      {/* Revenue & Profit Graph */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-white font-heading">Weekly Revenue & Net Profit Trend</h3>
            <p className="text-xs text-slate-400">Live sales performance across days of the week</p>
          </div>
          <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
            INR ₹ Currency
          </span>
        </div>

        {totalSales === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500">
            <TrendingUp className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No sales yet</p>
            <p className="text-xs mt-1">Create your first GST invoice to see sales data here.</p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="revenue" name="Gross Revenue" stroke="#2563eb" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
