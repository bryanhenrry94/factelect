import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useSearchFilter(paramName: string = "search") {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialValue = searchParams.get(paramName) ?? "";
  const [search, setSearch] = useState(initialValue);

  // Debounce controlado
  useEffect(() => {
    const id = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (search.trim()) params.set(paramName, search.trim());
      else params.delete(paramName);

      router.replace(`?${params.toString()}`);
    }, 400);

    return () => clearTimeout(id);
  }, [search]);

  return { search, setSearch };
}
