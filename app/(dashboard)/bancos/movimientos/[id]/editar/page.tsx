"use client";
import { BankMovementForm } from "@/components/bank/BankMovementForm";
import PageContainer from "@/components/container/PageContainer";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/* shadcn */
import { Card, CardContent } from "@/components/ui/card";
import { SlashIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function EditarMovimientoBancarioPage() {
  const params = useParams();
  const { id } = params;

  return (
    <PageContainer title="Editar Movimiento Bancario">
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
              <Link href="/bancos/movimientos">Movimientos Bancarios</Link>
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

      <Card className="mt-4">
        <CardContent className="p-6">
          <BankMovementForm bankMovementId={id as string} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
