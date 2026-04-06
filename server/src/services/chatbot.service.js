const OpenAI = require("openai");
const { Product, ProductBatch } = require("../models");
const { refreshBatchStatuses, sumAvailableStockForProductIds } = require("./inventory.service");
const env = require("../config/env");

function normalize(text) {
  return (text || "").toLowerCase();
}

/** Sản phẩm đang bán, còn tồn theo FEFO, có lô chưa hết hạn — dùng cho OpenAI và mock. */
async function buildEligibleCatalog(maxScan = 150) {
  const products = await Product.find({ isActive: true })
    .sort({ soldCount: -1, ratingAvg: -1 })
    .limit(maxScan)
    .lean();

  await refreshBatchStatuses();
  const stockMap = await sumAvailableStockForProductIds(products.map((p) => p._id));

  const rows = [];
  for (const product of products) {
    const stock = stockMap.get(product._id.toString()) || 0;
    if (stock <= 0) continue;
    const nextBatch = await ProductBatch.findOne({
      productId: product._id,
      expiryDate: { $gt: new Date() },
      quantityInStock: { $gt: 0 },
      isDisabled: { $ne: true },
    })
      .sort({ expiryDate: 1 })
      .lean();
    if (!nextBatch) continue;
    const desc = (product.description || "").replace(/\s+/g, " ").trim().slice(0, 280);
    rows.push({
      productId: product._id.toString(),
      name: product.name,
      description: desc,
      unit: product.unit,
      price: product.salePrice ?? product.price,
      supplier: product.supplier || "",
      certifications: product.certifications || [],
      stock,
      expiryDate: new Date(nextBatch.expiryDate).toISOString().slice(0, 10),
    });
  }
  return rows;
}

async function suggestProductsMock(message, maxItems = 5) {
  const q = normalize(message);
  const certifications = [];
  if (q.includes("hữu cơ") || q.includes("organic")) certifications.push("hữu cơ", "VietGAP");
  if (q.includes("vietgap")) certifications.push("VietGAP");
  if (q.includes("globalgap")) certifications.push("GlobalGAP");

  const products = await Product.find({
    isActive: true,
    ...(certifications.length ? { certifications: { $in: certifications } } : {}),
  })
    .sort({ soldCount: -1, ratingAvg: -1 })
    .limit(30);

  await refreshBatchStatuses();
  const stockMap = await sumAvailableStockForProductIds(products.map((p) => p._id));

  const recommendations = [];
  for (const product of products) {
    const stock = stockMap.get(product._id.toString()) || 0;
    if (stock <= 0) continue;
    const nextBatch = await ProductBatch.findOne({
      productId: product._id,
      expiryDate: { $gt: new Date() },
      quantityInStock: { $gt: 0 },
      isDisabled: { $ne: true },
    }).sort({ expiryDate: 1 });
    if (!nextBatch) continue;
    const supplierLc = (product.supplier || "").toLowerCase();
    const matchScore =
      (supplierLc && q.includes(supplierLc) ? 0.25 : 0) +
      (q.includes("ép") || q.includes("juice") ? 0.15 : 0) +
      (q.includes("eat clean") || q.includes("healthy") || q.includes("giảm cân") || q.includes("an kieng") ? 0.2 : 0) +
      0.4;

    recommendations.push({
      productId: product._id.toString(),
      name: product.name,
      unit: product.unit,
      price: product.salePrice || product.price,
      supplier: product.supplier || "",
      expiryInfo: `HSD: ${nextBatch.expiryDate.toISOString().slice(0, 10)}`,
      reason: `Phù hợp vì còn hàng, nhà cung cấp ${product.supplier || "—"}.`,
      matchScore: Math.min(1, Number(matchScore.toFixed(2))),
    });
  }

  const top = recommendations.sort((a, b) => b.matchScore - a.matchScore).slice(0, maxItems);
  if (!top.length) {
    return {
      answer:
        "Hiện chưa có sản phẩm đủ điều kiện (còn hàng, còn hạn). Bạn có thể nới lỏng tiêu chí (chứng nhận, nhóm hàng) để mình gợi ý thêm.",
      recommendations: [],
      followUpQuestions: ["Bạn ưu tiên nhóm sản phẩm nào: rau, củ, quả hay ngũ cốc?"],
      actions: [{ type: "relax_filters", label: "Nới điều kiện" }],
    };
  }

  return {
    answer: "Đây là các gợi ý từ tồn kho thực tế, ưu tiên sản phẩm còn hạn và còn hàng.",
    recommendations: top,
    followUpQuestions: ["Bạn muốn ưu tiên hữu cơ hay giá tối ưu?", "Bạn dự định dùng trong bao lâu?"],
    actions: [
      { type: "view_detail", label: "Xem chi tiết" },
      { type: "add_to_cart", label: "Thêm vào giỏ" },
      { type: "add_to_wishlist", label: "Lưu wishlist" },
    ],
  };
}

/**
 * OpenAI: chỉ được chọn productId có trong catalog; trả JSON.
 */
async function suggestWithOpenAI(message, catalog, maxItems) {
  const validIds = new Set(catalog.map((c) => c.productId));
  const model =
    env.aiModel && env.aiModel !== "mock" ? env.aiModel : "gpt-4o-mini";

  const client = new OpenAI({ apiKey: env.aiApiKey });
  const catalogPayload = catalog.map((c) => ({
    productId: c.productId,
    name: c.name,
    description: c.description,
    unit: c.unit,
    priceVnd: c.price,
    supplier: c.supplier,
    certifications: c.certifications,
    stock: c.stock,
    expiryDate: c.expiryDate,
  }));

  const system = `Bạn là trợ lý tư vấn nông sản/thực phẩm của cửa hàng trực tuyến. Luôn trả lời bằng tiếng Việt, ngắn gọn, thân thiện.

DANH SÁCH SẢN PHẨM ĐANG CÓ HÀNG (JSON). Bạn CHỈ ĐƯỢC gợi ý sản phẩm có \`productId\` nằm trong danh sách này. Không bịa sản phẩm hay giá.

${JSON.stringify(catalogPayload)}

Nhiệm vụ: Đọc nhu cầu khách, chọn tối đa ${maxItems} sản phẩm phù hợp nhất (dựa trên tên, mô tả, chứng nhận, nhà cung cấp, ngữ cảnh như giảm cân, hữu cơ, nấu ăn...).

Trả về DUY NHẤT một object JSON (không markdown), đúng schema:
{
  "answer": "string — lời trả lời tự nhiên cho khách",
  "recommendations": [
    {
      "productId": "string — phải trùng một productId trong danh sách",
      "name": "string — tên đúng như trong danh sách",
      "reason": "string — 1–2 câu tiếng Việt vì sao phù hợp",
      "matchScore": 0.0 đến 1.0
    }
  ]
}

Nếu không có sản phẩm phù hợp: recommendations = [] và answer giải thích nhẹ nhàng, gợi khách nói rõ hơn.`;

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: message },
    ],
    temperature: 0.45,
    max_tokens: 1200,
  });

  const text = completion.choices[0]?.message?.content || "{}";
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("OPENAI_INVALID_JSON");
  }

  const rawRecs = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
  const byId = Object.fromEntries(catalog.map((c) => [c.productId, c]));

  const recommendations = [];
  const seen = new Set();
  for (const r of rawRecs) {
    const id = r.productId && String(r.productId);
    if (!id || !validIds.has(id) || seen.has(id)) continue;
    seen.add(id);
    const c = byId[id];
    recommendations.push({
      productId: c.productId,
      name: c.name,
      unit: c.unit,
      price: c.price,
      supplier: c.supplier,
      expiryInfo: `HSD: ${c.expiryDate}`,
      reason: typeof r.reason === "string" && r.reason.trim() ? r.reason.trim() : "Phù hợp với nhu cầu bạn mô tả.",
      matchScore: Math.min(1, Math.max(0, Number(r.matchScore) || 0.75)),
    });
    if (recommendations.length >= maxItems) break;
  }

  return {
    answer:
      typeof parsed.answer === "string" && parsed.answer.trim()
        ? parsed.answer.trim()
        : "Cảm ơn bạn đã hỏi. Dưới đây là một số gợi ý từ kho hàng hiện có.",
    recommendations,
    followUpQuestions: [
      "Bạn có ngân sách hoặc khẩu vị cụ thể không?",
      "Bạn cần dùng trong bao nhiêu ngày?",
    ],
    actions: [
      { type: "view_detail", label: "Xem chi tiết" },
      { type: "add_to_cart", label: "Thêm vào giỏ" },
      { type: "add_to_wishlist", label: "Lưu wishlist" },
    ],
  };
}

/**
 * Entry: OpenAI nếu AI_PROVIDER=openai và có AI_API_KEY; ngược lại dùng mock.
 */
async function suggestProducts(message, maxItems = 5) {
  const providerLc = (env.aiProvider || "").toLowerCase();
  const hasKey = Boolean(env.aiApiKey);
  const useOpenAI = providerLc === "openai" && hasKey;

  if (useOpenAI) {
    try {
      const catalog = await buildEligibleCatalog(180);
      if (!catalog.length) {
        console.info("[chatbot] OpenAI: catalog rỗng (không có SP đủ tồn/hạn), trả lời cố định — không gọi API.");
        return {
          answer:
            "Hiện cửa hàng chưa có sản phẩm nào đủ tồn kho để gợi ý. Vui lòng quay lại sau hoặc xem mục Sản phẩm trên website.",
          recommendations: [],
          followUpQuestions: [],
          actions: [],
        };
      }
      const maxCatalogForContext = 55;
      const sliced = catalog.slice(0, maxCatalogForContext);
      const model = env.aiModel && env.aiModel !== "mock" ? env.aiModel : "gpt-4o-mini";
      console.info("[chatbot] đang gọi OpenAI…", { model, catalogItems: sliced.length });
      const out = await suggestWithOpenAI(message, sliced, maxItems);
      console.info("[chatbot] OpenAI xong, gợi ý:", out.recommendations?.length ?? 0, "sản phẩm");
      return out;
    } catch (err) {
      console.error("[chatbot] OpenAI lỗi → fallback mock:", err.message || err);
    }
  }

  return suggestProductsMock(message, maxItems);
}

module.exports = { suggestProducts, buildEligibleCatalog };
