"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Paper, Divider, Alert } from "@mui/material";
import { useParams } from "next/navigation";

import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import InvoiceForm from "@/components/invoice/InvoiceForm";

import {
  getPersonsByTenant,
  getEstablishmentsByTenant,
  getTenantSriConfig,
  getAllProducts,
} from "@/app/actions";
import { SRIConfiguration } from "@/prisma/generated/prisma";
import { PersonFilter } from "@/types";
import { PersonInput } from "@/lib/validations/person";
import { Product } from "@/lib/validations";

export default function InvoicesEditPage() {
  const { data: session } = useSession();
  const { id } = useParams();

  const [error, setError] = useState<string | null>(null);
  const [persons, setPersons] = useState<PersonInput[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [sriConfig, setSriConfig] = useState<SRIConfiguration | null>(null);

  useEffect(() => {
    if (!session?.user?.tenantId) return;

    const personFilter: PersonFilter = {
      tenantId: session.user.tenantId,
      role: "CLIENT",
    };

    const fetchData = async () => {
      const [c, p, e, s] = await Promise.all([
        getPersonsByTenant(personFilter),
        getAllProducts(session.user.tenantId),
        getEstablishmentsByTenant(session.user.tenantId),
        getTenantSriConfig(session.user.tenantId),
      ]);
      if (c.success) setPersons(c.data);
      if (p.success) setProducts(p.data);
      if (e.success) setEstablishments(e.data);
      if (s.success) setSriConfig(s.data);
    };
    fetchData();
  }, [session?.user?.tenantId]);

  return (
    <PageContainer title="Editar Factura" description="Editar una factura">
      <PageHeader
        title="Editar Factura"
        routes={[{ name: "Facturas", href: "/facturas" }]}
      />

      <Paper sx={{ p: 3, mb: 4 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Divider sx={{ mb: 2 }} />

        <InvoiceForm
          invoiceId={id as string}
          persons={persons}
          products={products}
          establishments={establishments}
          sriConfig={sriConfig}
          setError={setError}
        />
      </Paper>
    </PageContainer>
  );
}
