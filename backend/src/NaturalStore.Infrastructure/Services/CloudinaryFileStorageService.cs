using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;
using NaturalStore.Application.Interfaces;

namespace NaturalStore.Infrastructure.Services;

public class CloudinaryFileStorageService : IFileStorageService
{
    private readonly Cloudinary _cloudinary;
    private readonly string _folderPrefix;

    public CloudinaryFileStorageService(IConfiguration config)
    {
        var cloudName = config["Cloudinary:CloudName"];
        var apiKey = config["Cloudinary:ApiKey"];
        var apiSecret = config["Cloudinary:ApiSecret"];

        if (string.IsNullOrWhiteSpace(cloudName) || string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(apiSecret))
        {
            throw new InvalidOperationException("Cloudinary is not configured. Please set Cloudinary:CloudName, Cloudinary:ApiKey, Cloudinary:ApiSecret.");
        }

        _cloudinary = new Cloudinary(new Account(cloudName, apiKey, apiSecret))
        {
            Api = { Secure = true }
        };
        _folderPrefix = config["Cloudinary:Folder"] ?? "natural-store";
    }

    public async Task<string> UploadAsync(Stream stream, string fileName, string folder, string contentType, CancellationToken ct = default)
    {
        var result = await UploadImageAsync(stream, fileName, folder, contentType, ct);
        return result.Url;
    }

    public async Task<FileUploadResult> UploadImageAsync(Stream stream, string fileName, string folder, string contentType, CancellationToken ct = default)
    {
        var fullPublicId = $"{_folderPrefix}/{folder}/{Guid.NewGuid():N}";
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(fileName, stream),
            PublicId = fullPublicId,
            UseFilename = false,
            UniqueFilename = false,
            Overwrite = false
        };

        var result = await _cloudinary.UploadAsync(uploadParams, ct);
        if (result.Error is not null || string.IsNullOrWhiteSpace(result.SecureUrl?.ToString()))
        {
            throw new InvalidOperationException($"Cloudinary upload failed: {result.Error?.Message ?? "Unknown error"}");
        }

        return new FileUploadResult(result.SecureUrl.ToString(), result.PublicId ?? fullPublicId);
    }

    public async Task<bool> DeleteAsync(string publicId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(publicId)) return false;
        async Task<bool> DestroyOne(string pid)
        {
            var result = await _cloudinary.DestroyAsync(new DeletionParams(pid)
            {
                ResourceType = ResourceType.Image,
                Invalidate = true
            });
            return result.Result is "ok" or "not found";
        }

        // Primary attempt: delete using stored publicId.
        if (await DestroyOne(publicId)) return true;

        // Backward-compat fallback for old records that may have stored only bare id.
        if (!publicId.Contains('/'))
        {
            if (await DestroyOne($"{_folderPrefix}/products/{publicId}")) return true;
        }

        return false;
    }
}
