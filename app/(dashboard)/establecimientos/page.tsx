"use client";
import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Grid } from "@mui/material";

import { EstablishmentForm } from "@/components/establishment/EstablishmentForm";
import { EmissionPointForm } from "@/components/emission-point/EmissionPointForm";

const EstablishmentsPage = () => {
  return (
    <PageContainer
      title="Establecimientos"
      description="Gestiona los establecimientos de tu negocio"
    >
      {/* Header */}
      <PageHeader title="Establecimientos" />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 12 }}>
          <EstablishmentForm />
        </Grid>
        <Grid size={{ xs: 12, md: 12 }}>
          <EmissionPointForm />
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default EstablishmentsPage;
