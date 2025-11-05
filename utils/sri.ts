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
  const pad = (num: number, size: number) => {
    let s = num.toString();
    while (s.length < size) s = "0" + s;
    return s;
  };

  const formattedDate =
    pad(issueDate.getDate(), 2) +
    pad(issueDate.getMonth() + 1, 2) +
    issueDate.getFullYear().toString().slice(-2);

  const rawKey =
    formattedDate +
    documentType +
    ruc +
    environment +
    series +
    sequential +
    numericCode +
    emissionType;

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

  const mod = sum % 11;
  const verifierDigit = mod === 0 ? 0 : 11 - mod;
  return verifierDigit.toString();
};
