"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Paper, Divider, Alert } from "@mui/material";

import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";

import {
  getPersonsByTenant,
  getEstablishmentsByTenant,
  getTenantSriConfig,
  getAllProducts,
} from "@/app/actions";
import { SRIConfiguration } from "@/prisma/generated/prisma";
import { PersonFilter } from "@/types";
import TransactionForm from "@/components/transaction/TransactionForm";

export default function TransactionNewPage() {
  const { data: session } = useSession();

  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [sriConfig, setSriConfig] = useState<SRIConfiguration | null>(null);

  useEffect(() => {
    if (!session?.user?.tenantId) return;
    const fetchData = async () => {
      const filter: PersonFilter = {
        tenantId: session.user.tenantId,
        role: "CLIENT",
      };

      const [c, p, e, s] = await Promise.all([
        getPersonsByTenant(filter),
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
    <PageContainer
      title="Nueva Transacción"
      description="Crear una nueva transacción"
    >
      <PageHeader
        title="Nueva Transacción"
        routes={[{ name: "Transacciones", href: "/transacciones" }]}
      />

      <Paper sx={{ p: 3, mb: 4 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Divider sx={{ mb: 2 }} />

        <TransactionForm setError={setError} />
      </Paper>
    </PageContainer>
  );
}
