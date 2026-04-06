/** Luôn hiển thị theo giờ Việt Nam, kể cả khi trình duyệt/máy chủ ở múi khác. */
export const VN_TIMEZONE = "Asia/Ho_Chi_Minh";

const baseOpts: Intl.DateTimeFormatOptions = { timeZone: VN_TIMEZONE };

export function formatDateTimeVN(input: string | Date | number | undefined | null): string {
  if (input == null || input === "") return "—";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    ...baseOpts,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatDateVN(input: string | Date | number | undefined | null): string {
  if (input == null || input === "") return "—";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", { ...baseOpts });
}
