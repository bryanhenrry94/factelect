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
} from "@/actions";
import { PersonFilter } from "@/types";
import { PersonInput } from "@/lib/validations/person";
import { Product } from "@/lib/validations";
import DocumentForm from "@/components/document/DocumentForm";

export default function SaleNewPage() {
  const { data: session } = useSession();

  const [error, setError] = useState<string | null>(null);
  const [persons, setPersons] = useState<PersonInput[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!session?.user?.tenantId) return;
    const fetchData = async () => {
      const filter: PersonFilter = {
        tenantId: session.user.tenantId,
        role: "CLIENT",
      };

      const [c, p] = await Promise.all([
        getPersonsByTenant(filter),
        getAllProducts(session.user.tenantId),
      ]);
      if (c.success) setPersons(c.data);
      if (p.success) setProducts(p.data);
    };
    fetchData();
  }, [session?.user?.tenantId]);

  return (
    <PageContainer
      title="Nuevo Documento"
      description="Crear un nuevo documento"
    >
      <PageHeader
        title="Nuevo Documento"
        routes={[{ name: "Documentos", href: "/documentos" }]}
      />

      <Paper sx={{ p: 3, mb: 4 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Divider sx={{ mb: 2 }} />

        <DocumentForm
          persons={persons}
          products={products}
          setError={setError}
        />
      </Paper>
    </PageContainer>
  );
}
