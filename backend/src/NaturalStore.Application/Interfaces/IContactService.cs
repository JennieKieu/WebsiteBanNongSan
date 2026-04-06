using NaturalStore.Domain.Entities;

namespace NaturalStore.Application.Interfaces;

public interface IContactService
{
    Task<Contact> CreateAsync(Contact contact, CancellationToken ct = default);
    Task<List<Contact>> GetAllAsync(int page, int pageSize, CancellationToken ct = default);
    Task<Contact?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<(bool Ok, string? Error)> UpdateStatusAsync(string id, string status, CancellationToken ct = default);
    Task<(bool Ok, string? Error)> DeleteAsync(string id, CancellationToken ct = default);
}
