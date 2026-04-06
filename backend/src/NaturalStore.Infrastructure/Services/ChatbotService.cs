using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using MongoDB.Driver;
using NaturalStore.Application.Interfaces;
using NaturalStore.Domain.Entities;
using NaturalStore.Infrastructure;

namespace NaturalStore.Infrastructure.Services;

public class ChatbotService : IChatbotService
{
    private readonly MongoDbContext _db;
    private readonly IConfiguration _config;
    private readonly IProductService _productService;
    private readonly IHttpClientFactory _httpFactory;

    private static readonly Dictionary<string, string[]> UseTagKeywords = new(StringComparer.OrdinalIgnoreCase)
    {
        ["giảm cân"] = new[] { "giảm cân", "ăn kiêng", "ít calo" },
        ["đẹp da"] = new[] { "đẹp da", "vitamin c", "chống lão hóa" },
        ["tiểu đường"] = new[] { "tiểu đường", "ít đường", "chỉ số đường huyết thấp" },
        ["tăng cường miễn dịch"] = new[] { "miễn dịch", "vitamin", "antioxidant" },
        ["tốt cho tim"] = new[] { "tim mạch", "omega", "cholesterol" },
        ["sinh tố"] = new[] { "sinh tố", "nước ép", "smoothie" }
    };

    public ChatbotService(MongoDbContext db, IConfiguration config, IProductService productService, IHttpClientFactory httpFactory)
    {
        _db = db;
        _config = config;
        _productService = productService;
        _httpFactory = httpFactory;
    }

    public async Task<ChatResponse> ChatAsync(string userMessage, string? conversationId, CancellationToken ct = default)
    {
        var apiKey = _config["OpenAI:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
            return new ChatResponse { Message = "Tính năng tư vấn AI đang tạm bảo trì. Vui lòng liên hệ hotline." };

        var matchedTags = ResolveUseTags(userMessage);
        List<Product> products;
        if (matchedTags.Count > 0)
        {
            var filter = Builders<Product>.Filter.And(
                Builders<Product>.Filter.Eq(x => x.IsActive, true),
                Builders<Product>.Filter.AnyIn(x => x.UseTags, matchedTags));
            products = await _db.Products.Find(filter).Limit(20).ToListAsync(ct);
        }
        else
        {
            var search = userMessage.Trim();
            if (search.Length > 2)
            {
                var (items, _) = await _productService.GetListAsync(search, null, null, null, null, 1, 20, ct);
                products = items;
            }
            else
                products = await _productService.GetFeaturedAsync(20, ct);
        }

        var productContext = BuildProductContext(products);
        var systemPrompt = BuildSystemPrompt(productContext);

        var payload = new
        {
            model = "gpt-4o-mini",
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userMessage }
            },
            max_tokens = 500
        };

        var client = _httpFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

        try
        {
            var response = await client.PostAsJsonAsync("https://api.openai.com/v1/chat/completions", payload, ct);
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
            var text = json.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "Xin lỗi, tôi không thể trả lời.";
            var recommended = products.Take(4).Select(p => new RecommendedProduct
            {
                Id = p.Id,
                Name = p.Name,
                Price = p.Price,
                ImageUrl = p.ImageUrl ?? p.ImageUrls.FirstOrDefault()
            }).ToList();

            return new ChatResponse
            {
                Message = text.Trim(),
                RecommendedProducts = recommended,
                ComboSuggestion = products.Count >= 2 ? $"Gợi ý combo: {products[0].Name} kết hợp {products[1].Name} làm sinh tố rất ngon và bổ dưỡng." : null
            };
        }
        catch (Exception)
        {
            return new ChatResponse { Message = "Đã xảy ra lỗi khi xử lý. Vui lòng thử lại sau." };
        }
    }

    private static List<string> ResolveUseTags(string message)
    {
        var lower = message.ToLowerInvariant();
        var result = new List<string>();
        foreach (var (tag, keywords) in UseTagKeywords)
        {
            if (keywords.Any(k => lower.Contains(k)))
                result.Add(tag);
        }
        return result;
    }

    private static string BuildProductContext(List<Product> products)
    {
        if (products.Count == 0)
            return "Hiện không có sản phẩm phù hợp trong kho.";
        var sb = new StringBuilder();
        foreach (var p in products)
        {
            sb.AppendLine($"- {p.Name} (ID:{p.Id}): {p.Price:N0}đ. Công dụng: {string.Join(", ", p.UseTags)}");
        }
        return sb.ToString();
    }

    private static string BuildSystemPrompt(string productContext)
    {
        return $@"Bạn là nhân viên tư vấn nông sản của Natural Store.
Nhiệm vụ:
- Tư vấn sản phẩm phù hợp cho khách hàng dựa trên dữ liệu sản phẩm được cung cấp.
- Ưu tiên trả lời ngắn gọn, rõ ràng, thân thiện, đúng ngữ cảnh mua hàng.
- Nếu khách nêu nhu cầu sức khỏe như giảm cân, đẹp da, tiểu đường..., chỉ gợi ý các sản phẩm có tag phù hợp trong dữ liệu.
- Không bịa thông tin ngoài dữ liệu sản phẩm.
- Nếu chưa đủ dữ liệu, hãy hỏi thêm 1 câu ngắn để làm rõ nhu cầu.
- Khi phù hợp, hãy gợi ý 2-4 sản phẩm và có thể gợi ý combo sinh tố/nước ép.

DỮ LIỆU SẢN PHẨM:
{productContext}
Hãy trả lời bằng tiếng Việt.";
    }
}
