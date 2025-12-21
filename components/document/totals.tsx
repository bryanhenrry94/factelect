import { DocumentItem } from "@/lib/validations/document/document-item";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

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

  const discount = items.reduce((sum, item) => sum + item.discountAmount, 0);

  const iva15 = subtotal15 * 0.15;
  const iva5 = subtotal5 * 0.05;
  const ice = 0;

  const total =
    subtotal15 + subtotal5 + subtotal0 - discount + iva15 + iva5 + ice;

  return (
    <div className="flex justify-end">
      <div className="w-full max-w-sm">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Subtotal 15%</TableCell>
              <TableCell className="text-right">
                {subtotal15.toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Subtotal 5%</TableCell>
              <TableCell className="text-right">
                {subtotal5.toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Subtotal 0%</TableCell>
              <TableCell className="text-right">
                {subtotal0.toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Descuento</TableCell>
              <TableCell className="text-right">
                {discount.toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>IVA (15%)</TableCell>
              <TableCell className="text-right">{iva15.toFixed(2)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>IVA (5%)</TableCell>
              <TableCell className="text-right">{iva5.toFixed(2)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>ICE</TableCell>
              <TableCell className="text-right">{ice.toFixed(2)}</TableCell>
            </TableRow>
            <TableRow className="font-semibold border-t">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">{total.toFixed(2)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
