using Microsoft.AspNetCore.Mvc;
using NaturalStore.Application.Interfaces;
using NaturalStore.Domain.Entities;

namespace NaturalStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactsController : ControllerBase
{
    private readonly IContactService _contacts;

    public ContactsController(IContactService contacts) => _contacts = contacts;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateContactRequest req, CancellationToken ct = default)
    {
        var contact = new Contact
        {
            Name = req.Name,
            Email = req.Email,
            Phone = req.Phone,
            Subject = req.Subject,
            Message = req.Message
        };
        var created = await _contacts.CreateAsync(contact, ct);
        return Ok(created);
    }
}

public record CreateContactRequest(string Name, string Email, string? Phone, string? Subject, string Message);
