"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<Tenant>({
    resolver: zodResolver(tenantSchema),
    defaultValues: initialData || {
      name: "",
      subdomain: "",
      tradeName: "",
      ruc: "",
      phone: "",
      contactEmail: "",
      address: "",
      logoUrl: "",
    },
  });

  const onSubmit = async (data: Tenant) => {
    try {
      const result = await updateTenant(data.id || "", data);

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
      {/* {JSON.stringify(errors)} */}
      <CardHeader>
        <CardTitle>Información de la Empresa</CardTitle>
        <CardDescription>
          Actualiza los datos que aparecerán en facturas y documentos oficiales.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* RUC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>RUC (ID Fiscal)</Label>
              <p className="text-sm text-muted-foreground">
                Registro Único de Contribuyentes de tu empresa.
              </p>
            </div>

            <div className="space-y-1">
              <Input
                placeholder="1790012345001"
                disabled
                maxLength={13}
                {...register("ruc")}
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
              <Input placeholder="Ej: Mi Empresa S.A." {...register("name")} />
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
              <Input
                placeholder="Ej: Comercial Andina"
                {...register("tradeName")}
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
                Datos de contacto visibles en documentos.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <Input placeholder="0991234567" {...register("phone")} />
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Input
                  type="email"
                  placeholder="info@empresa.com"
                  {...register("contactEmail")}
                />
                {errors.contactEmail && (
                  <p className="text-sm text-destructive">
                    {errors.contactEmail.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Textarea
                  placeholder="Av. Principal 123 y Calle Secundaria"
                  rows={3}
                  {...register("address")}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">
                    {errors.address.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Logo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Logo de la Empresa</Label>
              <p className="text-sm text-muted-foreground">
                Logo que aparecerá en facturas y documentos oficiales.
              </p>
            </div>

            <div className="space-y-4">
              <Input
                placeholder="https://miempresa.com/logo.png"
                {...register("logoUrl")}
              />
              {errors.logoUrl && (
                <p className="text-sm text-destructive">
                  {errors.logoUrl.message}
                </p>
              )}

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
