import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  Plus, 
  Trash2, 
  Printer, 
  Share2, 
  QrCode, 
  Search, 
  CheckCircle, 
  CreditCard,
  Zap,
  Building2,
  Calendar,
  UserCheck,
  MessageSquare
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { WhatsAppModal } from './WhatsAppModal';

export const CreateInvoiceModal = ({ isOpen, onClose, onPrintInvoice, editingInvoice = null }) => {
  const { shopDetails, products, customers, addInvoice, updateInvoice, addCustomer } = useData();
  const { currentUser } = useAuth();

  // Customer & EV Vehicle State - Clean editable fields, zero hardcoding
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [regNo, setRegNo] = useState('');
  const [inwardDate, setInwardDate] = useState(new Date().toISOString().split('T')[0]);
  const [odoRunning, setOdoRunning] = useState('');
  const [batterySlNo, setBatterySlNo] = useState('');
  const [noOfServices, setNoOfServices] = useState('1');
  const [invoiceNumber, setInvoiceNumber] = useState(`EV-${Date.now().toString().slice(-6)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [stateOfSupply, setStateOfSupply] = useState('Karnataka (29)');

  // Items Table State
  const [items, setItems] = useState([
    { id: 1, name: 'EV Full General Service & Battery Diagnostics', batchNo: '', modelNo: '', quantity: 1, unit: 'Nos', pricePerUnit: 850, discountType: 'NONE', discountVal: 0, taxType: 'NONE', amount: 850 },
    { id: 2, name: 'EV Disc Brake Pad (Front/Rear)', batchNo: '', modelNo: '', quantity: 1, unit: 'Nos', pricePerUnit: 350, discountType: 'NONE', discountVal: 0, taxType: 'NONE', amount: 350 },
    { id: 3, name: '', batchNo: '', modelNo: '', quantity: 1, unit: 'Nos', pricePerUnit: 0, discountType: 'NONE', discountVal: 0, taxType: 'NONE', amount: 0 }
  ]);

  // Payment & Terms State
  const [termsTitle, setTermsTitle] = useState('Sale Invoice');
  const [termsText, setTermsText] = useState(shopDetails?.termsAndConditions || 'Warranty applies as per manufacturer terms. Thank you!');
  const [paymentType, setPaymentType] = useState('ONLINE'); // ONLINE, UPI, ACCOUNT_TRANSFER, CASH, CHEQUE, CREDIT
  const [referenceNo, setReferenceNo] = useState('');
  
  // Amounts State
  const [roundOff, setRoundOff] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [receivedChecked, setReceivedChecked] = useState(true);

  // Completion Modals
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const [showUpiQrModal, setShowUpiQrModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [errMessage, setErrMessage] = useState('');

  // Quick Add New Product to Inventory State
  const [showQuickAddProductModal, setShowQuickAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdSellingPrice, setNewProdSellingPrice] = useState('');
  const [newProdPurchasePrice, setNewProdPurchasePrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('General Parts');
  const [newProdTaxRate, setNewProdTaxRate] = useState(18);
  const [newProdStock, setNewProdStock] = useState(10);

  const handleQuickCreateProduct = (e) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const created = addProduct({
      name: newProdName,
      sellingPrice: Number(newProdSellingPrice || 0),
      purchasePrice: Number(newProdPurchasePrice || 0),
      category: newProdCategory || 'General Parts',
      taxRate: Number(newProdTaxRate || 18),
      stockQuantity: Number(newProdStock || 10),
      minStockThreshold: 3,
      unit: 'Pcs',
      barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString()
    }, currentUser);

    setItems(prev => {
      const updated = [...prev];
      const emptyIdx = updated.findIndex(i => !i.name || i.name.trim() === '');
      if (emptyIdx !== -1) {
        updated[emptyIdx] = {
          ...updated[emptyIdx],
          name: created.name,
          pricePerUnit: created.sellingPrice,
          amount: created.sellingPrice * (updated[emptyIdx].quantity || 1)
        };
        return updated;
      } else {
        return [...prev, {
          id: Date.now(),
          name: created.name,
          batchNo: '',
          modelNo: '',
          quantity: 1,
          unit: 'Pcs',
          pricePerUnit: created.sellingPrice,
          discountType: 'NONE',
          discountVal: 0,
          taxType: 'NONE',
          amount: created.sellingPrice
        }];
      }
    });

    setShowQuickAddProductModal(false);
    setNewProdName('');
    setNewProdSellingPrice('');
    setNewProdPurchasePrice('');
  };

  // Populate data if editing an existing bill
  useEffect(() => {
    if (editingInvoice) {
      setInvoiceNumber(editingInvoice.invoiceNumber || '');
      setCustomerName(editingInvoice.customerName || '');
      setCustomerPhone(editingInvoice.customerPhone || '');
      setBillingAddress(editingInvoice.billingAddress || '');
      setShippingAddress(editingInvoice.shippingAddress || '');
      setRegNo(editingInvoice.regNo || '');
      setOdoRunning(editingInvoice.odoRunning || '');
      setBatterySlNo(editingInvoice.batterySlNo || '');
      setNoOfServices(editingInvoice.noOfServices || '1');
      if (editingInvoice.date) setInvoiceDate(editingInvoice.date);
      if (editingInvoice.paymentMethod) setPaymentType(editingInvoice.paymentMethod);
      if (editingInvoice.referenceNo) setReferenceNo(editingInvoice.referenceNo);
      if (editingInvoice.paidAmount !== undefined) setReceivedAmount(editingInvoice.paidAmount);

      if (editingInvoice.items && Array.isArray(editingInvoice.items)) {
        const loadedItems = editingInvoice.items.map((i, idx) => ({
          id: i.id || idx + 1,
          name: i.productName || i.name || '',
          batchNo: i.batchNo || '',
          modelNo: i.modelNo || '',
          quantity: i.quantity || 1,
          unit: i.unit || 'Nos',
          pricePerUnit: i.unitPrice || i.pricePerUnit || 0,
          discountType: i.discountType || 'NONE',
          discountVal: i.discountVal || 0,
          taxType: i.taxType || 'NONE',
          amount: i.totalPrice || i.amount || 0
        }));
        setItems(loadedItems);
      }
    }
  }, [editingInvoice]);

  if (!isOpen) return null;

  // Auto Select Customer when customerName matches existing customers
  const handleCustomerSelect = (e) => {
    const selectedName = e.target.value;
    setCustomerName(selectedName);
    const found = customers.find(c => c.name.toLowerCase() === selectedName.toLowerCase());
    if (found) {
      setCustomerPhone(found.phone || '');
      setBillingAddress(found.address || '');
      setShippingAddress(found.shippingAddress || found.address || '');
      if (found.regNo) setRegNo(found.regNo);
    }
  };

  // Item Table Row Functions
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    const row = { ...updated[index], [field]: value };

    // Auto-fill price if item name matches product database
    if (field === 'name') {
      const match = products.find(p => p.name.toLowerCase() === value.toLowerCase());
      if (match) {
        row.pricePerUnit = match.sellingPrice || 0;
        row.unit = match.unit || 'Nos';
      }
    }

    // Recalculate amount
    const qty = Number(row.quantity) || 0;
    const price = Number(row.pricePerUnit) || 0;
    let disc = 0;
    if (row.discountType === 'AMOUNT') disc = Number(row.discountVal) || 0;
    else if (row.discountType === '%') disc = (price * qty) * ((Number(row.discountVal) || 0) / 100);

    let lineTax = 0;
    if (row.taxType === '18%') lineTax = (price * qty - disc) * 0.18;
    else if (row.taxType === '12%') lineTax = (price * qty - disc) * 0.12;
    else if (row.taxType === '5%') lineTax = (price * qty - disc) * 0.05;

    row.amount = Math.max(0, (price * qty) - disc + lineTax);
    updated[index] = row;
    setItems(updated);
  };

  const addRow = () => {
    setItems([...items, {
      id: Date.now(),
      name: '',
      batchNo: '',
      modelNo: '',
      quantity: 1,
      unit: 'Nos',
      pricePerUnit: 0,
      discountType: 'NONE',
      discountVal: 0,
      taxType: 'NONE',
      amount: 0
    }]);
  };

  const removeRow = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Math Totals
  const validItems = items.filter(item => item.name && item.name.trim() !== '');
  const totalQty = validItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalAmountCalculated = validItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const grandTotal = roundOff ? Math.round(totalAmountCalculated) : totalAmountCalculated;
  
  const finalReceived = receivedChecked ? (receivedAmount !== '' ? Number(receivedAmount) : grandTotal) : 0;
  const balanceDue = Math.max(0, grandTotal - finalReceived);

  // Save Invoice Handler
  const handleSaveInvoice = async () => {
    setErrMessage('');
    if (!customerName || !customerName.trim()) {
      setErrMessage('Please enter Customer Name.');
      return;
    }
    if (validItems.length === 0) {
      setErrMessage('Please enter at least one item/service before saving.');
      return;
    }

    const payload = {
      type: 'TAX_INVOICE',
      invoiceNumber,
      customerName,
      customerPhone,
      billingAddress,
      shippingAddress,
      regNo,
      inwardDate,
      odoRunning,
      batterySlNo,
      noOfServices,
      stateOfSupply,
      date: invoiceDate,
      items: validItems.map(i => ({
        id: i.id,
        productName: i.name,
        batchNo: i.batchNo,
        modelNo: i.modelNo,
        quantity: Number(i.quantity),
        unit: i.unit,
        unitPrice: Number(i.pricePerUnit),
        discountType: i.discountType,
        discountVal: Number(i.discountVal),
        taxType: i.taxType,
        totalPrice: Number(i.amount)
      })),
      subtotal: grandTotal,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      discountAmount: 0,
      grandTotal,
      paidAmount: finalReceived,
      balanceAmount: balanceDue,
      paymentStatus: balanceDue === 0 ? 'PAID' : finalReceived > 0 ? 'PARTIAL' : 'UNPAID',
      paymentMethod: paymentType,
      referenceNo,
      termsAndConditions: termsText
    };

    try {
      let saved;
      if (editingInvoice && editingInvoice.id) {
        saved = await updateInvoice({ ...editingInvoice, ...payload }, currentUser);
      } else {
        saved = await addInvoice(payload, currentUser);
      }

      if (saved && typeof saved.then === 'function') {
        saved = await saved;
      }

      const invoiceObj = (saved && saved.items) ? saved : { ...payload, id: Date.now() };

      setCompletedInvoice(invoiceObj);

      if (paymentType === 'ONLINE' || paymentType === 'UPI' || paymentType === 'ACCOUNT_TRANSFER') {
        setShowUpiQrModal(true);
      } else {
        if (onPrintInvoice) {
          onPrintInvoice(invoiceObj);
        }
        onClose();
      }
    } catch (e) {
      console.error('Error saving invoice:', e);
      setErrMessage('Error saving invoice.');
    }
  };

  const currentUpiId = shopDetails?.upiId || 'greendriveev@paytm';
  const upiQrString = `upi://pay?pa=${currentUpiId}&pn=${encodeURIComponent(shopDetails?.name || 'EV Motors')}&am=${grandTotal}&cu=INR&tn=Invoice_${completedInvoice?.invoiceNumber || 'EV'}`;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-7xl shadow-2xl overflow-hidden flex flex-col my-2 max-h-[96vh] text-slate-200">
        
        {/* Clean Modal Header - Screenshot Bar Removed */}
        <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-heading">{shopDetails?.name || 'GreenDrive EV Motors'}</h2>
              <p className="text-xs text-slate-400">EV Two-Wheeler Sales, Battery & Service Billing Terminal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {errMessage && (
              <span className="text-xs text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-lg">
                {errMessage}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">

          {/* Customer & EV Vehicle Details Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-950/60 p-4 border border-slate-800 rounded-xl">
            
            {/* Customer Details (Editable) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Customer Name *</label>
                  <input
                    type="text"
                    list="customer-list"
                    value={customerName}
                    onChange={handleCustomerSelect}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold focus:border-blue-500"
                    placeholder="Enter customer name"
                    required
                  />
                  <datalist id="customer-list">
                    {customers.map(c => <option key={c.id} value={c.name} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone No.</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    placeholder="Mobile number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Billing Address</label>
                  <textarea
                    rows={2}
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                    placeholder="Address"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Shipping Address</label>
                  <textarea
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                    placeholder="Shipping address"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* EV Vehicle Specifications */}
            <div className="lg:col-span-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Vehicle Reg No</label>
                  <input
                    type="text"
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono uppercase font-semibold"
                    placeholder="KA 05 EV 1234"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Battery Sl / Motor No</label>
                  <input
                    type="text"
                    value={batterySlNo}
                    onChange={(e) => setBatterySlNo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                    placeholder="BAT-60V-9982"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">ODO (km)</label>
                  <input
                    type="text"
                    value={odoRunning}
                    onChange={(e) => setOdoRunning(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                    placeholder="12400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Inward Date</label>
                  <input
                    type="date"
                    value={inwardDate}
                    onChange={(e) => setInwardDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">No of Services</label>
                  <input
                    type="text"
                    value={noOfServices}
                    onChange={(e) => setNoOfServices(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="lg:col-span-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Invoice No</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">State of Supply</label>
                <select
                  value={stateOfSupply}
                  onChange={(e) => setStateOfSupply(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                >
                  <option value="Karnataka (29)">Karnataka (29)</option>
                  <option value="Inter-State">Inter-State (IGST)</option>
                </select>
              </div>
            </div>

          </div>

          {/* Items Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40 shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="p-3 w-8">#</th>
                    <th className="p-3 min-w-[220px]">EV PART / SERVICE DESCRIPTION</th>
                    <th className="p-3 w-28">BATCH NO</th>
                    <th className="p-3 w-28">MODEL NO</th>
                    <th className="p-3 w-20">QTY</th>
                    <th className="p-3 w-24">UNIT</th>
                    <th className="p-3 w-28">PRICE/UNIT</th>
                    <th className="p-3 w-32">DISCOUNT</th>
                    <th className="p-3 w-28">TAX</th>
                    <th className="p-3 w-28 text-right">AMOUNT</th>
                    <th className="p-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {items.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-3 text-slate-500 font-mono text-center">{idx + 1}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          list="product-list"
                          value={row.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-medium focus:border-blue-500"
                          placeholder="Select EV part or service"
                        />
                        <datalist id="product-list">
                          {products.map(p => <option key={p.id} value={p.name} />)}
                        </datalist>
                        {row.name && row.name.trim().length > 1 && !products.some(p => p.name.toLowerCase() === row.name.toLowerCase()) && (
                          <button
                            type="button"
                            onClick={() => {
                              setNewProdName(row.name);
                              if (row.pricePerUnit) setNewProdSellingPrice(row.pricePerUnit);
                              setShowQuickAddProductModal(true);
                            }}
                            className="text-[10px] text-emerald-400 font-semibold hover:underline flex items-center gap-1 mt-1"
                          >
                            <Plus className="w-3 h-3" /> + Save "{row.name}" to Inventory
                          </button>
                        )}
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.batchNo}
                          onChange={(e) => handleItemChange(idx, 'batchNo', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.modelNo}
                          onChange={(e) => handleItemChange(idx, 'modelNo', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-semibold text-center"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={row.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-1 py-1 text-white text-[11px]"
                        >
                          <option value="Nos">Nos</option>
                          <option value="Pcs">Pcs</option>
                          <option value="Set">Set</option>
                          <option value="Ltr">Ltr</option>
                          <option value="Kg">Kg</option>
                          <option value="Hrs">Hrs</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={row.pricePerUnit}
                          onChange={(e) => handleItemChange(idx, 'pricePerUnit', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-right"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={row.discountType}
                          onChange={(e) => handleItemChange(idx, 'discountType', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-1 py-1 text-white text-[11px]"
                        >
                          <option value="NONE">NONE</option>
                          <option value="%">% Discount</option>
                          <option value="AMOUNT">Amount (₹)</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <select
                          value={row.taxType}
                          onChange={(e) => handleItemChange(idx, 'taxType', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-1 py-1 text-white text-[11px]"
                        >
                          <option value="NONE">NONE</option>
                          <option value="18%">GST 18%</option>
                          <option value="12%">GST 12%</option>
                          <option value="5%">GST 5%</option>
                        </select>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-white">
                        ₹{Number(row.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => removeRow(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Action & Total Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={addRow}
                  className="px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> ADD ROW
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewProdName('');
                    setShowQuickAddProductModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> + ADD NEW ITEM TO INVENTORY
                </button>
              </div>

              <div className="flex items-center gap-6 text-xs text-slate-300 font-medium">
                <span>TOTAL QTY: <strong className="text-white font-mono">{totalQty}</strong></span>
                <span>TOTAL AMOUNT: <strong className="text-emerald-400 font-mono text-sm">₹{grandTotal.toLocaleString('en-IN')}</strong></span>
              </div>
            </div>
          </div>

          {/* Bottom Section: Payment Selection, Terms & Conditions, Summary Totals */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 border-t border-slate-800 pt-4">

            {/* Terms & Conditions */}
            <div className="lg:col-span-4 bg-slate-950/60 p-4 border border-slate-800 rounded-xl space-y-3">
              <h3 className="font-bold text-white text-xs">Terms & Conditions</h3>
              <div>
                <select
                  value={termsTitle}
                  onChange={(e) => setTermsTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                >
                  <option value="Sale Invoice">Sale Invoice</option>
                  <option value="Service Job Sheet">Service Job Sheet</option>
                  <option value="Proforma Quotation">Proforma Quotation</option>
                </select>
              </div>

              <div>
                <textarea
                  rows={3}
                  value={termsText}
                  onChange={(e) => setTermsText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-300 text-xs"
                  placeholder="Warranty terms..."
                ></textarea>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="lg:col-span-4 bg-slate-950/60 p-4 border border-slate-800 rounded-xl space-y-3">
              <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-400" /> Payment Type
              </h3>

              <div>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold"
                >
                  <option value="ONLINE">ONLINE (UPI / QR Code)</option>
                  <option value="ACCOUNT_TRANSFER">ACCOUNT TRANSFER (Bank NEFT/IMPS)</option>
                  <option value="CASH">CASH</option>
                  <option value="CHEQUE">CHEQUE</option>
                  <option value="CREDIT">CREDIT / DUE (Unpaid)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Reference No. (UPI ID / Txn Ref / Cheque No)</label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                  placeholder="e.g. UPI987654321"
                />
              </div>
            </div>

            {/* Summary Totals & Save Button */}
            <div className="lg:col-span-4 bg-slate-950/80 p-4 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roundOff}
                    onChange={(e) => setRoundOff(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-blue-600"
                  />
                  <span>Round Off</span>
                </label>
                <span className="font-mono text-slate-400">Total: <strong className="text-white font-bold">₹{grandTotal.toLocaleString('en-IN')}</strong></span>
              </div>

              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={receivedChecked}
                    onChange={(e) => setReceivedChecked(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-blue-600"
                  />
                  <span className="font-semibold text-white">Received</span>
                </label>
                <input
                  type="number"
                  disabled={!receivedChecked}
                  value={receivedChecked ? (receivedAmount !== '' ? receivedAmount : grandTotal) : 0}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="w-28 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right text-emerald-400 font-mono font-bold text-sm"
                />
              </div>

              <div className="flex justify-between items-center text-xs font-semibold pt-1">
                <span className="text-slate-400">Balance:</span>
                <span className={`font-mono text-sm ${balanceDue > 0 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                  ₹{balanceDue.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveInvoice}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30"
                >
                  <Printer className="w-4 h-4" /> Save & Print Invoice
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* UPI QR Payment Modal */}
      {showUpiQrModal && completedInvoice && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 mx-auto">
              <QrCode className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">UPI Payment QR Code</h3>
            <p className="text-xs text-slate-400">
              Scan using PhonePe, Google Pay, Paytm, or BHIM to pay <strong className="text-emerald-400 font-mono">₹{completedInvoice.grandTotal.toLocaleString()}</strong> to {shopDetails?.name || 'EV Motors'}
            </p>

            <div className="bg-white p-4 rounded-xl inline-block shadow-inner">
              <QRCodeSVG value={upiQrString} size={180} />
            </div>

            <div className="text-[11px] text-slate-400 font-mono bg-slate-950 p-2 rounded-lg">
              UPI VPA: <strong className="text-white">{currentUpiId}</strong>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setShowUpiQrModal(false);
                  setShowWhatsAppModal(true);
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Send Invoice via WhatsApp
              </button>
              <button
                onClick={() => {
                  setShowUpiQrModal(false);
                  if (onPrintInvoice) onPrintInvoice(completedInvoice);
                  onClose();
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Invoice Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {showWhatsAppModal && completedInvoice && (
        <WhatsAppModal
          invoice={completedInvoice}
          onClose={() => {
            setShowWhatsAppModal(false);
            onClose();
          }}
        />
      )}

      {/* Quick Add Product Modal */}
      {showQuickAddProductModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" /> Quick Add New Product to Inventory
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickAddProductModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickCreateProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Product / Item Name *</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. EV Controller Harness 48V"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newProdSellingPrice}
                    onChange={(e) => setNewProdSellingPrice(e.target.value)}
                    placeholder="1200"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    value={newProdPurchasePrice}
                    onChange={(e) => setNewProdPurchasePrice(e.target.value)}
                    placeholder="850"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Initial Stock Qty</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuickAddProductModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30"
                >
                  Save & Add to Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
