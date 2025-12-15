"use client";

import { ProductForm } from "@/components/product/product-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import PageContainer from "@/components/container/PageContainer";

/* shadcn */
import { SlashIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ProductPageEdit() {
  const params = useParams();
  const { id } = params;

  /* ====================== UI ====================== */
  return (
    <PageContainer title="Editar Producto">
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
              <Link href="/inventario/productos">Productos</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <SlashIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Editar</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-4">
        <ProductForm productId={id as string} />
      </div>
    </PageContainer>
  );
}
