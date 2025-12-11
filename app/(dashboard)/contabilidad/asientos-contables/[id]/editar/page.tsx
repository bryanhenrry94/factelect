"use client";
import { getJournalEntryById } from "@/actions/accounting/journal-entry";
import { JournalEntryForm } from "@/components/accounting/JournalEntryForm";
import PageContainer from "@/components/container/PageContainer";
import { notifyError } from "@/lib/notifications";
import { JournalEntry } from "@/lib/validations/accounting/journal_entry";
import { Card, Typography } from "@mui/material";
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
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Editar Asiento Contable
        </Typography>
        <JournalEntryForm journalEntryToEdit={journalEntryToEdit} />
      </Card>
    </PageContainer>
  );
}
