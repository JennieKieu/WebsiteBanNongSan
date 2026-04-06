using MongoDB.Driver;
using NaturalStore.Domain.Entities;

namespace NaturalStore.Infrastructure;

public class MongoDbContext
{
    private readonly IMongoDatabase _db;

    public MongoDbContext(string connectionString, string databaseName = "NaturalStore")
    {
        var client = new MongoClient(connectionString);
        _db = client.GetDatabase(databaseName);
    }

    public IMongoCollection<User> Users => _db.GetCollection<User>("users");
    public IMongoCollection<OtpVerification> OtpVerifications => _db.GetCollection<OtpVerification>("otp_verifications");
    public IMongoCollection<Product> Products => _db.GetCollection<Product>("products");
    public IMongoCollection<Category> Categories => _db.GetCollection<Category>("categories");
    public IMongoCollection<Cart> Carts => _db.GetCollection<Cart>("carts");
    public IMongoCollection<Order> Orders => _db.GetCollection<Order>("orders");
    public IMongoCollection<Banner> Banners => _db.GetCollection<Banner>("banners");
    public IMongoCollection<News> News => _db.GetCollection<News>("news");
    public IMongoCollection<Contact> Contacts => _db.GetCollection<Contact>("contacts");
}
