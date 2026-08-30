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

    const upiId = shopDetails?.upiId || 'apexretail@hdfcbank';
    const shopName = shopDetails?.name || 'GreenDrive EV Motors';
    const note = `Invoice_${invoice.invoiceNumber || 'BILL'}`;

    // Standard NPCI UPI Intent Deep Link — pre-fills and locks exact bill amount (non-editable in UPI apps)
    const upiPayLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${lockedAmount}&cu=INR&tn=${encodeURIComponent(note)}`;

    return `🧾 *INVOICE: #${invoice.invoiceNumber || 'INV-001'}*
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

Thank you for choosing ${shopName}! 🙏`;
  };

  const formattedMsg = generateMessageText();
  const cleanPhoneDigits = phone.replace(/\D/g, '');

  // Generate and Download PDF Invoice — GST Tax Invoice Format
  const generateAndDownloadPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const W = 210;
      const pageH = 297;
      const lm = 10; // left margin
      const rm = 200; // right margin
      const cw = rm - lm; // content width

      // ── Helper colours ─────────────────────────────────────────
      const BLACK   = [0, 0, 0];
      const DKGRAY  = [40, 40, 40];
      const MDGRAY  = [100, 100, 100];
      const LTGRAY  = [220, 220, 220];
      const VLTGRAY = [245, 245, 245];
      const WHITE   = [255, 255, 255];

      // ── Helpers ────────────────────────────────────────────────
      const setFont = (style, size, color = BLACK) => {
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        doc.setTextColor(...color);
      };
      const hline = (y, thick = 0.3) => {
        doc.setDrawColor(...LTGRAY);
        doc.setLineWidth(thick);
        doc.line(lm, y, rm, y);
      };
      const box = (x, y, w, h, fill, stroke) => {
        if (fill) { doc.setFillColor(...fill); doc.rect(x, y, w, h, 'F'); }
        if (stroke) { doc.setDrawColor(...stroke); doc.setLineWidth(0.3); doc.rect(x, y, w, h, 'S'); }
      };

      // ── Resolve data ──────────────────────────────────────────
      const shopName     = shopDetails?.name || 'GreenDrive EV Motors';
      const shopAddr     = shopDetails?.address || 'Bengaluru, Karnataka - 560001';
      const shopPhone    = shopDetails?.phone || '';
      const shopAlt      = shopDetails?.altPhone || '';
      const shopEmail    = shopDetails?.email || '';
      const shopGstin    = shopDetails?.gstin || '';
      const invNo        = invoice.invoiceNumber || 'INV-001';
      const invDate      = invoice.date || new Date().toLocaleDateString('en-IN');
      const custName     = invoice.customerName || invoice.customer?.name || 'Customer';
      const custPhone    = invoice.customerPhone || invoice.customer?.phone || '';
      const custAddr     = invoice.billingAddress || invoice.customer?.address || '';
      const custGstin    = invoice.customerGstin || '';
      const custState    = invoice.stateOfSupply || 'Karnataka (29)';
      const payMode      = invoice.paymentMethod || invoice.paymentType || 'ONLINE';
      const termsContent = invoice.termsAndConditions || invoice.termsText || shopDetails?.termsAndConditions || '';
      const rawItems     = Array.isArray(invoice.items) ? invoice.items.filter(i => (i.productName || i.name || '').trim()) : [];

      // Bank details: from invoice payload first, fallback to shopDetails
      const iBankName   = invoice.bankName || shopDetails?.bankName || '';
      const iAccountNo  = invoice.accountNo || shopDetails?.accountNo || '';
      const iIfscCode   = invoice.ifscCode || shopDetails?.ifscCode || '';
      const iAccHolder  = invoice.accountHolderName || shopDetails?.name || shopName;

      // ── Number formatting ─────────────────────────────────────
      const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const fmtInt = (n) => Number(n || 0).toLocaleString('en-IN');

      // ── Totals ────────────────────────────────────────────────
      let subTotal = 0;
      let totalTax = 0;
      rawItems.forEach(item => {
        const qty  = Number(item.quantity || 1);
        const price= Number(item.unitPrice || item.pricePerUnit || 0);
        const taxR = Number(item.taxRate || 0) / 100;
        const base = qty * price;
        const tax  = base * taxR;
        subTotal  += base;
        totalTax  += tax;
      });
      const grandTotal   = Number(invoice.grandTotal || subTotal + totalTax);
      const paidAmount   = Number(invoice.paidAmount || grandTotal);
      const balanceAmt   = Math.max(0, grandTotal - paidAmount);
      const cgst         = totalTax / 2;
      const sgst         = totalTax / 2;

      // ── Number to words (simple) ──────────────────────────────
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

      // ════════════════════════════════════════════════════════════
      //  PAGE 1 — MAIN INVOICE
      // ════════════════════════════════════════════════════════════

      // ── Section 1: Header Border ─────────────────────────────
      box(lm, 8, cw, 52, null, LTGRAY);

      // ── Company name / address (left column) ─────────────────
      setFont('bold', 13, DKGRAY);
      doc.text(shopName.toUpperCase(), lm + 2, 16);

      setFont('normal', 7.5, MDGRAY);
      const addrLines = doc.splitTextToSize(shopAddr, 65);
      addrLines.forEach((line, i) => doc.text(line, lm + 2, 22 + i * 4.5));
      let addrY = 22 + addrLines.length * 4.5;
      if (shopPhone) { doc.text(`Phone: ${shopPhone}${shopAlt ? ' / ' + shopAlt : ''}`, lm + 2, addrY); addrY += 4.5; }
      if (shopEmail) { doc.text(`Email: ${shopEmail}`, lm + 2, addrY); addrY += 4.5; }
      if (shopGstin) { doc.text(`GSTIN: ${shopGstin}`, lm + 2, addrY); addrY += 4.5; }

      // ── "Tax Invoice" title (top-right) ──────────────────────
      setFont('bold', 13, DKGRAY);
      doc.text('Tax Invoice', rm - 2, 14, { align: 'right' });

      // ── Invoice meta grid (right column) ─────────────────────
      const metaX = 120;
      const metaColW = 38;
      const metaRows = [
        ['Invoice No.', invNo],
        ['Date', invDate],
        ['Place of Supply', custState],
      ];
      setFont('normal', 7.5, DKGRAY);
      metaRows.forEach(([label, val], i) => {
        const rowY = 22 + i * 10;
        box(metaX, rowY - 4, metaColW, 10, VLTGRAY, LTGRAY);
        box(metaX + metaColW, rowY - 4, rm - metaX - metaColW, 10, null, LTGRAY);
        setFont('bold', 7, MDGRAY);
        doc.text(label, metaX + 2, rowY + 1);
        setFont('normal', 8, DKGRAY);
        doc.text(val, metaX + metaColW + 2, rowY + 1);
      });

      // ── Section 2: Bill To ───────────────────────────────────
      const billY = 63;
      box(lm, billY, cw, 5, [30, 30, 30], null);
      setFont('bold', 8, WHITE);
      doc.text('Bill To:', lm + 2, billY + 3.5);

      const billContentY = billY + 5;
      box(lm, billContentY, cw / 2, 32, null, LTGRAY);
      box(lm + cw / 2, billContentY, cw / 2, 32, null, LTGRAY);

      setFont('bold', 9, DKGRAY);
      doc.text(custName, lm + 2, billContentY + 6);
      setFont('normal', 7.5, MDGRAY);
      const custAddrLines = doc.splitTextToSize(custAddr, cw / 2 - 4);
      custAddrLines.slice(0, 3).forEach((line, i) => doc.text(line, lm + 2, billContentY + 11 + i * 4));
      if (custPhone) doc.text(`Contact No: ${custPhone}`, lm + 2, billContentY + 23);
      if (custGstin) doc.text(`GSTIN: ${custGstin}`, lm + 2, billContentY + 27);
      doc.text(`State: ${custState}`, lm + 2, billContentY + 31);

      // ── Section 3: Items Table ───────────────────────────────
      const tblStart = billContentY + 32 + 2;
      const colX = [lm, lm+8, lm+68, lm+88, lm+108, lm+118, lm+132, lm+155, lm+175];
      const colHeaders = ['#', 'Item Name / Description', 'HSN/SAC', 'Motor No', 'Qty', 'Unit', 'Price/Unit', 'GST', 'Amount'];
      const colWidths  = [8,    60,                         20,        20,         10,    14,    23,           20,    15];
      const colAligns  = ['c',  'l',                        'c',       'c',        'c',   'c',   'r',          'r',   'r'];

      // Table header row
      const thH = 7;
      box(lm, tblStart, cw, thH, [30, 30, 30], null);
      setFont('bold', 7, WHITE);
      colHeaders.forEach((h, ci) => {
        const tx = colX[ci] + (colAligns[ci] === 'r' ? colWidths[ci] - 1 : colAligns[ci] === 'c' ? colWidths[ci] / 2 : 1);
        const align = colAligns[ci] === 'r' ? 'right' : colAligns[ci] === 'c' ? 'center' : 'left';
        doc.text(h, tx, tblStart + 4.8, { align });
      });

      // Table rows
      let rowY = tblStart + thH;
      const rowH = 8;
      rawItems.forEach((item, idx) => {
        const name = item.productName || item.name || 'Item';
        const qty  = Number(item.quantity || 1);
        const price= Number(item.unitPrice || item.pricePerUnit || 0);
        const taxR = Number(item.taxRate || 0);
        const base = qty * price;
        const taxAmt = base * taxR / 100;
        const amt  = base + taxAmt;
        const bg   = idx % 2 === 0 ? WHITE : VLTGRAY;
        box(lm, rowY, cw, rowH, bg, LTGRAY);

        setFont('normal', 7.5, DKGRAY);
        doc.text(`${idx + 1}`, colX[0] + 4, rowY + 5.3, { align: 'center' });
        doc.text(doc.splitTextToSize(name, 58)[0], colX[1] + 1, rowY + 5.3);
        doc.text(item.hsnCode || '', colX[2] + 10, rowY + 5.3, { align: 'center' });
        doc.text(item.modelNo || item.motorNo || '', colX[3] + 10, rowY + 5.3, { align: 'center' });
        doc.text(`${qty}`, colX[4] + 5, rowY + 5.3, { align: 'center' });
        doc.text(item.unit || 'Nos', colX[5] + 7, rowY + 5.3, { align: 'center' });
        doc.text(fmt(price), colX[6] + colWidths[6] - 1, rowY + 5.3, { align: 'right' });
        doc.text(taxR ? `${taxR}%` : '-', colX[7] + colWidths[7] - 1, rowY + 5.3, { align: 'right' });
        setFont('bold', 7.5, DKGRAY);
        doc.text(fmt(amt), colX[8] + colWidths[8] - 1, rowY + 5.3, { align: 'right' });
        rowY += rowH;
      });

      // Total row
      box(lm, rowY, cw, 7, VLTGRAY, LTGRAY);
      setFont('bold', 7.5, DKGRAY);
      doc.text('Total', lm + 2, rowY + 4.8);
      doc.text(`${rawItems.reduce((s,i)=>s+Number(i.quantity||1),0)}`, colX[4] + 5, rowY + 4.8, { align: 'center' });
      doc.text(`₹ ${fmt(grandTotal)}`, rm - 1, rowY + 4.8, { align: 'right' });
      rowY += 7;

      // ── Section 4: Amount in Words + Amounts summary ─────────
      const amtSectionY = rowY + 2;
      const halfW = cw * 0.55;

      // Words (left)
      setFont('bold', 7.5, DKGRAY);
      doc.text('Invoice Amount in Words:', lm + 1, amtSectionY + 4);
      setFont('italic', 7.5, DKGRAY);
      const wordsLines = doc.splitTextToSize(amtWords, halfW - 4);
      wordsLines.forEach((l, i) => doc.text(l, lm + 1, amtSectionY + 9 + i * 4));

      // Amounts box (right)
      const amtBoxX = lm + halfW + 2;
      const amtBoxW = cw - halfW - 2;
      const amtRows = [
        ['Sub Total', `₹ ${fmt(subTotal)}`],
        ['CGST', `₹ ${fmt(cgst)}`],
        ['SGST', `₹ ${fmt(sgst)}`],
        ['Total', `₹ ${fmt(grandTotal)}`],
        ['Received', `₹ ${fmt(paidAmount)}`],
        ['Balance', `₹ ${fmt(balanceAmt)}`],
      ];
      amtRows.forEach(([label, val], i) => {
        const isTotal = label === 'Total';
        const bg = isTotal ? [230, 240, 255] : (i%2===0 ? WHITE : VLTGRAY);
        box(amtBoxX, amtSectionY + i * 7, amtBoxW / 2, 7, bg, LTGRAY);
        box(amtBoxX + amtBoxW / 2, amtSectionY + i * 7, amtBoxW / 2, 7, bg, LTGRAY);
        setFont(isTotal ? 'bold' : 'normal', 7.5, DKGRAY);
        doc.text(label, amtBoxX + 2, amtSectionY + i * 7 + 4.8);
        doc.text(val, amtBoxX + amtBoxW - 1, amtSectionY + i * 7 + 4.8, { align: 'right' });
      });

      const secAfterAmt = amtSectionY + amtRows.length * 7 + 3;

      // ── Section 5: Description / Warranty ────────────────────
      if (termsContent) {
        setFont('bold', 7.5, DKGRAY);
        doc.text('Description:', lm + 1, secAfterAmt + 4);
        setFont('normal', 7, MDGRAY);
        const tLines = doc.splitTextToSize(termsContent, halfW - 4);
        tLines.slice(0, 5).forEach((l, i) => doc.text(l, lm + 1, secAfterAmt + 9 + i * 4));
      }

      // Payment mode
      setFont('bold', 7.5, DKGRAY);
      doc.text('Payment mode:', lm + 1, secAfterAmt + 35);
      setFont('normal', 8, DKGRAY);
      doc.text(payMode, lm + 30, secAfterAmt + 35);

      const gstTableY = secAfterAmt + 42;

      // ── Section 6: GST Breakup Table ─────────────────────────
      if (gstTableY < 230) {
        box(lm, gstTableY, cw, 6, [30, 30, 30], null);
        setFont('bold', 7, WHITE);
        const gCols = [lm+2, lm+34, lm+74, lm+94, lm+134, lm+154, lm+180];
        const gHdrs = ['HSN/SAC','Taxable Amount','CGST Rate','CGST Amount','SGST Rate','SGST Amount','Total Tax'];
        gHdrs.forEach((h, ci) => doc.text(h, gCols[ci], gstTableY + 4));

        // Group by HSN
        const hsnMap = {};
        rawItems.forEach(item => {
          const key = item.hsnCode || '—';
          const base = Number(item.quantity||1) * Number(item.unitPrice||item.pricePerUnit||0);
          const rate = Number(item.taxRate||0);
          if (!hsnMap[key]) hsnMap[key] = { taxable: 0, rate };
          hsnMap[key].taxable += base;
        });

        let gr = gstTableY + 6;
        Object.entries(hsnMap).forEach(([hsn, data], idx) => {
          const bg = idx%2===0 ? WHITE : VLTGRAY;
          box(lm, gr, cw, 7, bg, LTGRAY);
          const cgstR = data.rate / 2;
          const cgstA = data.taxable * cgstR / 100;
          const sgstA = cgstA;
          setFont('normal', 7.5, DKGRAY);
          doc.text(hsn, gCols[0], gr + 4.8);
          doc.text(fmt(data.taxable), gCols[1] + 36, gr + 4.8, { align: 'right' });
          doc.text(`${cgstR}%`, gCols[2] + 16, gr + 4.8, { align: 'right' });
          doc.text(fmt(cgstA), gCols[3] + 36, gr + 4.8, { align: 'right' });
          doc.text(`${cgstR}%`, gCols[4] + 16, gr + 4.8, { align: 'right' });
          doc.text(fmt(sgstA), gCols[5] + 22, gr + 4.8, { align: 'right' });
          setFont('bold', 7.5, DKGRAY);
          doc.text(`₹ ${fmt(cgstA + sgstA)}`, gCols[6] + 17, gr + 4.8, { align: 'right' });
          gr += 7;
        });

        // GST total row
        box(lm, gr, cw, 7, VLTGRAY, LTGRAY);
        setFont('bold', 7.5, DKGRAY);
        doc.text('Total', gCols[0], gr + 4.8);
        doc.text(`₹ ${fmt(subTotal)}`, gCols[1] + 36, gr + 4.8, { align: 'right' });
        doc.text(`₹ ${fmt(cgst)}`, gCols[3] + 36, gr + 4.8, { align: 'right' });
        doc.text(`₹ ${fmt(sgst)}`, gCols[5] + 22, gr + 4.8, { align: 'right' });
        doc.text(`₹ ${fmt(totalTax)}`, gCols[6] + 17, gr + 4.8, { align: 'right' });
        gr += 7;

        // ── Section 7: Bank Details + Terms + Signature ───────
        const bdY = gr + 3;
        const bdW = cw * 0.40;
        const termsW = cw * 0.35;
        const sigW = cw - bdW - termsW;

        // Bank Details box
        if (iBankName || iAccountNo) {
          box(lm, bdY, bdW, 28, WHITE, LTGRAY);
          setFont('bold', 7.5, DKGRAY);
          doc.text('Bank Details:', lm + 2, bdY + 5);
          setFont('normal', 7.5, MDGRAY);
          if (iBankName)  doc.text(`Name : ${iBankName}`, lm + 2, bdY + 10);
          if (iAccountNo) doc.text(`Account No : ${iAccountNo}`, lm + 2, bdY + 15);
          if (iIfscCode)  doc.text(`IFSC code : ${iIfscCode}`, lm + 2, bdY + 20);
          if (iAccHolder) doc.text(`Account holder's Name : ${iAccHolder}`, lm + 2, bdY + 25);
        }

        // Terms & Conditions box
        box(lm + bdW, bdY, termsW, 28, WHITE, LTGRAY);
        setFont('bold', 7.5, DKGRAY);
        doc.text('Terms and conditions:', lm + bdW + 2, bdY + 5);
        setFont('normal', 6.5, MDGRAY);
        const tC = doc.splitTextToSize(termsContent || 'Thanks for doing business with us!', termsW - 4);
        tC.slice(0, 4).forEach((l, i) => doc.text(l, lm + bdW + 2, bdY + 10 + i * 4));

        // Authorised Signatory box
        box(lm + bdW + termsW, bdY, sigW, 28, WHITE, LTGRAY);
        setFont('bold', 7.5, DKGRAY);
        doc.text(shopName, lm + bdW + termsW + sigW / 2, bdY + 5, { align: 'center' });
        setFont('normal', 6.5, MDGRAY);
        doc.text('Authorised Signatory', lm + bdW + termsW + sigW / 2, bdY + 25, { align: 'center' });
      }

      // ── Acknowledgement Slip ──────────────────────────────────
      const ackY = 255;
      hline(ackY, 0.5);
      // Dashed cut line
      doc.setLineDashPattern([2, 2], 0);
      doc.setDrawColor(...MDGRAY);
      doc.setLineWidth(0.3);
      doc.line(lm, ackY + 1, rm, ackY + 1);
      doc.setLineDashPattern([], 0);

      setFont('bold', 9, DKGRAY);
      doc.text('Acknowledgement', W / 2, ackY + 6, { align: 'center' });
      setFont('bold', 11, DKGRAY);
      doc.text(shopName.toUpperCase(), W / 2, ackY + 12, { align: 'center' });

      const ackColW = cw / 2;
      // Invoice To (left)
      setFont('bold', 7.5, DKGRAY);
      doc.text('Invoice To:', lm, ackY + 19);
      setFont('bold', 8, DKGRAY);
      doc.text(custName, lm, ackY + 24);
      setFont('normal', 7, MDGRAY);
      const ackAddr = doc.splitTextToSize(custAddr, ackColW - 5);
      ackAddr.slice(0, 3).forEach((l, i) => doc.text(l, lm, ackY + 29 + i * 4));

      // Invoice Details (right)
      setFont('bold', 7.5, DKGRAY);
      doc.text('Invoice Details:', lm + ackColW, ackY + 19);
      setFont('normal', 7.5, MDGRAY);
      doc.text(`Invoice No.: ${invNo}`, lm + ackColW, ackY + 24);
      doc.text(`Invoice Date: ${invDate}`, lm + ackColW, ackY + 29);
      setFont('bold', 8, DKGRAY);
      doc.text(`Invoice Amount: ₹ ${fmt(grandTotal)}`, lm + ackColW, ackY + 34);
      setFont('normal', 7, MDGRAY);
      doc.text("Receiver's Seal & Sign: _______________", lm + ackColW, ackY + 41);

      // ── Save ───────────────────────────────────────────────────
      const fileName = `Invoice_${invNo}.pdf`;
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

  const handleOpenWhatsAppMobile = () => {
    const url = `https://wa.me/${cleanPhoneDigits}?text=${encodeURIComponent(formattedMsg)}`;
    window.open(url, '_blank');
  };

  const handleDownloadAndSendPdf = () => {
    const fileName = generateAndDownloadPDF();
    const grandTotal = Number(invoice.grandTotal || invoice.totalAmount || 0);
    const lockedAmount = grandTotal.toFixed(2);
    const upiId = shopDetails?.upiId || 'apexretail@hdfcbank';
    const shopName = shopDetails?.name || 'GreenDrive EV Motors';
    const note = `Invoice_${invoice.invoiceNumber || 'BILL'}`;
    const upiPayLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${lockedAmount}&cu=INR&tn=${encodeURIComponent(note)}`;
    const custName = invoice.customerName || invoice.customer?.name || 'Customer';

    const pdfMessage = `🧾 *OFFICIAL BILL: #${invoice.invoiceNumber || 'INV-001'}*
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
