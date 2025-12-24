"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import PageContainer from "@/components/container/PageContainer";
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
import Link from "next/link";
import { SlashIcon } from "lucide-react";

export default function TransactionNewPage() {
  const { data: session } = useSession();

  const [error, setError] = useState<string | null>(null);
  const [cashBoxes, setCashBoxes] = useState<CashBox[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  useEffect(() => {
    if (!session?.user?.tenantId) return;

    const fetchData = async () => {
      const [cb, ba] = await Promise.all([
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
            <BreadcrumbPage>Nuevo</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="mb-6 mt-4">
        <CardContent className="space-y-4">
          {error && (
            <div className="mt-4">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          <Separator />

          <TransactionForm
            setError={setError}
            cashBoxes={cashBoxes}
            bankAccounts={bankAccounts}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
