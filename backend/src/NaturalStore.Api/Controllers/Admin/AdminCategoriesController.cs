using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NaturalStore.Application.Interfaces;
using NaturalStore.Domain.Entities;

namespace NaturalStore.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "Admin")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categories;

    public CategoriesController(ICategoryService categories) => _categories = categories;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] bool? isActive, CancellationToken ct = default)
    {
        var items = await _categories.GetAllAsync(search, isActive, ct);
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken ct = default)
    {
        var cat = await _categories.GetByIdAsync(id, ct);
        if (cat == null) return NotFound();
        return Ok(cat);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Category category, CancellationToken ct = default)
    {
        var created = await _categories.CreateAsync(category, ct);
        return Ok(created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] Category category, CancellationToken ct = default)
    {
        var (ok, err) = await _categories.UpdateAsync(id, category, ct);
        if (!ok) return BadRequest(new { error = err });
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct = default)
    {
        var (ok, err) = await _categories.DeleteAsync(id, ct);
        if (!ok) return BadRequest(new { error = err });
        return Ok();
    }
}
