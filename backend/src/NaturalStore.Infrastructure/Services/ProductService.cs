using MongoDB.Driver;
using NaturalStore.Application.Interfaces;
using NaturalStore.Domain.Entities;
using NaturalStore.Infrastructure;

namespace NaturalStore.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly MongoDbContext _db;

    public ProductService(MongoDbContext db) => _db = db;

    public async Task<(List<Product> Items, long Total)> GetListAsync(string? search, string? categoryId, string? useTag, decimal? minPrice, decimal? maxPrice, int page = 1, int pageSize = 12, CancellationToken ct = default)
    {
        var filter = Builders<Product>.Filter.Eq(x => x.IsActive, true);

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
        if (!string.IsNullOrWhiteSpace(useTag))
            filter = Builders<Product>.Filter.And(filter, Builders<Product>.Filter.AnyIn(x => x.UseTags, new[] { useTag }));
        if (minPrice.HasValue)
            filter = Builders<Product>.Filter.And(filter, Builders<Product>.Filter.Gte(x => x.Price, minPrice.Value));
        if (maxPrice.HasValue)
            filter = Builders<Product>.Filter.And(filter, Builders<Product>.Filter.Lte(x => x.Price, maxPrice.Value));

        var total = await _db.Products.CountDocumentsAsync(filter, cancellationToken: ct);
        var skip = (page - 1) * pageSize;
        var items = await _db.Products
            .Find(filter)
            .SortByDescending(x => x.IsFeatured)
            .ThenByDescending(x => x.CreatedAt)
            .Skip(skip)
            .Limit(pageSize)
            .ToListAsync(ct);
        return (items, total);
    }

    public async Task<Product?> GetByIdAsync(string id, CancellationToken ct = default) =>
        await _db.Products.Find(x => x.Id == id && x.IsActive).FirstOrDefaultAsync(ct);

    public async Task<Product?> GetBySlugAsync(string slug, CancellationToken ct = default) =>
        await _db.Products.Find(x => x.Slug == slug && x.IsActive).FirstOrDefaultAsync(ct);

    public async Task<List<Product>> GetRecommendedAsync(string productId, int limit = 4, CancellationToken ct = default)
    {
        var product = await GetByIdAsync(productId, ct);
        if (product == null) return new List<Product>();

        var filter = Builders<Product>.Filter.And(
            Builders<Product>.Filter.Eq(x => x.IsActive, true),
            Builders<Product>.Filter.Ne(x => x.Id, productId),
            Builders<Product>.Filter.Or(
                Builders<Product>.Filter.Eq(x => x.CategoryId, product.CategoryId),
                Builders<Product>.Filter.AnyIn(x => x.UseTags, product.UseTags)
            )
        );
        return await _db.Products.Find(filter).Limit(limit).ToListAsync(ct);
    }

    public async Task<List<Product>> GetFeaturedAsync(int limit = 8, CancellationToken ct = default) =>
        await _db.Products
            .Find(x => x.IsActive && x.IsFeatured)
            .SortByDescending(x => x.CreatedAt)
            .Limit(limit)
            .ToListAsync(ct);
}
