"use client";

import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { UserPlus, Check, ChevronsUpDown } from "lucide-react";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

import { cn } from "@/lib/utils";
import { PersonInput } from "@/lib/validations/person/person";
import { DocumentFiscalInfo } from "./DocumentFiscalInfo";

interface DocumentInfoProps {
  modeEdit: boolean;
  persons: PersonInput[];
}

export default function DocumentInfo({ persons, modeEdit }: DocumentInfoProps) {
  const { control, watch } = useFormContext();

  const selectedPersonId = watch("personId");

  const selectedPerson = useMemo(
    () => persons.find((p) => p.id === selectedPersonId),
    [persons, selectedPersonId]
  );

  const handleAddPerson = () => {
    // abre una nueva pagina /personas/nuevo
    return () => {
      window.open("/personas/nuevo", "_blank");
    };
  };

  return (
    <div>
      {/* ===================== DATOS GENERALES ===================== */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fecha */}
          <FormField
            control={control}
            name="issueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de emisión</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    disabled={modeEdit}
                    value={
                      field.value
                        ? new Date(field.value).toISOString().substring(0, 10)
                        : ""
                    }
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tipo Entidad */}
          <FormField
            control={control}
            name="entityType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entidad</FormLabel>
                <Select
                  disabled={modeEdit}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Cliente / Proveedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CUSTOMER">Cliente</SelectItem>
                    <SelectItem value="SUPPLIER">Proveedor</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tipo Documento */}
          <FormField
            control={control}
            name="documentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Documento</FormLabel>
                <Select
                  disabled={modeEdit}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de documento" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent>
                    <SelectItem value="INVOICE">Factura</SelectItem>
                    <SelectItem value="PURCHASE">
                      Liquidación de compra
                    </SelectItem>
                    <SelectItem value="CREDIT_NOTE">Nota de crédito</SelectItem>
                    <SelectItem value="DEBIT_NOTE">Nota de débito</SelectItem>
                    <SelectItem value="WITHHOLDING">
                      Comprobante de retención
                    </SelectItem>
                    <SelectItem value="REMISSION_GUIDE">
                      Guía de remisión
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* ===================== PERSONA ===================== */}
      <div className="mt-4">
        <FormField
          control={control}
          name="personId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Persona</FormLabel>

              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {selectedPerson ? (
                          <span className="truncate">
                            <span className="text-muted-foreground mr-1">
                              [{selectedPerson.identification}]
                            </span>
                            {selectedPerson.businessName ||
                              `${selectedPerson.firstName} ${selectedPerson.lastName}`}
                          </span>
                        ) : (
                          "Selecciona una persona"
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>

                  <PopoverContent className="w-[420px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar por nombre o cédula..." />
                      <CommandEmpty>No se encontraron personas</CommandEmpty>
                      <CommandGroup>
                        {persons.map((person) => (
                          <CommandItem
                            key={person.id}
                            value={person.id}
                            onSelect={() => field.onChange(person.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                person.businessName === field.value ||
                                  person.firstName === field.value ||
                                  person.lastName === field.value ||
                                  person.identification === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>
                                {person.businessName ||
                                  `${person.firstName} ${person.lastName}`}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {person.identification}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Crear persona"
                  onClick={handleAddPerson()}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>

              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* ===================== INFO FISCAL ===================== */}
      <div className="mt-4">
        <DocumentFiscalInfo
          modeEdit={modeEdit}
          documentType={watch("documentType") || "INVOICE"}
        />
      </div>
    </div>
  );
}
