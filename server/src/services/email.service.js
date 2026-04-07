const nodemailer = require("nodemailer");
const env = require("../config/env");

let _transporter = null;

/** Gmail App Password thường có dấu cách — bỏ khoảng trắng để tránh lỗi auth trên một số host */
function smtpPassNormalized() {
  return String(env.smtpPass || "").replace(/\s+/g, "");
}

function assertSmtpConfigured() {
  const pass = smtpPassNormalized();
  if (!env.smtpHost?.trim() || !env.smtpUser?.trim() || !pass) {
    const err = new Error(
      "SMTP chưa cấu hình đầy đủ. Trên Render: thêm SMTP_HOST, SMTP_USER, SMTP_PASS (mật ứng dụng Gmail 16 ký tự)."
    );
    err.code = "SMTP_NOT_CONFIGURED";
    throw err;
  }
}

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport(buildTransportOptions());
  }
  return _transporter;
}

function resetTransporter() {
  _transporter = null;
}

/** smtp.gmail.com → dùng preset Gmail (465 SSL), thường ổn định hơn 587 STARTTLS trên Render */
function isGmailSmtpHost() {
  const h = String(env.smtpHost || "")
    .trim()
    .toLowerCase();
  return h === "smtp.gmail.com" || h === "gmail";
}

function buildTransportOptions() {
  const pass = smtpPassNormalized();
  const user = env.smtpUser.trim();

  const longTimeouts = {
    pool: false,
    connectionTimeout: 45_000,
    greetingTimeout: 45_000,
    socketTimeout: 60_000,
  };

  if (isGmailSmtpHost()) {
    return {
      service: "gmail",
      auth: { user, pass },
      ...longTimeouts,
    };
  }

  const host = env.smtpHost.trim();
  const port = env.smtpPort;
  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    ...longTimeouts,
    requireTLS: port === 587,
    tls: {
      minVersion: "TLSv1.2",
      servername: host,
    },
  };
}

/**
 * Chuyển lỗi nodemailer → HTTP status + message tiếng Việt (để client không chỉ thấy "500").
 */
function getSmtpFailureInfo(err) {
  if (!err) {
    return {
      status: 500,
      code: "MAIL_ERROR",
      message: "Gửi email thất bại (không rõ lý do).",
    };
  }
  if (err.code === "SMTP_NOT_CONFIGURED") {
    return {
      status: 503,
      code: "MAIL_ERROR",
      message:
        "Máy chủ chưa cấu hình gửi email (SMTP). Trên Render: Environment → thêm SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (mật ứng dụng Gmail 16 ký tự).",
    };
  }

  const c = err.code;
  const rc = err.responseCode;

  if (c === "EAUTH" || rc === 535 || rc === 534) {
    return {
      status: 500,
      code: "MAIL_ERROR",
      message:
        "SMTP từ chối đăng nhập: sai tài khoản gửi hoặc mật ứng dụng Gmail. Kiểm tra SMTP_USER và SMTP_PASS trên Render (bật 2FA Gmail → tạo mật ứng dụng, không dùng mật khẩu đăng nhập thường).",
    };
  }

  if (c === "ETIMEDOUT" || c === "ECONNRESET" || c === "ESOCKET" || c === "ECONNREFUSED") {
    return {
      status: 503,
      code: "MAIL_ERROR",
      message:
        "Không kết nối được máy chủ SMTP (timeout). Với Gmail: đặt SMTP_HOST=smtp.gmail.com (code đã dùng cổng 465 SSL). Đảm bảo SMTP_USER và mật ứng dụng Gmail đúng. Nếu vẫn lỗi, thử dịch vụ gửi mail khác (Resend, Brevo).",
    };
  }

  if (c === "ETLS" || c === "ERR_TLS") {
    return {
      status: 503,
      code: "MAIL_ERROR",
      message: "Lỗi TLS khi gửi mail. Thử đặt SMTP_PORT=465 (SSL) trên Render.",
    };
  }

  if (c === "EMESSAGE" || rc === 550 || rc === 552) {
    return {
      status: 500,
      code: "MAIL_ERROR",
      message: "Máy chủ mail từ chối gửi (địa chỉ người nhận hoặc chính sách gửi).",
    };
  }

  const short = err.message ? String(err.message).slice(0, 240) : "";
  return {
    status: 500,
    code: "MAIL_ERROR",
    message: short
      ? `Gửi email thất bại: ${short}`
      : "Gửi email thất bại. Kiểm tra log API trên Render (dòng [Email]).",
  };
}

/**
 * Gửi OTP xác thực email khi đăng ký tài khoản
 */
async function sendVerifyOtp(toEmail, otp) {
  assertSmtpConfigured();
  const transporter = getTransporter();
  try {
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
  } catch (e) {
    resetTransporter();
    throw e;
  }
}

/**
 * Gửi OTP đặt lại mật khẩu
 */
async function sendResetPasswordOtp(toEmail, otp) {
  assertSmtpConfigured();
  const transporter = getTransporter();
  try {
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
  } catch (e) {
    resetTransporter();
    throw e;
  }
}

module.exports = { sendVerifyOtp, sendResetPasswordOtp, getSmtpFailureInfo };
