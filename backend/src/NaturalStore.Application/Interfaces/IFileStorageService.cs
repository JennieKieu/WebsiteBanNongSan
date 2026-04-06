namespace NaturalStore.Application.Interfaces;

public record FileUploadResult(string Url, string PublicId);

public interface IFileStorageService
{
    Task<FileUploadResult> UploadImageAsync(Stream stream, string fileName, string folder, string contentType, CancellationToken ct = default);
    Task<string> UploadAsync(Stream stream, string fileName, string folder, string contentType, CancellationToken ct = default);
    Task<bool> DeleteAsync(string publicId, CancellationToken ct = default);
}
