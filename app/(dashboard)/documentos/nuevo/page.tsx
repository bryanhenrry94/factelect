"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import PageContainer from "@/components/container/PageContainer";
import DocumentForm from "@/components/document/DocumentForm";

import { Card, CardContent } from "@/components/ui/card";

import { getPersonsByTenant, getAllProducts } from "@/actions";
import { getWarehouses } from "@/actions/inventory/warehouse";

import { PersonFilter } from "@/types";
import { PersonInput } from "@/lib/validations/person/person";
import { Product } from "@/lib/validations";
import { Warehouse } from "@/lib/validations/inventory/warehouse";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { SlashIcon } from "lucide-react";

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

      const [clients, productsRes, warehousesRes] = await Promise.all([
        getPersonsByTenant(filter),
        getAllProducts(session.user.tenantId),
        getWarehouses(session.user.tenantId),
      ]);

      if (clients.success) setPersons(clients.data);
      if (productsRes.success) setProducts(productsRes.data);
      if (warehousesRes.success) setWarehouses(warehousesRes.data);
    };

    fetchData();
  }, [session?.user?.tenantId]);

  return (
    <PageContainer
      title="Nuevo Documento"
      description="Crear un nuevo documento"
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
          persons={persons}
          warehouses={warehouses}
          products={products}
        />
      </div>
    </PageContainer>
  );
}
