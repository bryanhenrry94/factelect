"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Paper } from "@mui/material";
import { useParams } from "next/navigation";

import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";

import { getPersonsByTenant, getAllProducts } from "@/actions";
import { PersonFilter } from "@/types";
import { PersonInput } from "@/lib/validations/person";
import { Product } from "@/lib/validations";
import DocumentForm from "@/components/document/DocumentForm";

export default function DocumentEditPage() {
  const { data: session } = useSession();
  const { id } = useParams();

  const [persons, setPersons] = useState<PersonInput[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!session?.user?.tenantId) return;

    const personFilter: PersonFilter = {
      tenantId: session.user.tenantId,
      role: "CLIENT",
    };

    const fetchData = async () => {
      const [c, p] = await Promise.all([
        getPersonsByTenant(personFilter),
        getAllProducts(session.user.tenantId),
      ]);
      if (c.success) setPersons(c.data);
      if (p.success) setProducts(p.data);
    };
    fetchData();
  }, [session?.user?.tenantId]);

  return (
    <PageContainer title="Editar Documento" description="Editar una Documento">
      <PageHeader
        title="Editar Documento"
        routes={[{ name: "Documentos", href: "/documentos" }]}
      />

      <Paper sx={{ p: 3, mb: 4 }}>
        <DocumentForm
          documentId={id as string}
          persons={persons}
          products={products}
        />
      </Paper>
    </PageContainer>
  );
}
