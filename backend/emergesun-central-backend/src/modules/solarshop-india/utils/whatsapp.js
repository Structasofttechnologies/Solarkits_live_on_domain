const twilio = require("twilio");

const client = twilio(
    process.env.TWILIO_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const sendWhatsAppOTP = async (phone) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await client.messages.create({
      body: `Your OTP is: ${otp}`,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:+91${phone}`,
    });

    return otp;

  } catch (error) {
    console.error("WhatsApp OTP Error:", error.message || error);
    throw new Error("WHATSAPP_OTP_FAILED");
  }
};

module.exports = { sendWhatsAppOTP };