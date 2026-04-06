using NaturalStore.Domain.Entities;

namespace NaturalStore.Application.Interfaces;

public interface IProductService
{
    Task<(List<Product> Items, long Total)> GetListAsync(string? search, string? categoryId, string? useTag, decimal? minPrice, decimal? maxPrice, int page = 1, int pageSize = 12, CancellationToken ct = default);
    Task<Product?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<Product?> GetBySlugAsync(string slug, CancellationToken ct = default);
    Task<List<Product>> GetRecommendedAsync(string productId, int limit = 4, CancellationToken ct = default);
    Task<List<Product>> GetFeaturedAsync(int limit = 8, CancellationToken ct = default);
}
