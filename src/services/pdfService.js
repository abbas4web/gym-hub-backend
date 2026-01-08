const PDFDocument = require('pdfkit');

/**
 * Generates a professional PDF receipt for a client.
 * @param {Object} data - The receipt data.
 * @param {string} data.gymName - Name of the gym.
 * @param {string} data.gymAddress - Address of the gym (optional).
 * @param {string} data.gymLogo - URL or path to logo (optional - not implemented for remote URL yet).
 * @param {string} data.clientName - Name of the client.
 * @param {string} data.phone - Client's phone number.
 * @param {string} data.plan - Membership plan.
 * @param {number} data.amount - Amount paid.
 * @param {string} data.startDate - Start date of membership.
 * @param {string} data.endDate - End date of membership.
 * @param {string} data.receiptId - Unique receipt ID.
 * @returns {Promise<Buffer>} - Resolves with the PDF buffer.
 */
const generateReceiptPDF = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- COLORS ---
      const PRIMARY_COLOR = '#2c3e50'; // Dark Blue/Grey
      const ACCENT_COLOR = '#e74c3c';  // Red (Gym Energy)
      const TEXT_COLOR = '#333333';

      // --- HEADER ---
      // Gym Name
      doc.font('Helvetica-Bold').fontSize(24).fillColor(PRIMARY_COLOR)
         .text(data.gymName || 'GYM HUB', 50, 50, { align: 'left' });

      // Receipt Label
      doc.font('Helvetica-Bold').fontSize(20).fillColor(ACCENT_COLOR)
         .text('RECEIPT', 400, 50, { align: 'right' });

      // Gym Address (Static for now, can be passed in)
      doc.font('Helvetica').fontSize(10).fillColor(TEXT_COLOR)
         .text(data.gymAddress || 'Fitness Center, Main Road\nCity, State, 123456', 50, 80, { align: 'left', width: 250 });

      // Receipt Meta (Right aligned)
      doc.text(`Receipt #: ${data.receiptId}`, 400, 80, { align: 'right' });
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 400, 95, { align: 'right' });

      doc.moveDown(3);

      // --- SEPARATOR ---
      doc.moveTo(50, 130).lineTo(550, 130).strokeColor('#aaaaaa').stroke();
      doc.moveDown(2);

      // --- CLIENT DETAILS SECTION ---
      doc.font('Helvetica-Bold').fontSize(12).fillColor(PRIMARY_COLOR).text('BILL TO:', 50, 150);
      doc.font('Helvetica').fontSize(12).fillColor(TEXT_COLOR);
      doc.text(data.clientName, 50, 170);
      doc.text(`Phone: ${data.phone}`, 50, 185);

      // --- TABLE HEADER ---
      const tableTop = 230;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff');
      
      // Draw Header Background
      doc.rect(50, tableTop, 500, 25).fill(PRIMARY_COLOR);
      
      // Header Text
      doc.fillColor('#ffffff');
      doc.text('DESCRIPTION', 60, tableTop + 8);
      doc.text('START DATE', 250, tableTop + 8);
      doc.text('END DATE', 350, tableTop + 8);
      doc.text('AMOUNT', 480, tableTop + 8, { align: 'right', width: 60 });

      // --- TABLE ROWS ---
      const rowTop = tableTop + 25;
      doc.font('Helvetica').fontSize(10).fillColor(TEXT_COLOR);
      
      // Row 1
      doc.text(`Membership - ${data.plan}`, 60, rowTop + 10);
      doc.text(new Date(data.startDate).toLocaleDateString(), 250, rowTop + 10);
      doc.text(new Date(data.endDate).toLocaleDateString(), 350, rowTop + 10);
      doc.text(`₹${data.amount}`, 480, rowTop + 10, { align: 'right', width: 60 });

      // Line below row
      doc.moveTo(50, rowTop + 30).lineTo(550, rowTop + 30).strokeColor('#eeeeee').stroke();

      // --- TOTAL SECTION ---
      const totalTop = rowTop + 40;
      doc.font('Helvetica-Bold').fontSize(14).fillColor(PRIMARY_COLOR);
      doc.text('TOTAL PAID:', 350, totalTop, { align: 'right' });
      doc.text(`₹${data.amount}`, 480, totalTop, { align: 'right', width: 60 });

      // --- FOOTER ---
      const footerTop = 700;
      doc.moveTo(50, footerTop).lineTo(550, footerTop).strokeColor('#aaaaaa').stroke();
      
      doc.fontSize(10).font('Helvetica').fillColor(TEXT_COLOR);
      doc.text('Thank you for choosing us!', 50, footerTop + 15, { align: 'center', width: 500 });
      doc.fontSize(8).fillColor('#777777');
      doc.text('For any queries, please contact the front desk.', 50, footerTop + 30, { align: 'center', width: 500 });
      doc.text('This is a computer-generated receipt and does not require a signature.', 50, footerTop + 45, { align: 'center', width: 500 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateReceiptPDF };
