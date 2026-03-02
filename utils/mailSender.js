const nodemailer = require("nodemailer");
require("dotenv").config();

const mailSender = async (email, title, body) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,     // e.g. smtp-relay.brevo.com
      port: process.env.MAIL_PORT,     // 587
      secure: false,                  // TLS
      auth: {
        user: process.env.MAIL_USER,  // usually "apikey"
        pass: process.env.MAIL_PASS,  // SMTP key
      },
    });

    const info = await transporter.sendMail({
      from: `"It Mini - By Nitish" <${process.env.MAIL_USER}>`,
      to: email,
      subject: title,
      html: body,
    });

    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Mail error:", error.message);
    throw error;
  }
};

module.exports = mailSender;
