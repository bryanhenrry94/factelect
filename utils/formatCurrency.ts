// utils/formatCurrency.ts

export function formatCurrencyInput(value: string, maxDecimals: number = 2) {
  if (!value) return "";

  // Quitar caracteres no numéricos (excepto puntos)
  let cleaned = value.replace(/[^\d.]/g, "");

  // Prevenir más de un punto decimal
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts.slice(1).join("");
  }

  // Limitar decimales según configuración
  if (parts[1]) {
    parts[1] = parts[1].slice(0, maxDecimals);
    cleaned = parts[0] + "." + parts[1];
  }

  return cleaned;
}

export function parseCurrency(value: string): number {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}
