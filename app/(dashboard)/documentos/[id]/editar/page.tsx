"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import PageContainer from "@/components/container/PageContainer";
import DocumentForm from "@/components/document/DocumentForm";

import { getPersonsByTenant, getAllProducts } from "@/actions";
import { getWarehouses } from "@/actions/inventory/warehouse";

import { PersonFilter } from "@/types";
import { PersonInput } from "@/lib/validations/person/person";
import { Product } from "@/lib/validations";
import { Warehouse } from "@/lib/validations/inventory/warehouse";

import Link from "next/link";
import { SlashIcon } from "lucide-react";

export default function DocumentEditPage() {
  const { data: session } = useSession();
  const params = useParams<{ id: string }>();

  const [persons, setPersons] = useState<PersonInput[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!session?.user?.tenantId) return;

    const personFilter: PersonFilter = {
      tenantId: session.user.tenantId,
      isCustomer: true,
    };

    const fetchData = async () => {
      const [personsRes, productsRes, warehousesRes] = await Promise.all([
        getPersonsByTenant(personFilter),
        getAllProducts(session.user.tenantId),
        getWarehouses(session.user.tenantId),
      ]);

      if (personsRes.success) setPersons(personsRes.data);
      if (productsRes.success) setProducts(productsRes.data);
      if (warehousesRes.success) setWarehouses(warehousesRes.data);
    };

    fetchData();
  }, [session?.user?.tenantId]);

  return (
    <PageContainer
      title="Editar Documento"
      description="Editar un documento existente"
    >
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Inicio</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <SlashIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/documentos">Documentos</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <SlashIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Nuevo</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-4">
        <DocumentForm
          documentId={params.id}
          persons={persons}
          warehouses={warehouses}
          products={products}
        />
      </div>
    </PageContainer>
  );
}
