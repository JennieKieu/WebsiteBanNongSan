using MongoDB.Driver;
using NaturalStore.Application.Interfaces;
using NaturalStore.Domain.Entities;
using NaturalStore.Infrastructure;

namespace NaturalStore.Infrastructure.Services;

public class UserAdminService : IUserAdminService
{
    private readonly MongoDbContext _db;

    public UserAdminService(MongoDbContext db) => _db = db;

    public async Task<List<User>> GetAllAsync(int page, int pageSize, CancellationToken ct = default) =>
        await _db.Users.Find(_ => true)
            .SortByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync(ct);

    public async Task<User?> GetByIdAsync(string id, CancellationToken ct = default) =>
        await _db.Users.Find(x => x.Id == id).FirstOrDefaultAsync(ct);

    public async Task<(bool Ok, string? Error)> UpdateAsync(string id, string? firstName, string? lastName, string? phone, CancellationToken ct = default)
    {
        var updates = new List<UpdateDefinition<User>> { Builders<User>.Update.Set(x => x.UpdatedAt, DateTime.UtcNow) };
        if (firstName != null) updates.Add(Builders<User>.Update.Set(x => x.FirstName, firstName));
        if (lastName != null) updates.Add(Builders<User>.Update.Set(x => x.LastName, lastName));
        if (phone != null) updates.Add(Builders<User>.Update.Set(x => x.Phone, phone));
        var r = await _db.Users.UpdateOneAsync(x => x.Id == id, Builders<User>.Update.Combine(updates), cancellationToken: ct);
        return (r.MatchedCount > 0, r.MatchedCount > 0 ? null : "Không tìm thấy user");
    }

    public async Task<(bool Ok, string? Error)> DeleteAsync(string id, CancellationToken ct = default)
    {
        var r = await _db.Users.DeleteOneAsync(x => x.Id == id, ct);
        return (r.DeletedCount > 0, r.DeletedCount > 0 ? null : "Không tìm thấy user");
    }
}
