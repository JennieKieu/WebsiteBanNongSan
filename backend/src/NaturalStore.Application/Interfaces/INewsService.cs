using NaturalStore.Domain.Entities;

namespace NaturalStore.Application.Interfaces;

public interface INewsService
{
    Task<List<News>> GetPublishedAsync(int page, int pageSize, CancellationToken ct = default);
    Task<News?> GetBySlugAsync(string slug, CancellationToken ct = default);
    Task<List<News>> GetAllAdminAsync(int page, int pageSize, CancellationToken ct = default);
    Task<News> CreateAsync(News news, CancellationToken ct = default);
    Task<(bool Ok, string? Error)> UpdateAsync(string id, News news, CancellationToken ct = default);
    Task<(bool Ok, string? Error)> DeleteAsync(string id, CancellationToken ct = default);
}
