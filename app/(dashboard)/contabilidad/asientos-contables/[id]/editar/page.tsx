"use client";
import { getJournalEntryById } from "@/actions/accounting/journal-entry";
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
import { Card, CardContent } from "@/components/ui/card";
import { notifyError } from "@/lib/notifications";
import { JournalEntry } from "@/lib/validations/accounting/journal_entry";
import { SlashIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditarAsientoContablePage() {
  const { id } = useParams();

  const [journalEntryToEdit, setJournalEntryToEdit] =
    useState<JournalEntry | null>(null);

  useEffect(() => {
    const fetchJournalEntry = async () => {
      try {
        const response = await getJournalEntryById(id as string);
        if (response.success) {
          setJournalEntryToEdit(response.data || null);
        }
      } catch (error) {
        console.error("Error fetching journal entry:", error);
        notifyError("Error al cargar el asiento contable");
      }
    };

    fetchJournalEntry();
  }, [id]);

  return (
    <PageContainer title="Editar Asiento Contable">
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
            <BreadcrumbPage>Editar</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Card className="mt-4">
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Nuevo Asiento Contable</h2>
          <JournalEntryForm journalEntryToEdit={journalEntryToEdit} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
