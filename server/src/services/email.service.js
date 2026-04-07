const nodemailer = require("nodemailer");
const env = require("../config/env");

let _transporter = null;

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465, // true for 465, false for 587 (STARTTLS)
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
  }
  return _transporter;
}

/**
 * Gửi OTP xác thực email khi đăng ký tài khoản
 */
async function sendVerifyOtp(toEmail, otp) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Natural Store" <${env.smtpUser}>`,
    to: toEmail,
    subject: "Mã xác thực tài khoản Natural Store",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px;">
        <h2 style="color:#2e7d32;margin-bottom:8px;">Natural Store 🌿</h2>
        <p style="color:#555;">Xin chào,</p>
        <p style="color:#555;">Đây là mã OTP xác thực tài khoản của bạn:</p>
        <div style="text-align:center;margin:24px 0;">
          <span style="display:inline-block;font-size:36px;font-weight:bold;letter-spacing:12px;color:#2e7d32;background:#f1f8e9;padding:16px 32px;border-radius:8px;">${otp}</span>
        </div>
        <p style="color:#888;font-size:13px;">Mã có hiệu lực trong <strong>10 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
        <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;"/>
        <p style="color:#bbb;font-size:12px;">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.</p>
      </div>
    `,
  });
}

/**
 * Gửi OTP đặt lại mật khẩu
 */
async function sendResetPasswordOtp(toEmail, otp) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Natural Store" <${env.smtpUser}>`,
    to: toEmail,
    subject: "Đặt lại mật khẩu Natural Store",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px;">
        <h2 style="color:#2e7d32;margin-bottom:8px;">Natural Store 🌿</h2>
        <p style="color:#555;">Xin chào,</p>
        <p style="color:#555;">Bạn vừa yêu cầu đặt lại mật khẩu. Đây là mã OTP của bạn:</p>
        <div style="text-align:center;margin:24px 0;">
          <span style="display:inline-block;font-size:36px;font-weight:bold;letter-spacing:12px;color:#e65100;background:#fff3e0;padding:16px 32px;border-radius:8px;">${otp}</span>
        </div>
        <p style="color:#888;font-size:13px;">Mã có hiệu lực trong <strong>10 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
        <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;"/>
        <p style="color:#bbb;font-size:12px;">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.</p>
      </div>
    `,
  });
}

module.exports = { sendVerifyOtp, sendResetPasswordOtp };
