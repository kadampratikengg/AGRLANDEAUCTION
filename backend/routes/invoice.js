const express = require('express');
const PDFDocument = require('pdfkit');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const COMPANY_DETAILS = {
  name: 'VotingHUb',
  address: '266 Arale Satara 415011',
  phone: '9404360234',
  email: 'support@votinghub.com',
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-IN');
};

const formatCurrency = (value) => {
  const amount = Number(value ?? 0) / 100;
  return `INR ${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatCurrencyRupees = (value) => {
  const amount = Number(value ?? 0);
  return `INR ${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getSubscriptionStatus = (subscription) => {
  const endDate = subscription?.endDate ? new Date(subscription.endDate) : null;
  if (!endDate || Number.isNaN(endDate.getTime())) return 'N/A';
  return endDate >= new Date() ? 'Active' : 'Expired';
};

const resolveSubscriptionRecord = (user, orderId) => {
  const currentSubscription = user.subscription || {};
  if (currentSubscription.orderId === orderId) {
    return currentSubscription;
  }

  return (user.subscriptionHistory || []).find(
    (subscription) => subscription.orderId === orderId,
  );
};

const drawTable = (doc, startX, startY, tableWidth, rows) => {
  const labelWidth = Math.floor(tableWidth * 0.34);
  const valueWidth = tableWidth - labelWidth;
  const rowHeight = 24;
  let currentY = startY;

  rows.forEach((row, index) => {
    const isHeader = index === 0;

    if (isHeader) {
      doc
        .save()
        .rect(startX, currentY, tableWidth, rowHeight)
        .fill('#F3F4F6')
        .restore();
    }

    doc
      .lineWidth(1)
      .rect(startX, currentY, labelWidth, rowHeight)
      .stroke('#D1D5DB')
      .rect(startX + labelWidth, currentY, valueWidth, rowHeight)
      .stroke('#D1D5DB');

    doc
      .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(10)
      .fillColor('#111827')
      .text(row[0], startX + 8, currentY + 7, {
        width: labelWidth - 16,
      })
      .text(row[1], startX + labelWidth + 8, currentY + 7, {
        width: valueWidth - 16,
        align: 'right',
      });

    currentY += rowHeight;
  });

  return currentY;
};

const drawPricingTable = (doc, startX, startY, tableWidth, rows) => {
  const descriptionWidth = Math.floor(tableWidth * 0.48);
  const amountWidth = Math.floor(tableWidth * 0.26);
  const gstWidth = tableWidth - descriptionWidth - amountWidth;
  const rowHeight = 26;
  let currentY = startY;

  rows.forEach((row, index) => {
    const isHeader = index === 0;
    const isEmphasisRow = row[3] === true;

    if (isHeader) {
      doc
        .save()
        .rect(startX, currentY, tableWidth, rowHeight)
        .fill('#F3F4F6')
        .restore();
    }

    doc
      .lineWidth(1)
      .rect(startX, currentY, descriptionWidth, rowHeight)
      .stroke('#D1D5DB')
      .rect(startX + descriptionWidth, currentY, amountWidth, rowHeight)
      .stroke('#D1D5DB')
      .rect(
        startX + descriptionWidth + amountWidth,
        currentY,
        gstWidth,
        rowHeight,
      )
      .stroke('#D1D5DB');

    const rowFont = isHeader || isEmphasisRow ? 'Helvetica-Bold' : 'Helvetica';
    doc
      .font(rowFont)
      .fontSize(10)
      .fillColor('#111827')
      .text(row[0], startX + 8, currentY + 8, {
        width: descriptionWidth - 16,
      })
      .text(row[1], startX + descriptionWidth + 8, currentY + 8, {
        width: amountWidth - 16,
        align: 'right',
      })
      .text(row[2], startX + descriptionWidth + amountWidth + 8, currentY + 8, {
        width: gstWidth - 16,
        align: 'right',
      });

    currentY += rowHeight;
  });

  return currentY;
};

const drawAmountBreakdown = (doc, startX, startY, tableWidth, rows) => {
  const labelWidth = Math.floor(tableWidth * 0.54);
  const valueWidth = tableWidth - labelWidth;
  const rowHeight = 22;
  let currentY = startY;

  rows.forEach((row) => {
    const isBold = row[2] === true;

    doc
      .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(10)
      .fillColor('#111827')
      .text(row[0], startX, currentY, {
        width: labelWidth,
      })
      .text(row[1], startX + labelWidth, currentY, {
        width: valueWidth,
        align: 'right',
      });

    currentY += rowHeight;
  });

  return currentY;
};

router.get(
  '/api/invoice/:orderId/download',
  authenticateToken,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const requester = req.user;

      let user = null;

      if (requester.role === 'admin') {
        user = await User.findOne({
          $or: [
            { 'subscription.orderId': orderId },
            { 'subscriptionHistory.orderId': orderId },
          ],
        });
      } else {
        user = await User.findById(requester.userId);
      }

      if (!user) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (
        requester.role !== 'admin' &&
        String(requester.userId) !== String(user._id)
      ) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const subscription = resolveSubscriptionRecord(user, orderId);
      if (!subscription) {
        return res
          .status(404)
          .json({ message: 'Subscription invoice not found' });
      }

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=invoice_${orderId}.pdf`,
      );

      doc.pipe(res);

      const pageWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const leftX = doc.page.margins.left;
      const rightX = leftX + pageWidth / 2 + 20;
      const columnWidth = pageWidth / 2 - 20;

      doc
        .font('Helvetica-Bold')
        .fontSize(24)
        .fillColor('#111827')
        .text('TAX INVOICE', leftX, 50);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#4B5563')
        .text(`Invoice No: ${orderId}`, leftX, 84)
        .text(`Generated On: ${formatDate(new Date())}`, leftX, 98)
        .text(`Status: ${getSubscriptionStatus(subscription)}`, leftX, 112);

      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#111827')
        .text('Issued By', rightX, 50, { width: columnWidth });
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#374151')
        .text(COMPANY_DETAILS.name, rightX, 72, { width: columnWidth })
        .text(COMPANY_DETAILS.address, rightX, 86, { width: columnWidth })
        .text(`Phone: ${COMPANY_DETAILS.phone}`, rightX, 114, {
          width: columnWidth,
        })
        .text(`Email: ${COMPANY_DETAILS.email}`, rightX, 128, {
          width: columnWidth,
        });

      doc
        .moveTo(leftX, 160)
        .lineTo(leftX + pageWidth, 160)
        .lineWidth(1)
        .stroke('#E5E7EB');

      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#111827')
        .text('Bill To', leftX, 180);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#374151')
        .text(user.name || 'N/A', leftX, 202, { width: columnWidth })
        .text(user.organization || 'N/A', leftX, 216, { width: columnWidth })
        .text(user.address || 'N/A', leftX, 230, { width: columnWidth })
        .text(
          [user.district, user.state, user.pincode]
            .filter(Boolean)
            .join(', ') || 'N/A',
          leftX,
          258,
          { width: columnWidth },
        )
        .text(`Phone: ${user.phone || user.contact || 'N/A'}`, leftX, 286, {
          width: columnWidth,
        })
        .text(`Email: ${user.email || 'N/A'}`, leftX, 300, {
          width: columnWidth,
        })
        .text(`GSTIN: ${user.gstNumber || 'N/A'}`, leftX, 314, {
          width: columnWidth,
        });

      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#111827')
        .text('Subscription Details', rightX, 180, { width: columnWidth });
      const totalPaidRupees = Number(subscription.amount ?? 0) / 100;
      const gstRupees = Number(subscription.gst ?? 0);
      const discountedPriceRupees = Math.max(0, totalPaidRupees - gstRupees);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#374151')
        .text(`Plan: ${subscription.planDuration || 'N/A'}`, rightX, 202, {
          width: columnWidth,
        })
        .text(
          `Start Date: ${formatDate(subscription.startDate)}`,
          rightX,
          216,
          {
            width: columnWidth,
          },
        )
        .text(`End Date: ${formatDate(subscription.endDate)}`, rightX, 230, {
          width: columnWidth,
        })
        .text(`Payment ID: ${subscription.paymentId || 'N/A'}`, rightX, 244, {
          width: columnWidth,
        })
        .text(`Order ID: ${subscription.orderId || 'N/A'}`, rightX, 258, {
          width: columnWidth,
        });

      const pricingRows = [
        ['Description', 'Amount', 'GST 18%'],
        [
          subscription.planDuration || 'Voting Subscription',
          formatCurrencyRupees(subscription.mrp),
          formatCurrencyRupees(subscription.gst),
          true,
        ],
      ];

      let nextY = 360;
      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#111827')
        .text('Invoice Summary', leftX, nextY);
      nextY = drawPricingTable(doc, leftX, nextY + 24, pageWidth, pricingRows);

      const breakdownRows = [
        ['Amount', formatCurrencyRupees(subscription.mrp)],
        ['Discount', formatCurrencyRupees(subscription.discount)],
        ['Final Amount', formatCurrencyRupees(discountedPriceRupees), true],
        ['Total Paid', formatCurrency(subscription.amount), true],
      ];
      const breakdownWidth = 260;
      const breakdownX = leftX + pageWidth - breakdownWidth;

      nextY += 18;
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#111827')
        .text('Calculation', breakdownX, nextY, {
          width: breakdownWidth,
          align: 'right',
        });
      nextY = drawAmountBreakdown(
        doc,
        breakdownX,
        nextY + 18,
        breakdownWidth,
        breakdownRows,
      );

      nextY += 10;
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#4B5563')
        .text(
          'This invoice was generated from the subscription record associated with this account.',
          leftX,
          nextY,
          { width: pageWidth },
        );

      nextY += 50;
      const signBlockWidth = 180;
      const signX = leftX + pageWidth - signBlockWidth;

      doc
        .moveTo(signX, nextY)
        .lineTo(signX + signBlockWidth, nextY)
        .lineWidth(1)
        .stroke('#9CA3AF');
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#111827')
        .text('Authorized Signatory', signX, nextY + 8, {
          width: signBlockWidth,
          align: 'center',
        });

      doc
        .lineWidth(1)
        .dash(4, { space: 2 })
        .roundedRect(signX, nextY + 36, signBlockWidth, 44, 8)
        .stroke('#9CA3AF')
        .undash();
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#374151')
        .text('STAMP', signX, nextY + 50, {
          width: signBlockWidth,
          align: 'center',
        });
      doc
        .font('Helvetica')
        .fontSize(9)
        .text(COMPANY_DETAILS.name, signX, nextY + 64, {
          width: signBlockWidth,
          align: 'center',
        });

      doc.end();
    } catch (error) {
      console.error('Error generating invoice:', error);
      res.status(500).json({ message: 'Failed to generate invoice' });
    }
  },
);

module.exports = router;
