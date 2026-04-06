using NaturalStore.Domain.Entities;

namespace NaturalStore.Application.Interfaces;

public interface IOrderService
{
    Task<Order?> CreateOrderAsync(string userId, string? shippingAddress, CancellationToken ct = default);
    Task<Order?> GetByIdAsync(string id, string? userId, bool isAdmin, CancellationToken ct = default);
    Task<List<Order>> GetByUserIdAsync(string userId, CancellationToken ct = default);
    Task<List<Order>> GetAllOrdersAsync(int page, int pageSize, CancellationToken ct = default);
    Task<(bool Ok, string? Error)> UpdateStatusAsync(string orderId, string status, CancellationToken ct = default);
}
