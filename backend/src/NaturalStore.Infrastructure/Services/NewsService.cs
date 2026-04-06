using MongoDB.Driver;
using NaturalStore.Application.Interfaces;
using NaturalStore.Domain.Entities;
using NaturalStore.Infrastructure;

namespace NaturalStore.Infrastructure.Services;

public class NewsService : INewsService
{
    private readonly MongoDbContext _db;

    public NewsService(MongoDbContext db) => _db = db;

    public async Task<List<News>> GetPublishedAsync(int page, int pageSize, CancellationToken ct = default) =>
        await _db.News.Find(x => x.IsPublished)
            .SortByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync(ct);

    public async Task<News?> GetBySlugAsync(string slug, CancellationToken ct = default) =>
        await _db.News.Find(x => x.Slug == slug && x.IsPublished).FirstOrDefaultAsync(ct);

    public async Task<List<News>> GetAllAdminAsync(int page, int pageSize, CancellationToken ct = default) =>
        await _db.News.Find(_ => true)
            .SortByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync(ct);

    public async Task<News> CreateAsync(News news, CancellationToken ct = default)
    {
        news.Id = Guid.NewGuid().ToString("N");
        news.Slug = string.IsNullOrEmpty(news.Slug) ? Slugify(news.Title) : news.Slug;
        news.CreatedAt = DateTime.UtcNow;
        await _db.News.InsertOneAsync(news, cancellationToken: ct);
        return news;
    }

    public async Task<(bool Ok, string? Error)> UpdateAsync(string id, News news, CancellationToken ct = default)
    {
        news.Id = id;
        news.UpdatedAt = DateTime.UtcNow;
        var r = await _db.News.ReplaceOneAsync(x => x.Id == id, news, cancellationToken: ct);
        return (r.MatchedCount > 0, r.MatchedCount > 0 ? null : "Tin không tồn tại");
    }

    public async Task<(bool Ok, string? Error)> DeleteAsync(string id, CancellationToken ct = default)
    {
        var r = await _db.News.DeleteOneAsync(x => x.Id == id, ct);
        return (r.DeletedCount > 0, r.DeletedCount > 0 ? null : "Tin không tồn tại");
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
