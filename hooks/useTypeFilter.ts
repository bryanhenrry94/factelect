import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Options = {
  defaultValue?: string;
  allowed?: string[];
};

export function useTypeFilter(
  paramName: string = "type",
  options: Options = {}
) {
  const { defaultValue = "none", allowed } = options;

  const searchParams = useSearchParams();
  const router = useRouter();

  const getFromUrl = () => {
    const value = searchParams.get(paramName);
    if (!value) return defaultValue;
    if (allowed && !allowed.includes(value)) return defaultValue;
    return value;
  };

  const [type, setType] = useState<string>(getFromUrl);

  // ========================
  // ✅ URL → state
  // ========================
  useEffect(() => {
    const urlValue = getFromUrl();
    setType((prev) => (prev === urlValue ? prev : urlValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, paramName]);

  // ========================
  // ✅ state → URL (debounced)
  // ========================
  useEffect(() => {
    const id = setTimeout(() => {
      const current = searchParams.get(paramName) ?? defaultValue;
      const next = type || defaultValue;

      if (current === next) return;

      const params = new URLSearchParams(searchParams.toString());

      if (next === defaultValue) {
        params.delete(paramName);
      } else {
        params.set(paramName, next);
      }

      router.replace(`?${params.toString()}`);
    }, 300);

    return () => clearTimeout(id);
  }, [type, searchParams, paramName, router, defaultValue]);

  return { type, setType };
}
