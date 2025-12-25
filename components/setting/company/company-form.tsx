"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Tenant, tenantSchema } from "@/lib/validations/tenant";
import { updateTenant } from "@/actions/setting/tenant";
import { notifyError, notifyInfo } from "@/lib/notifications";

import UploadLogoForm from "../../ui/UploadLogoForm";

/* shadcn */
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "../../ui/label";
import {
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "../../ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Switch } from "../../ui/switch";

interface CompanyFormProps {
  initialData: Tenant | null;
}

export default function CompanyForm({ initialData }: CompanyFormProps) {
  const form = useForm<Tenant>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      ruc: "",
      legalName: "",
      tradeName: "",
      phone: "",
      email: "",
      address: "",
      contributorType: "NATURAL",
      taxRegime: "GENERAL",
      obligatedAccounting: false,
      isWithholdingAgent: false,
      isSpecialContributor: false,
      specialContributorNumber: "",
      economicActivity: "",
      logoUrl: "",
    },
  });

  const {
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = form;

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
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Datos Generales</FieldLegend>
            <FieldDescription>
              Información básica de la empresa.
            </FieldDescription>
            <FieldGroup>
              {/* RUC */}
              <FormField
                control={form.control}
                name="ruc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RUC (ID Fiscal)</FormLabel>
                    <FormControl>
                      <Input
                        disabled
                        maxLength={13}
                        placeholder="Ej: 1790012345001"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Registro Único de Contribuyentes de tu empresa.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nombre / Razón Social */}
              <FormField
                control={form.control}
                name="legalName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre / Razón Social</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Mi Empresa S.A." {...field} />
                    </FormControl>
                    <FormDescription>
                      Nombre legal registrado de la empresa.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nombre comercial */}
              <FormField
                control={form.control}
                name="tradeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Comercial</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Tienda de Tecnología"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Nombre con el que tus clientes reconocen tu empresa.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FieldGroup>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend>Datos Fiscales</FieldLegend>
              <FieldDescription>
                Configuración fiscal de la empresa.
              </FieldDescription>
              <FieldGroup>
                {/* Tipo Contribuyente */}
                <FormField
                  control={form.control}
                  name="contributorType"
                  rules={{
                    required: "El tipo de contribuyente es obligatorio",
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Contribuyente</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="NATURAL">Natural</SelectItem>
                              <SelectItem value="SOCIETY">Sociedad</SelectItem>
                              <SelectItem value="SPECIAL">
                                Contribuyente Especial
                              </SelectItem>
                              <SelectItem value="PUBLIC">
                                Entidad Pública
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Régimen Tributario */}
                <FormField
                  control={form.control}
                  name="taxRegime"
                  rules={{ required: "El régimen tributario es obligatorio" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Régimen Tributario</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="GENERAL">General</SelectItem>
                              <SelectItem value="RIMPE_EMPRENDEDOR">
                                RIMPE Emprendedor
                              </SelectItem>
                              <SelectItem value="RIMPE_NEGOCIO_POPULAR">
                                RIMPE Negocio Popular
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Obligado a Llevar Contabilidad */}
                <FormField
                  control={form.control}
                  name="obligatedAccounting"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Obligado a Llevar Contabilidad</FormLabel>
                      <FormControl className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Agente de Retención */}
                <FormField
                  control={form.control}
                  name="isWithholdingAgent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agente de Retención</FormLabel>
                      <FormControl className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Contribuyente Especial */}
                <FormField
                  control={form.control}
                  name="isSpecialContributor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contribuyente Especial</FormLabel>
                      <FormControl className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Numero de Contribuyente Especial */}
                <FormField
                  control={form.control}
                  name="specialContributorNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Contribuyente Especial</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 1234567890" {...field} />
                      </FormControl>
                      <FormDescription>
                        Número que te identifica como contribuyente especial.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Actividad Económica */}
                <FormField
                  control={form.control}
                  name="economicActivity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actividad Económica</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Comercio" {...field} />
                      </FormControl>
                      <FormDescription>
                        Descripción de la actividad económica principal.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FieldGroup>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend>Contacto Fiscal</FieldLegend>
              <FieldDescription>
                Información de contacto fiscal de la empresa.
              </FieldDescription>

              <FieldGroup>
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="0991234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="info@empresa.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Av. Principal 123 y Calle Secundaria"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FieldGroup>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend>Branding</FieldLegend>
              <FieldDescription>
                Personaliza la apariencia de tus documentos con el logo de tu
                empresa.
              </FieldDescription>
              <FieldGroup>
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="hidden" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <UploadLogoForm logoUrl={watch("logoUrl")} />
              </FieldGroup>
            </FieldSet>

            {/* Actions */}
            <div className="pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </FieldSet>
        </FieldGroup>
      </form>
    </Form>
  );
}
