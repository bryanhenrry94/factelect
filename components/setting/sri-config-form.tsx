"use client";

import { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";

import {
  getTenantSriConfig,
  updateTenantSriConfig,
} from "@/actions/setting/tenant-sri-config";

import {
  CreateTenantSriConfig,
  TenantSriConfigInput,
} from "@/lib/validations/sri-config";

import { sriEnvironmentOptions } from "@/constants/sri";
import UploadCertificateForm from "../ui/UploadCertificateForm";
import { notifyError, notifyInfo } from "@/lib/notifications";

/* shadcn */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "../ui/field";
import { EstablishmentForm } from "../establishment/EstablishmentForm";
import { EmissionPointForm } from "../emission-point/EmissionPointForm";
import { ConfirmDialog } from "../ConfirmDialog";

interface SriTenantFormProps {
  tenantId: string;
}

const SRIConfigForm: React.FC<SriTenantFormProps> = ({ tenantId }) => {
  const { data: session } = useSession();

  const form = useForm<CreateTenantSriConfig>();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty },
    reset,
    setValue,
  } = form;

  const certificatePath = watch("certificatePath");
  const environment = watch("environment");

  const onSubmit = async (data: TenantSriConfigInput) => {
    const currentTenantId = session?.user?.tenantId;
    if (!currentTenantId) {
      notifyError("No se encontró el tenantId en la sesión.");
      return;
    }

    if (data.environment === "PRODUCTION") {
      const confirm = await ConfirmDialog.confirm(
        "¿Cambiar al ambiente de PRODUCCIÓN?",
        "El ambiente de producción envía comprobantes electrónicos con validez fiscal ante el SRI. ¿Desea continuar?"
      );
      if (!confirm) return;
    }

    const result = await updateTenantSriConfig(currentTenantId, data);

    if (result?.success) {
      notifyInfo("Configuración SRI actualizada correctamente.");
      reset(result.data);
    } else {
      notifyError(result?.error || "Error al actualizar configuración.");
    }
  };

  const fetchTenantSRIConfig = useCallback(async () => {
    const currentTenantId = session?.user?.tenantId;
    if (!currentTenantId) return;

    const result = await getTenantSriConfig(currentTenantId);
    if (result?.success) {
      reset(result.data);
    }
  }, [session?.user?.tenantId, reset]);

  useEffect(() => {
    fetchTenantSRIConfig();
  }, [fetchTenantSRIConfig]);

  return (
    <FieldGroup>
      <FieldSet>
        <FieldLegend>Configuración SRI</FieldLegend>
        <FieldDescription>
          Configure los parámetros necesarios para emitir facturas electrónicas
          a través del SRI.
        </FieldDescription>
        <FieldGroup>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Ambiente */}
              <FormField
                control={form.control}
                name="environment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ambiente</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) =>
                          setValue("environment", value as any, {
                            shouldDirty: true,
                          })
                        }
                        {...field}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un ambiente" />
                        </SelectTrigger>
                        <SelectContent>
                          {sriEnvironmentOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Elija el ambiente para la emisión de comprobantes
                    </FormDescription>
                    {errors.environment?.message && (
                      <FormMessage>{errors.environment.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />

              {/* Password certificado */}
              {certificatePath && (
                <FormField
                  control={form.control}
                  name="certificatePassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña del Certificado</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Ingrese la contraseña"
                          {...field}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Ingrese la contraseña de su certificado digital.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || !isDirty}>
                  {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </form>
          </Form>
        </FieldGroup>
      </FieldSet>

      <FieldSeparator />

      <FieldSet>
        <FieldLegend>Certificado Digital</FieldLegend>
        <FieldDescription>
          Suba su certificado digital emitido por el SRI en formato .p12.
        </FieldDescription>
        <FieldGroup>
          <UploadCertificateForm
            tenantId={tenantId}
            certificatePath={certificatePath || null}
            onSave={fetchTenantSRIConfig}
          />
        </FieldGroup>
      </FieldSet>

      <FieldSeparator />

      <FieldSet>
        <FieldLegend>Establecimientos</FieldLegend>
        <FieldDescription>
          Configure los establecimientos asociados a su empresa.
        </FieldDescription>
        <FieldGroup>
          <EstablishmentForm />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Puntos de Emisión</FieldLegend>
        <FieldDescription>
          Configure los puntos de emisión asociados a sus establecimientos.
        </FieldDescription>
        <FieldGroup>
          <EmissionPointForm />
        </FieldGroup>
      </FieldSet>

      <FieldSeparator />

      <FieldSet>
        <FieldLegend>Ayuda</FieldLegend>
        <FieldDescription>
          Para más información sobre cómo obtener y configurar su certificado
          digital, visite la{" "}
          <a
            href="https://www.sri.gob.ec/web/guest/certificados-digitales"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            página oficial del SRI
          </a>
          .
        </FieldDescription>
      </FieldSet>
    </FieldGroup>
  );
};

export default SRIConfigForm;
