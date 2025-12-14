"use client";

import { JournalEntryForm } from "@/components/accounting/JournalEntryForm";
import PageContainer from "@/components/container/PageContainer";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/* ShadCN */
import { Card, CardContent } from "@/components/ui/card";
import { SlashIcon } from "lucide-react";
import Link from "next/link";

export default function NuevoAsientoContablePage() {
  return (
    <PageContainer title="Nuevo Asiento Contable">
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
              <Link href="/contabilidad/asientos-contables">
                Asientos Contables
              </Link>
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
      <Card className="mt-4">
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Nuevo Asiento Contable</h2>
          <JournalEntryForm journalEntryToEdit={null} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
