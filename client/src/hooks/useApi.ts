import { useEffect, useState } from "react";
import http from "../api/http";

/** Pass `null` to skip fetching (no request, loading=false, data=null). */
export function useApi<T>(url: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);
    http
      .get(url)
      .then((res) => {
        if (mounted) setData(res.data.data ?? res.data);
      })
      .catch((err) => {
        if (mounted) setError(err.response?.data?.message || err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, deps);

  return { data, loading, error, setData };
}
