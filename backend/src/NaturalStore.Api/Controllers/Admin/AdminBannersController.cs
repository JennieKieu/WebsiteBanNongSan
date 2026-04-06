using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NaturalStore.Application.Interfaces;
using NaturalStore.Domain.Entities;

namespace NaturalStore.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "Admin")]
public class BannersController : ControllerBase
{
    private readonly IBannerService _banners;

    public BannersController(IBannerService banners) => _banners = banners;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
    {
        var items = await _banners.GetAllAsync(ct);
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Banner banner, CancellationToken ct = default)
    {
        var created = await _banners.CreateAsync(banner, ct);
        return Ok(created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] Banner banner, CancellationToken ct = default)
    {
        var (ok, err) = await _banners.UpdateAsync(id, banner, ct);
        if (!ok) return BadRequest(new { error = err });
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct = default)
    {
        var (ok, err) = await _banners.DeleteAsync(id, ct);
        if (!ok) return BadRequest(new { error = err });
        return Ok();
    }
}
