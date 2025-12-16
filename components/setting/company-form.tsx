"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Tenant, tenantSchema } from "@/lib/validations/tenant";
import { updateTenant } from "@/actions/tenant";
import { notifyError, notifyInfo } from "@/lib/notifications";

import UploadLogoForm from "../ui/UploadLogoForm";

/* shadcn */
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface CompanyFormProps {
  initialData: Tenant | null;
}

export default function CompanyForm({ initialData }: CompanyFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<Tenant>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: "",
      tradeName: "",
      ruc: "",
      phone: "",
      contactEmail: "",
      address: "",
      logoUrl: "",
    },
  });

  /**
   * 🔑 CLAVE:
   * Cuando llega initialData → reset del formulario
   */
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const onSubmit = async (data: Tenant) => {
    try {
      const result = await updateTenant(data.id ?? "", data);

      if (result.success) {
        notifyInfo("Información de la empresa actualizada correctamente");
      } else {
        notifyError("Error al actualizar la información de la empresa");
      }
    } catch (error) {
      console.error(error);
      notifyError("Ocurrió un error inesperado");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de la Empresa</CardTitle>
        <CardDescription>
          Actualiza los datos que aparecerán en facturas y documentos oficiales.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {Object.entries(errors).map(([key, value]) => (
            <p key={key} className="text-sm text-destructive">
              {value?.message as string}
            </p>
          ))}

          {/* RUC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>RUC (ID Fiscal)</Label>
              <p className="text-sm text-muted-foreground">
                Registro Único de Contribuyentes de tu empresa.
              </p>
            </div>

            <div className="space-y-1">
              <Controller
                name="ruc"
                control={control}
                render={({ field }) => (
                  <Input
                    disabled
                    maxLength={13}
                    placeholder="Ej: 1790012345001"
                    {...field}
                  />
                )}
              />
              {errors.ruc && (
                <p className="text-sm text-destructive">{errors.ruc.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Nombre legal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Nombre / Razón Social</Label>
              <p className="text-sm text-muted-foreground">
                Nombre legal registrado de la empresa.
              </p>
            </div>

            <div className="space-y-1">
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input placeholder="Ej: Mi Empresa S.A." {...field} />
                )}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>

          {/* Nombre comercial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Nombre Comercial</Label>
              <p className="text-sm text-muted-foreground">
                Nombre con el que tus clientes reconocen tu empresa.
              </p>
            </div>

            <div className="space-y-1">
              <Controller
                name="tradeName"
                control={control}
                render={({ field }) => (
                  <Input placeholder="Ej: Tienda de Tecnología" {...field} />
                )}
              />
              {errors.tradeName && (
                <p className="text-sm text-destructive">
                  {errors.tradeName.message}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Información de Contacto</Label>
              <p className="text-sm text-muted-foreground">
                Datos visibles en documentos.
              </p>
            </div>

            <div className="space-y-4">
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input placeholder="0991234567" {...field} />
                )}
              />
              <Controller
                name="contactEmail"
                control={control}
                render={({ field }) => (
                  <Input
                    type="email"
                    placeholder="info@empresa.com"
                    {...field}
                  />
                )}
              />
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <Textarea
                    rows={3}
                    placeholder="Av. Principal 123 y Calle Secundaria"
                    {...field}
                  />
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Logo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Logo de la Empresa</Label>
              <p className="text-sm text-muted-foreground">
                Logo que aparecerá en documentos.
              </p>
            </div>

            <div className="space-y-4">
              <Controller
                name="logoUrl"
                control={control}
                render={({ field }) => <Input type="hidden" {...field} />}
              />
              <UploadLogoForm logoUrl={watch("logoUrl")} />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
