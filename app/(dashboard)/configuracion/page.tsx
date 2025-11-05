"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Tabs, Tab, Box, Card, Typography, Container } from "@mui/material";
import { Building2, FileText, Lock, CreditCard } from "lucide-react";
import CompanyForm from "@/components/setting/company-form";
import SRIConfigForm from "@/components/setting/sri-config-form";
import ChangePasswordForm from "@/components/setting/change-password-form";
import { getTenantById } from "@/app/actions/tenant";
import { useSession } from "next-auth/react";
import { Tenant } from "@/lib/validations/tenant";
import { TenantSriConfig } from "@/lib/validations/tenant-sri-config";
import { getTenantSriConfig } from "@/app/actions/tenant-sri-config";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

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
    <Container maxWidth="lg">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Configuración
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Administra la configuración de tu empresa y facturación
        </Typography>
      </Box>

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
            icon={<Lock className="w-5 h-5" />}
            iconPosition="start"
            label="Seguridad"
          />
          <Tab
            icon={<CreditCard className="w-5 h-5" />}
            iconPosition="start"
            label="Facturación y Suscripción"
          />
        </Tabs>
      </Box>

      <Card>
        {/* Company Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          {tenant && <CompanyForm initialData={tenant} />}
        </TabPanel>

        {/* Electronic Invoicing Tab */}
        <TabPanel value={tabValue} index={1}>
          <SRIConfigForm tenantId={tenant?.id || ""} />
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={2}>
          {session?.user?.id && (
            <ChangePasswordForm userId={session?.user?.id} />
          )}
        </TabPanel>
      </Card>
    </Container>
  );
}
