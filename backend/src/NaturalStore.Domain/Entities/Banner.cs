namespace NaturalStore.Domain.Entities;

public class Banner
{
    public string Id { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string? ProductId { get; set; }
    public string? LinkUrl { get; set; }
    public string? Title { get; set; }
    public int Order { get; set; }
    public bool IsActive { get; set; } = true;
}
