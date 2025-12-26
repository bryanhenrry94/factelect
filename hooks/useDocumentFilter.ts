import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useDocumentFilter(paramName: string = "documentType") {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paramValue = searchParams.get(paramName) ?? "none";

  const [documentType, setDocumentType] = useState(paramValue);

  /* ================================
   * 1️⃣ URL → estado
   * Si cambia la URL, forzar estado
   * ================================ */
  useEffect(() => {
    if (paramValue !== documentType) {
      setDocumentType(paramValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramValue]);

  /* ================================
   * 2️⃣ estado → URL (debounced)
   * ================================ */
  useEffect(() => {
    const id = setTimeout(() => {
      const current = searchParams.get(paramName) ?? "none";
      const next = documentType ?? "none";

      if (current === next) return;

      const params = new URLSearchParams(searchParams.toString());

      if (next === "none" || !next.trim()) {
        params.delete(paramName);
      } else {
        params.set(paramName, next);
      }

      router.replace(`?${params.toString()}`);
    }, 400);

    return () => clearTimeout(id);
  }, [documentType, paramName, router, searchParams]);

  return { documentType, setDocumentType };
}
