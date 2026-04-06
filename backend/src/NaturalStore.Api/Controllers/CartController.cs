using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NaturalStore.Application.Interfaces;

namespace NaturalStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CartController : ControllerBase
{
    private readonly ICartService _cart;

    public CartController(ICartService cart) => _cart = cart;

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var cart = await _cart.GetByUserIdAsync(UserId, ct);
        return Ok(cart ?? new Domain.Entities.Cart { Id = "", UserId = UserId, Items = new(), UpdatedAt = DateTime.UtcNow });
    }

    [HttpPost("items")]
    public async Task<IActionResult> AddItem([FromBody] CartItemRequest req, CancellationToken ct)
    {
        try
        {
            var cart = await _cart.AddItemAsync(UserId, req.ProductId, req.Quantity, ct);
            return Ok(cart);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("items/{productId}")]
    public async Task<IActionResult> UpdateQuantity(string productId, [FromBody] UpdateQuantityRequest req, CancellationToken ct)
    {
        var cart = await _cart.UpdateQuantityAsync(UserId, productId, req.Quantity, ct);
        if (cart == null) return NotFound();
        return Ok(cart);
    }

    [HttpDelete("items/{productId}")]
    public async Task<IActionResult> RemoveItem(string productId, CancellationToken ct)
    {
        var cart = await _cart.RemoveItemAsync(UserId, productId, ct);
        if (cart == null) return NotFound();
        return Ok(cart);
    }
}

public record CartItemRequest(string ProductId, int Quantity);
public record UpdateQuantityRequest(int Quantity);
