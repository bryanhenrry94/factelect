import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useDocumentFilter(paramName: string = "documentType") {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialValue = searchParams.get(paramName) ?? "none";
  const [documentType, setDocumentType] = useState(initialValue);

  useEffect(() => {
    const id = setTimeout(() => {
      const current = searchParams.get(paramName) ?? "none";
      const next = documentType;

      if (current === next || (current === "" && next === "none")) return;

      const params = new URLSearchParams(searchParams.toString());

      if (next === "none" || !next.trim()) params.delete(paramName);
      else params.set(paramName, next);

      router.replace(`?${params.toString()}`);
    }, 400);

    return () => clearTimeout(id);
  }, [documentType, paramName, router]);

  return { documentType, setDocumentType };
}
