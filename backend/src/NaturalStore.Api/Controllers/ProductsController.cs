using Microsoft.AspNetCore.Mvc;
using NaturalStore.Application.Interfaces;

namespace NaturalStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _products;

    public ProductsController(IProductService products) => _products = products;

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] string? search, [FromQuery] string? categoryId, [FromQuery] string? useTag,
        [FromQuery] decimal? minPrice, [FromQuery] decimal? maxPrice, [FromQuery] int page = 1, [FromQuery] int pageSize = 12, CancellationToken ct = default)
    {
        var (items, total) = await _products.GetListAsync(search, categoryId, useTag, minPrice, maxPrice, page, pageSize, ct);
        return Ok(new { items, total });
    }

    [HttpGet("featured")]
    public async Task<IActionResult> GetFeatured([FromQuery] int limit = 8, CancellationToken ct = default)
    {
        var items = await _products.GetFeaturedAsync(limit, ct);
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken ct = default)
    {
        var product = await _products.GetByIdAsync(id, ct);
        if (product == null) return NotFound();
        return Ok(product);
    }

    [HttpGet("slug/{slug}")]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken ct = default)
    {
        var product = await _products.GetBySlugAsync(slug, ct);
        if (product == null) return NotFound();
        return Ok(product);
    }

    [HttpGet("{id}/recommended")]
    public async Task<IActionResult> GetRecommended(string id, [FromQuery] int limit = 4, CancellationToken ct = default)
    {
        var items = await _products.GetRecommendedAsync(id, limit, ct);
        return Ok(items);
    }
}
