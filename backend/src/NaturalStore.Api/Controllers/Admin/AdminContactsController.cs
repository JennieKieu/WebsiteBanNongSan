using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NaturalStore.Application.Interfaces;

namespace NaturalStore.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "Admin")]
public class ContactsController : ControllerBase
{
    private readonly IContactService _contacts;

    public ContactsController(IContactService contacts) => _contacts = contacts;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var items = await _contacts.GetAllAsync(page, pageSize, ct);
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken ct = default)
    {
        var item = await _contacts.GetByIdAsync(id, ct);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] AdminUpdateStatusRequest req, CancellationToken ct = default)
    {
        var (ok, err) = await _contacts.UpdateStatusAsync(id, req.Status, ct);
        if (!ok) return BadRequest(new { error = err });
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct = default)
    {
        var (ok, err) = await _contacts.DeleteAsync(id, ct);
        if (!ok) return BadRequest(new { error = err });
        return Ok();
    }
}

public record AdminUpdateStatusRequest(string Status);
