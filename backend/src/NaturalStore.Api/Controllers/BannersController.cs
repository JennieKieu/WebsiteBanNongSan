using Microsoft.AspNetCore.Mvc;
using NaturalStore.Application.Interfaces;

namespace NaturalStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BannersController : ControllerBase
{
    private readonly IBannerService _banners;

    public BannersController(IBannerService banners) => _banners = banners;

    [HttpGet]
    public async Task<IActionResult> GetActive(CancellationToken ct = default)
    {
        var items = await _banners.GetActiveAsync(ct);
        return Ok(items);
    }
}
