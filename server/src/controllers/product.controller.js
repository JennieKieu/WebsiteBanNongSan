const mongoose = require("mongoose");
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
const { searchTokenParts, escapeRegex, removeVietnameseTones } = require("../utils/viFold");

/** Danh mục có tên (đã bỏ dấu) chứa đủ từ khoá — để gõ "ngu" vẫn ra sản phẩm nhóm "Ngũ cốc". */
async function categoryIdsMatchingKeywordParts(parts) {
  if (!parts.length) return [];
  const categories = await Category.find({ isActive: true }).select("_id name").lean();
  return categories
    .filter((c) => {
      const folded = removeVietnameseTones(c.name || "");
      return parts.every((p) => folded.includes(p));
    })
    .map((c) => c._id);
}

/** Khớp theo trường đã bỏ dấu HOẶC regex trên trường gốc (fallback khi chưa backfill / seed insertMany). */
function matchFoldedOrRaw(parts, normKey, rawKey, rawValue) {
  if (!parts.length) return null;
  const normClause =
    parts.length === 1
      ? { [normKey]: { $regex: escapeRegex(parts[0]), $options: "i" } }
      : { $and: parts.map((p) => ({ [normKey]: { $regex: escapeRegex(p), $options: "i" } })) };
  return {
    $or: [
      normClause,
      { [rawKey]: { $regex: escapeRegex(rawValue), $options: "i" } },
    ],
  };
}

function matchCertFoldedOrRaw(parts, rawValue) {
  if (!parts.length) return null;
  const normClause =
    parts.length === 1
      ? { certificationsSearch: { $regex: escapeRegex(parts[0]), $options: "i" } }
      : {
          $and: parts.map((p) => ({
            certificationsSearch: { $regex: escapeRegex(p), $options: "i" },
          })),
        };
  return {
    $or: [
      normClause,
      { certifications: { $regex: escapeRegex(rawValue), $options: "i" } },
    ],
  };
}

/** Từ khoá: tên HOẶC mô tả (đã chuẩn hoá + fallback regex trên chuỗi gốc). */
function matchNameOrDescriptionFoldedOrRaw(parts, rawKeyword) {
  if (!parts.length) return null;
  const nameClause = matchFoldedOrRaw(parts, "nameNormalized", "name", rawKeyword);
  const descNormClause =
    parts.length === 1
      ? { descriptionNormalized: { $regex: escapeRegex(parts[0]), $options: "i" } }
      : {
          $and: parts.map((p) => ({
            descriptionNormalized: { $regex: escapeRegex(p), $options: "i" },
          })),
        };
  const descClause = {
    $or: [
      descNormClause,
      { description: { $regex: escapeRegex(rawKeyword), $options: "i" } },
    ],
  };
  return { $or: [nameClause, descClause] };
}

/**
 * Chỉ tìm trong mô tả khi có ít nhất một từ (sau bỏ dấu) đủ dài.
 * Tránh gõ "cai" (3 ký tự) mà khớp "cải thiện" trong mô tả → lẫn cả sản phẩm không liên quan.
 */
function shouldSearchDescription(parts) {
  return parts.some((p) => p.length >= 4);
}

/** $match trong aggregate không tự ép kiểu như find() — ép categoryId nếu có. */
function castCategoryIdForAggregate(q) {
  const out = { ...q };
  if (out.categoryId && mongoose.Types.ObjectId.isValid(String(out.categoryId))) {
    out.categoryId = new mongoose.Types.ObjectId(String(out.categoryId));
  }
  return out;
}

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
  const supplierQ = cleanText(req.query.supplier || "");
  const certQ = cleanText(req.query.certification || "");
  const query = { isActive: true };
  if (req.query.categoryId) query.categoryId = req.query.categoryId;

  const andParts = [];
  if (keyword) {
    const parts = searchTokenParts(keyword);
    let clause = shouldSearchDescription(parts)
      ? matchNameOrDescriptionFoldedOrRaw(parts, keyword)
      : matchFoldedOrRaw(parts, "nameNormalized", "name", keyword);
    if (clause) {
      if (!req.query.categoryId) {
        const catIds = await categoryIdsMatchingKeywordParts(parts);
        if (catIds.length > 0) {
          clause = { $or: [clause, { categoryId: { $in: catIds } }] };
        }
      }
      andParts.push(clause);
    }
  }
  if (supplierQ) {
    const parts = searchTokenParts(supplierQ);
    const clause = matchFoldedOrRaw(parts, "supplierNormalized", "supplier", supplierQ);
    if (clause) andParts.push(clause);
  }
  if (certQ) {
    const parts = searchTokenParts(certQ);
    const clause = matchCertFoldedOrRaw(parts, certQ);
    if (clause) andParts.push(clause);
  }
  if (andParts.length) query.$and = andParts;
  if (req.query.minPrice || req.query.maxPrice) {
    query.price = {};
    if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
  }
  const sortRaw = cleanText(req.query.sort || "newest");
  const sort =
    sortRaw === "price_asc" || sortRaw === "price_desc" ? sortRaw : "newest";
  const priceSort = sort === "price_asc" || sort === "price_desc";

  const total = await Product.countDocuments(query);
  let products;
  if (priceSort) {
    const matchQ = castCategoryIdForAggregate(query);
    const dir = sort === "price_asc" ? 1 : -1;
    const catColl = Category.collection.collectionName;
    products = await Product.aggregate([
      { $match: matchQ },
      {
        $addFields: {
          effectivePrice: { $ifNull: ["$salePrice", "$price"] },
        },
      },
      { $sort: { effectivePrice: dir, _id: 1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: catColl,
          localField: "categoryId",
          foreignField: "_id",
          as: "_categoryDocs",
        },
      },
      { $addFields: { categoryId: { $arrayElemAt: ["$_categoryDocs", 0] } } },
      { $project: { _categoryDocs: 0, effectivePrice: 0 } },
    ]);
  } else {
    products = await Product.find(query)
      .populate("categoryId", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }
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
