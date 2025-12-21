import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function usePersonFilter(paramName: string = "person") {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialValue = searchParams.get(paramName) ?? "none";
  const [person, setPerson] = useState(initialValue);

  // ✅ URL → state
  useEffect(() => {
    const current = searchParams.get(paramName) ?? "none";
    setPerson((prev) => (prev === current ? prev : current));
  }, [searchParams, paramName]);

  // ✅ state → URL (debounced)
  useEffect(() => {
    const id = setTimeout(() => {
      const current = searchParams.get(paramName) ?? "none";
      const next = person;

      if (current === next || (current === "" && next === "none")) return;

      const params = new URLSearchParams(searchParams.toString());

      if (next === "none" || !next.trim()) params.delete(paramName);
      else params.set(paramName, next);

      router.replace(`?${params.toString()}`);
    }, 400);

    return () => clearTimeout(id);
  }, [person, searchParams, paramName, router]);

  return { person, setPerson };
}
