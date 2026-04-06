using MongoDB.Driver;
using NaturalStore.Application.Interfaces;
using NaturalStore.Domain.Entities;
using NaturalStore.Infrastructure;

namespace NaturalStore.Infrastructure.Services;

public class BannerService : IBannerService
{
    private readonly MongoDbContext _db;

    public BannerService(MongoDbContext db) => _db = db;

    public async Task<List<Banner>> GetActiveAsync(CancellationToken ct = default) =>
        await _db.Banners.Find(x => x.IsActive).SortBy(x => x.Order).ToListAsync(ct);

    public async Task<List<Banner>> GetAllAsync(CancellationToken ct = default) =>
        await _db.Banners.Find(_ => true).SortBy(x => x.Order).ToListAsync(ct);

    public async Task<Banner> CreateAsync(Banner banner, CancellationToken ct = default)
    {
        banner.Id = Guid.NewGuid().ToString("N");
        await _db.Banners.InsertOneAsync(banner, cancellationToken: ct);
        return banner;
    }

    public async Task<(bool Ok, string? Error)> UpdateAsync(string id, Banner banner, CancellationToken ct = default)
    {
        banner.Id = id;
        var r = await _db.Banners.ReplaceOneAsync(x => x.Id == id, banner, cancellationToken: ct);
        return (r.MatchedCount > 0, r.MatchedCount > 0 ? null : "Banner không tồn tại");
    }

    public async Task<(bool Ok, string? Error)> DeleteAsync(string id, CancellationToken ct = default)
    {
        var r = await _db.Banners.DeleteOneAsync(x => x.Id == id, ct);
        return (r.DeletedCount > 0, r.DeletedCount > 0 ? null : "Banner không tồn tại");
    }
}
