// SpliBi - PDF Generator
// Generates per-person split summaries using jsPDF

import { jsPDF } from 'jspdf';
import { formatIDR } from './calculator.js';

/**
 * Generate a PDF summary for the entire bill or a specific person
 * @param {Object} receipt - The receipt data
 * @param {Object|null} personSplit - If provided, generate for this person specifically
 */
export function generateBillPDF(receipt, personSplit = null) {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200] // Receipt-style narrow format
    });

    const margin = 5;
    const width = 70;
    let y = 10;

    // Header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SpliBi', 40, y, { align: 'center' });
    y += 5;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Split Bill Bareng', 40, y, { align: 'center' });
    y += 7;

    // Separator
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin, y, margin + width, y);
    y += 5;

    // Store name & date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(receipt.storeName || 'Struk', 40, y, { align: 'center' });
    y += 4;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(receipt.date), 40, y, { align: 'center' });
    y += 6;

    if (personSplit) {
        // Person-specific PDF
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`Tagihan untuk: ${personSplit.name}`, margin, y);
        y += 5;

        doc.setLineDashPattern([1, 1], 0);
        doc.line(margin, y, margin + width, y);
        y += 4;

        // Items
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);

        if (personSplit.items && personSplit.items.length > 0) {
            personSplit.items.forEach(item => {
                const name = truncate(item.name, 25);
                doc.text(name, margin, y);
                doc.text(formatIDR(item.share || item.price), margin + width, y, { align: 'right' });
                y += 3.5;
            });
        }

        y += 2;
        doc.setLineDashPattern([1, 1], 0);
        doc.line(margin, y, margin + width, y);
        y += 4;

        // Total for person
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL', margin, y);
        doc.text(formatIDR(personSplit.amount), margin + width, y, { align: 'right' });
        y += 6;

    } else {
        // Full receipt PDF
        doc.setLineDashPattern([1, 1], 0);
        doc.line(margin, y, margin + width, y);
        y += 4;

        // Items
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);

        if (receipt.items) {
            receipt.items.forEach((item, i) => {
                const name = truncate(item.name, 22);
                const qty = item.qty > 1 ? `${item.qty}x ` : '';
                doc.text(`${qty}${name}`, margin, y);
                doc.text(formatIDR(item.price * (item.qty || 1)), margin + width, y, { align: 'right' });
                y += 3.5;
            });
        }

        y += 2;
        doc.line(margin, y, margin + width, y);
        y += 4;

        // Summary
        doc.setFontSize(7);
        const subtotal = receipt.items?.reduce((s, i) => s + i.price * (i.qty || 1), 0) || 0;

        doc.text('Subtotal', margin, y);
        doc.text(formatIDR(subtotal), margin + width, y, { align: 'right' });
        y += 3.5;

        if (receipt.taxAmount) {
            doc.text(`Pajak (${receipt.taxPercent || 0}%)`, margin, y);
            doc.text(formatIDR(receipt.taxAmount), margin + width, y, { align: 'right' });
            y += 3.5;
        }

        if (receipt.serviceAmount) {
            doc.text(`Service (${receipt.servicePercent || 0}%)`, margin, y);
            doc.text(formatIDR(receipt.serviceAmount), margin + width, y, { align: 'right' });
            y += 3.5;
        }

        if (receipt.tipAmount) {
            doc.text(`Tip (${receipt.tipPercent || 0}%)`, margin, y);
            doc.text(formatIDR(receipt.tipAmount), margin + width, y, { align: 'right' });
            y += 3.5;
        }

        y += 2;
        doc.setLineDashPattern([1, 1], 0);
        doc.line(margin, y, margin + width, y);
        y += 4;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('GRAND TOTAL', margin, y);
        doc.text(formatIDR(receipt.grandTotal || subtotal), margin + width, y, { align: 'right' });
        y += 7;

        // Split results
        if (receipt.splitResult && receipt.splitResult.length > 0) {
            doc.setFontSize(8);
            doc.text('Pembagian:', margin, y);
            y += 4;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);

            receipt.splitResult.forEach(person => {
                doc.text(person.name, margin, y);
                doc.text(formatIDR(person.amount), margin + width, y, { align: 'right' });
                y += 3.5;
            });
        }
    }

    // Footer
    y += 5;
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('Dibuat dengan SpliBi', 40, y, { align: 'center' });

    return doc;
}

/**
 * Download PDF
 */
export function downloadPDF(receipt, personSplit = null) {
    const doc = generateBillPDF(receipt, personSplit);
    const name = personSplit
        ? `SpliBi_${personSplit.name}_${receipt.storeName || 'bill'}.pdf`
        : `SpliBi_${receipt.storeName || 'bill'}.pdf`;

    doc.save(name.replace(/\s+/g, '_'));
}

/**
 * Share PDF via Web Share API
 */
export async function sharePDF(receipt, personSplit = null) {
    const doc = generateBillPDF(receipt, personSplit);
    const blob = doc.output('blob');
    const name = personSplit
        ? `SpliBi_${personSplit.name}.pdf`
        : `SpliBi_${receipt.storeName || 'bill'}.pdf`;

    const file = new File([blob], name, { type: 'application/pdf' });

    if (navigator.share && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                title: 'SpliBi - Split Bill',
                text: personSplit
                    ? `Hai ${personSplit.name}, ini tagihanmu dari ${receipt.storeName || 'makan bareng'}: ${formatIDR(personSplit.amount)}`
                    : `Detail split bill dari ${receipt.storeName || 'makan bareng'}`,
                files: [file]
            });
            return true;
        } catch (e) {
            if (e.name !== 'AbortError') {
                downloadPDF(receipt, personSplit);
            }
            return false;
        }
    } else {
        downloadPDF(receipt, personSplit);
        return true;
    }
}

function truncate(str, maxLen) {
    if (!str) return '';
    return str.length > maxLen ? str.substring(0, maxLen - 2) + '..' : str;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return dateStr;
    }
}
