const twilio = require('twilio');
const logger = require('../utils/logger');

let twilioClient = null;

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (accountSid && authToken && !accountSid.startsWith('mock_')) {
    if (!twilioClient) {
      twilioClient = twilio(accountSid, authToken);
    }
    return twilioClient;
  }
  return null;
}

/**
 * Sends a real SMS message via Twilio or safely simulates it for zero cost
 */
exports.sendSMS = async ({ to, body }) => {
  if (!to) {
    logger.warn('[SmsService] No destination phone number provided');
    return { success: false, reason: 'No phone number' };
  }

  const client = getTwilioClient();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (client && fromNumber) {
    try {
      const message = await client.messages.create({
        body,
        from: fromNumber,
        to,
      });
      logger.info(`[SmsService Sent] SID: ${message.sid} to ${to}`);
      return { success: true, sid: message.sid };
    } catch (err) {
      console.error('[SmsService Live Error]:', err.message);
      return { success: false, error: err.message };
    }
  }

  // Zero-cost simulated SMS dispatch
  logger.info(`[Simulated SMS Dispatch] To: ${to} | Content: "${body}"`);
  return { success: true, simulated: true };
};

/**
 * Sends a WhatsApp notification via Twilio WhatsApp Sandbox (free) or Production WhatsApp
 */
exports.sendWhatsApp = async ({ to, body }) => {
  if (!to) return { success: false, reason: 'No phone number' };

  const client = getTwilioClient();
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio official sandbox
  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  if (client) {
    try {
      const message = await client.messages.create({
        body,
        from: fromWhatsApp,
        to: formattedTo,
      });
      logger.info(`[WhatsAppService Sent] SID: ${message.sid} to ${formattedTo}`);
      return { success: true, sid: message.sid };
    } catch (err) {
      console.error('[WhatsAppService Live Error]:', err.message);
      return { success: false, error: err.message };
    }
  }

  // Zero-cost simulated WhatsApp dispatch
  logger.info(`[Simulated WhatsApp Dispatch] To: ${formattedTo} | Content: "${body}"`);
  return { success: true, simulated: true };
};

/**
 * Dispatch booking confirmation & reminder SMS
 */
exports.sendBookingSMS = async ({ to, userName, bookingId, stationName, slotTime }) => {
  const formattedTime = new Date(slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const body = `⚡ Aurora Hub: Hi ${userName || 'Driver'}, your 700-Bar H2 refueling slot at ${stationName} is confirmed for ${formattedTime}. Ref #${String(bookingId).slice(-6)}. Drive safely!`;
  
  // Send SMS and WhatsApp in parallel if phone provided
  return Promise.allSettled([
    exports.sendSMS({ to, body }),
    exports.sendWhatsApp({ to, body })
  ]);
};

/**
 * Dispatch urgent SOS alert to station technicians / safety responders
 */
exports.sendEmergencyAlertSMS = async ({ to, requestType, location, userPhone }) => {
  const coords = location?.coordinates ? `${location.coordinates[1].toFixed(4)}, ${location.coordinates[0].toFixed(4)}` : 'Unknown';
  const body = `🚨 [AURORA SOS ALERT]: ${requestType?.toUpperCase() || 'ASSISTANCE'} requested at (${coords}). Driver contact: ${userPhone || 'In-App'}. Please dispatch emergency response!`;

  return Promise.allSettled([
    exports.sendSMS({ to, body }),
    exports.sendWhatsApp({ to, body })
  ]);
};
