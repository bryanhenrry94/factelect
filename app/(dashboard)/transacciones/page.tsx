"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, Edit, Trash2, File } from "lucide-react";

import PageContainer from "@/components/container/PageContainer";
import { getTransactions } from "@/actions";
import { TransactionInput } from "@/lib/validations";
import { formatDate } from "@/utils/formatters";
import { getTransactionTypeLabel } from "@/utils/transaction";
import { getPaymentMethodLabel } from "@/utils/paymentMethods";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const TransactionsPage = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const [transactions, setTransactions] = React.useState<TransactionInput[]>(
    []
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleAdd = () => router.push("/transacciones/nueva");
  const handleEdit = (t: TransactionInput) => {};
  const handleDelete = (id: string) => {};

  const fetchTransactions = async () => {
    try {
      if (!session?.user?.tenantId) return;
      setLoading(true);
      const res = await getTransactions(session.user.tenantId);

      if (res.success && res.data) setTransactions(res.data);
      else setTransactions([]);
    } catch {
      setError("No se pudieron obtener las transacciones.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTransactions();
  }, [session?.user?.tenantId]);

  return (
    <PageContainer
      title="Transacciones"
      description="Administra las transacciones de tu negocio"
    >
      {/* Header */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input placeholder="Buscar transacciones" className="sm:max-w-sm" />

        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo
        </Button>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <File className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No hay transacciones registradas
              </h3>
              <p className="text-sm text-muted-foreground">
                Agrega tu primera transacción para comenzar
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    "Tipo",
                    "Método",
                    "Persona",
                    "Fecha",
                    "Referencia",
                    "Descripción",
                    "Acciones",
                  ].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{getTransactionTypeLabel(t.type)}</TableCell>
                    <TableCell>{getPaymentMethodLabel(t.method)}</TableCell>
                    <TableCell>{t.personId}</TableCell>
                    <TableCell>{formatDate(t.issueDate.toString())}</TableCell>
                    <TableCell>{t.reference || "-"}</TableCell>
                    <TableCell>{t.description || "-"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(t)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(t.id || "")}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </PageContainer>
  );
};

export default TransactionsPage;
