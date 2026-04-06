import { useEffect, useState } from "react";
import {
  formatVnInteger,
  parseVnInteger,
  sanitizeVnIntegerTyping,
} from "../utils/vnNumberFormat";

type Props = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange"
> & {
  value: number | "";
  min?: number;
  max?: number;
  /** true: chỉ gọi onCommit khi blur (giỏ hàng). Luôn đồng bộ text theo value. */
  commitOnBlur?: boolean;
  onValueChange?: (n: number | null) => void;
  onCommit?: (n: number) => void;
};

export default function VnIntegerInput({
  value,
  min,
  max,
  commitOnBlur = false,
  onValueChange,
  onCommit,
  className = "",
  disabled,
  id,
  placeholder,
  required,
  "aria-label": ariaLabel,
  onBlur: onBlurProp,
  onFocus: onFocusProp,
  ...rest
}: Props) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);

  function clamp(n: number): number {
    let x = n;
    if (min != null && x < min) x = min;
    if (max != null && x > max) x = max;
    return x;
  }

  function displayForValue(v: number | ""): string {
    if (v === "") return "";
    if (typeof v !== "number" || !Number.isFinite(v)) return "";
    return formatVnInteger(v);
  }

  useEffect(() => {
    if (commitOnBlur) {
      setText(displayForValue(value));
      return;
    }
    if (!focused) setText(displayForValue(value));
  }, [value, focused, commitOnBlur]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = sanitizeVnIntegerTyping(e.target.value);
    setText(cleaned);
    if (commitOnBlur) return;
    const n = parseVnInteger(cleaned);
    onValueChange?.(n);
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    setFocused(false);
    const n = parseVnInteger(text);
    if (commitOnBlur) {
      if (n != null) {
        const c = clamp(n);
        setText(formatVnInteger(c));
        onCommit?.(c);
      } else {
        setText(displayForValue(value));
      }
      onBlurProp?.(e);
      return;
    }
    if (n != null) {
      const c = clamp(n);
      setText(formatVnInteger(c));
      onValueChange?.(c);
    } else if (text.trim() === "") {
      setText("");
      onValueChange?.(null);
    } else {
      setText(displayForValue(value));
    }
    onBlurProp?.(e);
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    setFocused(true);
    onFocusProp?.(e);
  }

  return (
    <input
      {...rest}
      id={id}
      type="text"
      inputMode="numeric"
      lang="vi"
      autoComplete="off"
      className={`vn-integer-input ${className}`.trim()}
      disabled={disabled}
      placeholder={placeholder}
      required={required}
      aria-label={ariaLabel}
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
    />
  );
}
