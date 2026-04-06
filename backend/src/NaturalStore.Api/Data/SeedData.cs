using MongoDB.Driver;
using NaturalStore.Domain.Entities;
using NaturalStore.Infrastructure;

namespace NaturalStore.Api.Data;

public static class SeedData
{
    public static async Task SeedAsync(MongoDbContext db, IConfiguration config)
    {
        // Admin user if not exists
        var adminEmail = config["Seed:AdminEmail"] ?? "admin@naturalstore.vn";
        var adminPass = config["Seed:AdminPassword"] ?? "Admin@123";
        var existingAdmin = await db.Users.Find(x => x.Email == adminEmail).FirstOrDefaultAsync();
        if (existingAdmin == null)
        {
            var hash = BCrypt.Net.BCrypt.HashPassword(adminPass);
            await db.Users.InsertOneAsync(new User
            {
                Id = Guid.NewGuid().ToString("N"),
                FirstName = "Admin",
                LastName = "Natural",
                Email = adminEmail,
                Phone = "0900000000",
                PasswordHash = hash,
                IsEmailVerified = true,
                Role = "Admin",
                CreatedAt = DateTime.UtcNow
            });
        }

        // Categories
        if (await db.Categories.CountDocumentsAsync(_ => true) == 0)
        {
            var categories = new[]
            {
                new Category { Id = Guid.NewGuid().ToString("N"), Name = "Trái cây sấy, mứt", Slug = "trai-cay-say-mut", Order = 1 },
                new Category { Id = Guid.NewGuid().ToString("N"), Name = "Bánh mứt, đồ khô đặc sản", Slug = "banh-mut-do-kho", Order = 2 },
                new Category { Id = Guid.NewGuid().ToString("N"), Name = "Trà, cà phê", Slug = "tra-ca-phe", Order = 3 },
                new Category { Id = Guid.NewGuid().ToString("N"), Name = "Nông sản, dược liệu, quý hiếm", Slug = "nong-san-duoc-lieu", Order = 4 },
            };
            await db.Categories.InsertManyAsync(categories);
        }

        // Sample products if empty
        if (await db.Products.CountDocumentsAsync(_ => true) == 0)
        {
            var cat = await db.Categories.Find(_ => true).FirstOrDefaultAsync();
            var catId = cat?.Id ?? "cat1";
            var products = new[]
            {
                new Product { Id = Guid.NewGuid().ToString("N"), Name = "Bưởi da xanh", Slug = "buoi-da-xanh", Price = 45000, Stock = 100, CategoryId = catId, UseTags = new List<string> { "giảm cân" }, IsFeatured = true, IsActive = true, CreatedAt = DateTime.UtcNow },
                new Product { Id = Guid.NewGuid().ToString("N"), Name = "Táo đỏ", Slug = "tao-do", Price = 55000, Stock = 80, CategoryId = catId, UseTags = new List<string> { "giảm cân", "tăng cường miễn dịch" }, IsFeatured = true, IsActive = true, CreatedAt = DateTime.UtcNow },
                new Product { Id = Guid.NewGuid().ToString("N"), Name = "Thanh long", Slug = "thanh-long", Price = 35000, Stock = 120, CategoryId = catId, UseTags = new List<string> { "tiểu đường" }, IsFeatured = true, IsActive = true, CreatedAt = DateTime.UtcNow },
                new Product { Id = Guid.NewGuid().ToString("N"), Name = "Ổi", Slug = "oi", Price = 25000, Stock = 150, CategoryId = catId, UseTags = new List<string> { "tiểu đường", "tăng cường miễn dịch" }, IsFeatured = true, IsActive = true, CreatedAt = DateTime.UtcNow },
                new Product { Id = Guid.NewGuid().ToString("N"), Name = "Cam", Slug = "cam", Price = 40000, Stock = 90, CategoryId = catId, UseTags = new List<string> { "đẹp da", "vitamin C" }, IsFeatured = true, IsActive = true, CreatedAt = DateTime.UtcNow },
            };
            await db.Products.InsertManyAsync(products);
        }
    }
}
