"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Tabs, Tab, Box, Card } from "@mui/material";
import { Building2, CreditCard, FileText } from "lucide-react";
import CompanyForm from "@/components/setting/company-form";
import SRIConfigForm from "@/components/setting/sri-config-form";
import { getTenantById } from "@/actions/tenant";
import { useSession } from "next-auth/react";
import { Tenant } from "@/lib/validations/tenant";
import { PageHeader } from "@/components/ui/PageHeader";
import PageContainer from "@/components/container/PageContainer";
import TabPanel from "@/components/ui/TabPanel";
import { BillingForm } from "@/components/billing/BillingForm";

export default function SettingsPage() {
  const { data: session } = useSession();

  const [tenant, setTenant] = useState<Tenant | null>(null);

  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    if (session?.user?.tenantId) {
      fetchTenantData();
    }
  }, [session?.user?.tenantId]);

  const fetchTenantData = async () => {
    if (!session?.user?.tenantId) return;
    const result = await getTenantById(session?.user?.tenantId);

    if (result.success) {
      setTenant(result.data || null);
    }
  };

  return (
    <PageContainer
      title="Configuración"
      description="Configuración de la cuenta"
    >
      {/* HEADER */}
      <PageHeader title="Configuración" />

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              icon={<Building2 className="w-5 h-5" />}
              iconPosition="start"
              label="Empresa"
            />
            <Tab
              icon={<FileText className="w-5 h-5" />}
              iconPosition="start"
              label="Facturación Electrónica"
            />
            <Tab
              icon={<CreditCard className="w-5 h-5" />}
              iconPosition="start"
              label="Facturación"
            />
          </Tabs>
        </Box>

        {/* Company Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          {tenant && <CompanyForm initialData={tenant} />}
        </TabPanel>

        {/* Electronic Invoicing Tab */}
        <TabPanel value={tabValue} index={1}>
          <SRIConfigForm tenantId={tenant?.id || ""} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <BillingForm />
        </TabPanel>
      </Card>
    </PageContainer>
  );
}
