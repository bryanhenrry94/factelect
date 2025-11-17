export const generateAccessKey = (
  issueDate: Date,
  documentType: string,
  ruc: string,
  environment: string,
  series: string,
  sequential: string,
  numericCode: string,
  emissionType: string
): string => {
  const pad = (value: string | number, length: number) =>
    value.toString().padStart(length, "0");

  const formattedDate =
    pad(issueDate.getDate(), 2) +
    pad(issueDate.getMonth() + 1, 2) +
    issueDate.getFullYear().toString();

  const codeEnvironment = environment === "TEST" ? "1" : "2";

  const rawKey =
    formattedDate +
    pad(documentType, 2) +
    pad(ruc, 13) +
    pad(codeEnvironment, 1) +
    pad(series, 6) +
    pad(sequential, 9) +
    pad(numericCode, 8) +
    pad(emissionType, 1);

  const verifierDigit = calculateVerifierDigit(rawKey);
  return rawKey + verifierDigit;
};

const calculateVerifierDigit = (key: string): string => {
  const weights = [2, 3, 4, 5, 6, 7];
  let sum = 0;
  let weightIndex = 0;

  for (let i = key.length - 1; i >= 0; i--) {
    sum += parseInt(key[i], 10) * weights[weightIndex];
    weightIndex = (weightIndex + 1) % weights.length;
  }

  const mod = 11 - (sum % 11);
  const verifierDigit = mod === 11 ? 0 : mod === 10 ? 1 : mod;

  return verifierDigit.toString();
};
