import { DocumentItem } from "@/lib/validations/document/document-item";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";

interface InvoiceTotalsProps {
  items: DocumentItem[];
}

export const DocumentTotals: React.FC<InvoiceTotalsProps> = ({ items }) => {
  const subtotal15 = items
    .filter((item) => item.tax === "IVA_15")
    .reduce((sum, item) => sum + item.subtotal, 0);

  const subtotal5 = items
    .filter((item) => item.tax === "IVA_5")
    .reduce((sum, item) => sum + item.subtotal, 0);

  const subtotal0 = items
    .filter((item) => ["IVA_0", "NO_IVA", "EXENTO_IVA"].includes(item.tax))
    .reduce((sum, item) => sum + item.subtotal, 0);

  // descuento
  const discount = items.reduce((sum, item) => sum + item.discountAmount, 0);

  const iva15 = subtotal15 * 0.15;
  const iva5 = subtotal5 * 0.05;
  const ice = 0;

  const total =
    subtotal15 + subtotal5 + subtotal0 - discount + iva15 + iva5 + ice;

  return (
    <TableContainer>
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell>Subtotal 15%</TableCell>
            <TableCell align="right">{subtotal15.toFixed(2)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Subtotal 5%</TableCell>
            <TableCell align="right">{subtotal5.toFixed(2)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Subtotal 0%</TableCell>
            <TableCell align="right">{subtotal0.toFixed(2)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Descuento</TableCell>
            <TableCell align="right">{discount.toFixed(2)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Iva (15%)</TableCell>
            <TableCell align="right">{iva15.toFixed(2)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Iva (5%)</TableCell>
            <TableCell align="right">{iva5.toFixed(2)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>ICE</TableCell>
            <TableCell align="right">{ice.toFixed(2)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <strong>Total</strong>
            </TableCell>
            <TableCell align="right">
              <strong>{total.toFixed(2)}</strong>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};
