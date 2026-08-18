import React, { useState } from 'react';
import { Send, Copy, ExternalLink, QrCode, CheckCircle2, MessageSquare, Smartphone, FileText, Download, X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import jsPDF from 'jspdf';

export const WhatsAppModal = ({ invoice, onClose }) => {
  const { shopDetails } = useData();

  if (!invoice) return null;

  const [phone, setPhone] = useState(() => {
    let raw = invoice.customerPhone || invoice.phone || '';
    let digits = raw.replace(/\D/g, '');
    if (digits.length === 10) {
      digits = '91' + digits;
    }
    return digits ? '+' + digits : '+91 ';
  });

  const [customNote, setCustomNote] = useState('Thank you for shopping with us! Please find your digital invoice details attached.');
  const [copied, setCopied] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState('DIRECT'); // 'DIRECT' | 'EMBEDDED_WEB'

  // Generate robust invoice items list for WhatsApp
  const generateMessageText = () => {
    const rawItems = invoice.items || [];
    const itemsList = rawItems.map((item, idx) => {
      const name = item.productName || item.name || item.description || `Item #${idx + 1}`;
      const qty = Number(item.quantity || item.qty || 1);
      const unitPrice = Number(item.unitPrice || item.pricePerUnit || item.price || 0);
      const lineTotal = Number(item.totalPrice || item.amount || item.total || (unitPrice * qty));
      return `  ${idx + 1}. *${name}* (x${qty}) - ₹${lineTotal.toLocaleString('en-IN')}`;
    }).join('\n');

    const grandTotal = Number(invoice.grandTotal || invoice.totalAmount || 0);
    const subTotal = Number(invoice.subtotal || invoice.subTotal || grandTotal);
    const taxTotal = Number(invoice.taxTotal || invoice.taxAmount || 0);

    const upiId = shopDetails?.upiId || 'apexretail@hdfcbank';
    const upiPayLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopDetails?.name || 'GreenDrive EV')}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent('Invoice-' + invoice.invoiceNumber)}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiPayLink)}`;

    return `🧾 *INVOICE & BILL PDF: ${invoice.invoiceNumber || 'INV-001'}*
🏢 *${shopDetails?.name || 'GreenDrive EV Motors'}*
----------------------------------------
👤 *Customer:* ${invoice.customerName || 'Valued Customer'}
📅 *Date:* ${invoice.date || new Date().toLocaleDateString('en-IN')}
💳 *Payment Status:* ${invoice.paymentStatus || invoice.paymentMethod || 'PAID'}

📦 *ITEMS PURCHASED:*
${itemsList || '  • Standard Invoice Items'}

----------------------------------------
💵 *Subtotal:* ₹${subTotal.toLocaleString('en-IN')}
📊 *Tax / GST:* ₹${taxTotal.toLocaleString('en-IN')}
💰 *GRAND TOTAL:* ₹${grandTotal.toLocaleString('en-IN')}

📲 *SCAN TO PAY (UPI QR CODE LINK):*
${qrImageUrl}

🏦 *PAYMENT UPI ID:* ${upiId}
ℹ️ ${customNote}

Thank you for your business! 🙏`;
  };

  const formattedMsg = generateMessageText();
  const cleanPhoneDigits = phone.replace(/\D/g, '');

  // Generate and Download PDF Invoice
  const generateAndDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Colors
      const primaryColor = [15, 23, 42]; // Slate 900
      const accentColor = [37, 99, 235]; // Blue 600
      const darkText = [30, 41, 59];

      // Header Banner
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 32, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(shopDetails?.name || 'GreenDrive EV Motors', 14, 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(shopDetails?.tagline || 'Tax Invoice & Enterprise Management System', 14, 22);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('TAX INVOICE', 196, 15, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`#${invoice.invoiceNumber || 'INV-001'}`, 196, 22, { align: 'right' });

      // Invoice Details Block
      doc.setTextColor(...darkText);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('CUSTOMER DETAILS:', 14, 42);
      doc.text('INVOICE INFO:', 120, 42);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Name: ${invoice.customerName || 'Valued Customer'}`, 14, 48);
      doc.text(`Phone: ${invoice.customerPhone || phone || 'N/A'}`, 14, 54);
      if (invoice.regNo) doc.text(`Vehicle Reg: ${invoice.regNo}`, 14, 60);

      doc.text(`Date: ${invoice.date || new Date().toLocaleDateString('en-IN')}`, 120, 48);
      doc.text(`Payment Method: ${invoice.paymentMethod || 'ONLINE'}`, 120, 54);
      doc.text(`Payment Status: ${invoice.paymentStatus || 'PAID'}`, 120, 60);

      // Table Header
      let startY = 70;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, startY, 182, 8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text('#', 18, startY + 5.5);
      doc.text('Item Description', 28, startY + 5.5);
      doc.text('Qty', 125, startY + 5.5, { align: 'center' });
      doc.text('Price/Unit', 155, startY + 5.5, { align: 'right' });
      doc.text('Amount (INR)', 192, startY + 5.5, { align: 'right' });

      // Table Rows
      let currentY = startY + 12;
      const rawItems = invoice.items || [];
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkText);

      rawItems.forEach((item, idx) => {
        const name = item.productName || item.name || item.description || `Item #${idx + 1}`;
        const qty = Number(item.quantity || item.qty || 1);
        const unitPrice = Number(item.unitPrice || item.pricePerUnit || item.price || 0);
        const lineTotal = Number(item.totalPrice || item.amount || item.total || (unitPrice * qty));

        doc.text(`${idx + 1}`, 18, currentY);
        doc.text(name.substring(0, 45), 28, currentY);
        doc.text(`${qty}`, 125, currentY, { align: 'center' });
        doc.text(`${unitPrice.toLocaleString('en-IN')}`, 155, currentY, { align: 'right' });
        doc.setFont('helvetica', 'bold');
        doc.text(`${lineTotal.toLocaleString('en-IN')}`, 192, currentY, { align: 'right' });
        doc.setFont('helvetica', 'normal');

        currentY += 7;
      });

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(14, currentY, 196, currentY);
      currentY += 8;

      // Summary Box
      const grandTotal = Number(invoice.grandTotal || invoice.totalAmount || 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...accentColor);
      doc.text(`GRAND TOTAL: INR ${grandTotal.toLocaleString('en-IN')}`, 196, currentY, { align: 'right' });

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`${shopDetails?.address || 'Main Road, Bengaluru'} | Phone: ${shopDetails?.phone || '+91 9876543210'}`, 105, 280, { align: 'center' });
      doc.text('Computer Generated Tax Invoice • TejuPay Billing ERP', 105, 285, { align: 'center' });

      const fileName = `Invoice_${invoice.invoiceNumber || 'EV-BILL'}.pdf`;
      doc.save(fileName);
      setPdfGenerated(true);
      return fileName;
    } catch (err) {
      console.error('PDF Generation Error:', err);
      return null;
    }
  };

  const handleOpenWhatsAppWeb = () => {
    const url = `https://web.whatsapp.com/send?phone=${cleanPhoneDigits}&text=${encodeURIComponent(formattedMsg)}`;
    window.open(url, '_blank');
  };

  const handleOpenWhatsAppApi = () => {
    const url = `https://api.whatsapp.com/send?phone=${cleanPhoneDigits}&text=${encodeURIComponent(formattedMsg)}`;
    window.open(url, '_blank');
  };

  const handleDownloadAndSendPdf = () => {
    const fileName = generateAndDownloadPDF();
    const grandTotal = Number(invoice.grandTotal || invoice.totalAmount || 0);
    const upiId = shopDetails?.upiId || 'apexretail@hdfcbank';
    const upiPayLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopDetails?.name || 'GreenDrive EV')}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent('Invoice-' + invoice.invoiceNumber)}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiPayLink)}`;

    const pdfMessage = `🧾 *OFFICIAL BILL PDF DOCUMENT: ${invoice.invoiceNumber}*
🏢 *${shopDetails?.name || 'GreenDrive EV Motors'}*
----------------------------------------
👤 *Customer:* ${invoice.customerName || 'Valued Customer'}
💰 *Grand Total:* ₹${grandTotal.toLocaleString('en-IN')}

📲 *PAYMENT QR CODE LINK:*
${qrImageUrl}
🏦 *UPI ID:* ${upiId}

📎 Your official PDF invoice file (*${fileName || 'Invoice.pdf'}*) has been generated and saved to your computer. Please attach the downloaded PDF file in this chat window!

Thank you for your business! 🙏`;

    const url = `https://web.whatsapp.com/send?phone=${cleanPhoneDigits}&text=${encodeURIComponent(pdfMessage)}`;
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(formattedMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Send WhatsApp Bill & PDF Invoice
              </h3>
              <p className="text-xs text-slate-400">Automatic PDF invoice generation & WhatsApp Web dispatch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 mt-4 mb-4 gap-2">
          <button
            onClick={() => setActiveTab('DIRECT')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 ${
              activeTab === 'DIRECT'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📄 PDF Invoice & WhatsApp Trigger
          </button>
          <button
            onClick={() => setActiveTab('EMBEDDED_WEB')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 ${
              activeTab === 'EMBEDDED_WEB'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📱 Log into WhatsApp Web Session
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === 'DIRECT' ? (
            <>
              {/* Customer Phone Input */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Customer WhatsApp Phone Number (with Country Code)
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* PDF Download Feature Card */}
              <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Official PDF Bill Document</h4>
                    <p className="text-[11px] text-slate-300">Generates clean PDF file `Invoice_{invoice.invoiceNumber}.pdf` for sharing</p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadAndSendPdf}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition shrink-0"
                >
                  <Download className="w-4 h-4" /> Download PDF & Send
                </button>
              </div>

              {/* Formatted Message Preview */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Formatted WhatsApp Message Preview
                  </label>
                  <button
                    onClick={handleCopyText}
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy Text'}
                  </button>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed border-l-4 border-l-emerald-500">
                  {formattedMsg}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-300 text-xs flex items-start gap-3">
                <QrCode className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-400">WhatsApp Web Session</h4>
                  <p className="mt-1 text-slate-300">
                    Open WhatsApp Web to log in and attach the generated PDF bill file directly into the customer chat window.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-slate-950 border border-slate-800 rounded-xl text-center">
                <MessageSquare className="w-12 h-12 text-emerald-400 mb-3 animate-pulse" />
                <h4 className="text-sm font-bold text-white mb-1">WhatsApp Web Quick Launch</h4>
                <p className="text-xs text-slate-400 mb-4 max-w-sm">
                  Click below to open WhatsApp Web directly and send invoice #{invoice.invoiceNumber} to {phone}.
                </p>
                <button
                  onClick={handleOpenWhatsAppWeb}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition"
                >
                  <ExternalLink className="w-4 h-4" /> Open WhatsApp Web Chat Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-2 justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
          >
            Close
          </button>

          <button
            onClick={generateAndDownloadPDF}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Save PDF
          </button>
          
          <button
            onClick={handleCopyText}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Text'}
          </button>

          <button
            onClick={handleOpenWhatsAppWeb}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition"
          >
            <Send className="w-3.5 h-3.5" /> Trigger WhatsApp Web
          </button>
        </div>
      </div>
    </div>
  );
};
