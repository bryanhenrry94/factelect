import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { useEffect, useState } from "react";
import {
  WithholdingCode,
  WithholdingCodeCreate,
} from "@/lib/validations/withholding/withholding-code";
import { Button } from "../ui/button";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import {
  createWithholdingCode,
  deleteWithholdingCode,
  getAllWithholdingCodes,
  updateWithholdingCode,
} from "@/actions/withholding/withholding-code";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
} from "../ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { WithholdingCodeForm } from "./withholding-code-form";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { ChartOfAccount } from "@/lib/validations";
import { getAccounts } from "@/actions/accounting/chart-of-account";

interface WithholdingCodeListProps {}

export const WithholdingCodeList: React.FC<WithholdingCodeListProps> = () => {
  const { data: session } = useSession();

  // state
  const [withholdingCodes, setWithholdingCodes] = useState<WithholdingCode[]>(
    []
  );
  const [withholdingCodeSelected, setWithholdingCodeSelected] = useState<
    WithholdingCode | undefined
  >(undefined);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [openDialog, setOpenDialog] = useState(false);

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => {
    setWithholdingCodeSelected(undefined);
    setOpenDialog(false);
  };

  const fetchWithholdingCodes = async () => {
    if (!session?.user?.tenantId) return;

    try {
      const response = await getAllWithholdingCodes(session.user.tenantId);
      if (response.success) {
        setWithholdingCodes(response.data as WithholdingCode[]);
      } else {
        setWithholdingCodes([]);
      }
    } catch (error) {
      setWithholdingCodes([]);
    }
  };

  const fetchAccounts = async () => {
    if (!session?.user?.tenantId) return;
    const res = await getAccounts(session.user.tenantId);
    if (!res.success) return notifyError("Error al cargar cuentas contables");
    setAccounts(res.data || []);
  };

  useEffect(() => {
    if (!session?.user?.tenantId) return;

    fetchWithholdingCodes();
    fetchAccounts();
  }, [session?.user.tenantId]);

  const handleEdit = (code: WithholdingCode) => {
    setWithholdingCodeSelected(code);
    handleOpenDialog();
  };

  const handleDelete = async (id: string) => {
    if (!id) return;

    const response = await deleteWithholdingCode(id);
    if (!response.success) {
      notifyError(response.error || "Error al eliminar el código de retención");
      return;
    }

    notifyInfo("Código de retención eliminado exitosamente");
    await fetchWithholdingCodes();
  };

  const onSubmit = async (data: WithholdingCodeCreate) => {
    try {
      const tenantId = session?.user?.tenantId;
      if (!tenantId) return;

      const response = withholdingCodeSelected
        ? await updateWithholdingCode(withholdingCodeSelected.id, data)
        : await createWithholdingCode(tenantId, data);

      if (!response.success) {
        notifyError(
          response.error || "Error al guardar el código de retención"
        );
        return;
      }

      notifyInfo("Código de retención guardado exitosamente");
      // Refrescar la lista de códigos de retención
      await fetchWithholdingCodes();
      handleCloseDialog();
    } catch (error) {}
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "IVA":
        return "IVA";
      case "SOURCE":
        return "Fuente";
      default:
        return type;
    }
  };

  return (
    <>
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Códigos de Retención</CardTitle>
            <CardDescription>
              Administra los códigos de retención utilizados en las facturas.
            </CardDescription>
          </div>
          <Button className="ml-auto" onClick={handleOpenDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código SRI</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Porcentaje</TableHead>
                <TableHead>Cuenta Contable</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withholdingCodes.length === 0 ? (
                <TableRow>
                  <TableHead colSpan={6} className="text-center">
                    No hay códigos de retención disponibles.
                  </TableHead>
                </TableRow>
              ) : (
                withholdingCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>{code.code}</TableCell>
                    <TableCell>{getTypeLabel(code.type)}</TableCell>
                    <TableCell>{code.description}</TableCell>
                    <TableCell>{code.percentage}%</TableCell>
                    <TableCell>
                      {accounts.find((account) => account.id === code.accountId)
                        ?.name || "-"}
                    </TableCell>
                    <TableCell>{code.active ? "Activo" : "Inactivo"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(code)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(code.id || "")}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {withholdingCodeSelected
                ? "Editar Código de Retención"
                : "Nuevo Código de Retención"}
            </DialogTitle>
            <DialogDescription>
              Administra los códigos de retención utilizados en las facturas.
            </DialogDescription>
          </DialogHeader>
          <WithholdingCodeForm
            onSubmit={onSubmit}
            onCancel={handleCloseDialog}
            accounts={accounts}
            defaultValues={withholdingCodeSelected}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
