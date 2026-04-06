import { useRef, useState } from "react";
import { HiOutlinePhoto, HiOutlineTrash, HiOutlineArrowUpTray } from "react-icons/hi2";
import http from "../api/http";

type ImageData = { secure_url: string; public_id?: string };

type Props = {
  value: ImageData | null;
  onChange: (img: ImageData | null) => void;
  folder?: string;
  label?: string;
};

export default function ImageUpload({ value, onChange, folder = "general", label = "Hình ảnh" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setError("Chỉ chấp nhận JPEG, PNG, WebP, GIF");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File tối đa 5MB");
      return;
    }

    setError("");
    setUploading(true);

    try {
      if (value?.public_id) {
        await http.post("/admin/delete-image", { public_id: value.public_id }).catch(() => {});
      }

      const fd = new FormData();
      fd.append("image", file);
      const res = await http.post(`/admin/upload?folder=${folder}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Upload thất bại");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (value?.public_id) {
      await http.post("/admin/delete-image", { public_id: value.public_id }).catch(() => {});
    }
    onChange(null);
  }

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="image-upload-area">
        {value?.secure_url ? (
          <div className="image-upload-preview">
            <img src={value.secure_url} alt="Preview" />
            <div className="image-upload-overlay">
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={handleRemove}
                disabled={uploading}
              >
                <HiOutlineTrash /> Xoá
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                <HiOutlineArrowUpTray /> Đổi ảnh
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="image-upload-placeholder"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <span className="text-muted">Đang tải lên...</span>
            ) : (
              <>
                <HiOutlinePhoto />
                <span>Nhấn để chọn ảnh</span>
                <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                  JPEG, PNG, WebP, GIF — tối đa 5MB
                </span>
              </>
            )}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: "none" }}
          onChange={handleFile}
        />
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
