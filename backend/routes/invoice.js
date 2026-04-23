const express = require('express');
const PDFDocument = require('pdfkit');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Download invoice for a subscription/order. Only the owner (user) or admin can download.
router.get(
  '/api/invoice/:orderId/download',
  authenticateToken,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const requester = req.user;

      // Find user who has this orderId in subscription
      const user = await User.findOne({ 'subscription.orderId': orderId });
      if (!user) return res.status(404).json({ message: 'Order not found' });

      // Allow if requester is admin or owner
      if (
        requester.role !== 'admin' &&
        String(requester.userId) !== String(user._id)
      ) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Generate simple invoice PDF
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=invoice_${orderId}.pdf`,
      );

      doc.pipe(res);

      doc.fontSize(20).text('Invoice', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Invoice ID: ${orderId}`);
      doc.text(`Date: ${new Date().toLocaleString()}`);
      doc.moveDown();

      doc.text('Billed To:');
      doc.text(`Name: ${user.name}`);
      doc.text(`Email: ${user.email}`);
      if (user.organization) doc.text(`Organization: ${user.organization}`);
      doc.moveDown();

      const s = user.subscription || {};
      doc.text('Order Details:');
      doc.text(`Plan Duration: ${s.planDuration || 'N/A'}`);
      doc.text(`Amount: ${s.amount ?? '0'}`);
      doc.text(`Payment ID: ${s.paymentId || 'N/A'}`);
      doc.moveDown();

      doc.text('Pricing Breakdown:');
      doc.text(`MRP: ${s.mrp ?? 0}`);
      doc.text(`Discount: ${s.discount ?? 0}`);
      doc.text(`GST: ${s.gst ?? 0}`);
      doc.text(`Total Paid: ${s.amount ?? 0}`);

      doc.end();
    } catch (error) {
      console.error('❌ Error generating invoice:', error);
      res.status(500).json({ message: 'Failed to generate invoice' });
    }
  },
);

module.exports = router;
