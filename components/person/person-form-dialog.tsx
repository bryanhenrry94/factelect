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
    formState: { errors, isSubmitting },
    reset,
    watch,
    control,
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
      setError(action.error || "Error al guardar el cliente");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingPerson ? "Editar Persona" : "Agregar Persona"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {editingPerson
              ? "Actualiza la información de la persona."
              : "Agrega una nueva persona a tu base de datos."}
          </p>

          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Persona */}
            <Controller
              name="personKind"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-1">
                  <Label>Tipo de Persona</Label>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NATURAL">NATURAL</SelectItem>
                      <SelectItem value="LEGAL">JURÍDICA</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.personKind && (
                    <p className="text-red-500 text-xs">
                      {errors.personKind.message}
                    </p>
                  )}
                </div>
              )}
            />

            <div />

            {/* Tipo identificacion */}
            <Controller
              name="identificationType"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col">
                  <Label>Tipo de Identificación</Label>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    value={field.value || ""}
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
                  {errors.identificationType && (
                    <p className="text-red-500 text-xs">
                      {errors.identificationType.message}
                    </p>
                  )}
                </div>
              )}
            />

            {/* Identificacion */}
            <div className="flex flex-col">
              <Label>Identificación</Label>
              <Input {...register("identification")} />
              {errors.identification && (
                <p className="text-red-500 text-xs">
                  {errors.identification.message}
                </p>
              )}
            </div>

            {/* Si es Jurídica */}
            {watch("personKind") === "LEGAL" ? (
              <>
                <div className="flex flex-col">
                  <Label>Razón Social</Label>
                  <Input {...register("businessName")} />
                </div>

                <div className="flex flex-col">
                  <Label>Nombre Comercial</Label>
                  <Input {...register("commercialName")} />
                </div>
              </>
            ) : (
              <>
                {/* Nombres */}
                <div className="flex flex-col">
                  <Label>Nombres</Label>
                  <Input {...register("firstName")} />
                </div>

                {/* Apellidos */}
                <div className="flex flex-col">
                  <Label>Apellidos</Label>
                  <Input {...register("lastName")} />
                </div>
              </>
            )}

            {/* Correo */}
            <div className="flex flex-col">
              <Label>Correo electrónico</Label>
              <Input type="email" {...register("email")} />
            </div>

            {/* Telefono */}
            <div className="flex flex-col">
              <Label>Teléfono</Label>
              <Input {...register("phone")} />
            </div>
          </div>

          {/* Dirección */}
          <div className="flex flex-col">
            <Label>Dirección</Label>
            <Input {...register("address")} />
          </div>

          {/* Roles */}
          <Controller
            name="roles"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <div className="flex flex-col">
                <Label>Roles</Label>
                <Select
                  onValueChange={(val) => field.onChange([val])}
                  defaultValue={field.value[0]}
                  value={field.value[0] || ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {["CLIENT", "SUPPLIER", "SELLER"].map((role) => (
                      <SelectItem key={role} value={role}>
                        {getRoleLabel(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          <p className="text-sm text-muted-foreground mt-2">Contabilidad</p>

          {/* Cuenta por pagar */}
          <Controller
            name="accountPayableId"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col">
                <Label>Cuenta por Pagar</Label>
                <Select
                  defaultValue={field.value || ""}
                  onValueChange={(val) =>
                    field.onChange(val === "none" ? null : val)
                  }
                  value={field.value ?? "none"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguna</SelectItem>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          {/* Cuenta por cobrar */}
          <Controller
            name="accountReceivableId"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col">
                <Label>Cuenta por Cobrar</Label>
                <Select
                  defaultValue={field.value || ""}
                  onValueChange={(val) =>
                    field.onChange(val === "none" ? null : val)
                  }
                  value={field.value ?? "none"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguna</SelectItem>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          {/* Acciones */}
          <DialogFooter className="mt-4">
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
