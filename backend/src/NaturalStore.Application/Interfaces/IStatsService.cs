namespace NaturalStore.Application.Interfaces;

public class StatsDto
{
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public int TotalProducts { get; set; }
    public int TotalCustomers { get; set; }
    public int LowStockCount { get; set; }
    public List<DailyRevenueDto>? RevenueByDay { get; set; }
}

public class DailyRevenueDto
{
    public string Date { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int Orders { get; set; }
}

public interface IStatsService
{
    Task<StatsDto> GetDashboardStatsAsync(DateTime? from, DateTime? to, CancellationToken ct = default);
}
