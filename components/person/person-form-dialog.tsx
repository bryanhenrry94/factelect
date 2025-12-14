"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createPerson, updatePerson } from "@/actions";
import { getAccounts } from "@/actions/accounting/chart-of-account";
import { identificationOptions } from "@/constants/identification";
import { notifyInfo } from "@/lib/notifications";
import { ChartOfAccount } from "@/lib/validations";

import {
  createPersonSchema,
  CreatePersonInput,
  PersonInput,
} from "@/lib/validations/person";

import { getRoleLabel } from "@/utils/person";

import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

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
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface PersonFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  editingPerson: PersonInput | null;
  tenantId: string;
  setError: (error: string | null) => void;
}

export default function PersonFormDialog({
  open,
  onClose,
  onSuccess,
  editingPerson,
  tenantId,
  setError,
}: PersonFormDialogProps) {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreatePersonInput>({
    resolver: zodResolver(createPersonSchema),
    defaultValues: editingPerson ?? {
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

  useEffect(() => {
    if (editingPerson) {
      reset(editingPerson);
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
  }, [editingPerson, reset]);

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

    const action = editingPerson
      ? await updatePerson(editingPerson.id ?? "", data)
      : await createPerson(data, tenantId);

    if (action.success) {
      notifyInfo(
        `Persona ${editingPerson ? "actualizada" : "creada"} correctamente`
      );
      await onSuccess();
      onClose();
    } else {
      setError(action.error || "Error al guardar la persona");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingPerson ? "Editar Persona" : "Agregar Persona"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FieldDescription>
            {editingPerson
              ? "Actualiza la información de la persona."
              : "Agrega una nueva persona a tu base de datos."}
          </FieldDescription>

          {/* ======================= */}
          {/*        DATOS BASE       */}
          {/* ======================= */}
          <FieldSet>
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
                    <Select
                      value={field.value ?? "none"}
                      onValueChange={(val) =>
                        field.onChange(val === "none" ? null : val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ninguna</SelectItem>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.code} — {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Select
                      value={field.value ?? "none"}
                      onValueChange={(val) =>
                        field.onChange(val === "none" ? null : val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ninguna</SelectItem>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.code} — {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </FieldGroup>
          </FieldSet>

          {/* Botones */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {editingPerson ? "Actualizar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
