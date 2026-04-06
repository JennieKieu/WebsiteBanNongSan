using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using NaturalStore.Application.Interfaces;
using NaturalStore.Domain.Entities;
using NaturalStore.Infrastructure;

namespace NaturalStore.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly MongoDbContext _db;
    private readonly IEmailService _email;
    private readonly IConfiguration _config;
    private const int OtpExpireMinutes = 10;
    private const int OtpLength = 6;

    public AuthService(MongoDbContext db, IEmailService email, IConfiguration config)
    {
        _db = db;
        _email = email;
        _config = config;
    }

    public async Task<(bool Ok, string? Error)> RegisterAsync(string firstName, string lastName, string email, string phone, string password, CancellationToken ct = default)
    {
        var normalized = email.Trim().ToLowerInvariant();
        var existing = await _db.Users.Find(x => x.Email == normalized).FirstOrDefaultAsync(ct);
        if (existing != null)
            return (false, "Email đã được đăng ký");

        var hash = BCrypt.Net.BCrypt.HashPassword(password);
        var user = new User
        {
            Id = Guid.NewGuid().ToString("N"),
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            Email = normalized,
            Phone = phone.Trim(),
            PasswordHash = hash,
            IsEmailVerified = false,
            Role = "User",
            CreatedAt = DateTime.UtcNow
        };
        await _db.Users.InsertOneAsync(user, cancellationToken: ct);

        await SendOtpAsync(normalized, "Register", ct);
        return (true, null);
    }

    public async Task<string?> SendOtpAsync(string email, string type, CancellationToken ct = default)
    {
        var normalized = email.Trim().ToLowerInvariant();
        if (type == "Register")
        {
            var exists = await _db.Users.Find(x => x.Email == normalized).FirstOrDefaultAsync(ct);
            if (exists == null)
                return "Email chưa đăng ký";
            if (exists.IsEmailVerified)
                return null; // already verified
        }
        else if (type == "ForgotPassword")
        {
            var exists = await _db.Users.Find(x => x.Email == normalized).FirstOrDefaultAsync(ct);
            if (exists == null)
                return "Email chưa đăng ký";
        }

        var otp = new Random().Next(100000, 999999).ToString();
        var exp = DateTime.UtcNow.AddMinutes(OtpExpireMinutes);
        await _db.OtpVerifications.DeleteManyAsync(x => x.Email == normalized && x.Type == type && !x.IsUsed, ct);
        var record = new OtpVerification
        {
            Id = Guid.NewGuid().ToString("N"),
            Email = normalized,
            Otp = otp,
            Type = type,
            ExpiresAt = exp,
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };
        await _db.OtpVerifications.InsertOneAsync(record, cancellationToken: ct);
        await _email.SendOtpAsync(normalized, otp, type, ct);
        return null;
    }

    public async Task<(bool Ok, string? Error)> VerifyOtpAsync(string email, string otp, string type, CancellationToken ct = default)
    {
        var normalized = email.Trim().ToLowerInvariant();
        var record = await _db.OtpVerifications
            .Find(x => x.Email == normalized && x.Type == type && x.Otp == otp && !x.IsUsed && x.ExpiresAt > DateTime.UtcNow)
            .FirstOrDefaultAsync(ct);
        if (record == null)
            return (false, "OTP không hợp lệ hoặc đã hết hạn");

        record.IsUsed = true;
        await _db.OtpVerifications.ReplaceOneAsync(x => x.Id == record.Id, record, cancellationToken: ct);

        if (type == "Register")
        {
            await _db.Users.UpdateOneAsync(
                x => x.Email == normalized,
                Builders<User>.Update.Set(x => x.IsEmailVerified, true).Set(x => x.UpdatedAt, DateTime.UtcNow),
                cancellationToken: ct);
        }
        return (true, null);
    }

    public async Task<string?> LoginAsync(string email, string password, CancellationToken ct = default)
    {
        var normalized = email.Trim().ToLowerInvariant();
        var user = await _db.Users.Find(x => x.Email == normalized).FirstOrDefaultAsync(ct);
        if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            return null;
        if (!user.IsEmailVerified)
            return null;

        return GenerateJwt(user);
    }

    public async Task<(bool Ok, string? Error)> ForgotPasswordAsync(string email, CancellationToken ct = default)
    {
        var normalized = email.Trim().ToLowerInvariant();
        var user = await _db.Users.Find(x => x.Email == normalized).FirstOrDefaultAsync(ct);
        if (user == null)
            return (false, "Email chưa đăng ký");
        await SendOtpAsync(normalized, "ForgotPassword", ct);
        return (true, null);
    }

    public async Task<(bool Ok, string? Error)> ResetPasswordAsync(string email, string otp, string newPassword, CancellationToken ct = default)
    {
        var normalized = email.Trim().ToLowerInvariant();
        var record = await _db.OtpVerifications
            .Find(x => x.Email == normalized && x.Type == "ForgotPassword" && x.Otp == otp && !x.IsUsed && x.ExpiresAt > DateTime.UtcNow)
            .FirstOrDefaultAsync(ct);
        if (record == null)
            return (false, "OTP không hợp lệ hoặc đã hết hạn");

        record.IsUsed = true;
        await _db.OtpVerifications.ReplaceOneAsync(x => x.Id == record.Id, record, cancellationToken: ct);

        var hash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await _db.Users.UpdateOneAsync(
            x => x.Email == normalized,
            Builders<User>.Update.Set(x => x.PasswordHash, hash).Set(x => x.UpdatedAt, DateTime.UtcNow),
            cancellationToken: ct);
        return (true, null);
    }

    private string GenerateJwt(User user)
    {
        var key = _config["Jwt:Key"] ?? "NaturalStore-SecretKey-ChangeInProduction-32chars!!";
        var issuer = _config["Jwt:Issuer"] ?? "NaturalStore";
        var audience = _config["Jwt:Audience"] ?? "NaturalStore";
        var expireMinutes = int.TryParse(_config["Jwt:ExpireMinutes"] ?? "1440", out var m) ? m : 1440;

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role)
        };
        var token = new JwtSecurityToken(issuer, audience, claims, null, DateTime.UtcNow.AddMinutes(expireMinutes), credentials);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
