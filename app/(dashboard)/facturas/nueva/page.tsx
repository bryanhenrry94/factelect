"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Paper, Divider, Alert } from "@mui/material";

import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import InvoiceForm from "@/components/invoice/InvoiceForm";

import {
  getCustomersByTenant,
  getEstablishmentsByTenant,
  getTenantSriConfig,
  getAllProducts,
} from "@/app/actions";
import { SRIConfiguration } from "@/prisma/generated/prisma";

export default function InvoicesNewPage() {
  const { data: session } = useSession();

  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [sriConfig, setSriConfig] = useState<SRIConfiguration | null>(null);

  useEffect(() => {
    if (!session?.user?.tenantId) return;
    const fetchData = async () => {
      const [c, p, e, s] = await Promise.all([
        getCustomersByTenant(session.user.tenantId),
        getAllProducts(session.user.tenantId),
        getEstablishmentsByTenant(session.user.tenantId),
        getTenantSriConfig(session.user.tenantId),
      ]);
      if (c.success) setClients(c.data);
      if (p.success) setProducts(p.data);
      if (e.success) setEstablishments(e.data);
      if (s.success) setSriConfig(s.data);
    };
    fetchData();
  }, [session?.user?.tenantId]);

  return (
    <PageContainer title="Nueva Factura" description="Crear una nueva factura">
      <PageHeader
        title="Nueva Factura"
        routes={[{ name: "Facturas", href: "/facturas" }]}
      />

      <Paper sx={{ p: 3, mb: 4 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Divider sx={{ mb: 2 }} />

        <InvoiceForm
          clients={clients}
          products={products}
          establishments={establishments}
          sriConfig={sriConfig}
          setError={setError}
        />
      </Paper>
    </PageContainer>
  );
}
