/** Số nguyên dạng VN: dấu chấm phân cách nghìn (100.000) */

export function parseVnInteger(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, "");
  if (s === "") return null;
  const digits = s.replace(/\./g, "").replace(/\D/g, "");
  if (digits === "") return null;
  const n = parseInt(digits, 10);
  return Number.isNaN(n) ? null : n;
}

export function formatVnInteger(n: number): string {
  if (!Number.isFinite(n)) return "";
  const x = Math.trunc(n);
  const neg = x < 0;
  const abs = String(Math.abs(x));
  const withDots = abs.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return neg ? `-${withDots}` : withDots;
}

/** Cho phép gõ: chữ số và dấu chấm (phân cách nghìn) */
export function sanitizeVnIntegerTyping(raw: string): string {
  return raw.replace(/[^\d.]/g, "");
}
