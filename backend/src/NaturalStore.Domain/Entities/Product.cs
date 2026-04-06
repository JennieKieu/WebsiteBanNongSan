namespace NaturalStore.Domain.Entities;

public class Product
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public string? ImageUrl { get; set; }
    public List<string> ImageUrls { get; set; } = new();
    public List<string> ImagePublicIds { get; set; } = new();
    public string CategoryId { get; set; } = string.Empty;
    public string? CategoryName { get; set; }
    public List<string> UseTags { get; set; } = new(); // giảm cân, đẹp da, tiểu đường...
    public bool IsFeatured { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
