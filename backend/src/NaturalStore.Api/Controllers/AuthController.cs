using Microsoft.AspNetCore.Mvc;
using NaturalStore.Application.Interfaces;

namespace NaturalStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req, CancellationToken ct)
    {
        var (ok, err) = await _auth.RegisterAsync(req.FirstName, req.LastName, req.Email, req.Phone, req.Password, ct);
        if (!ok) return BadRequest(new { error = err });
        return Ok(new { message = "Đăng ký thành công. Vui lòng xác thực OTP qua email." });
    }

    [HttpPost("send-otp")]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest req, CancellationToken ct)
    {
        var err = await _auth.SendOtpAsync(req.Email, req.Type, ct);
        if (err != null) return BadRequest(new { error = err });
        return Ok(new { message = "Đã gửi OTP qua email." });
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest req, CancellationToken ct)
    {
        var (ok, err) = await _auth.VerifyOtpAsync(req.Email, req.Otp, req.Type, ct);
        if (!ok) return BadRequest(new { error = err });
        return Ok(new { message = "Xác thực thành công." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req, CancellationToken ct)
    {
        var token = await _auth.LoginAsync(req.Email, req.Password, ct);
        if (token == null) return Unauthorized(new { error = "Email hoặc mật khẩu không đúng." });
        return Ok(new { token });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req, CancellationToken ct)
    {
        var (ok, err) = await _auth.ForgotPasswordAsync(req.Email, ct);
        if (!ok) return BadRequest(new { error = err });
        return Ok(new { message = "Đã gửi OTP qua email." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req, CancellationToken ct)
    {
        var (ok, err) = await _auth.ResetPasswordAsync(req.Email, req.Otp, req.NewPassword, ct);
        if (!ok) return BadRequest(new { error = err });
        return Ok(new { message = "Đặt lại mật khẩu thành công." });
    }
}

public record RegisterRequest(string FirstName, string LastName, string Email, string Phone, string Password);
public record SendOtpRequest(string Email, string Type);
public record VerifyOtpRequest(string Email, string Otp, string Type);
public record LoginRequest(string Email, string Password);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Email, string Otp, string NewPassword);
