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
import { WithholdingCode } from "@/lib/validations/withholding/withholding-code";
import { getAllWithholdingCodes } from "@/actions/withholding/withholding-code";

export default function SaleNewPage() {
  const { data: session } = useSession();

  const [persons, setPersons] = useState<PersonInput[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [withholdingCodes, setWithholdingCodes] = useState<WithholdingCode[]>(
    []
  );

  useEffect(() => {
    if (!session?.user?.tenantId) return;

    const fetchData = async () => {
      const filter: PersonFilter = {
        tenantId: session.user.tenantId,
        isCustomer: true,
      };

      const [clients, productsRes, warehousesRes, withholdingCodesRes] =
        await Promise.all([
          getPersonsByTenant(filter),
          getAllProducts(session.user.tenantId),
          getWarehouses(session.user.tenantId),
          getAllWithholdingCodes(session.user.tenantId),
        ]);

      if (clients.success) setPersons(clients.data);
      if (productsRes.success) setProducts(productsRes.data);
      if (warehousesRes.success) setWarehouses(warehousesRes.data);
      if (withholdingCodesRes.success)
        setWithholdingCodes(withholdingCodesRes.data);
    };

    fetchData();
  }, [session?.user?.tenantId]);

  return (
    <PageContainer
      title="Nuevo Documento"
      description="Crear un nuevo documento"
    >
      <h1>Nuevo Documento</h1>
    </PageContainer>
  );
}
