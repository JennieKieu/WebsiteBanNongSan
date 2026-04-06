import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/** Mỗi lần đổi URL, cuộn về đầu trang (hành vi giống site nhiều trang). */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}
