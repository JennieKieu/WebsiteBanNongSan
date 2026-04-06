using System.Text;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using NaturalStore.Infrastructure;
using NaturalStore.Infrastructure.Services;
using NaturalStore.Application.Interfaces;

// Load .env (secrets) - file này KHÔNG commit lên Git.
// Hỗ trợ chạy lệnh từ cả thư mục backend/ hoặc backend/src/NaturalStore.Api/.
var envCandidates = new[]
{
    ".env",
    Path.Combine("src", "NaturalStore.Api", ".env"),
};
foreach (var envPath in envCandidates)
{
    if (File.Exists(envPath))
    {
        Env.Load(envPath);
        break;
    }
}

var builder = WebApplication.CreateBuilder(args);

// MongoDB (từ .env hoặc appsettings)
var mongoConn = builder.Configuration["MongoDB:ConnectionString"];
if (string.IsNullOrEmpty(mongoConn))
    mongoConn = "mongodb://localhost:27017";
builder.Services.AddSingleton(new MongoDbContext(mongoConn));

// HttpClient for OpenAI
builder.Services.AddHttpClient();

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IProductAdminService, ProductAdminService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IChatbotService, ChatbotService>();
builder.Services.AddScoped<IBannerService, BannerService>();
builder.Services.AddScoped<INewsService, NewsService>();
builder.Services.AddScoped<IContactService, ContactService>();
builder.Services.AddScoped<IUserAdminService, UserAdminService>();
builder.Services.AddScoped<IStatsService, StatsService>();

// Cloudinary upload (optional - only if configured)
var cloudinaryCloudName = builder.Configuration["Cloudinary:CloudName"];
if (!string.IsNullOrEmpty(cloudinaryCloudName))
{
    builder.Services.AddScoped<IFileStorageService, CloudinaryFileStorageService>();
}

// JWT (phải cấu hình trong .env khi deploy)
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(jwtKey))
    jwtKey = "dev-only-change-in-production-32chars!!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "NaturalStore",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "NaturalStore",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddCors(opts =>
{
    opts.AddDefaultPolicy(pb =>
    {
        pb.WithOrigins(builder.Configuration["Cors:Origins"]?.Split(',') ?? new[] { "http://localhost:5173" })
            .AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

// Seed data (dev)
if (app.Environment.IsDevelopment())
{
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<NaturalStore.Infrastructure.MongoDbContext>();
        NaturalStore.Api.Data.SeedData.SeedAsync(db, app.Configuration).GetAwaiter().GetResult();
    }
    catch { /* ignore */ }
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

if (app.Environment.IsDevelopment())
{
}

app.Run();
