import React, { useRef, useState } from 'react';
import { Download, Printer, Smartphone, Zap, CheckCircle2, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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

export const PublicInvoiceView = ({ invoice }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSaved, setPdfSaved] = useState(false);
  const invoiceRef = useRef(null);

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md text-center">
          <Zap className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Invoice Not Found</h2>
          <p className="text-xs text-slate-400">The invoice link may be invalid or expired. Please contact Yashas EV Service.</p>
        </div>
      </div>
    );
  }

  // Company details
  const companyName = 'YASHAS EV SERVICE';
  const companyAddress = '1/9 A.M Complex, Next To Just Bake, Opp to C.B Kallu Metro Station, Bangalore - 560073';
  const companyPhone1 = '7676424061';
  const companyPhone2 = '8792383779';
  const companyGstin = '29EVHUB1234F1Z5';
  const companyEmail = 'yrtmotos@gmail.com';

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

  const bankName = invoice.bankName || 'Canara Bank';
  const accountNo = invoice.accountNo || '120001017346';
  const ifscCode = invoice.ifscCode || 'CNRB0001199';
  const accountHolder = invoice.accountHolderName || companyName;
  const upiId = '8105979580-of5a-2@ybl';
  const upiPayString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(companyName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Invoice_' + (invoice.invoiceNumber || 'EV01'))}`;

  const termsAndConditions = invoice.termsAndConditions || '1. Warranty applies as per manufacturer terms.\n2. Physical and water damage will not be covered under warranty.';

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
      setPdfSaved(true);
      setTimeout(() => setPdfSaved(false), 4000);
    } catch (e) {
      console.error('Error downloading PDF:', e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-6 px-3 sm:px-6">
      
      {/* Top Banner & Customer Actions */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
            <Zap className="w-6 h-6 text-emerald-400 fill-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>{companyName}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                Official Bill
              </span>
            </h2>
            <p className="text-xs text-slate-400">Invoice #{invoice.invoiceNumber || 'EV 01'} • Amount: ₹{grandTotal.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
          >
            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {pdfSaved ? 'Saved to Downloads!' : 'Download Official PDF'}
          </button>

          <a
            href={upiPayString}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition"
          >
            <Smartphone className="w-4 h-4" />
            1-Click Pay (UPI)
          </a>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Printable / Rendered Invoice Sheet */}
      <div className="w-full flex justify-center">
        <div 
          id="printable-invoice" 
          ref={invoiceRef}
          className="w-full max-w-[210mm] bg-white text-slate-900 shadow-2xl p-6 sm:p-12 border border-slate-300 font-sans text-xs leading-normal rounded-xl print:rounded-none print:shadow-none print:border-none print:p-0"
          style={{ minHeight: '297mm' }}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
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

            {/* Logo Badge */}
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

          {/* Billed by & Billed to Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-1">
              <div className="text-xs font-bold text-slate-950 mb-1.5">Billed to</div>
              <div className="text-xs font-bold text-slate-900">{invoice.customerName || 'Customer'}</div>
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
                <div className="text-[11px] text-slate-700 pt-0.5">
                  Vehicle Reg: <span className="font-mono">{invoice.regNo}</span>
                </div>
              )}
            </div>
          </div>

          {/* Place of Supply */}
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

          {/* Table */}
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

          {/* Bottom Section */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 mb-6 items-start">
            <div className="sm:col-span-7 space-y-5">
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

                  <div className="flex flex-col items-center justify-center shrink-0 text-center">
                    <span className="text-[10px] text-slate-500 font-medium mb-1">UPI - Scan to Pay</span>
                    <div className="p-1.5 border border-slate-200 rounded-lg bg-white shadow-sm">
                      <QRCodeSVG value={upiPayString} size={72} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <h4 className="text-xs font-bold text-slate-950">Terms and Conditions</h4>
                <div className="text-slate-600 leading-relaxed whitespace-pre-line text-[10px]">
                  {termsAndConditions}
                </div>
              </div>
            </div>

            {/* Totals */}
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
                    {cgstTotal > 0 && (
                      <div className="flex justify-between items-center text-slate-600">
                        <span>CGST</span>
                        <span className="font-mono">₹{cgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {sgstTotal > 0 && (
                      <div className="flex justify-between items-center text-slate-600">
                        <span>SGST</span>
                        <span className="font-mono">₹{sgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {igstTotal > 0 && (
                      <div className="flex justify-between items-center text-slate-600">
                        <span>IGST</span>
                        <span className="font-mono">₹{igstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </>
                )}

                <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-slate-950 font-black text-sm">
                  <span>Total</span>
                  <span className="font-mono text-base">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="pt-2 text-[11px]">
                  <span className="text-slate-500 font-medium">Invoice Total (in words)</span>
                  <p className="font-bold text-slate-900 italic mt-0.5">{amountInWords}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-500">
            For any enquiries, email us on <span className="text-slate-800 font-semibold">{companyEmail}</span> or call us on <span className="font-mono text-slate-800 font-semibold">+{companyPhone1} / +{companyPhone2}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
