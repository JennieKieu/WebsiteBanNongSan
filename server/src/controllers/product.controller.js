const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { Product, ProductBatch } = require("../models");
const {
  getAvailableStock,
  sumAvailableStockForProductIds,
  refreshBatchStatuses,
} = require("../services/inventory.service");
const { Category, Banner } = require("../models");
const { cleanText } = require("./helpers");

exports.listCategories = asyncHandler(async (_req, res) => {
  const data = await Category.find({ isActive: true }).sort({ name: 1 });
  res.json({ data });
});

exports.listBanners = asyncHandler(async (_req, res) => {
  const data = await Banner.find({ isActive: true }).sort({ createdAt: -1 }).limit(8);
  res.json({ data });
});

exports.listProducts = asyncHandler(async (req, res) => {
  await refreshBatchStatuses();
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 12);
  const skip = (page - 1) * limit;
  const keyword = cleanText(req.query.keyword || "");
  const query = { isActive: true };
  if (req.query.categoryId) query.categoryId = req.query.categoryId;
  const supplierQ = cleanText(req.query.supplier || "");
  if (supplierQ) query.supplier = { $regex: supplierQ, $options: "i" };
  if (req.query.certification) query.certifications = { $in: [req.query.certification] };
  if (keyword) query.name = { $regex: keyword, $options: "i" };
  if (req.query.minPrice || req.query.maxPrice) {
    query.price = {};
    if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
  }
  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate("categoryId", "name slug")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const stockMap = await sumAvailableStockForProductIds(products.map((p) => p._id));
  for (const p of products) p.availableStock = stockMap.get(p._id.toString()) || 0;
  res.json({ data: products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

exports.productDetail = asyncHandler(async (req, res) => {
  await refreshBatchStatuses();
  const product = await Product.findById(req.params.id).populate("categoryId", "name slug");
  if (!product) throw new AppError("NOT_FOUND", "Không tìm thấy sản phẩm", 404);
  const batches = await ProductBatch.find({ productId: product._id }).sort({ expiryDate: 1 }).limit(8);
  const availableStock = await getAvailableStock(product._id);

  const related = await Product.find({
    _id: { $ne: product._id },
    isActive: true,
    categoryId: product.categoryId?._id || product.categoryId,
  })
    .limit(8)
    .lean();
  const relatedStockMap = await sumAvailableStockForProductIds(related.map((r) => r._id));
  for (const r of related) r.availableStock = relatedStockMap.get(r._id.toString()) || 0;

  res.json({ data: { ...product.toObject(), batches, availableStock, relatedProducts: related } });
});

exports.adminProductById = asyncHandler(async (req, res) => {
  await refreshBatchStatuses();
  const product = await Product.findById(req.params.id).populate("categoryId", "name slug").lean();
  if (!product) throw new AppError("NOT_FOUND", "Không tìm thấy sản phẩm", 404);
  const batches = await ProductBatch.find({ productId: product._id }).sort({ expiryDate: 1 }).lean();
  const availableStock = await getAvailableStock(product._id);
  res.json({ data: { ...product, batches, availableStock } });
});
