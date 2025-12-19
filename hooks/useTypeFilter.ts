import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useTypeFilter(paramName: string = "type") {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialValue = searchParams.get(paramName) ?? "none";
  const [type, setType] = useState(initialValue);

  useEffect(() => {
    const id = setTimeout(() => {
      const current = searchParams.get(paramName) ?? "none";
      const next = type;

      if (current === next || (current === "" && next === "none")) return;

      const params = new URLSearchParams(searchParams.toString());

      if (next === "none" || !next.trim()) params.delete(paramName);
      else params.set(paramName, next);

      router.replace(`?${params.toString()}`);
    }, 400);

    return () => clearTimeout(id);
  }, [type, paramName, router]);

  return { type, setType };
}
