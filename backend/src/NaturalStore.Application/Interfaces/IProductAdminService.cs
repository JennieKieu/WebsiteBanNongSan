using NaturalStore.Domain.Entities;

namespace NaturalStore.Application.Interfaces;

public interface IProductAdminService
{
    Task<(List<Product> Items, long Total)> GetListAsync(string? search, string? categoryId, bool? isActive, int page = 1, int pageSize = 20, CancellationToken ct = default);
    Task<Product?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<Product> CreateAsync(Product product, CancellationToken ct = default);
    Task<(bool Ok, string? Error)> UpdateAsync(string id, Product product, CancellationToken ct = default);
    Task<(bool Ok, string? Error)> DeleteAsync(string id, CancellationToken ct = default);
    Task<(bool Ok, string? Error)> UpdateStockAsync(string id, int stock, CancellationToken ct = default);
}
