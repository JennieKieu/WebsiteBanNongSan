using MongoDB.Driver;
using NaturalStore.Application.Interfaces;
using NaturalStore.Domain.Entities;
using NaturalStore.Infrastructure;

namespace NaturalStore.Infrastructure.Services;

public class CategoryService : ICategoryService
{
    private readonly MongoDbContext _db;

    public CategoryService(MongoDbContext db) => _db = db;

    public async Task<List<Category>> GetAllAsync(string? search = null, bool? isActive = null, CancellationToken ct = default)
    {
        var filter = Builders<Category>.Filter.Empty;
        if (!string.IsNullOrWhiteSpace(search))
        {
            filter = Builders<Category>.Filter.And(
                filter,
                Builders<Category>.Filter.Regex(x => x.Name, new MongoDB.Bson.BsonRegularExpression(search, "i"))
            );
        }
        if (isActive.HasValue)
            filter = Builders<Category>.Filter.And(filter, Builders<Category>.Filter.Eq(x => x.IsActive, isActive.Value));

        return await _db.Categories.Find(filter).SortBy(x => x.Order).ToListAsync(ct);
    }

    public async Task<List<Category>> GetAllActiveAsync(CancellationToken ct = default) =>
        await _db.Categories.Find(x => x.IsActive).SortBy(x => x.Order).ToListAsync(ct);

    public async Task<Category?> GetByIdAsync(string id, CancellationToken ct = default) =>
        await _db.Categories.Find(x => x.Id == id).FirstOrDefaultAsync(ct);

    public async Task<Category> CreateAsync(Category category, CancellationToken ct = default)
    {
        category.Id = string.IsNullOrWhiteSpace(category.Id) ? Guid.NewGuid().ToString("N") : category.Id;
        category.Slug = string.IsNullOrWhiteSpace(category.Slug) ? Slugify(category.Name) : category.Slug;
        await _db.Categories.InsertOneAsync(category, cancellationToken: ct);
        return category;
    }

    public async Task<(bool Ok, string? Error)> UpdateAsync(string id, Category category, CancellationToken ct = default)
    {
        var existing = await _db.Categories.Find(x => x.Id == id).FirstOrDefaultAsync(ct);
        if (existing == null) return (false, "Danh mục không tồn tại");

        category.Id = id;
        category.Slug = string.IsNullOrWhiteSpace(category.Slug) ? Slugify(category.Name) : category.Slug;
        await _db.Categories.ReplaceOneAsync(x => x.Id == id, category, cancellationToken: ct);
        return (true, null);
    }

    public async Task<(bool Ok, string? Error)> DeleteAsync(string id, CancellationToken ct = default)
    {
        var r = await _db.Categories.DeleteOneAsync(x => x.Id == id, ct);
        return (r.DeletedCount > 0, r.DeletedCount > 0 ? null : "Danh mục không tồn tại");
    }

    private static string Slugify(string text)
    {
        var slug = string.Join("-", text.ToLowerInvariant()
            .Where(c => char.IsLetterOrDigit(c) || c == ' ')
            .Select(c => c == ' ' ? '-' : c))
            .Trim('-');
        return slug.Length > 0 ? slug : Guid.NewGuid().ToString("N")[..8];
    }
}
