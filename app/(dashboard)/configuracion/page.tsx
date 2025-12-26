"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  BookMinus,
  Building2,
  CreditCard,
  FileText,
  Users,
} from "lucide-react";

import PageContainer from "@/components/container/PageContainer";
import CompanyForm from "@/components/setting/company/company-form";
import SRIConfigForm from "@/components/setting/sri-config-form";
import { BillingForm } from "@/components/billing/BillingForm";

import { getTenantById } from "@/actions/setting/tenant";
import { Tenant } from "@/lib/validations/tenant";

/* shadcn */
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import TeamFormPage from "@/components/setting/team/team-form-page";
import AccountingSettingForm from "@/components/accounting/accounting-setting-form";
import { WithholdingCodeList } from "@/components/withholding/withholding-code-list";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    if (session?.user?.tenantId) {
      fetchTenantData();
    }
  }, [session?.user?.tenantId]);

  const fetchTenantData = async () => {
    if (!session?.user?.tenantId) return;

    const result = await getTenantById(session.user.tenantId);
    if (result.success) {
      setTenant(result.data || null);
    }
  };

  return (
    <PageContainer
      title="Configuración"
      description="Configuración de la cuenta"
    >
      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
          <CardDescription>
            Administra la configuración de tu empresa, usuarios y facturación.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="company" className="w-full">
            {/* Tabs Header */}
            <TabsList className="mb-6 flex w-full justify-start gap-2">
              <TabsTrigger value="company" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Empresa
              </TabsTrigger>

              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuarios
              </TabsTrigger>

              <TabsTrigger value="sri" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Facturación Electrónica
              </TabsTrigger>

              <TabsTrigger
                value="accounting"
                className="flex items-center gap-2"
              >
                <BookMinus className="h-4 w-4" />
                Contabilidad
              </TabsTrigger>

              <TabsTrigger value="billing" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Facturación
              </TabsTrigger>
            </TabsList>

            {/* Empresa */}
            <TabsContent value="company" className="mt-0">
              {tenant && <CompanyForm initialData={tenant} />}
            </TabsContent>

            {/* Usuarios */}
            <TabsContent value="users" className="mt-0">
              <TeamFormPage />
            </TabsContent>

            {/* Facturación Electrónica */}
            <TabsContent value="sri" className="mt-0">
              <SRIConfigForm tenantId={tenant?.id || ""} />
            </TabsContent>

            {/* Contabilidad */}
            <TabsContent value="accounting" className="mt-0">
              <AccountingSettingForm />
              
              <WithholdingCodeList />
            </TabsContent>

            {/* Billing */}
            <TabsContent value="billing" className="mt-0">
              <BillingForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
