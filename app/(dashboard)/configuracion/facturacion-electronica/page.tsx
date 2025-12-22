"use client";
import { useEffect, useState } from "react";
import { getTenantById } from "@/actions";
import { Tenant } from "@/lib/validations";
import { useSession } from "next-auth/react";
import SRIConfigForm from "@/components/setting/sri-config-form";

export default function FacturacionElectronicaPage() {
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
      setTenant(result.data || null);
    }
  };

  return <SRIConfigForm tenantId={tenant?.id || ""} />;
}
