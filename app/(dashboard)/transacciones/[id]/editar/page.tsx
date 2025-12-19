"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import PageContainer from "@/components/container/PageContainer";
import {
  getPersonsByTenant,
  getEstablishmentsByTenant,
  getTenantSriConfig,
  getAllProducts,
} from "@/actions";
import { PersonFilter } from "@/types";
import TransactionForm from "@/components/transaction/TransactionForm";

import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CashBox } from "@/lib/validations/cash/cash_box";
import { BankAccount } from "@/lib/validations/bank/bank_account";
import { getAllCashBoxes } from "@/actions/cash/cash-box";
import { getAllBankAccounts } from "@/actions/bank/bank-account";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SlashIcon } from "lucide-react";

export default function TransactionEditPage() {
  const { data: session } = useSession();

  const [error, setError] = useState<string | null>(null);
  const [cashBoxes, setCashBoxes] = useState<CashBox[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  const params = useParams();
  const { id } = params;

  useEffect(() => {
    if (!session?.user?.tenantId) return;

    const fetchData = async () => {
      const filter: PersonFilter = {
        tenantId: session.user.tenantId,
        role: "CLIENT",
      };

      const [c, p, e, s, cb, ba] = await Promise.all([
        getPersonsByTenant(filter),
        getAllProducts(session.user.tenantId),
        getEstablishmentsByTenant(session.user.tenantId),
        getTenantSriConfig(session.user.tenantId),
        getAllCashBoxes(session.user.tenantId),
        getAllBankAccounts(session.user.tenantId),
      ]);

      if (cb.success && cb.data) setCashBoxes(cb.data);
      if (ba.success && ba.data) setBankAccounts(ba.data);
    };

    fetchData();
  }, [session?.user?.tenantId]);

  return (
    <PageContainer
      title="Nueva Transacción"
      description="Crear una nueva transacción"
    >
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
              <Link href="/transacciones">Transacciones</Link>
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

      <Card className="mb-6 mt-4">
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Separator />

          <TransactionForm
            transactionId={id as string}
            setError={setError}
            cashBoxes={cashBoxes}
            bankAccounts={bankAccounts}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
