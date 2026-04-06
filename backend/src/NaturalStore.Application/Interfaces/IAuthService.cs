namespace NaturalStore.Application.Interfaces;

public interface IAuthService
{
    Task<(bool Ok, string? Error)> RegisterAsync(string firstName, string lastName, string email, string phone, string password, CancellationToken ct = default);
    Task<string?> SendOtpAsync(string email, string type, CancellationToken ct = default); // type: Register | ForgotPassword
    Task<(bool Ok, string? Error)> VerifyOtpAsync(string email, string otp, string type, CancellationToken ct = default);
    Task<string?> LoginAsync(string email, string password, CancellationToken ct = default); // returns JWT
    Task<(bool Ok, string? Error)> ForgotPasswordAsync(string email, CancellationToken ct = default);
    Task<(bool Ok, string? Error)> ResetPasswordAsync(string email, string otp, string newPassword, CancellationToken ct = default);
}
