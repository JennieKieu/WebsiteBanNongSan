const bcrypt = require("bcryptjs");
const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { User, OtpVerification } = require("../models");
const { cleanText } = require("./helpers");

function createTokens(user) {
  const payload = { userId: user._id.toString(), role: user.role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

exports.health = asyncHandler(async (_req, res) => {
  res.json({ ok: true, name: "Natural Store API" });
});

exports.register = asyncHandler(async (req, res) => {
  const name = cleanText(req.body.name);
  const email = cleanText(req.body.email)?.toLowerCase();
  const password = req.body.password;
  if (!name || !email || !password)
    throw new AppError("VALIDATION_ERROR", "Vui lòng nhập đủ họ tên, email và mật khẩu", 422);

  const existed = await User.findOne({ email });
  if (existed) throw new AppError("EMAIL_EXISTS", "Email đã được đăng ký", 409);

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role: "Customer", isVerified: false });
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  await OtpVerification.create({
    email,
    otp,
    type: "VERIFY_EMAIL",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  res.status(201).json({
    message: "Register success. Verify OTP",
    data: { userId: user._id, otpPreview: otp },
  });
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  const email = cleanText(req.body.email)?.toLowerCase();
  const otp = cleanText(req.body.otp);
  const row = await OtpVerification.findOne({
    email,
    otp,
    type: "VERIFY_EMAIL",
    expiresAt: { $gt: new Date() },
  });
  if (!row) throw new AppError("OTP_INVALID", "Mã OTP không đúng hoặc đã hết hạn", 400);
  await User.updateOne({ email }, { $set: { isVerified: true } });
  await OtpVerification.deleteMany({ email, type: "VERIFY_EMAIL" });
  res.json({ message: "OTP verified" });
});

exports.login = asyncHandler(async (req, res) => {
  const email = cleanText(req.body.email)?.toLowerCase();
  const password = req.body.password;
  const user = await User.findOne({ email });
  if (!user) throw new AppError("LOGIN_FAILED", "Email hoặc mật khẩu không đúng", 401);
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AppError("LOGIN_FAILED", "Email hoặc mật khẩu không đúng", 401);
  if (!user.isVerified)
    throw new AppError("NOT_VERIFIED", "Vui lòng xác thực OTP trước khi đăng nhập", 403);
  const tokens = createTokens(user);
  user.refreshToken = tokens.refreshToken;
  await user.save();
  res.json({
    message: "Login success",
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    },
  });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken;
  if (!token) throw new AppError("UNAUTHORIZED", "Cần refresh token", 401);
  const payload = verifyRefreshToken(token);
  const user = await User.findById(payload.userId);
  if (!user || user.refreshToken !== token)
    throw new AppError("UNAUTHORIZED", "Refresh token không hợp lệ", 401);
  const tokens = createTokens(user);
  user.refreshToken = tokens.refreshToken;
  await user.save();
  res.json({ data: tokens });
});

exports.logout = asyncHandler(async (req, res) => {
  if (req.user) {
    req.user.refreshToken = "";
    await req.user.save();
  }
  res.json({ message: "Logout success" });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ data: req.user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError("NOT_FOUND", "Không tìm thấy người dùng", 404);
  const { name, phone } = req.body;
  if (name !== undefined) user.name = cleanText(name);
  if (phone !== undefined) user.phone = cleanText(phone);
  await user.save();
  res.json({
    message: "Profile updated",
    data: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
  });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError("NOT_FOUND", "Không tìm thấy người dùng", 404);
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    throw new AppError("VALIDATION", "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới", 400);
  if (newPassword.length < 6)
    throw new AppError("VALIDATION", "Mật khẩu mới phải có ít nhất 6 ký tự", 400);
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw new AppError("WRONG_PASSWORD", "Mật khẩu hiện tại không đúng", 400);
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: "Password changed" });
});
