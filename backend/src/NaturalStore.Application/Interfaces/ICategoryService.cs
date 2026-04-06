using NaturalStore.Domain.Entities;

namespace NaturalStore.Application.Interfaces;

public interface ICategoryService
{
    Task<List<Category>> GetAllAsync(string? search = null, bool? isActive = null, CancellationToken ct = default);
    Task<List<Category>> GetAllActiveAsync(CancellationToken ct = default);
    Task<Category?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<Category> CreateAsync(Category category, CancellationToken ct = default);
    Task<(bool Ok, string? Error)> UpdateAsync(string id, Category category, CancellationToken ct = default);
    Task<(bool Ok, string? Error)> DeleteAsync(string id, CancellationToken ct = default);
}
