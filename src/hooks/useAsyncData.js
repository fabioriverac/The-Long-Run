import { useEffect, useState } from "react";

/**
 * Runs an async fetcher on mount, tracking loading state and guarding
 * against setting state after unmount. Used by every dashboard panel and
 * page that reads from a repository module (src/data/*Repository.js).
 *
 * @param {() => Promise<any>} fetcher
 * @param {Array} deps - effect dependencies, same rules as useEffect
 * @param {*} [initialValue]
 */
export function useAsyncData(fetcher, deps, initialValue = []) {
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetcher().then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading };
}
