"use client";
import { useEffect, useState } from "react";
import { getTenantById } from "@/actions";
import CompanyForm from "@/components/setting/company-form";
import { Tenant } from "@/lib/validations";
import { useSession } from "next-auth/react";

export default function AccountPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.tenantId) {
      fetchTenantData();
    }
  }, [session?.user?.tenantId]);

  const fetchTenantData = async () => {
    if (!session?.user?.tenantId) return;
    const result = await getTenantById(session?.user?.tenantId);

    if (result.success) {
      console.log("Tenant data fetched:", result.data);
      setTenant(result.data || null);
    }
  };

  return <CompanyForm initialData={tenant} />;
}
