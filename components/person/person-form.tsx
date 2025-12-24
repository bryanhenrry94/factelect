"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createPerson, getPersonById, updatePerson } from "@/actions";
import { getAccounts } from "@/actions/accounting/chart-of-account";
import { identificationOptions } from "@/constants/identification";
import { notifyInfo } from "@/lib/notifications";
import { ChartOfAccount } from "@/lib/validations";

import {
  createPersonSchema,
  CreatePersonInput,
} from "@/lib/validations/person/person";

import { getRoleLabel } from "@/utils/person";

import {
  FieldSet,
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
  FieldLegend,
} from "@/components/ui/field";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useRouter } from "next/navigation";
import { AccountSelect } from "../AccountSelected";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Switch } from "../ui/switch";

interface PersonFormProps {
  open?: boolean;
  onClose?: () => void;
  onSuccess?: () => Promise<void>;
  personId?: string | null;
  tenantId: string;
}

export default function PersonForm({
  open,
  onClose,
  onSuccess,
  personId,
  tenantId,
}: PersonFormProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreatePersonInput>({
    resolver: zodResolver(createPersonSchema),
    defaultValues: {
      personKind: "NATURAL",
      identificationType: "CEDULA",
      identification: "",
      firstName: "",
      lastName: "",
      businessName: "",
      commercialName: "",
      email: "",
      phone: "",
      address: "",
      roles: ["CLIENT"],
      accountPayableId: null,
      accountReceivableId: null,
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (personId) {
      const getPerson = async () => {
        const person = await getPersonById(personId);
        if (person) {
          reset(person);
        }
      };

      getPerson();
    } else {
      reset({
        identificationType: "CEDULA",
        identification: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        roles: ["CLIENT"],
      });
    }
  }, [personId, reset]);

  useEffect(() => {
    const fetchAccounts = async () => {
      const response = await getAccounts(tenantId);
      if (response.success && response.data) {
        setAccounts(response.data);
      }
    };
    fetchAccounts();
  }, [tenantId, open]);

  const onSubmit = async (data: CreatePersonInput) => {
    setError(null);

    const action = personId
      ? await updatePerson(personId ?? "", data)
      : await createPerson(data, tenantId);

    if (action.success) {
      notifyInfo(
        `Persona ${personId ? "actualizada" : "creada"} correctamente`
      );
      await onSuccess?.();
      onClose?.();

      if (!personId) {
        router.push(`/personas/${action.data?.id}/editar`);
      }
    } else {
      setError(action.error || "Error al guardar la persona");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Form {...form}>
        <FieldSet>
          {/* ======================= */}
          {/*        DATOS BASE       */}
          {/* ======================= */}
          <FieldLegend>Datos Personales</FieldLegend>

          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo Persona */}
            <Field>
              <FieldLabel>Tipo de Persona</FieldLabel>
              <Controller
                name="personKind"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NATURAL">NATURAL</SelectItem>
                      <SelectItem value="LEGAL">JURÍDICA</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.personKind && (
                <p className="text-red-500 text-xs">
                  {errors.personKind.message}
                </p>
              )}
            </Field>

            {/* Tipo Identificación */}
            <Field>
              <FieldLabel>Tipo de Identificación</FieldLabel>
              <Controller
                name="identificationType"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || "NATURAL"}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {identificationOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.identificationType && (
                <p className="text-red-500 text-xs">
                  {errors.identificationType.message}
                </p>
              )}
            </Field>

            {/* Identificación */}
            <Field>
              <FieldLabel>Identificación</FieldLabel>
              <Input {...register("identification")} />
              {errors.identification && (
                <p className="text-red-500 text-xs">
                  {errors.identification.message}
                </p>
              )}
            </Field>

            {/* Condicional NATURAL vs LEGAL */}
            {watch("personKind") === "LEGAL" ? (
              <>
                <Field>
                  <FieldLabel>Razón Social</FieldLabel>
                  <Input {...register("businessName")} />
                </Field>

                <Field>
                  <FieldLabel>Nombre Comercial</FieldLabel>
                  <Input {...register("commercialName")} />
                </Field>
              </>
            ) : (
              <>
                <Field>
                  <FieldLabel>Nombres</FieldLabel>
                  <Input {...register("firstName")} />
                </Field>

                <Field>
                  <FieldLabel>Apellidos</FieldLabel>
                  <Input {...register("lastName")} />
                </Field>
              </>
            )}

            {/* Email */}
            <Field>
              <FieldLabel>Correo electrónico</FieldLabel>
              <Input type="email" {...register("email")} />
            </Field>

            {/* Teléfono */}
            <Field>
              <FieldLabel>Teléfono</FieldLabel>
              <Input {...register("phone")} />
            </Field>
          </FieldGroup>

          {/* Dirección */}
          <Field>
            <FieldLabel>Dirección</FieldLabel>
            <Input {...register("address")} />
          </Field>
        </FieldSet>

        {/* ======================= */}
        {/*          ROLES          */}
        {/* ======================= */}
        <FieldSet>
          <FieldLegend>Roles</FieldLegend>

          <Field>
            <FieldLabel>Rol</FieldLabel>
            <Controller
              name="roles"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value[0]}
                  onValueChange={(val) => field.onChange([val])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {["CLIENT", "SUPPLIER", "SELLER"].map((r) => (
                      <SelectItem key={r} value={r}>
                        {getRoleLabel(r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </FieldSet>

        {/* ======================= */}
        {/*      CONTABILIDAD       */}
        {/* ======================= */}
        <FieldSet>
          <FieldLegend>Contabilidad</FieldLegend>

          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cuenta por pagar */}
            <Field>
              <FieldLabel>Cuenta por Pagar</FieldLabel>
              <Controller
                name="accountPayableId"
                control={control}
                render={({ field }) => (
                  <AccountSelect
                    label="Seleccionar cuenta"
                    accounts={accounts}
                    value={field.value ?? null}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>

            {/* Cuenta por cobrar */}
            <Field>
              <FieldLabel>Cuenta por Cobrar</FieldLabel>
              <Controller
                name="accountReceivableId"
                control={control}
                render={({ field }) => (
                  <AccountSelect
                    label="Seleccionar cuenta"
                    accounts={accounts}
                    value={field.value ?? null}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>

            {/* Estado */}
            <FormField
              control={control}
              name="isActive"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activo</FormLabel>
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
          </FieldGroup>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Botones */}
          <FieldGroup>
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {personId ? "Actualizar" : "Agregar"}
            </Button>
          </FieldGroup>
        </FieldSet>
      </Form>
    </form>
  );
}
