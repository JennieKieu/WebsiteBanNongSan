namespace NaturalStore.Application.Interfaces;

public class ChatResponse
{
    public string Message { get; set; } = string.Empty;
    public List<RecommendedProduct>? RecommendedProducts { get; set; }
    public string? ComboSuggestion { get; set; }
    public string? FollowUpQuestion { get; set; }
}

public class RecommendedProduct
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
}

public interface IChatbotService
{
    Task<ChatResponse> ChatAsync(string userMessage, string? conversationId, CancellationToken ct = default);
}
