const PDFDocument = require('pdfkit');

/**
 * Generates a professional PDF receipt matching the Green Reference Design.
 */
const generateReceiptPDF = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 0 }); // 0 margin for full-width header
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- COLORS (Green Theme) ---
      const PRIMARY_COLOR = '#4CAF50'; // Bright Green (Reference Image)
      const TEXT_COLOR = '#333333';
      const LIGHT_GREY = '#F5F5F5';
      const BORDER_COLOR = '#E0E0E0';

      // --- 1. FULL WIDTH HEADER (Green Background) ---
      doc.rect(0, 0, 595.28, 140).fill(PRIMARY_COLOR); // A4 width is ~595pt

      // Gym Logo
      if (data.gymLogoBuffer) {
        try {
          // Embed the image centered (50x50 size)
          doc.image(data.gymLogoBuffer, 272, 20, { width: 50, height: 50, fit: [50, 50], align: 'center' });
        } catch (imgErr) {
          console.error('Error embedding logo:', imgErr);
          // Fallback to circle if image is invalid
          doc.circle(297, 45, 25).fill('#ffffff'); 
        }
      } else {
        // Fallback Placeholder
        doc.circle(297, 45, 25).fill('#ffffff'); 
      }
      
      // Gym Name (Centered, White)
      doc.font('Helvetica-Bold').fontSize(22).fillColor('#ffffff')
         .text(data.gymName || 'PARADISE FITNESS', 0, 80, { align: 'center' });
      
      // Subtitle
      doc.font('Helvetica').fontSize(10).fillColor('#E8F5E9')
         .text('Fitness & Wellness Center', 0, 110, { align: 'center' });


      // --- 2. RECEIPT ID SECTION (Centered below header) ---
      const contentStartY = 160;
      doc.font('Helvetica').fontSize(9).fillColor('#888888')
         .text('RECEIPT ID', 0, contentStartY, { align: 'center' });
      
      doc.font('Helvetica-Bold').fontSize(12).fillColor(TEXT_COLOR)
         .text(data.receiptId, 0, contentStartY + 15, { align: 'center' });
      
      // Dotted Line Separator
      doc.moveTo(50, contentStartY + 40).lineTo(545, contentStartY + 40)
         .dash(3, { space: 3 })
         .strokeColor(BORDER_COLOR).stroke();


      // --- 3. BIG AMOUNT (Centered) ---
      const amountY = contentStartY + 60;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#888888').undash()
         .text('AMOUNT PAID', 0, amountY, { align: 'center' });
      
      doc.font('Helvetica-Bold').fontSize(36).fillColor(PRIMARY_COLOR)
         .text(`₹${data.amount.toLocaleString('en-IN')}`, 0, amountY + 20, { align: 'center' });
      
      doc.font('Helvetica').fontSize(10).fillColor('#888888')
         .text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), 0, amountY + 65, { align: 'center' });


      // --- 4. SECTIONS (Client & Membership) ---
      
      const drawSectionHeader = (title, y) => {
        doc.font('Helvetica-Bold').fontSize(11).fillColor(TEXT_COLOR)
           .text(title, 50, y);
        // Green Underline
        doc.rect(50, y + 18, 495, 2).fill(PRIMARY_COLOR);
      };

      const drawRow = (label, value, y, isBoldValue = false) => {
        doc.font('Helvetica').fontSize(10).fillColor('#666666')
           .text(label, 50, y);
        
        doc.font(isBoldValue ? 'Helvetica-Bold' : 'Helvetica').fontSize(10).fillColor(TEXT_COLOR)
           .text(value, 50, y, { align: 'right', width: 495 });
      };

      // -- Client Details --
      let currentY = 320;
      drawSectionHeader('Client Details', currentY);
      currentY += 35;
      drawRow('Name', data.clientName, currentY);
      currentY += 25;
      drawRow('Phone', data.phone, currentY);
      
      // -- Membership Details --
      currentY += 50;
      drawSectionHeader('Membership Details', currentY);
      currentY += 35;
      
      // Membership Type Badge (Optional visual flair)
      drawRow('Plan', data.plan.toUpperCase(), currentY, true);
      currentY += 25;
      
      const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      };

      drawRow('Start Date', formatDate(data.startDate), currentY);
      currentY += 25;
      drawRow('End Date', formatDate(data.endDate), currentY);
      currentY += 25;

      // -- Payment Summary --
      currentY += 50;
      drawSectionHeader('Payment Summary', currentY);
      currentY += 35;
      drawRow('Membership Fee', `₹${data.amount.toLocaleString('en-IN')}`, currentY);
      currentY += 25;
      drawRow('Tax (0%)', '₹0', currentY);
      
      
      // --- 5. TOTAL BAR (Green Background at bottom of content) ---
      const totalBarY = currentY + 40;
      doc.rect(50, totalBarY, 495, 40).fill('#F1F8E9'); // Light Green Background
      
      doc.font('Helvetica-Bold').fontSize(12).fillColor(TEXT_COLOR)
         .text('Total Paid', 70, totalBarY + 14);
      
      doc.font('Helvetica-Bold').fontSize(14).fillColor(PRIMARY_COLOR)
         .text(`₹${data.amount.toLocaleString('en-IN')}`, 70, totalBarY + 12, { align: 'right', width: 455 });


      // --- FOOTER ---
      const footerY = 750;
      doc.font('Helvetica-Bold').fontSize(10).fillColor(TEXT_COLOR)
         .text('Thank you for your payment!', 0, footerY, { align: 'center' });
      
      doc.font('Helvetica').fontSize(8).fillColor('#999999')
         .text('This is a computer-generated receipt. No signature required.', 0, footerY + 15, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateReceiptPDF };
