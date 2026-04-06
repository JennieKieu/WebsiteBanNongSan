using NaturalStore.Domain.Entities;

namespace NaturalStore.Application.Interfaces;

public interface IBannerService
{
    Task<List<Banner>> GetActiveAsync(CancellationToken ct = default);
    Task<List<Banner>> GetAllAsync(CancellationToken ct = default);
    Task<Banner> CreateAsync(Banner banner, CancellationToken ct = default);
    Task<(bool Ok, string? Error)> UpdateAsync(string id, Banner banner, CancellationToken ct = default);
    Task<(bool Ok, string? Error)> DeleteAsync(string id, CancellationToken ct = default);
}
