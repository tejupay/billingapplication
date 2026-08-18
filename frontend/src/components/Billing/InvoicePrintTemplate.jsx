import React, { useEffect, useRef } from 'react';
import { X, Printer, Download, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { useData } from '../../context/DataContext';

export const InvoicePrintTemplate = ({ invoice, onClose }) => {
  const { shopDetails } = useData();
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current && invoice?.invoiceNumber) {
      try {
        JsBarcode(barcodeRef.current, invoice.invoiceNumber, {
          format: 'CODE128',
          width: 1.5,
          height: 35,
          displayValue: true,
          fontSize: 9
        });
      } catch (err) {
        console.error('Barcode error:', err);
      }
    }
  }, [invoice]);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentUpiId = shopDetails?.upiId || 'jaganna@hdfcbank';
  const upiString = `upi://pay?pa=${currentUpiId}&pn=${encodeURIComponent(shopDetails?.name || 'JAGANNA')}&am=${invoice.grandTotal}&cu=INR&tn=${invoice.invoiceNumber}`;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Controls Bar */}
        <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="text-xs font-bold text-white font-mono">
            Print Preview: {invoice.invoiceNumber}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
            >
              <Printer className="w-4 h-4" /> Print Invoice
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`*GST Invoice #${invoice.invoiceNumber}*\nCustomer: ${invoice.customerName}\nGrand Total: ₹${invoice.grandTotal}\nIssued by ${shopDetails?.name || 'JAGANNA'}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4" /> Share WhatsApp
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 bg-white text-slate-900 overflow-y-auto" id="printable-invoice">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-300 pb-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-heading">{shopDetails?.name || 'JAGANNA'}</h1>
              {shopDetails?.tagline && <p className="text-xs font-semibold text-slate-700">{shopDetails.tagline}</p>}
              <p className="text-xs text-slate-600 mt-1">{shopDetails?.address || 'Main Road, Bengaluru'}</p>
              <p className="text-xs text-slate-600">
                Support: <span className="font-mono font-bold text-slate-800">{shopDetails?.phone || '+91 93339 11911'}</span>
                {shopDetails?.gstin && <span> • GSTIN: <span className="font-mono font-bold">{shopDetails.gstin}</span></span>}
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold font-mono rounded">
                SALE INVOICE
              </span>
              <div className="text-sm font-bold text-slate-900 font-mono mt-1">{invoice.invoiceNumber}</div>
              <div className="text-xs text-slate-600">Date: {invoice.date}</div>
              <div className="text-xs text-slate-600">Issued by: {invoice.createdByName}</div>
            </div>
          </div>

          {/* Billed To & Vehicle Info */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Customer Details:</div>
              <div className="text-sm font-bold text-slate-900">{invoice.customerName}</div>
              {invoice.customerPhone && <div className="text-xs text-slate-600">Phone: {invoice.customerPhone}</div>}
              {invoice.billingAddress && <div className="text-xs text-slate-600">Address: {invoice.billingAddress}</div>}
            </div>

            <div className="text-right space-y-0.5">
              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Vehicle & Service Info:</div>
              {invoice.regNo && <div className="text-xs text-slate-800 font-mono">Reg No: <strong>{invoice.regNo}</strong></div>}
              {invoice.odoRunning && <div className="text-xs text-slate-600">ODO Running: {invoice.odoRunning}</div>}
              <div className="text-xs font-bold text-slate-800">
                Payment Method: <span className="text-emerald-700 font-mono">{invoice.paymentMethod || 'ONLINE'}</span>
              </div>
              {invoice.referenceNo && <div className="text-[11px] font-mono text-slate-600">Ref: {invoice.referenceNo}</div>}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-xs text-left mb-4 border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="p-2 w-8">#</th>
                <th className="p-2">Item Description</th>
                <th className="p-2 text-center">Batch / Model</th>
                <th className="p-2 text-center">Qty / Unit</th>
                <th className="p-2 text-right">Price/Unit</th>
                <th className="p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="text-slate-800">
                  <td className="p-2 font-mono">{idx + 1}</td>
                  <td className="p-2 font-medium">{item.productName || item.name}</td>
                  <td className="p-2 text-center font-mono text-[11px] text-slate-600">
                    {item.batchNo || item.modelNo ? `${item.batchNo || ''} ${item.modelNo || ''}` : '-'}
                  </td>
                  <td className="p-2 text-center font-semibold">{item.quantity} {item.unit || 'Nos'}</td>
                  <td className="p-2 text-right font-mono">₹{item.unitPrice || item.pricePerUnit}</td>
                  <td className="p-2 text-right font-mono font-bold">₹{(item.totalPrice || item.amount || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tax Summary & Bank Details */}
          <div className="flex justify-between items-start border-t border-slate-300 pt-4">
            <div className="flex items-center gap-4">
              <div>
                <svg ref={barcodeRef}></svg>
              </div>
              <div className="text-center">
                <QRCodeSVG value={upiString} size={65} />
                <div className="text-[9px] font-mono text-slate-500 mt-1">UPI Pay QR</div>
              </div>
              {shopDetails?.bankName && (
                <div className="text-[10px] text-slate-600 border-l border-slate-200 pl-3">
                  <div className="font-bold text-slate-800">{shopDetails.bankName}</div>
                  <div>A/C: <span className="font-mono font-bold">{shopDetails.accountNo}</span></div>
                  <div>IFSC: <span className="font-mono">{shopDetails.ifscCode}</span></div>
                </div>
              )}
            </div>

            <div className="w-56 space-y-1 text-xs text-slate-700 text-right">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono font-semibold">₹{(invoice.subtotal || invoice.grandTotal).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-400 pt-1.5">
                <span>Grand Total</span>
                <span className="font-mono text-base font-bold text-slate-900">₹{(invoice.grandTotal || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[11px] text-emerald-700 font-semibold">
                <span>Paid Amount</span>
                <span className="font-mono">₹{(invoice.paidAmount || invoice.grandTotal).toLocaleString('en-IN')}</span>
              </div>
              {invoice.balanceAmount > 0 && (
                <div className="flex justify-between text-[11px] text-rose-600 font-bold">
                  <span>Balance Due</span>
                  <span className="font-mono">₹{invoice.balanceAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
            <div>{shopDetails?.termsAndConditions || 'Thanks for doing business with us!'}</div>
            <div>Computer Generated Invoice</div>
          </div>
        </div>
      </div>
    </div>
  );
};
