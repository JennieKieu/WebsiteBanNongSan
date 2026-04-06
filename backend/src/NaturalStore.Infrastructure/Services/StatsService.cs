using MongoDB.Driver;
using NaturalStore.Application.Interfaces;
using NaturalStore.Domain.Entities;
using NaturalStore.Infrastructure;

namespace NaturalStore.Infrastructure.Services;

public class StatsService : IStatsService
{
    private readonly MongoDbContext _db;

    public StatsService(MongoDbContext db) => _db = db;

    public async Task<StatsDto> GetDashboardStatsAsync(DateTime? from, DateTime? to, CancellationToken ct = default)
    {
        var fromDate = from ?? DateTime.UtcNow.AddDays(-30);
        var toDate = to ?? DateTime.UtcNow;

        var completedFilter = Builders<Order>.Filter.And(
            Builders<Order>.Filter.Eq(x => x.Status, "Completed"),
            Builders<Order>.Filter.Gte(x => x.CreatedAt, fromDate),
            Builders<Order>.Filter.Lte(x => x.CreatedAt, toDate));

        var orders = await _db.Orders.Find(completedFilter).ToListAsync(ct);
        var totalRevenue = orders.Sum(x => x.TotalAmount);
        var totalOrders = await _db.Orders.CountDocumentsAsync(_ => true, cancellationToken: ct);
        var totalProducts = await _db.Products.CountDocumentsAsync(_ => true, cancellationToken: ct);
        var totalCustomers = await _db.Users.CountDocumentsAsync(x => x.Role == "User", cancellationToken: ct);
        var lowStockCount = await _db.Products.CountDocumentsAsync(x => x.Stock < 10 && x.IsActive, cancellationToken: ct);

        var revenueByDay = orders
            .GroupBy(x => x.CreatedAt.Date)
            .Select(g => new DailyRevenueDto
            {
                Date = g.Key.ToString("yyyy-MM-dd"),
                Revenue = g.Sum(x => x.TotalAmount),
                Orders = g.Count()
            })
            .OrderBy(x => x.Date)
            .ToList();

        return new StatsDto
        {
            TotalRevenue = totalRevenue,
            TotalOrders = (int)totalOrders,
            TotalProducts = (int)totalProducts,
            TotalCustomers = (int)totalCustomers,
            LowStockCount = (int)lowStockCount,
            RevenueByDay = revenueByDay
        };
    }
}
