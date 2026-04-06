import { useRef, useState } from "react";
import { HiOutlinePhoto, HiOutlineTrash, HiOutlinePlus } from "react-icons/hi2";
import http from "../api/http";

export type ImageData = { secure_url: string; public_id?: string };

type Props = {
  value: ImageData[];
  onChange: (images: ImageData[]) => void;
  folder?: string;
  label?: string;
  maxImages?: number;
};

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

export default function ImageUploadMulti({
  value,
  onChange,
  folder = "products",
  label = "Hình ảnh sản phẩm",
  maxImages = 10,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadFile(file: File): Promise<ImageData> {
    const fd = new FormData();
    fd.append("image", file);
    const res = await http.post(`/admin/upload?folder=${encodeURIComponent(folder)}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setError("");
    const room = maxImages - value.length;
    if (room <= 0) {
      setError(`Tối đa ${maxImages} ảnh`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const toUpload = files.slice(0, room);
    for (const file of toUpload) {
      if (!ALLOWED.includes(file.type)) {
        setError("Chỉ chấp nhận JPEG, PNG, WebP, GIF");
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("Mỗi file tối đa 5MB");
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
    }

    setUploading(true);
    try {
      const next = [...value];
      for (const file of toUpload) {
        if (next.length >= maxImages) break;
        const img = await uploadFile(file);
        next.push(img);
      }
      onChange(next);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setError(ax.response?.data?.message || "Upload thất bại");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removeAt(index: number) {
    const img = value[index];
    if (img?.public_id) {
      await http.post("/admin/delete-image", { public_id: img.public_id }).catch(() => {});
    }
    onChange(value.filter((_, i) => i !== index));
  }

  const canAdd = value.length < maxImages;

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <p className="text-muted" style={{ fontSize: "0.8125rem", margin: "0 0 10px" }}>
        Có thể chọn nhiều ảnh cùng lúc (tối đa {maxImages} ảnh, mỗi ảnh ≤ 5MB).
      </p>
      <div className="image-upload-multi-grid">
        {value.map((img, index) => (
          <div key={`${img.public_id || img.secure_url}-${index}`} className="image-upload-multi-item">
            <img src={img.secure_url} alt="" />
            <button
              type="button"
              className="image-upload-multi-remove"
              title="Xoá ảnh"
              onClick={() => removeAt(index)}
              disabled={uploading}
            >
              <HiOutlineTrash />
            </button>
            {index === 0 && <span className="image-upload-multi-badge">Ảnh bìa</span>}
          </div>
        ))}
        {canAdd && (
          <button
            type="button"
            className="image-upload-multi-add"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <span className="text-muted">Đang tải…</span>
            ) : (
              <>
                <HiOutlinePlus />
                <HiOutlinePhoto />
                <span>Thêm ảnh</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(",")}
        multiple
        style={{ display: "none" }}
        onChange={handleFiles}
      />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
