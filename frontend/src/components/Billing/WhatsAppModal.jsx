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

  // Generate robust invoice items list & locked-amount UPI payment links for WhatsApp
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
    const lockedAmount = grandTotal.toFixed(2);

    // Read actual customer name — never fall back to 'Valued Customer' if a name was provided
    const custName = invoice.customerName || invoice.customer?.name || 'Customer';

    const upiId = shopDetails?.upiId || '8105979580-of5a-2@ybl';
    const shopName = shopDetails?.name || 'Yashas EV Service';
    const note = `Invoice_${invoice.invoiceNumber || 'BILL'}`;

    // Standard NPCI UPI Intent Deep Link — pre-fills and locks exact bill amount (non-editable in UPI apps)
    const upiPayLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${lockedAmount}&cu=INR&tn=${encodeURIComponent(note)}`;

    return `🧾 *INVOICE: #${invoice.invoiceNumber || 'EV 01'}*
🏢 *${shopName}*
°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°
👤 *Customer:* ${custName}
📅 *Date:* ${invoice.date || new Date().toLocaleDateString('en-IN')}
💳 *Payment Status:* ${invoice.paymentStatus || 'PENDING'}

📦 *ITEMS PURCHASED:*
${itemsList || '  • Standard Invoice Items'}

°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°
💵 *Subtotal:* ₹${subTotal.toLocaleString('en-IN')}
📊 *Tax / GST:* ₹${taxTotal.toLocaleString('en-IN')}
💰 *TOTAL AMOUNT PAYABLE:* *₹${grandTotal.toLocaleString('en-IN')}*

⚡ *PAY NOW — 1-Click UPI Link (PhonePe / Google Pay / Paytm / Any UPI App):*
👉 ${upiPayLink}

_(Tap the link above to open your UPI app. The exact amount ₹${grandTotal.toLocaleString('en-IN')} is already filled in — just confirm and pay. No manual entry needed.)_

🏦 *UPI ID:* \`${upiId}\`

Thank you for shopping with us! 🙏`;
  };

  const formattedMsg = generateMessageText();
  const cleanPhoneDigits = phone.replace(/\D/g, '');

  // Generate and Download PDF Invoice — Matching uploaded Reference Design
  const generateAndDownloadPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const W = 210;
      const lm = 12; // left margin
      const rm = 198; // right margin
      const cw = rm - lm; // content width: 186mm

      // Helper colours
      const BLACK   = [17, 24, 39];
      const DKGRAY  = [55, 65, 81];
      const MDGRAY  = [107, 114, 128];
      const LTGRAY  = [229, 231, 235];
      const CARD_BG = [248, 249, 250];
      const TH_BG   = [75, 85, 99];
      const WHITE   = [255, 255, 255];

      const setFont = (style, size, color = BLACK) => {
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        doc.setTextColor(...color);
      };

      const box = (x, y, w, h, fill, stroke) => {
        if (fill) { doc.setFillColor(...fill); doc.rect(x, y, w, h, 'F'); }
        if (stroke) { doc.setDrawColor(...stroke); doc.setLineWidth(0.3); doc.rect(x, y, w, h, 'S'); }
      };

      const roundedBox = (x, y, w, h, r, fill, stroke) => {
        if (fill) { doc.setFillColor(...fill); doc.roundedRect(x, y, w, h, r, r, 'F'); }
        if (stroke) { doc.setDrawColor(...stroke); doc.setLineWidth(0.25); doc.roundedRect(x, y, w, h, r, r, 'S'); }
      };

      // Resolve Company & Customer Data
      const companyName = shopDetails?.name || 'YASHAS EV SERVICE';
      const companyAddr = shopDetails?.address || '1/9 A.M Complex, Next To Just Bake, Opp to C.B Kallu Metro Station, Bangalore - 560073';
      const companyPhone = shopDetails?.phone || '7676424061';
      const companyAltPhone = shopDetails?.altPhone || '8792383779';
      const companyGstin = shopDetails?.gstin || '29EVHUB1234F1Z5';
      const companyEmail = shopDetails?.email || 'yrtmotos@gmail.com';

      const invNo     = invoice.invoiceNumber || 'EV 01';
      const invDate   = invoice.date || new Date().toLocaleDateString('en-IN');
      const dueDate   = invoice.dueDate || invDate;
      const custName  = invoice.customerName || invoice.customer?.name || 'Customer';
      const custPhone = invoice.customerPhone || invoice.customer?.phone || '';
      const custAddr  = invoice.billingAddress || invoice.customer?.address || 'Bengaluru, Karnataka';
      const custGstin = invoice.customerGstin || '';
      const stateSupply = invoice.stateOfSupply || 'Karnataka';

      const rawItems  = Array.isArray(invoice.items) ? invoice.items.filter(i => (i.productName || i.name || '').trim()) : [];
      const isInterState = stateSupply.toLowerCase().includes('inter');

      // Bank details
      const iBankName   = invoice.bankName || shopDetails?.bankName || 'Canara Bank';
      const iAccountNo  = invoice.accountNo || shopDetails?.accountNo || '120001017346';
      const iIfscCode   = invoice.ifscCode || shopDetails?.ifscCode || 'CNRB0001199';
      const iAccHolder  = invoice.accountHolderName || companyName;
      const iUpiId      = shopDetails?.upiId || '8105979580-of5a-2@ybl';

      // Calculations
      let calculatedSubtotal = 0;
      let calculatedTax = 0;
      let totalDiscount = 0;

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

        const taxableVal = Math.max(0, (rate * qty) - discountAmt);
        const taxRate = Number(item.taxRate || (item.taxType === '18%' ? 18 : item.taxType === '12%' ? 12 : item.taxType === '5%' ? 5 : 18));
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
          hsnCode: item.hsnCode || '02',
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

      // Words helper
      const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
      const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
      const toWords = (num) => {
        if (num === 0) return 'Zero';
        const n = Math.floor(num);
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '');
        if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + toWords(n%100) : '');
        if (n < 100000) return toWords(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' ' + toWords(n%1000) : '');
        if (n < 10000000) return toWords(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' ' + toWords(n%100000) : '');
        return toWords(Math.floor(n/10000000)) + ' Crore' + (n%10000000 ? ' ' + toWords(n%10000000) : '');
      };
      const amtWords = toWords(Math.floor(grandTotal)) + ' Rupees Only';

      const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      // ── PAGE DRAWING ──────────────────────────────────────────

      // 1. Top Header
      setFont('bold', 24, BLACK);
      doc.text('Invoice', lm, 20);

      setFont('normal', 8, MDGRAY);
      doc.text('Invoice#', lm, 28);
      setFont('bold', 8, BLACK);
      doc.text(invNo, lm + 26, 28);

      setFont('normal', 8, MDGRAY);
      doc.text('Invoice Date', lm, 34);
      setFont('bold', 8, BLACK);
      doc.text(invDate.toUpperCase(), lm + 26, 34);

      setFont('normal', 8, MDGRAY);
      doc.text('Due Date', lm, 40);
      setFont('bold', 8, BLACK);
      doc.text(dueDate.toUpperCase(), lm + 26, 40);

      // Logo / Brand on Top Right
      roundedBox(rm - 55, 14, 55, 18, 2, BLACK, null);
      setFont('bold', 10, WHITE);
      doc.text(companyName, rm - 27.5, 22, { align: 'center' });
      setFont('normal', 6.5, [209, 213, 219]);
      doc.text('EV SERVICE & BILLING', rm - 27.5, 27, { align: 'center' });

      // 2. Dual Billed By / Billed To Grey Cards
      const cardY = 46;
      const cardW = (cw - 6) / 2; // ~90mm each
      const cardH = 34;

      // Billed By
      roundedBox(lm, cardY, cardW, cardH, 2.5, CARD_BG, LTGRAY);
      setFont('bold', 8.5, BLACK);
      doc.text('Billed by', lm + 3, cardY + 6);
      setFont('bold', 7.5, DKGRAY);
      doc.text(companyName, lm + 3, cardY + 11);
      setFont('normal', 6.8, MDGRAY);
      const addrLines = doc.splitTextToSize(companyAddr, cardW - 6);
      addrLines.slice(0, 2).forEach((l, i) => doc.text(l, lm + 3, cardY + 16 + i * 3.6));
      doc.text(`Phone: ${companyPhone} / ${companyAltPhone}`, lm + 3, cardY + 24);
      doc.text(`GSTIN: ${companyGstin}`, lm + 3, cardY + 28);
      if (companyEmail) doc.text(`Email: ${companyEmail}`, lm + 3, cardY + 32);

      // Billed To
      const card2X = lm + cardW + 6;
      roundedBox(card2X, cardY, cardW, cardH, 2.5, CARD_BG, LTGRAY);
      setFont('bold', 8.5, BLACK);
      doc.text('Billed to', card2X + 3, cardY + 6);
      setFont('bold', 7.5, DKGRAY);
      doc.text(custName, card2X + 3, cardY + 11);
      setFont('normal', 6.8, MDGRAY);
      const custAddrLines = doc.splitTextToSize(custAddr, cardW - 6);
      custAddrLines.slice(0, 2).forEach((l, i) => doc.text(l, card2X + 3, cardY + 16 + i * 3.6));
      if (custPhone) doc.text(`Phone: ${custPhone}`, card2X + 3, cardY + 24);
      if (custGstin) doc.text(`GSTIN: ${custGstin}`, card2X + 3, cardY + 28);
      if (invoice.regNo) doc.text(`Vehicle Reg: ${invoice.regNo}`, card2X + 3, cardY + 32);

      // 3. Place of Supply Bar
      const posBarY = cardY + cardH + 4;
      setFont('normal', 7.5, MDGRAY);
      doc.text('Place of Supply', lm + 3, posBarY);
      setFont('bold', 7.5, BLACK);
      doc.text(stateSupply, lm + 32, posBarY);

      setFont('normal', 7.5, MDGRAY);
      doc.text('Country of Supply', rm - 45, posBarY);
      setFont('bold', 7.5, BLACK);
      doc.text('India', rm - 10, posBarY);

      // Divider line
      doc.setDrawColor(...LTGRAY);
      doc.setLineWidth(0.3);
      doc.line(lm, posBarY + 2.5, rm, posBarY + 2.5);

      // 4. Items Table
      const tblStart = posBarY + 6;
      const thH = 7.5;
      box(lm, tblStart, cw, thH, TH_BG, null);

      const colX = [lm+2, lm+56, lm+72, lm+86, lm+116, lm+138, lm+160, rm-2];
      setFont('bold', 7, WHITE);
      doc.text('Item # /Item description', colX[0], tblStart + 5);
      doc.text('HSN', colX[1], tblStart + 5, { align: 'center' });
      doc.text('Qty.', colX[2], tblStart + 5, { align: 'center' });
      doc.text('GST', colX[3], tblStart + 5, { align: 'center' });
      doc.text('Taxable Amount', colX[4], tblStart + 5, { align: 'right' });
      doc.text('SGST', colX[5], tblStart + 5, { align: 'right' });
      doc.text('CGST', colX[6], tblStart + 5, { align: 'right' });
      doc.text('Amount', colX[7], tblStart + 5, { align: 'right' });

      // Table Rows
      let rowY = tblStart + thH;
      const rowH = 7.5;

      processedItems.forEach((item, idx) => {
        setFont('normal', 7.2, BLACK);
        const nameText = `${idx + 1}. ${item.name}`;
        doc.text(doc.splitTextToSize(nameText, 52)[0], colX[0], rowY + 5);
        doc.text(item.hsnCode, colX[1], rowY + 5, { align: 'center' });
        doc.text(`${item.qty}`, colX[2], rowY + 5, { align: 'center' });
        doc.text(item.taxRate ? `${item.halfTaxRate}%` : '0%', colX[3], rowY + 5, { align: 'center' });
        doc.text(`₹ ${fmt(item.taxableVal)}`, colX[4], rowY + 5, { align: 'right' });
        doc.text(`₹${fmt(item.sgstAmt)}`, colX[5], rowY + 5, { align: 'right' });
        doc.text(`₹${fmt(item.cgstAmt)}`, colX[6], rowY + 5, { align: 'right' });
        setFont('bold', 7.2, BLACK);
        doc.text(`₹ ${fmt(item.totalLineAmt)}`, colX[7], rowY + 5, { align: 'right' });

        doc.setDrawColor(...LTGRAY);
        doc.setLineWidth(0.2);
        doc.line(lm, rowY + rowH, rm, rowY + rowH);
        rowY += rowH;
      });

      // 5. Bottom Section: Bank Details (Left) + Totals Breakdown (Right)
      const botY = Math.max(rowY + 6, 175);

      // Left Column: Bank Details & Terms
      const leftColW = 95;
      setFont('bold', 8.5, BLACK);
      doc.text('Bank & Payment Details', lm, botY);

      const bRows = [
        ['Account Holder Name', iAccHolder],
        ['Account Number', iAccountNo],
        ['IFSC', iIfscCode],
        ['Account Type', 'Current'],
        ['Bank', iBankName],
        ['UPI', iUpiId],
      ];

      setFont('normal', 7, MDGRAY);
      bRows.forEach(([lbl, val], i) => {
        doc.text(lbl, lm, botY + 6 + i * 4.5);
        setFont('bold', 7, DKGRAY);
        doc.text(val, lm + 38, botY + 6 + i * 4.5);
        setFont('normal', 7, MDGRAY);
      });

      // Terms and Conditions
      const termsY = botY + 36;
      setFont('bold', 8.5, BLACK);
      doc.text('Terms and Conditions', lm, termsY);
      setFont('normal', 6.8, MDGRAY);
      const tLines = [
        '1. Warranty applies as per manufacturer terms.',
        '2. Physical and water damage will not be covered under warranty.'
      ];
      tLines.forEach((l, i) => doc.text(l, lm, termsY + 5 + i * 4));

      // Right Column: Totals Summary
      const totX = lm + leftColW + 15;
      const totValX = rm;

      setFont('normal', 8, MDGRAY);
      doc.text('Sub Total', totX, botY);
      doc.text(`₹${fmt(calculatedSubtotal)}`, totValX, botY, { align: 'right' });

      let curTotY = botY + 5;
      if (totalDiscount > 0) {
        doc.text('Discount', totX, curTotY);
        doc.text(`- ₹${fmt(totalDiscount)}`, totValX, curTotY, { align: 'right' });
        curTotY += 5;
      }

      doc.text('Taxable Amount', totX, curTotY);
      doc.text(`₹${fmt(taxableTotal)}`, totValX, curTotY, { align: 'right' });
      curTotY += 5;

      if (!isInterState) {
        doc.text('CGST', totX, curTotY);
        doc.text(`₹${fmt(cgstTotal)}`, totValX, curTotY, { align: 'right' });
        curTotY += 5;

        doc.text('SGST', totX, curTotY);
        doc.text(`₹${fmt(sgstTotal)}`, totValX, curTotY, { align: 'right' });
        curTotY += 5;
      } else {
        doc.text('IGST', totX, curTotY);
        doc.text(`₹${fmt(igstTotal)}`, totValX, curTotY, { align: 'right' });
        curTotY += 5;
      }

      doc.setDrawColor(...LTGRAY);
      doc.setLineWidth(0.3);
      doc.line(totX, curTotY, rm, curTotY);
      curTotY += 6;

      // Large Total
      setFont('bold', 12, BLACK);
      doc.text('Total', totX, curTotY);
      doc.text(`₹${fmt(grandTotal)}`, totValX, curTotY, { align: 'right' });
      curTotY += 8;

      // Total in words
      setFont('normal', 7, MDGRAY);
      doc.text('Invoice Total (in words)', totX, curTotY);
      setFont('bold', 7.5, BLACK);
      const wLines = doc.splitTextToSize(amtWords, rm - totX);
      wLines.forEach((l, i) => doc.text(l, totX, curTotY + 4 + i * 3.5));

      // 6. Bottom Enquiry Footer
      const footerY = 285;
      doc.setDrawColor(...LTGRAY);
      doc.setLineWidth(0.3);
      doc.line(lm, footerY - 3, rm, footerY - 3);

      setFont('normal', 7, MDGRAY);
      doc.text(`For any enquiries, email us on ${companyEmail} or call us on +91 ${companyPhone} / +91 ${companyAltPhone}`, W / 2, footerY + 1, { align: 'center' });

      // Save PDF
      const fileName = `Invoice_${invNo.replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
      setPdfGenerated(true);
      return fileName;
    } catch (err) {
      console.error('PDF Generation Error:', err);
      return null;
    }
  };

  // WhatsApp Trigger Handlers (MANDATORY PDF GENERATION)
  const handleOpenWhatsAppWeb = () => {
    // 1. Mandatory PDF generation & download
    generateAndDownloadPDF();

    // 2. Launch WhatsApp Web with formatted bill message and UPI intent
    const url = `https://web.whatsapp.com/send?phone=${cleanPhoneDigits}&text=${encodeURIComponent(formattedMsg)}`;
    window.open(url, '_blank');
  };

  const handleOpenWhatsAppMobile = () => {
    // 1. Mandatory PDF generation & download
    generateAndDownloadPDF();

    // 2. Launch native WhatsApp with formatted message
    const url = `https://wa.me/${cleanPhoneDigits}?text=${encodeURIComponent(formattedMsg)}`;
    window.open(url, '_blank');
  };

  const handleDownloadAndSendPdf = () => {
    const fileName = generateAndDownloadPDF();
    const grandTotal = Number(invoice.grandTotal || invoice.totalAmount || 0);
    const lockedAmount = grandTotal.toFixed(2);
    const upiId = shopDetails?.upiId || '8105979580-of5a-2@ybl';
    const shopName = shopDetails?.name || 'Yashas EV Service';
    const note = `Invoice_${invoice.invoiceNumber || 'BILL'}`;
    const upiPayLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${lockedAmount}&cu=INR&tn=${encodeURIComponent(note)}`;
    const custName = invoice.customerName || invoice.customer?.name || 'Customer';

    const pdfMessage = `🧾 *OFFICIAL BILL: #${invoice.invoiceNumber || 'EV 01'}*
🏢 *${shopName}*
----------------------------------------
👤 *Customer:* ${custName}
💰 *AMOUNT PAYABLE:* *₹${grandTotal.toLocaleString('en-IN')}*

⚡ *PAY NOW — 1-Click UPI Link (PhonePe / Google Pay / Paytm / Any UPI):*
👉 ${upiPayLink}

_(Tap the link — the exact amount ₹${grandTotal.toLocaleString('en-IN')} is already filled in, just confirm and pay.)_

🏦 UPI ID: \`${upiId}\`

📎 Your PDF invoice (*${fileName || 'Invoice.pdf'}*) is also attached.
Thank you! 🙏`;

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
            onClick={handleOpenWhatsAppMobile}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-700/30 transition"
            title="Open native WhatsApp App directly on mobile or desktop"
          >
            <Smartphone className="w-3.5 h-3.5" /> WhatsApp App (Mobile)
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
