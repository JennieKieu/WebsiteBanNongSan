using Microsoft.AspNetCore.Mvc;
using NaturalStore.Application.Interfaces;

namespace NaturalStore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatbotController : ControllerBase
{
    private readonly IChatbotService _chatbot;

    public ChatbotController(IChatbotService chatbot) => _chatbot = chatbot;

    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] ChatRequest req, CancellationToken ct = default)
    {
        var response = await _chatbot.ChatAsync(req.Message, req.ConversationId, ct);
        return Ok(response);
    }
}

public record ChatRequest(string Message, string? ConversationId);
