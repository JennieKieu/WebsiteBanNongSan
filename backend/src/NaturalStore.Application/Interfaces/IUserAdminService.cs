using NaturalStore.Domain.Entities;

namespace NaturalStore.Application.Interfaces;

public interface IUserAdminService
{
    Task<List<User>> GetAllAsync(int page, int pageSize, CancellationToken ct = default);
    Task<User?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<(bool Ok, string? Error)> UpdateAsync(string id, string? firstName, string? lastName, string? phone, CancellationToken ct = default);
    Task<(bool Ok, string? Error)> DeleteAsync(string id, CancellationToken ct = default);
}
