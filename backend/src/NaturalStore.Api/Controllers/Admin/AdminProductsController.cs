using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NaturalStore.Application.Interfaces;
using NaturalStore.Domain.Entities;

namespace NaturalStore.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "Admin")]
public class ProductsController : ControllerBase
{
    private readonly IProductAdminService _products;
    private readonly IFileStorageService? _storage;

    public ProductsController(IProductAdminService products, IFileStorageService? storage = null)
    {
        _products = products;
        _storage = storage;
    }

    [HttpGet]
    public async Task<IActionResult> GetList(
        [FromQuery] string? search,
        [FromQuery] string? categoryId,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var (items, total) = await _products.GetListAsync(search, categoryId, isActive, page, pageSize, ct);
        return Ok(new { items, total });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken ct = default)
    {
        var item = await _products.GetByIdAsync(id, ct);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Product product, CancellationToken ct = default)
    {
        var created = await _products.CreateAsync(product, ct);
        return Ok(created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] Product product, CancellationToken ct = default)
    {
        var (ok, err) = await _products.UpdateAsync(id, product, ct);
        if (!ok) return BadRequest(new { error = err });
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct = default)
    {
        var (ok, err) = await _products.DeleteAsync(id, ct);
        if (!ok) return BadRequest(new { error = err });
        return Ok();
    }

    [HttpPatch("{id}/stock")]
    public async Task<IActionResult> UpdateStock(string id, [FromBody] UpdateStockRequest req, CancellationToken ct = default)
    {
        var (ok, err) = await _products.UpdateStockAsync(id, req.Stock, ct);
        if (!ok) return BadRequest(new { error = err });
        return Ok();
    }

    [HttpPost("upload-image")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> UploadImage([FromForm] IFormFile file, CancellationToken ct = default)
    {
        if (_storage == null)
            return BadRequest(new { error = "Cloudinary chưa được cấu hình." });

        if (file == null || file.Length == 0)
            return BadRequest(new { error = "Vui lòng chọn tệp ảnh." });

        var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? "";
        var allowed = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp" };
        if (!allowed.Contains(ext))
            return BadRequest(new { error = "Chỉ hỗ trợ ảnh: jpg, jpeg, png, gif, webp, bmp." });

        try
        {
            await using var stream = file.OpenReadStream();
            var result = await _storage.UploadImageAsync(stream, file.FileName, "products", file.ContentType ?? "application/octet-stream", ct);
            return Ok(new { url = result.Url, publicId = result.PublicId });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = $"Upload Cloudinary thất bại: {ex.Message}" });
        }
    }
}

public record UpdateStockRequest(int Stock);
