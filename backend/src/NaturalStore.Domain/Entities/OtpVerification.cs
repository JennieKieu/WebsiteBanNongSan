namespace NaturalStore.Domain.Entities;

public class OtpVerification
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Otp { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // Register | ForgotPassword
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
    public DateTime CreatedAt { get; set; }
}
