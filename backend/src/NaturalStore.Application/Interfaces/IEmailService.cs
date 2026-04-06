namespace NaturalStore.Application.Interfaces;

public interface IEmailService
{
    Task SendOtpAsync(string toEmail, string otp, string type, CancellationToken ct = default);
}
