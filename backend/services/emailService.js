const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let cachedTransporter = null;

/**
 * Initializes and returns a resilient nodemailer transporter.
 * Works with free Gmail App Passwords, Resend/SendGrid SMTP, or auto Ethereal test accounts.
 */
async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  // 1. If custom SMTP or Gmail credentials exist in environment
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    cachedTransporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    return cachedTransporter;
  }

  // 2. If dedicated SMTP Host/Port provided (e.g., SendGrid, Mailtrap, Resend SMTP, AWS SES)
  if (process.env.SMTP_HOST) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return cachedTransporter;
  }

  // 3. 100% Free Development/Testing fallback: Ethereal test SMTP
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info(`[EmailService] Using free testing Ethereal SMTP account: ${testAccount.user}`);
    return cachedTransporter;
  } catch (err) {
    logger.warn('[EmailService] Could not establish test transporter, falling back to simulated logger:', err.message);
    return null;
  }
}

/**
 * Helper to dispatch email with automatic logging and preview link generation
 */
async function dispatchEmail({ to, subject, htmlText, fallbackText }) {
  const fromAddress = process.env.EMAIL_FROM || '"Aurora Hydrogen Network" <no-reply@aurorahub.energy>';
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      logger.info(`[Simulated Email Dispatch] To: ${to} | Subject: "${subject}"\n${fallbackText}`);
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: fallbackText,
      html: htmlText,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`[EmailService Preview URL]: 🔗 ${previewUrl}`);
    } else {
      logger.info(`[EmailService Sent] MessageId: ${info.messageId} to ${to}`);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error('[EmailService Error]:', error.message);
    return { success: false, error: error.message };
  }
}

// -------------------------------------------------------------
// 1. BOOKING CONFIRMATION EMAIL
// -------------------------------------------------------------
exports.sendBookingConfirmation = async ({ to, userName, bookingId, stationName, stationAddress, slotTime, dispenserNozzle, hydrogenPrice }) => {
  const formattedTime = new Date(slotTime).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `Confirmed: Hydrogen Refueling Reservation (#${String(bookingId).slice(-6)})`;
  
  const htmlText = `
    <div style="background-color: #0b0f19; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(6, 182, 212, 0.2);">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: #000; font-weight: 800; font-size: 11px; padding: 4px 12px; border-radius: 20px; letter-spacing: 1px; text-transform: uppercase;">
          Zero Emission Energy
        </span>
        <h1 style="color: #ffffff; margin: 15px 0 5px; font-size: 24px; font-weight: 800;">Refueling Slot Confirmed</h1>
        <p style="color: #9ca3af; margin: 0; font-size: 14px;">Booking Reference: <strong style="color: #06b6d4;">#${bookingId}</strong></p>
      </div>

      <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="margin: 0 0 16px; font-size: 15px; color: #e5e7eb;">Hello <strong>${userName || 'Valued Driver'}</strong>,</p>
        <p style="margin: 0 0 20px; font-size: 14px; color: #9ca3af; line-height: 1.5;">
          Your pressurized green hydrogen dispenser reservation has been locked into the Aurora Smart Grid. Please arrive within 10 minutes of your scheduled slot.
        </p>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="border-bottom: 1px solid #1f2937;">
            <td style="padding: 10px 0; color: #9ca3af;">Station</td>
            <td style="padding: 10px 0; font-weight: 600; text-align: right; color: #ffffff;">${stationName || 'Aurora Hub'}</td>
          </tr>
          ${stationAddress ? `
          <tr style="border-bottom: 1px solid #1f2937;">
            <td style="padding: 10px 0; color: #9ca3af;">Address</td>
            <td style="padding: 10px 0; text-align: right; color: #d1d5db;">${stationAddress}</td>
          </tr>` : ''}
          <tr style="border-bottom: 1px solid #1f2937;">
            <td style="padding: 10px 0; color: #9ca3af;">Reserved Time</td>
            <td style="padding: 10px 0; font-weight: 600; text-align: right; color: #06b6d4;">${formattedTime}</td>
          </tr>
          <tr style="border-bottom: 1px solid #1f2937;">
            <td style="padding: 10px 0; color: #9ca3af;">Dispenser Nozzle</td>
            <td style="padding: 10px 0; font-weight: 600; text-align: right; color: #ffffff;">${dispenserNozzle || '700-Bar H2 Dual'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #9ca3af;">Base Rate</td>
            <td style="padding: 10px 0; font-weight: 600; text-align: right; color: #10b981;">₹${hydrogenPrice || 82} / kg</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 24px;">
        <p style="margin: 0 0 6px;">Safety Tip: Ensure vehicle is powered off and grounding clamp is engaged prior to refueling.</p>
        <p style="margin: 0;">Aurora Clean Energy Network &bull; Automated Fuel Dispatch</p>
      </div>
    </div>
  `;

  return dispatchEmail({
    to,
    subject,
    htmlText,
    fallbackText: `Your hydrogen refueling booking (#${bookingId}) at ${stationName} is confirmed for ${formattedTime}. Rate: ₹${hydrogenPrice || 82}/kg.`
  });
};

// -------------------------------------------------------------
// 2. TAX INVOICE & REFUEL RECEIPT EMAIL
// -------------------------------------------------------------
exports.sendInvoiceEmail = async ({ to, userName, invoiceNumber, stationName, dispenserNozzle, amount, quantityKg, pricePerKg, paymentMethod, transactionDate }) => {
  const subject = `Refuel Tax Invoice & Receipt: ₹${amount} (#${String(invoiceNumber).slice(-8)})`;
  const formattedDate = new Date(transactionDate || Date.now()).toLocaleString();

  const htmlText = `
    <div style="background-color: #0b0f19; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(16, 185, 129, 0.3);">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1f2937; padding-bottom: 20px; margin-bottom: 24px;">
        <div>
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">AURORA HYDROGEN</h2>
          <p style="color: #10b981; margin: 4px 0 0; font-size: 12px; font-weight: 600;">OFFICIAL SETTLEMENT RECEIPT</p>
        </div>
        <div style="text-align: right;">
          <p style="color: #9ca3af; margin: 0; font-size: 11px;">INVOICE ID</p>
          <p style="color: #ffffff; margin: 2px 0 0; font-size: 13px; font-weight: 700; font-family: monospace;">#${invoiceNumber}</p>
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <p style="margin: 0; color: #9ca3af; font-size: 13px;">Billed To:</p>
        <p style="margin: 4px 0 0; color: #ffffff; font-size: 15px; font-weight: 600;">${userName || 'Customer'}</p>
        <p style="margin: 2px 0 0; color: #6b7280; font-size: 13px;">${to}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
        <thead>
          <tr style="background-color: #111827; color: #9ca3af; text-align: left;">
            <th style="padding: 10px 12px; border-radius: 6px 0 0 6px;">Item Description</th>
            <th style="padding: 10px 12px; text-align: center;">Qty</th>
            <th style="padding: 10px 12px; text-align: right;">Rate</th>
            <th style="padding: 10px 12px; text-align: right; border-radius: 0 6px 6px 0;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #1f2937;">
            <td style="padding: 14px 12px; color: #ffffff;">
              <strong>High-Purity Green Hydrogen (H2)</strong><br/>
              <span style="font-size: 12px; color: #9ca3af;">${stationName || 'Aurora Hub'} &bull; ${dispenserNozzle || '700-Bar'}</span>
            </td>
            <td style="padding: 14px 12px; text-align: center; color: #06b6d4; font-weight: 600;">${quantityKg || '5.00'} kg</td>
            <td style="padding: 14px 12px; text-align: right; color: #d1d5db;">₹${pricePerKg || '82.00'}</td>
            <td style="padding: 14px 12px; text-align: right; font-weight: 700; color: #10b981;">₹${amount}</td>
          </tr>
        </tbody>
      </table>

      <div style="background-color: #111827; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
          <span style="color: #9ca3af;">Payment Method</span>
          <span style="color: #ffffff; text-transform: uppercase; font-weight: 600;">${paymentMethod || 'Wallet / Card'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
          <span style="color: #9ca3af;">Timestamp</span>
          <span style="color: #d1d5db;">${formattedDate}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; border-top: 1px solid #1f2937; padding-top: 10px; margin-top: 8px;">
          <span style="color: #ffffff;">Total Settled</span>
          <span style="color: #10b981;">₹${amount}</span>
        </div>
      </div>

      <div style="text-align: center; color: #6b7280; font-size: 12px;">
        <p style="margin: 0 0 4px;">Thank you for driving clean and accelerating zero-emission transport!</p>
        <p style="margin: 0;">For tax compliance and billing inquiries, visit our support center.</p>
      </div>
    </div>
  `;

  return dispatchEmail({
    to,
    subject,
    htmlText,
    fallbackText: `Aurora Hydrogen Invoice #${invoiceNumber}: ₹${amount} settled successfully for ${quantityKg || 5}kg at ${stationName}.`
  });
};

// -------------------------------------------------------------
// 3. PASSWORD RESET & SECURITY OTP EMAIL
// -------------------------------------------------------------
exports.sendPasswordResetOTP = async ({ to, userName, otpCode, expiryMinutes = 15 }) => {
  const subject = `Your Aurora Security Verification Code: ${otpCode}`;

  const htmlText = `
    <div style="background-color: #0b0f19; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; max-width: 540px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(239, 68, 68, 0.3);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #ffffff; margin: 0 0 8px; font-size: 22px; font-weight: 800;">Password Recovery Request</h2>
        <p style="color: #9ca3af; margin: 0; font-size: 14px;">Aurora Clean Energy Authentication Shield</p>
      </div>

      <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="color: #d1d5db; margin: 0 0 16px; font-size: 14px;">
          Hello ${userName || 'User'}, use the one-time verification passcode below to reset your Aurora password.
        </p>

        <div style="background: rgba(6, 182, 212, 0.1); border: 2px dashed #06b6d4; border-radius: 8px; padding: 18px; display: inline-block; margin: 0 auto 16px;">
          <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #06b6d4;">
            ${otpCode}
          </span>
        </div>

        <p style="color: #ef4444; font-size: 12px; margin: 0; font-weight: 600;">
          Expires in ${expiryMinutes} minutes. Never share this code with anyone.
        </p>
      </div>

      <div style="text-align: center; color: #6b7280; font-size: 12px;">
        <p style="margin: 0 0 4px;">If you did not request this password reset, please change your credentials immediately or contact station security.</p>
      </div>
    </div>
  `;

  return dispatchEmail({
    to,
    subject,
    htmlText,
    fallbackText: `Your Aurora Hydrogen verification code is: ${otpCode}. It expires in ${expiryMinutes} minutes.`
  });
};
