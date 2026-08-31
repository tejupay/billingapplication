import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Package, Plus, Search, AlertCircle, RefreshCw, Layers, Tag, Trash2, Edit2, Check, X, Save } from 'lucide-react';

export const InventoryManager = () => {
  const { products, addProduct, updateProduct, deleteProduct, adjustStock } = useData();
  const { currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustQty, setAdjustQty] = useState(5);
  const [adjustMode, setAdjustMode] = useState('IN');

  // Inline Price Editing State
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [inlineSellingPrice, setInlineSellingPrice] = useState('');
  const [inlinePurchasePrice, setInlinePurchasePrice] = useState('');

  // New / Edit Product Form State
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [category, setCategory] = useState('General Service & Consumables');
  const [brand, setBrand] = useState('Yashas Care');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [taxRate, setTaxRate] = useState(18);
  const [stockQuantity, setStockQuantity] = useState(10);
  const [minStockThreshold, setMinStockThreshold] = useState(5);
  const [unit, setUnit] = useState('Nos');

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search)) ||
    (p.hsnCode && p.hsnCode.includes(search)) ||
    (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenAddModal = () => {
    setName('');
    setBarcode(Math.floor(100000000000 + Math.random() * 900000000000).toString());
    setHsnCode('');
    setCategory('General Service & Consumables');
    setBrand('Yashas Care');
    setPurchasePrice('');
    setSellingPrice('');
    setTaxRate(18);
    setStockQuantity(10);
    setMinStockThreshold(5);
    setUnit('Nos');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (p) => {
    setEditId(p.id);
    setName(p.name || '');
    setBarcode(p.barcode || '');
    setHsnCode(p.hsnCode || '');
    setCategory(p.category || 'General Service & Consumables');
    setBrand(p.brand || 'Yashas Care');
    setPurchasePrice(p.purchasePrice !== undefined ? String(p.purchasePrice) : '');
    setSellingPrice(p.sellingPrice !== undefined ? String(p.sellingPrice) : '');
    setTaxRate(p.taxRate !== undefined ? Number(p.taxRate) : 18);
    setStockQuantity(p.stockQuantity !== undefined ? Number(p.stockQuantity) : 0);
    setMinStockThreshold(p.minStockThreshold !== undefined ? Number(p.minStockThreshold) : 5);
    setUnit(p.unit || 'Nos');
    setShowEditModal(true);
  };

  const handleCreateProduct = (e) => {
    e.preventDefault();
    addProduct({
      name,
      barcode: barcode || Math.floor(100000000000 + Math.random() * 900000000000).toString(),
      hsnCode,
      category,
      brand,
      purchasePrice: purchasePrice !== '' ? Number(purchasePrice) : 0,
      sellingPrice: Number(sellingPrice || 0),
      taxRate: Number(taxRate || 0),
      stockQuantity: Number(stockQuantity || 0),
      minStockThreshold: Number(minStockThreshold || 0),
      unit
    }, currentUser);

    setShowAddModal(false);
  };

  const handleUpdateProduct = (e) => {
    e.preventDefault();
    if (!editId) return;

    updateProduct(editId, {
      name,
      barcode,
      hsnCode,
      category,
      brand,
      purchasePrice: purchasePrice !== '' ? Number(purchasePrice) : 0,
      sellingPrice: Number(sellingPrice || 0),
      taxRate: Number(taxRate || 0),
      stockQuantity: Number(stockQuantity || 0),
      minStockThreshold: Number(minStockThreshold || 0),
      unit
    }, currentUser);

    setShowEditModal(false);
  };

  const handleStartInlineEdit = (p) => {
    setInlineEditingId(p.id);
    setInlineSellingPrice(String(p.sellingPrice || 0));
    setInlinePurchasePrice(String(p.purchasePrice || 0));
  };

  const handleSaveInlineEdit = (productId) => {
    updateProduct(productId, {
      sellingPrice: Number(inlineSellingPrice || 0),
      purchasePrice: Number(inlinePurchasePrice || 0)
    }, currentUser);
    setInlineEditingId(null);
  };

  const handleDeleteProduct = (product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}" from inventory?`)) {
      deleteProduct(product.id, currentUser);
    }
  };

  const handleAdjustSave = (e) => {
    e.preventDefault();
    if (selectedProduct) {
      adjustStock(selectedProduct.id, Number(adjustQty), adjustMode, currentUser);
      setShowRefillModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold font-heading text-white">Stock & Inventory Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">Edit prices, adjust stock IN / OUT tracking & manage workshop parts.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30"
        >
          <Plus className="w-4 h-4" /> Add New Item / Part
        </button>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search part name, category, barcode or HSN code..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Item / Part Name</th>
                <th className="p-4">Barcode / HSN</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-right">Purchase Price</th>
                <th className="p-4 text-right">Selling Price</th>
                <th className="p-4 text-right">GST %</th>
                <th className="p-4 text-center">Stock Level</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(p => {
                const isLow = p.stockQuantity <= p.minStockThreshold;
                const isInline = inlineEditingId === p.id;
                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-semibold text-white">
                      {p.name}
                      {isLow && (
                        <span className="ml-2 px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[9px] rounded font-mono">
                          LOW STOCK
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-slate-400">
                      {p.barcode} <span className="text-[10px] text-slate-500 block">HSN: {p.hsnCode || '—'}</span>
                    </td>
                    <td className="p-4 text-slate-400">
                      <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md text-[10px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono">
                      {isInline ? (
                        <input
                          type="number"
                          value={inlinePurchasePrice}
                          onChange={(e) => setInlinePurchasePrice(e.target.value)}
                          className="w-20 bg-slate-950 border border-slate-600 rounded px-1.5 py-0.5 text-right text-xs text-white"
                        />
                      ) : (
                        <span 
                          onClick={() => handleStartInlineEdit(p)}
                          className="cursor-pointer hover:text-blue-400 hover:underline"
                          title="Click to edit purchase price"
                        >
                          ₹{p.purchasePrice}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-white">
                      {isInline ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            value={inlineSellingPrice}
                            onChange={(e) => setInlineSellingPrice(e.target.value)}
                            className="w-24 bg-slate-950 border border-emerald-500 rounded px-1.5 py-0.5 text-right text-xs text-emerald-400 font-bold"
                          />
                          <button
                            onClick={() => handleSaveInlineEdit(p.id)}
                            className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded"
                            title="Save Price"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setInlineEditingId(null)}
                            className="p-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span 
                          onClick={() => handleStartInlineEdit(p)}
                          className="cursor-pointer hover:text-emerald-400 hover:underline flex items-center justify-end gap-1"
                          title="Click to edit selling price"
                        >
                          ₹{p.sellingPrice}
                          <Edit2 className="w-2.5 h-2.5 text-slate-500 opacity-0 group-hover:opacity-100" />
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-400">{p.taxRate}%</td>
                    <td className="p-4 text-center font-bold">
                      <span className={`font-mono ${isLow ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {p.stockQuantity} {p.unit}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[10px] font-semibold rounded-lg flex items-center gap-1 transition"
                          title="Edit Price & Details"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProduct(p);
                            setShowRefillModal(true);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-semibold rounded-lg flex items-center gap-1"
                          title="Adjust Stock Qty"
                        >
                          <RefreshCw className="w-3 h-3" /> Stock
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p)}
                          className="p-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition"
                          title="Delete Product from Stock"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Add New Inventory Item</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Product Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  placeholder="e.g. Wireless Mouse"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Barcode (Optional)</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">HSN/SAC Code</label>
                  <input
                    type="text"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    placeholder="e.g. 84716040"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Purchase Price (₹) <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">GST %</label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-white"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Initial Qty</label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Min Threshold</label>
                  <input
                    type="number"
                    value={minStockThreshold}
                    onChange={(e) => setMinStockThreshold(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/30"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-400" /> Edit Item Details & Price
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Item / Part Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Selling Price (₹) <span className="text-emerald-400 font-bold">*</span></label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-emerald-500 rounded-lg px-3 py-2 text-white font-mono font-bold"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">HSN/SAC Code</label>
                  <input
                    type="text"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">GST %</label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-white"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-white"
                  >
                    <option value="Nos">Nos</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Set">Set</option>
                    <option value="Pair/set">Pair/set</option>
                    <option value="Pair">Pair</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Kit">Kit</option>
                    <option value="Ltr">Ltr</option>
                    <option value="Kg">Kg</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Min Threshold</label>
                  <input
                    type="number"
                    value={minStockThreshold}
                    onChange={(e) => setMinStockThreshold(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refill Stock Modal */}
      {showRefillModal && selectedProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Refill Stock: {selectedProduct.name}</h3>
            <p className="text-xs text-slate-400 mb-4">Current Available: {selectedProduct.stockQuantity} {selectedProduct.unit}</p>

            <form onSubmit={handleAdjustSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustMode('IN')}
                  className={`py-2 text-xs font-semibold rounded-lg border ${
                    adjustMode === 'IN' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Stock IN (+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustMode('OUT')}
                  className={`py-2 text-xs font-semibold rounded-lg border ${
                    adjustMode === 'OUT' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Stock OUT (-)
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Adjustment Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowRefillModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                >
                  Confirm Stock Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
