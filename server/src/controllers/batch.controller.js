const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { ProductBatch, Order } = require("../models");
const { refreshBatchStatuses } = require("../services/inventory.service");

async function batchHasOrders(batchId) {
  const count = await Order.countDocuments({
    "allocations.batchId": batchId,
    status: { $nin: ["Cancelled"] },
  });
  return count > 0;
}

exports.adminNearExpiry = asyncHandler(async (_req, res) => {
  await refreshBatchStatuses();
  const data = await ProductBatch.find({ status: "NearExpiry" }).populate("productId", "name");
  res.json({ data });
});

exports.listBatches = asyncHandler(async (_req, res) => {
  await refreshBatchStatuses();
  const batches = await ProductBatch.find({}).sort({ createdAt: -1 }).lean();
  const batchIds = batches.map((b) => b._id);

  const ordersWithBatches = await Order.aggregate([
    { $match: { "allocations.batchId": { $in: batchIds }, status: { $nin: ["Cancelled"] } } },
    { $unwind: "$allocations" },
    { $match: { "allocations.batchId": { $in: batchIds } } },
    { $group: { _id: "$allocations.batchId" } },
  ]);
  const usedBatchIds = new Set(ordersWithBatches.map((o) => o._id.toString()));

  const result = batches.map((b) => ({ ...b, hasOrders: usedBatchIds.has(b._id.toString()) }));
  res.json({ data: result });
});

exports.createBatch = asyncHandler(async (req, res) => {
  const data = await ProductBatch.create(req.body);
  res.status(201).json({ data });
});

exports.updateBatch = asyncHandler(async (req, res) => {
  const batch = await ProductBatch.findById(req.params.id);
  if (!batch) throw new AppError("NOT_FOUND", "Không tìm thấy lô hàng", 404);
  if (await batchHasOrders(batch._id))
    throw new AppError(
      "BATCH_HAS_ORDERS",
      "Lô hàng đã phát sinh đơn hàng, không thể chỉnh sửa. Chỉ có thể vô hiệu hoá.",
      400
    );
  Object.assign(batch, req.body);
  await batch.save();
  res.json({ data: batch });
});

exports.deleteBatch = asyncHandler(async (req, res) => {
  const batch = await ProductBatch.findById(req.params.id);
  if (!batch) throw new AppError("NOT_FOUND", "Không tìm thấy lô hàng", 404);
  if (await batchHasOrders(batch._id))
    throw new AppError("BATCH_HAS_ORDERS", "Lô hàng đã phát sinh đơn hàng, không thể xoá.", 400);
  await ProductBatch.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

exports.toggleBatchDisabled = asyncHandler(async (req, res) => {
  const batch = await ProductBatch.findById(req.params.id);
  if (!batch) throw new AppError("NOT_FOUND", "Không tìm thấy lô hàng", 404);
  batch.isDisabled = !batch.isDisabled;
  await batch.save();
  res.json({
    message: batch.isDisabled ? "Lô hàng đã bị vô hiệu hoá" : "Lô hàng đã được kích hoạt lại",
    data: batch,
  });
});
