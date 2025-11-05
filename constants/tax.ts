export const taxOptions = [
  { label: "0%", value: "IVA_0", rate: 0, code: "0", isActive: true },
  { label: "5%", value: "IVA_5", rate: 5, code: "1", isActive: true },
  //   { label: "12%", value: "IVA_12", rate: 12, code: "2", isActive: false },
  //   { label: "14%", value: "IVA_14", rate: 14, code: "3", isActive: false },
  { label: "15%", value: "IVA_15", rate: 15, code: "4", isActive: true },
  {
    label: "No objeto de IVA",
    value: "NO_IVA",
    rate: 0,
    code: "6",
    isActive: true,
  },
  {
    label: "Exento de IVA",
    value: "EXENTO_IVA",
    rate: 0,
    code: "7",
    isActive: true,
  },
];
