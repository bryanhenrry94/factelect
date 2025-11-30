import React, { memo, useEffect } from "react";
import {
  TableRow,
  TableCell,
  TextField,
  MenuItem,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { Delete, Search } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { useSession } from "next-auth/react";
import { formatCurrency } from "@/utils/formatters";
import { DocumentResponse, TransactionInput } from "@/lib/validations";
import { getDocument } from "@/actions";

interface CustomRowProps {
  field: any;
  index: number;
  remove: (index: number) => void;
}

const CustomRow: React.FC<CustomRowProps> = memo(({ field, index, remove }) => {
  const { data: session } = useSession();

  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext<TransactionInput>(); // <- accedemos al contexto del formulario

  const [documents, setDocuments] = React.useState<DocumentResponse[]>([]);
  const [document, setDocument] = React.useState<DocumentResponse | null>(null);

  const handleChangeDocument = async (documentId: string) => {
    const invoiceResponse = await getDocument(documentId);
    if (invoiceResponse.success && invoiceResponse.data) {
      const document = invoiceResponse.data;
      setDocument(document);
    }
  };

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!session?.user?.tenantId) return;

      const watchPersonId = watch("personId");

      if (!watchPersonId) {
        setDocuments([]);
        return;
      }
    };
    fetchInvoices();
  }, [session?.user?.tenantId, watch("personId")]);

  return (
    <TableRow
      sx={{
        "& td, & th": {
          borderBottom: "1px solid",
          borderColor: "divider",
          borderRight: "1px solid",
          "&:last-child": {
            borderRight: 0,
          },
        },
      }}
    >
      <TableCell>
        <Stack direction="row" gap={2}>
          <Controller
            control={control}
            name={`documents.${index}.documentId`}
            render={({ field }) => (
              <TextField
                fullWidth
                size="small"
                select
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  handleChangeDocument(e.target.value);
                }}
                error={!!errors.documents?.[index]?.documentId}
                helperText={
                  errors.documents?.[index]?.documentId
                    ? (errors.documents[index]?.documentId?.message as string)
                    : ""
                }
              >
                {documents.map((inv) => (
                  <MenuItem key={inv.id} value={inv.id}>
                    {`FACT ${
                      inv.DocumentFiscalInfo?.sequence
                    } - $${inv.total.toFixed(2)} - ${new Date(
                      inv.issueDate
                    ).toLocaleDateString()} `}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <IconButton onClick={() => {}} color="primary">
            <Search />
          </IconButton>
        </Stack>
      </TableCell>
      <TableCell>
        {document ? new Date(document.issueDate).toLocaleDateString() : ""}
      </TableCell>
      <TableCell>{document ? `$${document.total.toFixed(2)}` : ""}</TableCell>
      <TableCell>{formatCurrency(document?.balance || 0)}</TableCell>
      <TableCell>
        {document ? (
          <Controller
            control={control}
            name={`documents.${index}.amount`}
            render={({ field }) => (
              <TextField
                {...field}
                type="number"
                size="small"
                sx={{ width: 120 }}
                value={field.value || 0}
                onChange={(e) => {
                  const inputAmount = parseFloat(e.target.value);
                  field.onChange(isNaN(inputAmount) ? 0 : inputAmount);
                }}
                inputProps={{ min: 0, step: 0.01 }}
              />
            )}
          />
        ) : (
          <Typography variant="body2" color="textSecondary">
            N/A
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <IconButton color="error" onClick={() => remove(index)}>
          <Delete />
        </IconButton>
      </TableCell>
    </TableRow>
  );
});

CustomRow.displayName = "CustomRow";
export default CustomRow;
