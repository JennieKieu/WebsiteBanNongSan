using MongoDB.Driver;
using NaturalStore.Application.Interfaces;
using NaturalStore.Domain.Entities;
using NaturalStore.Infrastructure;

namespace NaturalStore.Infrastructure.Services;

public class ContactService : IContactService
{
    private readonly MongoDbContext _db;

    public ContactService(MongoDbContext db) => _db = db;

    public async Task<Contact> CreateAsync(Contact contact, CancellationToken ct = default)
    {
        contact.Id = Guid.NewGuid().ToString("N");
        contact.CreatedAt = DateTime.UtcNow;
        await _db.Contacts.InsertOneAsync(contact, cancellationToken: ct);
        return contact;
    }

    public async Task<List<Contact>> GetAllAsync(int page, int pageSize, CancellationToken ct = default) =>
        await _db.Contacts.Find(_ => true)
            .SortByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync(ct);

    public async Task<Contact?> GetByIdAsync(string id, CancellationToken ct = default) =>
        await _db.Contacts.Find(x => x.Id == id).FirstOrDefaultAsync(ct);

    public async Task<(bool Ok, string? Error)> UpdateStatusAsync(string id, string status, CancellationToken ct = default)
    {
        var r = await _db.Contacts.UpdateOneAsync(
            x => x.Id == id,
            Builders<Contact>.Update.Set(x => x.Status, status),
            cancellationToken: ct);
        return (r.MatchedCount > 0, r.MatchedCount > 0 ? null : "Liên hệ không tồn tại");
    }

    public async Task<(bool Ok, string? Error)> DeleteAsync(string id, CancellationToken ct = default)
    {
        var r = await _db.Contacts.DeleteOneAsync(x => x.Id == id, ct);
        return (r.DeletedCount > 0, r.DeletedCount > 0 ? null : "Liên hệ không tồn tại");
    }
}
