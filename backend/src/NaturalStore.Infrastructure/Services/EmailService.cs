using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;
using NaturalStore.Application.Interfaces;

namespace NaturalStore.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config) => _config = config;

    public async Task SendOtpAsync(string toEmail, string otp, string type, CancellationToken ct = default)
    {
        var host = _config["EmailSettings:SmtpHost"];
        var port = int.Parse(_config["EmailSettings:SmtpPort"] ?? "587");
        var user = _config["EmailSettings:SmtpUser"];
        var pass = _config["EmailSettings:SmtpPassword"];
        var fromEmail = _config["EmailSettings:FromEmail"] ?? user;
        var fromName = _config["EmailSettings:FromName"] ?? "Natural Store";

        if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(user))
        {
            Console.WriteLine($"[Email] SMTP chưa cấu hình. To: {toEmail} | OTP: {otp}");
            return;
        }

        var subject = type == "Register" ? "Xác thực đăng ký - Natural Store" : "Đặt lại mật khẩu - Natural Store";
        var body = $"<p>Mã OTP của bạn: <strong>{otp}</strong></p><p>Mã có hiệu lực 10 phút.</p><p>Natural Store</p>";

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, fromEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = body };

        using var client = new SmtpClient();
        await client.ConnectAsync(host, port, SecureSocketOptions.StartTls, ct);
        if (!string.IsNullOrEmpty(user))
            await client.AuthenticateAsync(user, pass, ct);
        await client.SendAsync(message, ct);
        await client.DisconnectAsync(true, ct);
    }
}
