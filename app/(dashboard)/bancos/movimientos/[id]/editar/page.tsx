"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import PageContainer from "@/components/container/PageContainer";
import { BankMovementForm } from "@/components/bank/BankMovementForm";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditarMovimientoBancarioPage() {
  const params = useParams<{ id: string }>();

  return (
    <PageContainer title="Editar Movimiento Bancario">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Inicio</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator />

          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/bancos/movimientos">Movimientos Bancarios</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator />

          <BreadcrumbItem>
            <BreadcrumbPage>Editar</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Content */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Datos del movimiento</CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          <BankMovementForm bankMovementId={params.id} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
