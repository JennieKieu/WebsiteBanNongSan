using NaturalStore.Domain.Entities;

namespace NaturalStore.Application.Interfaces;

public interface ICartService
{
    Task<Cart?> GetByUserIdAsync(string userId, CancellationToken ct = default);
    Task<Cart> AddItemAsync(string userId, string productId, int quantity, CancellationToken ct = default);
    Task<Cart?> UpdateQuantityAsync(string userId, string productId, int quantity, CancellationToken ct = default);
    Task<Cart?> RemoveItemAsync(string userId, string productId, CancellationToken ct = default);
    Task ClearCartAsync(string userId, CancellationToken ct = default);
}
