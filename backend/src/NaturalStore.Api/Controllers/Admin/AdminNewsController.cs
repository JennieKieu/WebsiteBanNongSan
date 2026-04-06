using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NaturalStore.Application.Interfaces;
using NaturalStore.Domain.Entities;

namespace NaturalStore.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "Admin")]
public class NewsController : ControllerBase
{
    private readonly INewsService _news;

    public NewsController(INewsService news) => _news = news;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var items = await _news.GetAllAdminAsync(page, pageSize, ct);
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] News news, CancellationToken ct = default)
    {
        var created = await _news.CreateAsync(news, ct);
        return Ok(created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] News news, CancellationToken ct = default)
    {
        var (ok, err) = await _news.UpdateAsync(id, news, ct);
        if (!ok) return BadRequest(new { error = err });
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct = default)
    {
        var (ok, err) = await _news.DeleteAsync(id, ct);
        if (!ok) return BadRequest(new { error = err });
        return Ok();
    }
}
