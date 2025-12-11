"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Paper } from "@mui/material";

import PageContainer from "@/components/container/PageContainer";
import { getPersonsByTenant, getAllProducts } from "@/actions";
import { PersonFilter } from "@/types";
import { PersonInput } from "@/lib/validations/person";
import { Product } from "@/lib/validations";
import DocumentForm from "@/components/document/DocumentForm";
import { Warehouse } from "@/lib/validations/inventory/warehouse";
import { getWarehouses } from "@/actions/inventory/warehouse";

export default function SaleNewPage() {
  const { data: session } = useSession();

  const [persons, setPersons] = useState<PersonInput[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!session?.user?.tenantId) return;
    const fetchData = async () => {
      const filter: PersonFilter = {
        tenantId: session.user.tenantId,
        role: "CLIENT",
      };

      const [c, p, w] = await Promise.all([
        getPersonsByTenant(filter),
        getAllProducts(session.user.tenantId),
        getWarehouses(session.user.tenantId),
      ]);
      if (c.success) setPersons(c.data);
      if (p.success) setProducts(p.data);
      if (w.success) setWarehouses(w.data);
    };
    fetchData();
  }, [session?.user?.tenantId]);

  return (
    <PageContainer
      title="Nuevo Documento"
      description="Crear un nuevo documento"
    >
      <Paper sx={{ p: 3, mb: 4 }}>
        <DocumentForm
          persons={persons}
          warehouses={warehouses}
          products={products}
        />
      </Paper>
    </PageContainer>
  );
}
