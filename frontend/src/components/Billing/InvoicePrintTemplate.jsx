import React, { useEffect, useRef } from 'react';
import { X, Printer, Download, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { useData } from '../../context/DataContext';

// Indian numbering amount in words converter
const convertNumberToWords = (amount) => {
  if (!amount || isNaN(amount) || Number(amount) === 0) return 'Zero Rupees Only';
  const num = Math.round(Number(amount));
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanOneThousand = (n) => {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str.trim();
  };

  let result = '';
  let crore = Math.floor(num / 10000000);
  let rem = num % 10000000;
  let lakh = Math.floor(rem / 100000);
  rem %= 100000;
  let thousand = Math.floor(rem / 1000);
  rem %= 1000;
  let hundred = rem;

  if (crore > 0) result += convertLessThanOneThousand(crore) + ' Crore ';
  if (lakh > 0) result += convertLessThanOneThousand(lakh) + ' Lakh ';
  if (thousand > 0) result += convertLessThanOneThousand(thousand) + ' Thousand ';
  if (hundred > 0) result += convertLessThanOneThousand(hundred) + ' ';

  return 'Rupees ' + result.trim() + ' Only';
};

export const InvoicePrintTemplate = ({ invoice, onClose }) => {
  const { shopDetails } = useData();
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current && invoice?.invoiceNumber) {
      try {
        JsBarcode(barcodeRef.current, invoice.invoiceNumber, {
          format: 'CODE128',
          width: 1.4,
          height: 32,
          displayValue: false,
          margin: 0
        });
      } catch (err) {
        console.error('Barcode error:', err);
      }
    }
  }, [invoice]);

  if (!invoice || typeof invoice.then === 'function') return null;

  const handlePrint = () => {
    window.print();
  };

  // Company Details
  const companyName = shopDetails?.name || 'YASHAS EV SERVICE';
  const companyTagline = shopDetails?.tagline || 'EV SERVICE & BILLING';
  const companyAddress = shopDetails?.address || '1/9 A.M Complex, Next To Just Bake, Opp to C.B Kallu Metro Station, Bangalore - 560073';
  const companyPhone1 = shopDetails?.phone || '7676424061';
  const companyPhone2 = shopDetails?.altPhone || '8792383779';
  const companyGstin = shopDetails?.gstin || '';
  const companyEmail = shopDetails?.email || '';

  // Invoice Items & Calculations
  const rawItems = Array.isArray(invoice.items) ? invoice.items.filter(i => (i.productName || i.name || '').trim()) : [];
  
  let calculatedSubtotal = 0;
  let calculatedTax = 0;
  const processedItems = rawItems.map((item, idx) => {
    const name = item.productName || item.name || `Item #${idx + 1}`;
    const qty = Number(item.quantity || 1);
    const unit = item.unit || 'Nos';
    const rate = Number(item.unitPrice || item.pricePerUnit || 0);
    const discountVal = Number(item.discountVal || 0);
    let discountAmt = 0;
    if (item.discountType === '%') {
      discountAmt = (rate * qty) * (discountVal / 100);
    } else if (item.discountType === 'AMOUNT') {
      discountAmt = discountVal;
    }
    const taxableVal = Math.max(0, (rate * qty) - discountAmt);
    const taxRate = Number(item.taxRate || (item.taxType === '18%' ? 18 : item.taxType === '12%' ? 12 : item.taxType === '5%' ? 5 : 0));
    const taxAmt = Number(item.taxAmount || (taxableVal * (taxRate / 100)));
    const totalLineAmt = Number(item.totalPrice || item.amount || (taxableVal + taxAmt));

    calculatedSubtotal += taxableVal;
    calculatedTax += taxAmt;

    return {
      sNo: idx + 1,
      name,
      hsnCode: item.hsnCode || '',
      batchNo: item.batchNo || '',
      modelNo: item.modelNo || '',
      qty,
      unit,
      rate,
      discountAmt,
      taxableVal,
      taxRate,
      taxAmt,
      totalLineAmt
    };
  });

  const grandTotal = Number(invoice.grandTotal || (calculatedSubtotal + calculatedTax));
  const subtotal = Number(invoice.subtotal || calculatedSubtotal);
  const isInterState = (invoice.stateOfSupply || '').toLowerCase().includes('inter');
  const cgstAmount = isInterState ? 0 : Number(invoice.cgstAmount || (calculatedTax / 2));
  const sgstAmount = isInterState ? 0 : Number(invoice.sgstAmount || (calculatedTax / 2));
  const igstAmount = isInterState ? Number(invoice.igstAmount || calculatedTax) : 0;
  const paidAmount = Number(invoice.paidAmount !== undefined ? invoice.paidAmount : grandTotal);
  const balanceDue = Number(invoice.balanceAmount !== undefined ? invoice.balanceAmount : Math.max(0, grandTotal - paidAmount));
  const amountInWords = convertNumberToWords(grandTotal);

  // Bank & UPI Details
  const bankName = invoice.bankName || shopDetails?.bankName || 'Canara Bank';
  const accountNo = invoice.accountNo || shopDetails?.accountNo || '120001017346';
  const ifscCode = invoice.ifscCode || shopDetails?.ifscCode || 'CNRB0001199';
  const accountHolder = invoice.accountHolderName || shopDetails?.name || 'YASHAS EV SERVICE';
  const upiId = shopDetails?.upiId || '8105979580-of5a-2@ybl';
  const upiPayString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(companyName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Invoice_' + (invoice.invoiceNumber || 'BILL'))}`;

  const termsAndConditions = invoice.termsAndConditions || shopDetails?.termsAndConditions || 'Warranty applies as per manufacturer terms. Physical and water damage are not covered under warranty. Thank you for choosing Yashas EV Service!';

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Container Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-none print:bg-white">
        
        {/* Controls Bar (Hidden during printing) */}
        <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-white tracking-wide font-mono">
              PREMIUM CORPORATE INVOICE: {invoice.invoiceNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-black hover:bg-slate-800 text-white border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition"
            >
              <Printer className="w-4 h-4 text-emerald-400" /> Print A4 Invoice
            </button>
            <a
              href={`https://wa.me/${(invoice.customerPhone || invoice.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                `🧾 *INVOICE: #${invoice.invoiceNumber || 'EV 01'}*\n` +
                `🏢 *${companyName}*\n` +
                `----------------------------------------\n` +
                `👤 Customer: ${invoice.customerName || 'Customer'}\n` +
                `💰 *AMOUNT PAYABLE:* *₹${grandTotal.toLocaleString('en-IN')}*\n\n` +
                `⚡ *1-CLICK UPI PAYMENT LINK:*\n` +
                `${upiPayString}\n\n` +
                `🏦 UPI ID: ${upiId}\n` +
                `Thank you for choosing ${companyName}! 🙏`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition"
            >
              <Share2 className="w-4 h-4" /> WhatsApp
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable A4 Paper Preview */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-200/60 print:p-0 print:bg-white print:overflow-visible flex justify-center">
          <div 
            id="printable-invoice" 
            className="w-full max-w-[210mm] bg-white text-slate-900 shadow-xl print:shadow-none p-6 sm:p-10 border border-slate-300 print:border-none font-sans text-xs leading-normal"
            style={{ minHeight: '297mm' }}
          >
            {/* Header: Left Seller Info + Right Tax Invoice Box */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-5">
              {/* Seller Brand Details */}
              <div className="max-w-[60%] space-y-1">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight uppercase">
                  {companyName}
                </h1>
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">
                  {companyTagline}
                </div>
                <div className="text-[11px] text-slate-700 font-medium leading-relaxed pt-1">
                  {companyAddress}
                </div>
                <div className="text-[11px] text-slate-800 font-semibold pt-0.5">
                  Phone: <span className="font-mono">{companyPhone1}</span> {companyPhone2 ? ` / ${companyPhone2}` : ''}
                </div>
                {companyEmail && (
                  <div className="text-[11px] text-slate-700">
                    Email: <span className="font-medium">{companyEmail}</span>
                  </div>
                )}
                {companyGstin && (
                  <div className="text-[11px] text-slate-900 font-bold">
                    GSTIN: <span className="font-mono">{companyGstin}</span>
                  </div>
                )}
              </div>

              {/* Invoice Meta Heading */}
              <div className="text-right flex flex-col items-end space-y-2">
                <div className="bg-slate-950 text-white px-4 py-1.5 rounded text-sm font-black tracking-wider uppercase inline-block">
                  TAX INVOICE
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Original for Recipient
                </div>

                <div className="bg-slate-50 border border-slate-300 rounded p-2.5 space-y-1 text-left min-w-[190px]">
                  <div className="flex justify-between gap-3 text-[11px]">
                    <span className="text-slate-500 font-bold">INVOICE NO:</span>
                    <span className="font-mono font-black text-slate-900">{invoice.invoiceNumber || 'EV 01'}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-[11px]">
                    <span className="text-slate-500 font-bold">DATE:</span>
                    <span className="font-mono font-semibold text-slate-900">{invoice.date || new Date().toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-[11px]">
                    <span className="text-slate-500 font-bold">PLACE OF SUPPLY:</span>
                    <span className="font-medium text-slate-900">{invoice.stateOfSupply || 'Karnataka (29)'}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-[11px]">
                    <span className="text-slate-500 font-bold">PAYMENT:</span>
                    <span className="font-mono font-bold text-slate-900">{invoice.paymentMethod || 'ONLINE'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To & EV Vehicle Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              {/* Customer Box */}
              <div className="border border-slate-300 rounded p-3.5 bg-slate-50/50">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 mb-2">
                  BILL TO / CUSTOMER DETAILS
                </div>
                <div className="text-sm font-bold text-slate-950 uppercase">{invoice.customerName || 'Customer'}</div>
                {invoice.customerPhone && (
                  <div className="text-[11px] text-slate-700 mt-1">
                    Contact: <span className="font-mono font-medium">{invoice.customerPhone}</span>
                  </div>
                )}
                {invoice.billingAddress && (
                  <div className="text-[11px] text-slate-700 leading-snug mt-1">
                    Address: {invoice.billingAddress}
                  </div>
                )}
                {invoice.customerGstin && (
                  <div className="text-[11px] text-slate-900 font-bold mt-1">
                    GSTIN: <span className="font-mono">{invoice.customerGstin}</span>
                  </div>
                )}
                <div className="text-[10px] text-slate-500 mt-1">
                  State: {invoice.stateOfSupply || 'Karnataka (29)'}
                </div>
              </div>

              {/* EV Vehicle & Inward Details */}
              <div className="border border-slate-300 rounded p-3.5 bg-slate-50/50">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 mb-2">
                  VEHICLE & SERVICE SPECIFICATIONS
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold">VEHICLE REG NO:</span>
                    <span className="font-mono font-bold text-slate-900">{invoice.regNo || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold">ODO READING (KM):</span>
                    <span className="font-mono font-bold text-slate-900">{invoice.odoRunning || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold">BATTERY / MOTOR NO:</span>
                    <span className="font-mono text-slate-900">{invoice.batterySlNo || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold">INWARD DATE:</span>
                    <span className="font-mono text-slate-900">{invoice.inwardDate || invoice.date || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items / Services Table */}
            <div className="mb-5 overflow-x-auto">
              <table className="w-full text-[11px] text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-950 text-white font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-2 border border-slate-800 text-center w-8">#</th>
                    <th className="p-2 border border-slate-800">DESCRIPTION OF GOODS / SERVICES</th>
                    <th className="p-2 border border-slate-800 text-center w-20">HSN/SAC</th>
                    <th className="p-2 border border-slate-800 text-center w-14">QTY</th>
                    <th className="p-2 border border-slate-800 text-center w-14">UNIT</th>
                    <th className="p-2 border border-slate-800 text-right w-24">RATE (₹)</th>
                    <th className="p-2 border border-slate-800 text-right w-20">TAXABLE (₹)</th>
                    <th className="p-2 border border-slate-800 text-center w-16">GST</th>
                    <th className="p-2 border border-slate-800 text-right w-24">AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {processedItems.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="p-2 border border-slate-200 text-center font-mono text-slate-500">{item.sNo}</td>
                      <td className="p-2 border border-slate-200 font-medium text-slate-900">
                        <div>{item.name}</div>
                        {(item.batchNo || item.modelNo) && (
                          <div className="text-[9px] text-slate-500 font-mono">
                            Model/Sl: {item.batchNo || ''} {item.modelNo || ''}
                          </div>
                        )}
                      </td>
                      <td className="p-2 border border-slate-200 text-center font-mono text-slate-700">{item.hsnCode || '—'}</td>
                      <td className="p-2 border border-slate-200 text-center font-mono font-bold text-slate-900">{item.qty}</td>
                      <td className="p-2 border border-slate-200 text-center text-slate-700">{item.unit}</td>
                      <td className="p-2 border border-slate-200 text-right font-mono">{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="p-2 border border-slate-200 text-right font-mono">{item.taxableVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="p-2 border border-slate-200 text-center font-mono">{item.taxRate ? `${item.taxRate}%` : '0%'}</td>
                      <td className="p-2 border border-slate-200 text-right font-mono font-bold text-slate-950">
                        {item.totalLineAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="bg-slate-100 font-bold text-slate-950">
                    <td colSpan={3} className="p-2 border border-slate-300 text-left uppercase text-[10px]">Total</td>
                    <td className="p-2 border border-slate-300 text-center font-mono">
                      {processedItems.reduce((acc, i) => acc + i.qty, 0)}
                    </td>
                    <td colSpan={2} className="p-2 border border-slate-300"></td>
                    <td className="p-2 border border-slate-300 text-right font-mono">
                      ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border border-slate-300"></td>
                    <td className="p-2 border border-slate-300 text-right font-mono font-black text-sm">
                      ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Grid: Left (Words, GST Breakup, Bank) + Right (Totals Summary) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 mb-5 items-start">
              {/* Left Column (7 cols): Amount in words + GST Breakup + Payment Details */}
              <div className="sm:col-span-7 space-y-4">
                {/* Amount in Words */}
                <div className="border border-slate-300 rounded p-3 bg-slate-50/50">
                  <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                    INVOICE AMOUNT IN WORDS:
                  </div>
                  <div className="font-bold text-slate-950 italic text-[11px] leading-relaxed">
                    {amountInWords}
                  </div>
                </div>

                {/* GST Summary Table */}
                <div className="border border-slate-300 rounded overflow-hidden">
                  <div className="bg-slate-900 text-white px-3 py-1 font-bold text-[10px] uppercase tracking-wider">
                    GST TAX BREAKUP SUMMARY
                  </div>
                  <table className="w-full text-[10px] text-left border-collapse">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                      <tr>
                        <th className="p-1.5 border border-slate-200">Tax Type</th>
                        <th className="p-1.5 border border-slate-200 text-right">Taxable Value</th>
                        <th className="p-1.5 border border-slate-200 text-right">Tax Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!isInterState ? (
                        <>
                          <tr>
                            <td className="p-1.5 border border-slate-200 font-semibold text-slate-800">CGST (Central Tax)</td>
                            <td className="p-1.5 border border-slate-200 text-right font-mono">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="p-1.5 border border-slate-200 text-right font-mono font-bold text-slate-900">₹{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className="p-1.5 border border-slate-200 font-semibold text-slate-800">SGST (State Tax)</td>
                            <td className="p-1.5 border border-slate-200 text-right font-mono">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="p-1.5 border border-slate-200 text-right font-mono font-bold text-slate-900">₹{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td className="p-1.5 border border-slate-200 font-semibold text-slate-800">IGST (Integrated Tax)</td>
                          <td className="p-1.5 border border-slate-200 text-right font-mono">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="p-1.5 border border-slate-200 text-right font-mono font-bold text-slate-900">₹{igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bank Details & UPI QR Code */}
                <div className="border border-slate-300 rounded p-3 bg-slate-50/50 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                  <div className="space-y-1 text-[11px] flex-1">
                    <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      BANK PAYMENT DETAILS:
                    </div>
                    <div>Bank: <strong className="text-slate-900">{bankName}</strong></div>
                    <div>A/C No: <strong className="font-mono text-slate-900">{accountNo}</strong></div>
                    <div>IFSC: <strong className="font-mono text-slate-900">{ifscCode}</strong></div>
                    <div>A/C Holder: <strong className="text-slate-900">{accountHolder}</strong></div>
                    <div>UPI VPA: <strong className="font-mono text-slate-900">{upiId}</strong></div>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 bg-white border border-slate-300 rounded shrink-0">
                    <QRCodeSVG value={upiPayString} size={64} />
                    <span className="text-[8px] font-mono font-bold text-slate-500 uppercase mt-1">UPI Pay QR</span>
                  </div>
                </div>
              </div>

              {/* Right Column (5 cols): Summary Totals */}
              <div className="sm:col-span-5 border-2 border-slate-900 rounded overflow-hidden bg-white">
                <div className="bg-slate-950 text-white px-4 py-2 font-black text-[11px] uppercase tracking-wider text-center">
                  PAYMENT SUMMARY
                </div>
                <div className="p-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-medium">Taxable Subtotal:</span>
                    <span className="font-mono font-semibold">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {!isInterState ? (
                    <>
                      <div className="flex justify-between items-center text-slate-700">
                        <span className="font-medium">CGST:</span>
                        <span className="font-mono">₹{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-700">
                        <span className="font-medium">SGST:</span>
                        <span className="font-mono">₹{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-medium">IGST:</span>
                      <span className="font-mono">₹{igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {invoice.discountAmount > 0 && (
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-medium">Discount:</span>
                      <span className="font-mono text-slate-900">-₹{Number(invoice.discountAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {/* Grand Total Highlight */}
                  <div className="border-t-2 border-slate-900 pt-2.5 mt-2 flex justify-between items-center">
                    <span className="text-sm font-black text-slate-950 uppercase">GRAND TOTAL:</span>
                    <span className="text-lg font-black font-mono text-slate-950">
                      ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-[11px] text-slate-700">
                    <span>Paid Amount:</span>
                    <span className="font-mono font-bold text-slate-900">₹{paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {balanceDue > 0 && (
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-950 bg-slate-100 p-1.5 rounded">
                      <span>Balance Due:</span>
                      <span className="font-mono">₹{balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Terms & Signatures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t-2 border-slate-900 items-end mb-6">
              {/* Terms & Conditions */}
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                  TERMS & CONDITIONS:
                </div>
                <div className="text-[10px] text-slate-600 leading-relaxed">
                  {termsAndConditions}
                </div>
              </div>

              {/* Authorized Signatory */}
              <div className="text-right space-y-12">
                <div className="text-xs font-black text-slate-950 uppercase">
                  For {companyName}
                </div>
                <div className="border-t border-slate-400 pt-1 text-[11px] font-bold text-slate-800 uppercase inline-block min-w-[180px] text-center">
                  Authorized Signatory
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-[9px] font-medium text-slate-500 uppercase tracking-wider">
              <span>Thank you for choosing Yashas EV Service.</span>
              <span>Powered by TejuPay — Smart Billing ERP</span>
            </div>
          </div>
        </div>

      </div>

      {/* Print CSS Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 12mm !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}} />
    </div>
  );
};
