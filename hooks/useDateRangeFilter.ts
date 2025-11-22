import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useDateRangeFilter(defaults?: {
  defaultFrom?: string;
  defaultTo?: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialFrom = searchParams.get("dateFrom") || defaults?.defaultFrom || "";
  const initialTo = searchParams.get("dateTo") || defaults?.defaultTo || "";

  const [dateFrom, setDateFrom] = useState(initialFrom);
  const [dateTo, setDateTo] = useState(initialTo);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    dateFrom ? params.set("dateFrom", dateFrom) : params.delete("dateFrom");
    dateTo ? params.set("dateTo", dateTo) : params.delete("dateTo");

    router.replace(`?${params.toString()}`);
  }, [dateFrom, dateTo]);

  return { dateFrom, dateTo, setDateFrom, setDateTo };
}
