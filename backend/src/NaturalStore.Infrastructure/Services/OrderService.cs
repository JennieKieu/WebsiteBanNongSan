using MongoDB.Driver;
using NaturalStore.Application.Interfaces;
using NaturalStore.Domain.Entities;
using NaturalStore.Infrastructure;

namespace NaturalStore.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly MongoDbContext _db;
    private readonly ICartService _cart;

    public OrderService(MongoDbContext db, ICartService cart)
    {
        _db = db;
        _cart = cart;
    }

    public async Task<Order?> CreateOrderAsync(string userId, string? shippingAddress, CancellationToken ct = default)
    {
        var cart = await _cart.GetByUserIdAsync(userId, ct);
        if (cart == null || !cart.Items.Any())
            return null;

        var user = await _db.Users.Find(x => x.Id == userId).FirstOrDefaultAsync(ct);
        var order = new Order
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            UserName = user?.FullName,
            UserEmail = user?.Email,
            UserPhone = user?.Phone,
            ShippingAddress = shippingAddress,
            Status = "Pending",
            TotalAmount = cart.Items.Sum(x => x.Price * x.Quantity),
            Items = cart.Items.Select(x => new OrderItem
            {
                ProductId = x.ProductId,
                ProductName = x.ProductName,
                ImageUrl = x.ImageUrl,
                Price = x.Price,
                Quantity = x.Quantity
            }).ToList(),
            CreatedAt = DateTime.UtcNow
        };
        await _db.Orders.InsertOneAsync(order, cancellationToken: ct);
        await _cart.ClearCartAsync(userId, ct);
        return order;
    }

    public async Task<Order?> GetByIdAsync(string id, string? userId, bool isAdmin, CancellationToken ct = default)
    {
        var order = await _db.Orders.Find(x => x.Id == id).FirstOrDefaultAsync(ct);
        if (order == null) return null;
        if (!isAdmin && order.UserId != userId) return null;
        return order;
    }

    public async Task<List<Order>> GetByUserIdAsync(string userId, CancellationToken ct = default) =>
        await _db.Orders.Find(x => x.UserId == userId).SortByDescending(x => x.CreatedAt).ToListAsync(ct);

    public async Task<List<Order>> GetAllOrdersAsync(int page, int pageSize, CancellationToken ct = default) =>
        await _db.Orders.Find(_ => true)
            .SortByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync(ct);

    public async Task<(bool Ok, string? Error)> UpdateStatusAsync(string orderId, string status, CancellationToken ct = default)
    {
        var valid = new[] { "Pending", "Confirmed", "Shipping", "Completed", "Cancelled" };
        if (!valid.Contains(status))
            return (false, "Trạng thái không hợp lệ");
        await _db.Orders.UpdateOneAsync(
            x => x.Id == orderId,
            Builders<Order>.Update.Set(x => x.Status, status).Set(x => x.UpdatedAt, DateTime.UtcNow),
            cancellationToken: ct);
        return (true, null);
    }
}
