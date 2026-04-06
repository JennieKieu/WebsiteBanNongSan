import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
};

export default function AdminListToolbar({ search, onSearchChange, placeholder = "Tìm kiếm...", children }: Props) {
  return (
    <div className="admin-list-toolbar">
      <div className="admin-search-wrap">
        <HiOutlineMagnifyingGlass className="admin-search-icon" aria-hidden />
        <input
          type="search"
          className="admin-search-input"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          aria-label="Tìm kiếm"
        />
      </div>
      {children}
    </div>
  );
}
