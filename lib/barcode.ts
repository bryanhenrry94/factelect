import JsBarcode from "jsbarcode";
import { createCanvas } from "canvas";

/**
 * Genera un código de barras en formato base64 PNG
 * @param value - Texto del código de barras (por ejemplo, clave de acceso del SRI)
 */
export function generateBarcodeBase64(value: string): string {
  const canvas = createCanvas(250, 40);
  JsBarcode(canvas, value, {
    format: "CODE128",
    lineColor: "#000000",
    width: 2,
    height: 40,
    displayValue: false, // oculta el texto debajo
    margin: 0,
  });
  return canvas.toDataURL("image/png");
}
