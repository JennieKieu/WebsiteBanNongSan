using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NaturalStore.Application.Interfaces;

namespace NaturalStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orders;

    public OrdersController(IOrderService orders) => _orders = orders;

    private string? UserId => User?.FindFirstValue(ClaimTypes.NameIdentifier);
    private bool IsAdmin => User?.IsInRole("Admin") ?? false;

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest req, CancellationToken ct)
    {
        var order = await _orders.CreateOrderAsync(UserId!, req.ShippingAddress, ct);
        if (order == null) return BadRequest(new { error = "Giỏ hàng trống." });
        return Ok(order);
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetById(string id, CancellationToken ct)
    {
        var order = await _orders.GetByIdAsync(id, UserId, IsAdmin, ct);
        if (order == null) return NotFound();
        return Ok(order);
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetList([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        if (IsAdmin)
        {
            var orders = await _orders.GetAllOrdersAsync(page, pageSize, ct);
            return Ok(orders);
        }
        var myOrders = await _orders.GetByUserIdAsync(UserId!, ct);
        return Ok(myOrders);
    }
}

public record CreateOrderRequest(string? ShippingAddress);
