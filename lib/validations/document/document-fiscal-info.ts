import { z } from "zod";

export const SRIStatusEnum = z.enum([
  "DRAFT", // Aún no firmado / no enviado
  "SENT", // Enviado a recepción SRI
  "RECEIVED", // SRI lo recibió (RECIBIDA)
  "IN_PROCESS", // Esperando autorización
  "AUTHORIZED", // Autorizada
  "REJECTED", // Rechazada
]);
export const SRIEnvironmentEnum = z.enum(["TEST", "PRODUCTION"]);

export const DocumentFiscalInfoSchema = z.object({
  id: z.string(),

  documentId: z.string(),
  establishmentId: z.string(),
  emissionPointId: z.string(),
  sequence: z.number(),

  accessKey: z.string().nullable().optional(),
  authorization: z.string().nullable().optional(),
  authorizationDate: z.date().nullable().optional(),

  sriStatus: SRIStatusEnum,
  environment: SRIEnvironmentEnum,

  generatedXmlUrl: z.string().nullable().optional(),
  authorizedXmlUrl: z.string().nullable().optional(),
  pdfUrl: z.string().nullable().optional(),
});

export const createDocumentFiscalInfoSchema = DocumentFiscalInfoSchema.omit({
  id: true,
});

export const updateDocumentFiscalInfoSchema =
  createDocumentFiscalInfoSchema.partial();

export type DocumentFiscalInfo = z.infer<typeof DocumentFiscalInfoSchema>;
export type CreateDocumentFiscalInfo = z.infer<
  typeof createDocumentFiscalInfoSchema
>;
export type UpdateDocumentFiscalInfo = z.infer<
  typeof updateDocumentFiscalInfoSchema
>;
