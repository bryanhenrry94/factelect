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
import { SRIConfiguration } from "@/prisma/generated/prisma";
import { PersonFilter } from "@/types";
import TransactionForm from "@/components/transaction/TransactionForm";

import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CashBox } from "@/lib/validations/cash/cash_box";
import { BankAccount } from "@/lib/validations/bank/bank_account";
import { getAllCashBoxes } from "@/actions/cash/cash-box";
import { getAllBankAccounts } from "@/actions/bank/bank-account";

export default function TransactionNewPage() {
  const { data: session } = useSession();

  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [sriConfig, setSriConfig] = useState<SRIConfiguration | null>(null);
  const [cashBoxes, setCashBoxes] = useState<CashBox[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

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

      if (c.success) setClients(c.data);
      if (p.success) setProducts(p.data);
      if (e.success) setEstablishments(e.data);
      if (s.success) setSriConfig(s.data);
      if (cb.success && cb.data) setCashBoxes(cb.data);
      if (ba.success && ba.data) setBankAccounts(ba.data);

      console.log("Cash Boxes:", cb);
      console.log("Bank Accounts:", ba);
    };

    fetchData();
  }, [session?.user?.tenantId]);

  return (
    <PageContainer
      title="Nueva Transacción"
      description="Crear una nueva transacción"
    >
      <Card className="mb-6">
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Separator />

          <TransactionForm
            setError={setError}
            clients={clients}
            products={products}
            establishments={establishments}
            sriConfig={sriConfig}
            cashBoxes={cashBoxes}
            bankAccounts={bankAccounts}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
