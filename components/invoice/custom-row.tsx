import { memo, useState, useCallback, useEffect } from "react";
import {
  TableRow,
  TableCell,
  TextField,
  MenuItem,
  IconButton,
  Stack,
} from "@mui/material";
import { PlusCircle, Delete } from "lucide-react";

const taxRates: Record<string, number> = {
  IVA_0: 0,
  IVA_5: 0.05,
  IVA_12: 0.12,
  IVA_14: 0.14,
  IVA_15: 0.15,
  NO_IVA: 0,
  EXENTO_DE_IVA: 0,
};

interface CustomRowProps {
  item: any;
  index: number;
  products: any[];
  taxOptions: { label: string; value: string; code: string }[];
  setItems: React.Dispatch<React.SetStateAction<any[]>>;
  getProductById: (id: string) => Promise<any>;
  onDelete: (index: number) => void;
  onOpenModal: () => void;
}

/**
 * ✅ OPTIMIZACIONES:
 * - `memo` evita re-render si las props no cambian.
 * - Usa `useState` local para controlar valores de inputs.
 * - Actualiza el array padre solo cuando es necesario.
 */
const CustomRow: React.FC<CustomRowProps> = memo(
  ({
    item,
    index,
    products,
    taxOptions,
    setItems,
    getProductById,
    onDelete,
    onOpenModal,
  }) => {
    const [localItem, setLocalItem] = useState(item);

    // 🔁 Sincroniza cuando el padre cambia (por ejemplo, reset form)
    useEffect(() => {
      setLocalItem(item);
    }, [item]);

    const updateParent = useCallback(
      (updated: any) => {
        setItems((prev) => {
          const newItems = [...prev];
          newItems[index] = updated;
          return newItems;
        });
      },
      [index, setItems]
    );

    // ✅ Cálculo de totales y descuentos
    const recalc = useCallback(
      (changes: Partial<typeof localItem>) => {
        const updated = { ...localItem, ...changes };
        const quantity = Number(updated.quantity) || 1;
        const unitPrice = Number(updated.unitPrice) || 0;
        const discountRate = Number(updated.discountRate) || 0;
        const discountAmount = unitPrice * quantity * (discountRate / 100);
        const subtotal = unitPrice * quantity - discountAmount;

        const taxRate = taxRates[updated.tax] || 0;
        const taxAmount = subtotal * taxRate;
        // const total = subtotal + taxAmount;

        const newItem = {
          ...updated,
          discountAmount,
          subtotal,
          taxAmount,
          // total,
        };

        setLocalItem(newItem);
        updateParent(newItem);
      },
      [localItem, updateParent]
    );

    const handleChangeItem = useCallback(
      async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        const response = await getProductById(value);

        if (response.success && response.data) {
          const product = response.data;
          recalc({
            productId: product.id ?? "",
            unitPrice: product.price ?? 0,
            tax: product.tax ?? "IVA_0",
          });
        }
      },
      [recalc, getProductById]
    );

    const handleChange = useCallback(
      (field: keyof typeof localItem) =>
        (event: React.ChangeEvent<HTMLInputElement>) => {
          const value =
            field === "discountRate" ||
            field === "unitPrice" ||
            field === "quantity"
              ? parseFloat(event.target.value) || 0
              : event.target.value;

          recalc({ [field]: value });
        },
      [recalc]
    );

    const taxRate = taxRates[localItem.tax] || 0;
    const totalWithTax =
      (localItem.subtotal ?? 0) + (localItem.subtotal ?? 0) * taxRate;

    return (
      <TableRow>
        <TableCell>
          <Stack direction="row" gap={2}>
            <TextField
              fullWidth
              size="small"
              select
              sx={{ width: 200 }}
              value={localItem.productId || ""}
              onChange={handleChangeItem}
            >
              {products.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.description}
                </MenuItem>
              ))}
            </TextField>
            <IconButton onClick={onOpenModal} color="primary">
              <PlusCircle />
            </IconButton>
          </Stack>
        </TableCell>

        <TableCell>
          <TextField
            type="number"
            fullWidth
            size="small"
            value={localItem.quantity ?? 1}
            onChange={handleChange("quantity")}
            slotProps={{
              htmlInput: {
                min: 0,
                step: "0.01", // permite decimales
              },
            }}
          />
        </TableCell>

        <TableCell>
          <TextField
            type="number"
            fullWidth
            size="small"
            value={localItem.unitPrice ?? 0}
            onChange={handleChange("unitPrice")}
            slotProps={{
              htmlInput: {
                min: 0,
                step: "0.01", // permite decimales
              },
            }}
          />
        </TableCell>

        <TableCell>
          <TextField
            fullWidth
            size="small"
            select
            value={localItem.tax || ""}
            onChange={handleChange("tax")}
          >
            {taxOptions.map(({ label, value, code }) => (
              <MenuItem key={code} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>
        </TableCell>

        <TableCell>
          <TextField
            type="number"
            fullWidth
            size="small"
            value={localItem.discountRate ?? 0}
            onChange={handleChange("discountRate")}
            slotProps={{
              htmlInput: {
                min: 0,
                max: 100,
                step: "0.01",
              },
            }}
          />
        </TableCell>

        <TableCell>{`$${(localItem.discountAmount ?? 0).toFixed(
          2
        )}`}</TableCell>
        <TableCell>{`$${totalWithTax.toFixed(2)}`}</TableCell>

        <TableCell>
          <IconButton color="error" onClick={() => onDelete(index)}>
            <Delete />
          </IconButton>
        </TableCell>
      </TableRow>
    );
  }
);

CustomRow.displayName = "CustomRow";
export default CustomRow;
