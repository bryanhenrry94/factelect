"use client";

import { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";

import {
  getTenantSriConfig,
  updateTenantSriConfig,
} from "@/actions/tenant-sri-config";

import {
  CreateTenantSriConfig,
  TenantSriConfigInput,
} from "@/lib/validations/sri-config";

import { AlertService } from "@/lib/alerts";
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
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SriTenantFormProps {
  tenantId: string;
}

const SRIConfigForm: React.FC<SriTenantFormProps> = ({ tenantId }) => {
  const { data: session } = useSession();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty },
    reset,
    setValue,
  } = useForm<CreateTenantSriConfig>();

  const certificatePath = watch("certificatePath");
  const environment = watch("environment");

  const onSubmit = async (data: TenantSriConfigInput) => {
    const currentTenantId = session?.user?.tenantId;
    if (!currentTenantId) {
      notifyError("No se encontró el tenantId en la sesión.");
      return;
    }

    if (data.environment === "PRODUCTION") {
      const confirm = await AlertService.showConfirm(
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
    <Card className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">
          Configuración de Facturación Electrónica SRI
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure los parámetros necesarios para emitir facturas electrónicas
          a través del SRI.
        </p>
      </div>

      <Separator />

      {/* Ambiente SRI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium">Ambiente SRI</h4>
          <p className="text-sm text-muted-foreground mt-1">
            <strong>Ambiente de Pruebas:</strong> Para realizar pruebas sin
            afectar documentos reales.
            <br />
            <strong>Ambiente de Producción:</strong> Para emisión real con
            validez fiscal ante el SRI.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Ambiente */}
          <div className="space-y-1">
            <Label>Ambiente</Label>
            <Select
              value={environment || ""}
              onValueChange={(value) =>
                setValue("environment", value as any, {
                  shouldDirty: true,
                })
              }
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
            {errors.environment && (
              <p className="text-sm text-destructive">
                {errors.environment.message}
              </p>
            )}
          </div>

          {/* Password certificado */}
          {certificatePath && (
            <div className="space-y-1">
              <Label>Contraseña del Certificado</Label>
              <Input
                type="password"
                placeholder="Ingrese la contraseña"
                {...register("certificatePassword")}
              />
              {errors.certificatePassword && (
                <p className="text-sm text-destructive">
                  {errors.certificatePassword.message}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </div>

      <Separator />

      {/* Certificado Digital */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium">Certificado Digital (.p12)</h4>
          <p className="text-sm text-muted-foreground">
            Suba su certificado digital emitido por el SRI.
          </p>
        </div>

        <UploadCertificateForm
          tenantId={tenantId}
          certificatePath={certificatePath || null}
          onSave={fetchTenantSRIConfig}
        />
      </div>
    </Card>
  );
};

export default SRIConfigForm;
