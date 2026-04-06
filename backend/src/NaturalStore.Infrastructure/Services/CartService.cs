using MongoDB.Driver;
using NaturalStore.Application.Interfaces;
using NaturalStore.Domain.Entities;
using NaturalStore.Infrastructure;

namespace NaturalStore.Infrastructure.Services;

public class CartService : ICartService
{
    private readonly MongoDbContext _db;

    public CartService(MongoDbContext db) => _db = db;

    public async Task<Cart?> GetByUserIdAsync(string userId, CancellationToken ct = default) =>
        await _db.Carts.Find(x => x.UserId == userId).FirstOrDefaultAsync(ct);

    public async Task<Cart> AddItemAsync(string userId, string productId, int quantity, CancellationToken ct = default)
    {
        var product = await _db.Products.Find(x => x.Id == productId && x.IsActive).FirstOrDefaultAsync(ct);
        if (product == null) throw new ArgumentException("Sản phẩm không tồn tại");

        var cart = await GetByUserIdAsync(userId, ct);
        if (cart == null)
        {
            cart = new Cart
            {
                Id = Guid.NewGuid().ToString("N"),
                UserId = userId,
                Items = new List<CartItem>(),
                UpdatedAt = DateTime.UtcNow
            };
            await _db.Carts.InsertOneAsync(cart, cancellationToken: ct);
        }

        var existing = cart.Items.FirstOrDefault(x => x.ProductId == productId);
        if (existing != null)
            existing.Quantity += quantity;
        else
            cart.Items.Add(new CartItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                ImageUrl = product.ImageUrl ?? product.ImageUrls.FirstOrDefault(),
                Price = product.Price,
                Quantity = quantity
            });

        cart.UpdatedAt = DateTime.UtcNow;
        await _db.Carts.ReplaceOneAsync(x => x.Id == cart.Id, cart, cancellationToken: ct);
        return cart;
    }

    public async Task<Cart?> UpdateQuantityAsync(string userId, string productId, int quantity, CancellationToken ct = default)
    {
        var cart = await GetByUserIdAsync(userId, ct);
        if (cart == null) return null;
        var item = cart.Items.FirstOrDefault(x => x.ProductId == productId);
        if (item == null) return cart;
        if (quantity <= 0)
            cart.Items.Remove(item);
        else
            item.Quantity = quantity;
        cart.UpdatedAt = DateTime.UtcNow;
        await _db.Carts.ReplaceOneAsync(x => x.Id == cart.Id, cart, cancellationToken: ct);
        return cart;
    }

    public async Task<Cart?> RemoveItemAsync(string userId, string productId, CancellationToken ct = default)
    {
        var cart = await GetByUserIdAsync(userId, ct);
        if (cart == null) return null;
        cart.Items.RemoveAll(x => x.ProductId == productId);
        cart.UpdatedAt = DateTime.UtcNow;
        await _db.Carts.ReplaceOneAsync(x => x.Id == cart.Id, cart, cancellationToken: ct);
        return cart;
    }

    public async Task ClearCartAsync(string userId, CancellationToken ct = default)
    {
        var cart = await GetByUserIdAsync(userId, ct);
        if (cart != null)
        {
            cart.Items.Clear();
            cart.UpdatedAt = DateTime.UtcNow;
            await _db.Carts.ReplaceOneAsync(x => x.Id == cart.Id, cart, cancellationToken: ct);
        }
    }
}
