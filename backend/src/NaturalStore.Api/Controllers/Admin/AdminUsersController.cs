using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NaturalStore.Application.Interfaces;

namespace NaturalStore.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUserAdminService _users;

    public UsersController(IUserAdminService users) => _users = users;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var items = await _users.GetAllAsync(page, pageSize, ct);
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken ct = default)
    {
        var user = await _users.GetByIdAsync(id, ct);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateUserRequest req, CancellationToken ct = default)
    {
        var (ok, err) = await _users.UpdateAsync(id, req.FirstName, req.LastName, req.Phone, ct);
        if (!ok) return BadRequest(new { error = err });
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct = default)
    {
        var (ok, err) = await _users.DeleteAsync(id, ct);
        if (!ok) return BadRequest(new { error = err });
        return Ok();
    }
}

public record UpdateUserRequest(string? FirstName, string? LastName, string? Phone);
