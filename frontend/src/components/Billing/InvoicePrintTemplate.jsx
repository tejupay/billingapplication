import React, { useEffect, useRef, useState } from 'react';
import { X, Printer, Download, Share2, Zap, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useData } from '../../context/DataContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

  return result.trim() + ' Rupees Only';
};

export const InvoicePrintTemplate = ({ invoice, onClose }) => {
  const { shopDetails } = useData();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const invoiceRef = useRef(null);

  if (!invoice || typeof invoice.then === 'function') return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 297));
      const safeInvNo = String(invoice.invoiceNumber || 'EV01').replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`Invoice_${safeInvNo}.pdf`);
    } catch (e) {
      console.error('Error generating PDF:', e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Company Details (Yashas EV Service)
  const companyName = shopDetails?.name || 'YASHAS EV SERVICE';
  const companyAddress = shopDetails?.address || '1/9 A.M Complex, Next To Just Bake, Opp to C.B Kallu Metro Station, Bangalore - 560073';
  const companyPhone1 = shopDetails?.phone || '7676424061';
  const companyPhone2 = shopDetails?.altPhone || '8792383779';
  const companyGstin = shopDetails?.gstin || '29EVHUB1234F1Z5';
  const companyEmail = shopDetails?.email || 'yrtmotos@gmail.com';

  // Invoice Items & Calculations
  const rawItems = Array.isArray(invoice.items) ? invoice.items.filter(i => (i.productName || i.name || '').trim()) : [];
  
  let calculatedSubtotal = 0;
  let calculatedTax = 0;
  let totalDiscount = 0;

  const isInterState = (invoice.stateOfSupply || '').toLowerCase().includes('inter');

  const processedItems = rawItems.map((item, idx) => {
    const name = item.productName || item.name || `Item #${idx + 1}`;
    const qty = Number(item.quantity || 1);
    const rate = Number(item.unitPrice || item.pricePerUnit || 0);
    const discountVal = Number(item.discountVal || 0);
    let discountAmt = 0;
    if (item.discountType === '%') {
      discountAmt = (rate * qty) * (discountVal / 100);
    } else if (item.discountType === 'AMOUNT') {
      discountAmt = discountVal;
    }
    totalDiscount += discountAmt;

    let taxRate = 0;
    if (item.taxRate !== undefined && item.taxRate !== null && item.taxRate !== '') {
      taxRate = Number(item.taxRate) || 0;
    } else if (item.taxType && item.taxType !== 'NONE') {
      taxRate = parseFloat(item.taxType) || 0;
    }

    const halfTaxRate = taxRate / 2;
    const cgstAmt = isInterState ? 0 : (taxableVal * (halfTaxRate / 100));
    const sgstAmt = isInterState ? 0 : (taxableVal * (halfTaxRate / 100));
    const igstAmt = isInterState ? (taxableVal * (taxRate / 100)) : 0;
    const taxAmt = cgstAmt + sgstAmt + igstAmt;
    const totalLineAmt = taxableVal + taxAmt;

    calculatedSubtotal += (rate * qty);
    calculatedTax += taxAmt;

    return {
      sNo: idx + 1,
      name,
      hsnCode: item.hsnCode || '—',
      qty,
      taxRate,
      halfTaxRate,
      rate,
      taxableVal,
      cgstAmt,
      sgstAmt,
      igstAmt,
      totalLineAmt
    };
  });

  const taxableTotal = Math.max(0, calculatedSubtotal - totalDiscount);
  const grandTotal = Number(invoice.grandTotal || (taxableTotal + calculatedTax));
  const cgstTotal = isInterState ? 0 : (calculatedTax / 2);
  const sgstTotal = isInterState ? 0 : (calculatedTax / 2);
  const igstTotal = isInterState ? calculatedTax : 0;
  const amountInWords = convertNumberToWords(grandTotal);

  // Bank & UPI Details
  const bankName = invoice.bankName || shopDetails?.bankName || 'Canara Bank';
  const accountNo = invoice.accountNo || shopDetails?.accountNo || '120001017346';
  const ifscCode = invoice.ifscCode || shopDetails?.ifscCode || 'CNRB0001199';
  const accountHolder = invoice.accountHolderName || companyName;
  const upiId = shopDetails?.upiId || '8105979580-of5a-2@ybl';
  const upiPayString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(companyName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Invoice_' + (invoice.invoiceNumber || 'EV01'))}`;

  const termsAndConditions = invoice.termsAndConditions || shopDetails?.termsAndConditions || '1. Warranty applies as per manufacturer terms.\n2. Physical and water damage will not be covered under warranty.';

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Outer Modal Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-none print:bg-white">
        
        {/* Controls Bar (Hidden during printing) */}
        <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-white tracking-wide font-mono">
              INVOICE PREVIEW: {invoice.invoiceNumber || 'EV 01'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition"
            >
              <Printer className="w-4 h-4 text-emerald-400" /> Print A4 Invoice
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
            >
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download PDF
            </button>
            <a
              href={`https://wa.me/${(invoice.customerPhone || invoice.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                `🧾 *INVOICE: #${invoice.invoiceNumber || 'EV 01'}*\n` +
                `🏢 *${companyName}*\n` +
                `----------------------------------------\n` +
                `👤 Customer: ${invoice.customerName || 'Customer'}\n` +
                `💰 *TOTAL AMOUNT:* *₹${grandTotal.toLocaleString('en-IN')}*\n\n` +
                `⚡ *1-CLICK UPI PAYMENT LINK:*\n` +
                `${upiPayString}\n\n` +
                `🏦 UPI ID: ${upiId}\n\n` +
                `📎 Your official PDF invoice is generated.\n` +
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
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-200/70 print:p-0 print:bg-white print:overflow-visible flex justify-center">
          <div 
            id="printable-invoice" 
            ref={invoiceRef}
            className="w-full max-w-[210mm] bg-white text-slate-900 shadow-xl print:shadow-none p-8 sm:p-12 border border-slate-300 print:border-none font-sans text-xs leading-normal"
            style={{ minHeight: '297mm' }}
          >
            {/* Header: Top Title + Logo Badge */}
            <div className="flex justify-between items-start mb-6">
              {/* Left Side: Invoice Title & Meta */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                  Invoice
                </h1>
                <div className="space-y-1 pt-1 text-[11px]">
                  <div className="grid grid-cols-2 gap-4">
                    <span className="text-slate-500 font-semibold">Invoice#</span>
                    <span className="font-bold text-slate-900 font-mono">{invoice.invoiceNumber || 'EV 01'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <span className="text-slate-500 font-semibold">Invoice Date</span>
                    <span className="font-bold text-slate-900 uppercase font-mono">{invoice.date || new Date().toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <span className="text-slate-500 font-semibold">Due Date</span>
                    <span className="font-bold text-slate-900 uppercase font-mono">{invoice.dueDate || invoice.date || new Date().toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Company Logo Badge */}
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-md font-bold text-lg">
                  <Zap className="w-6 h-6 text-white fill-white" />
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">
                    {companyName}
                  </div>
                  <div className="text-[10px] font-bold text-slate-600 tracking-widest uppercase">
                    EV SERVICE & BILLING
                  </div>
                </div>
              </div>
            </div>

            {/* Billed By & Billed To Grey Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Billed By Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-1">
                <div className="text-xs font-bold text-slate-950 mb-1.5">Billed by</div>
                <div className="text-xs font-bold text-slate-900">{companyName}</div>
                <div className="text-[11px] text-slate-600 leading-relaxed">{companyAddress}</div>
                <div className="text-[11px] text-slate-700 font-medium pt-0.5">
                  Phone: <span className="font-mono">{companyPhone1}</span> {companyPhone2 ? `/ ${companyPhone2}` : ''}
                </div>
                {companyGstin && (
                  <div className="text-[11px] text-slate-800 pt-0.5">
                    <span className="font-bold">GSTIN</span> <span className="font-mono ml-2 font-medium">{companyGstin}</span>
                  </div>
                )}
                {companyEmail && (
                  <div className="text-[11px] text-slate-600">
                    <span className="font-bold">Email</span> <span className="ml-2 font-medium">{companyEmail}</span>
                  </div>
                )}
              </div>

              {/* Billed To Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-1">
                <div className="text-xs font-bold text-slate-950 mb-1.5">Billed to</div>
                <div className="text-xs font-bold text-slate-900">{invoice.customerName || 'Walk-in Customer'}</div>
                <div className="text-[11px] text-slate-600 leading-relaxed">
                  {invoice.billingAddress || 'Bengaluru, Karnataka'}
                </div>
                {invoice.customerPhone && (
                  <div className="text-[11px] text-slate-700 font-medium pt-0.5">
                    Contact: <span className="font-mono">{invoice.customerPhone}</span>
                  </div>
                )}
                {invoice.customerGstin && (
                  <div className="text-[11px] text-slate-800 pt-0.5">
                    <span className="font-bold">GSTIN</span> <span className="font-mono ml-2 font-medium">{invoice.customerGstin}</span>
                  </div>
                )}
                {invoice.regNo && (
                  <div className="text-[11px] text-slate-800 font-semibold pt-0.5">
                    Vehicle Reg: <span className="font-mono">{invoice.regNo}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Place of Supply Bar */}
            <div className="flex justify-between items-center px-4 py-2 bg-white text-[11px] border-b border-slate-200 mb-4">
              <div>
                <span className="text-slate-500 font-medium">Place of Supply</span>
                <strong className="ml-3 text-slate-900">{invoice.stateOfSupply || 'Karnataka'}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Country of Supply</span>
                <strong className="ml-3 text-slate-900">India</strong>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#4b5563] text-white font-semibold text-[11px]">
                    <th className="py-2.5 px-3 rounded-l">Item # /Item description</th>
                    <th className="py-2.5 px-2 text-center">HSN</th>
                    <th className="py-2.5 px-2 text-center">Qty.</th>
                    <th className="py-2.5 px-2 text-center">GST</th>
                    <th className="py-2.5 px-3 text-right">Taxable Amount</th>
                    <th className="py-2.5 px-2 text-right">SGST</th>
                    <th className="py-2.5 px-2 text-right">CGST</th>
                    <th className="py-2.5 px-3 text-right rounded-r">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {processedItems.map((item) => (
                    <tr key={item.sNo} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-3 font-medium text-slate-900">
                        {item.sNo}. {item.name}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-slate-600">{item.hsnCode}</td>
                      <td className="py-3 px-2 text-center font-mono">{item.qty}</td>
                      <td className="py-3 px-2 text-center font-mono">{item.taxRate ? `${item.halfTaxRate}%` : '0%'}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-800">
                        ₹ {item.taxableVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-slate-700">
                        ₹{item.sgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-slate-700">
                        ₹{item.cgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-950">
                        ₹ {item.totalLineAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Section: Bank & Terms (Left) + Totals Summary (Right) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 mb-6 items-start">
              {/* Left Column: Bank Details & Terms */}
              <div className="sm:col-span-7 space-y-5">
                {/* Bank & Payment Details */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-950">Bank & Payment Details</h4>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 text-[11px] text-slate-600">
                      <div className="grid grid-cols-2 gap-2">
                        <span>Account Holder Name</span>
                        <strong className="text-slate-900">{accountHolder}</strong>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span>Account Number</span>
                        <strong className="font-mono text-slate-900">{accountNo}</strong>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span>IFSC</span>
                        <strong className="font-mono text-slate-900">{ifscCode}</strong>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span>Account Type</span>
                        <span className="text-slate-800">Current</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span>Bank</span>
                        <span className="text-slate-800">{bankName}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span>UPI</span>
                        <strong className="font-mono text-slate-900">{upiId}</strong>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center justify-center shrink-0 text-center">
                      <span className="text-[10px] text-slate-500 font-medium mb-1">UPI - Scan to Pay</span>
                      <div className="p-1.5 border border-slate-200 rounded-lg bg-white shadow-sm">
                        <QRCodeSVG value={upiPayString} size={72} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-1 text-[11px]">
                  <h4 className="text-xs font-bold text-slate-950">Terms and Conditions</h4>
                  <div className="text-slate-600 leading-relaxed whitespace-pre-line text-[10px]">
                    {termsAndConditions}
                  </div>
                </div>

                {/* Additional Notes */}
                {invoice.notes && (
                  <div className="space-y-1 text-[11px]">
                    <h4 className="text-xs font-bold text-slate-950">Additional Notes</h4>
                    <p className="text-slate-600 text-[10px] leading-relaxed">{invoice.notes}</p>
                  </div>
                )}
              </div>

              {/* Right Column: Financial Totals */}
              <div className="sm:col-span-5 space-y-3">
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between items-center">
                    <span>Sub Total</span>
                    <span className="font-mono font-semibold">₹{calculatedSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {totalDiscount > 0 && (
                    <div className="flex justify-between items-center text-slate-800">
                      <span>Discount</span>
                      <span className="font-mono">- ₹{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span>Taxable Amount</span>
                    <span className="font-mono font-semibold">₹{taxableTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {!isInterState ? (
                    <>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>CGST</span>
                        <span className="font-mono">₹{cgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>SGST</span>
                        <span className="font-mono">₹{sgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center text-slate-600">
                      <span>IGST</span>
                      <span className="font-mono">₹{igstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>

                {/* Total Row */}
                <div className="border-t border-slate-300 pt-2.5 flex justify-between items-center">
                  <span className="text-base font-bold text-slate-950">Total</span>
                  <span className="text-2xl font-black font-mono text-slate-950">
                    ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Amount in Words */}
                <div className="space-y-0.5 pt-1">
                  <div className="text-[10px] text-slate-500">Invoice Total (in words)</div>
                  <div className="text-[11px] font-bold text-slate-900 leading-snug">
                    {amountInWords}
                  </div>
                </div>

                {/* Payment Status / Paid Amount */}
                <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px]">
                  <span className="text-slate-500">Payment Status</span>
                  <span className="font-bold font-mono text-slate-900">{invoice.paymentStatus || 'PAID'}</span>
                </div>
              </div>
            </div>

            {/* Bottom Footer Line */}
            <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-500">
              For any enquiries, email us on <strong className="text-slate-800">{companyEmail}</strong> or call us on <strong className="text-slate-800">+{companyPhone1} / +{companyPhone2}</strong>
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
