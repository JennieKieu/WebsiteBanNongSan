namespace NaturalStore.Domain.Entities;

public class Contact
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Subject { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = "New"; // New | Read | Replied
    public DateTime CreatedAt { get; set; }
}
