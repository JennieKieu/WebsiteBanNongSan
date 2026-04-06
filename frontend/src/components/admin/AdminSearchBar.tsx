type Props = {
  value: string
  placeholder?: string
  onChange: (value: string) => void
}

export function AdminSearchBar({ value, placeholder = 'Tìm kiếm...', onChange }: Props) {
  return (
    <input
      className="ns-input"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ maxWidth: 320 }}
    />
  )
}
