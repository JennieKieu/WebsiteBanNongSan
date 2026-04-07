/** Đọc payload JWT (không verify) — chỉ dùng để hiển thị tạm trước khi /users/me xong. */
export function decodeJwtPayload(token: string): { userId: string; role: "Admin" | "Customer" } | null {
  try {
    const body = token.split(".")[1];
    if (!body) return null;
    const padded = body + "=".repeat((4 - (body.length % 4)) % 4);
    const json = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    const p = JSON.parse(json) as { userId?: string; role?: string };
    if (!p.userId) return null;
    return {
      userId: String(p.userId),
      role: p.role === "Admin" ? "Admin" : "Customer",
    };
  } catch {
    return null;
  }
}
