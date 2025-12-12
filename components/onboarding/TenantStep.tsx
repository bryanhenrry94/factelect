"use client";

import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type StepProps = {
  control: any;
  errors: any;
};

export const TenantStep: React.FC<StepProps> = ({ control, errors }) => {
  return (
    <div className="space-y-6 mt-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">(1/2)</p>
        <h2 className="text-xl font-semibold">Datos del contribuyente</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Registra la información del contribuyente.
        </p>
      </div>

      <div className="space-y-4">
        {/* RUC */}
        <div className="space-y-1">
          <Label htmlFor="ruc">RUC</Label>
          <Controller
            name="ruc"
            control={control}
            rules={{
              required: "El RUC es obligatorio",
              pattern: {
                value: /^\d{13}$/,
                message: "El RUC debe tener 13 dígitos",
              },
            }}
            render={({ field }) => (
              <Input
                id="ruc"
                placeholder="Ingresa el RUC"
                {...field}
                value={field.value ?? ""}
                className={errors.ruc ? "border-destructive" : ""}
              />
            )}
          />
          {errors.ruc && (
            <p className="text-sm text-destructive">{errors.ruc.message}</p>
          )}
        </div>

        {/* Nombre / Razón social */}
        <div className="space-y-1">
          <Label htmlFor="tenantName">Nombre / Razón Social</Label>
          <Controller
            name="tenantName"
            control={control}
            rules={{ required: "El nombre de la empresa es obligatorio" }}
            render={({ field }) => (
              <Input
                id="tenantName"
                placeholder="Nombre de la empresa"
                {...field}
                value={field.value ?? ""}
                className={errors.tenantName ? "border-destructive" : ""}
              />
            )}
          />
          {errors.tenantName && (
            <p className="text-sm text-destructive">
              {errors.tenantName.message}
            </p>
          )}
        </div>

        {/* Dirección */}
        <div className="space-y-1">
          <Label htmlFor="tenantAddress">Dirección</Label>
          <Controller
            name="tenantAddress"
            control={control}
            rules={{ required: "La dirección es obligatoria" }}
            render={({ field }) => (
              <Input
                id="tenantAddress"
                placeholder="Dirección fiscal"
                {...field}
                value={field.value ?? ""}
                className={errors.tenantAddress ? "border-destructive" : ""}
              />
            )}
          />
          {errors.tenantAddress && (
            <p className="text-sm text-destructive">
              {errors.tenantAddress.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
