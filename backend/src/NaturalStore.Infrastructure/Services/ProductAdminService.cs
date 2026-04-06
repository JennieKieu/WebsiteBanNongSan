using MongoDB.Driver;
using Microsoft.Extensions.DependencyInjection;
using NaturalStore.Application.Interfaces;
using NaturalStore.Domain.Entities;
using NaturalStore.Infrastructure;

namespace NaturalStore.Infrastructure.Services;

public class ProductAdminService : IProductAdminService
{
    private readonly MongoDbContext _db;
    private readonly IFileStorageService? _storage;

    public ProductAdminService(MongoDbContext db, IServiceProvider serviceProvider)
    {
        _db = db;
        _storage = serviceProvider.GetService<IFileStorageService>();
    }

    public async Task<(List<Product> Items, long Total)> GetListAsync(
        string? search,
        string? categoryId,
        bool? isActive,
        int page = 1,
        int pageSize = 20,
        CancellationToken ct = default)
    {
        var filter = Builders<Product>.Filter.Empty;
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchFilter = Builders<Product>.Filter.Or(
                Builders<Product>.Filter.Regex(x => x.Name, new MongoDB.Bson.BsonRegularExpression(search, "i")),
                Builders<Product>.Filter.Regex("Description", new MongoDB.Bson.BsonRegularExpression(search, "i"))
            );
            filter = Builders<Product>.Filter.And(filter, searchFilter);
        }
        if (!string.IsNullOrWhiteSpace(categoryId))
            filter = Builders<Product>.Filter.And(filter, Builders<Product>.Filter.Eq(x => x.CategoryId, categoryId));
        if (isActive.HasValue)
            filter = Builders<Product>.Filter.And(filter, Builders<Product>.Filter.Eq(x => x.IsActive, isActive.Value));

        var total = await _db.Products.CountDocumentsAsync(filter, cancellationToken: ct);
        var items = await _db.Products
            .Find(filter)
            .SortByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync(ct);
        return (items, total);
    }

    public async Task<Product?> GetByIdAsync(string id, CancellationToken ct = default) =>
        await _db.Products.Find(x => x.Id == id).FirstOrDefaultAsync(ct);

    public async Task<Product> CreateAsync(Product product, CancellationToken ct = default)
    {
        product.Id = Guid.NewGuid().ToString("N");
        product.Slug = string.IsNullOrEmpty(product.Slug) ? Slugify(product.Name) : product.Slug;
        product.ImageUrls ??= new List<string>();
        product.ImagePublicIds ??= new List<string>();
        if (!string.IsNullOrWhiteSpace(product.ImageUrl) && !product.ImageUrls.Contains(product.ImageUrl))
            product.ImageUrls.Insert(0, product.ImageUrl);
        if (string.IsNullOrWhiteSpace(product.ImageUrl) && product.ImageUrls.Count > 0)
            product.ImageUrl = product.ImageUrls[0];
        product.CreatedAt = DateTime.UtcNow;
        await _db.Products.InsertOneAsync(product, cancellationToken: ct);
        return product;
    }

    public async Task<(bool Ok, string? Error)> UpdateAsync(string id, Product product, CancellationToken ct = default)
    {
        var existing = await _db.Products.Find(x => x.Id == id).FirstOrDefaultAsync(ct);
        if (existing == null)
            return (false, "Sản phẩm không tồn tại");

        product.ImageUrls ??= new List<string>();
        product.ImagePublicIds ??= new List<string>();
        if (!string.IsNullOrWhiteSpace(product.ImageUrl) && !product.ImageUrls.Contains(product.ImageUrl))
            product.ImageUrls.Insert(0, product.ImageUrl);
        if (string.IsNullOrWhiteSpace(product.ImageUrl) && product.ImageUrls.Count > 0)
            product.ImageUrl = product.ImageUrls[0];

        var removedPublicIds = (existing.ImagePublicIds ?? new List<string>())
            .Except(product.ImagePublicIds)
            .ToList();

        product.Id = id;
        product.Slug = string.IsNullOrEmpty(product.Slug) ? Slugify(product.Name) : product.Slug;
        product.UpdatedAt = DateTime.UtcNow;
        await _db.Products.ReplaceOneAsync(x => x.Id == id, product, cancellationToken: ct);
        await DeleteCloudinaryImagesAsync(removedPublicIds, ct);
        return (true, null);
    }

    public async Task<(bool Ok, string? Error)> DeleteAsync(string id, CancellationToken ct = default)
    {
        var existing = await _db.Products.Find(x => x.Id == id).FirstOrDefaultAsync(ct);
        var r = await _db.Products.DeleteOneAsync(x => x.Id == id, ct);
        if (r.DeletedCount > 0 && existing?.ImagePublicIds?.Count > 0)
            await DeleteCloudinaryImagesAsync(existing.ImagePublicIds, ct);
        return (r.DeletedCount > 0, r.DeletedCount > 0 ? null : "Sản phẩm không tồn tại");
    }

    public async Task<(bool Ok, string? Error)> UpdateStockAsync(string id, int stock, CancellationToken ct = default)
    {
        var r = await _db.Products.UpdateOneAsync(
            x => x.Id == id,
            Builders<Product>.Update.Set(x => x.Stock, stock).Set(x => x.UpdatedAt, DateTime.UtcNow),
            cancellationToken: ct);
        return (r.ModifiedCount > 0 || r.MatchedCount > 0, null);
    }

    private static string Slugify(string text)
    {
        var slug = string.Join("-", text.ToLowerInvariant()
            .Where(c => char.IsLetterOrDigit(c) || c == ' ')
            .Select(c => c == ' ' ? '-' : c))
            .Trim('-');
        return slug.Length > 0 ? slug : Guid.NewGuid().ToString("N")[..8];
    }

    private async Task DeleteCloudinaryImagesAsync(IEnumerable<string> publicIds, CancellationToken ct)
    {
        if (_storage == null) return;
        foreach (var publicId in publicIds.Where(x => !string.IsNullOrWhiteSpace(x)))
        {
            try
            {
                await _storage.DeleteAsync(publicId, ct);
            }
            catch
            {
                // Best effort cleanup: không block thao tác chính nếu Cloudinary lỗi.
            }
        }
    }
}
