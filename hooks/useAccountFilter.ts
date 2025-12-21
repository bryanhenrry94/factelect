import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function useAccountFilter(paramName: string = "account") {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialValue = searchParams.get(paramName) ?? "";
  const [account, setAccount] = useState<string | null>(initialValue);

  useEffect(() => {
    const id = setTimeout(() => {
      const current = searchParams.get(paramName) ?? "";
      const next = account?.trim() ?? "";

      // 🚫 no hacer replace si no hay cambio real
      if (current === next) return;

      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set(paramName, next);
      else params.delete(paramName);

      router.replace(`?${params.toString()}`);
    }, 400);

    return () => clearTimeout(id);
  }, [account, paramName, router]); // ⬅️ quitamos searchParams

  return { account, setAccount };
}
