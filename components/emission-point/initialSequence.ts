import { EmissionPointSequence } from "@/lib/validations";

export const initialSequences: EmissionPointSequence[] = [
  {
    id: "",
    emissionPointId: "",
    documentType: "INVOICE",
    currentSequence: 1,
  },
  {
    id: "",
    emissionPointId: "",
    documentType: "PURCHASE",
    currentSequence: 1,
  },
  {
    id: "",
    emissionPointId: "",
    documentType: "CREDIT_NOTE",
    currentSequence: 1,
  },
  {
    id: "",
    emissionPointId: "",
    documentType: "DEBIT_NOTE",
    currentSequence: 1,
  },
  {
    id: "",
    emissionPointId: "",
    documentType: "WITHHOLDING",
    currentSequence: 1,
  },
  {
    id: "",
    emissionPointId: "",
    documentType: "REMISSION_GUIDE",
    currentSequence: 1,
  },
];
